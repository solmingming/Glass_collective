// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./EnhancedProposal.sol";
import "./Vault.sol";
import "./GovernanceToken.sol";

/**
 * @title AutoExecution
 * @dev 자동화된 제안 실행 시스템과 보안 강화
 * - 투표 종료 후 자동 실행 (DoS 방지 로직 적용)
 * - 스케줄링된 실행
 * - 멀티시그 보안
 * - 재진입 공격 방지
 * - 수정: 정족수 계산 시 정밀도 손실 방지
 */
contract AutoExecution is AccessControl, ReentrancyGuard {
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    EnhancedProposal public proposalContract;
    Vault public vaultContract;
    GovernanceToken public governanceToken;

    // 실행 대기열
    struct ExecutionQueue {
        uint256 proposalId;
        uint256 scheduledTime;
        bool isExecuted;
        address executor;
    }

    // 멀티시그 설정
    struct MultiSigConfig {
        uint256 requiredSignatures;
        uint256 executionDelay;
        mapping(address => bool) signers;
    }

    mapping(uint256 => ExecutionQueue) public executionQueue;
    mapping(uint256 => mapping(address => bool)) public proposalSignatures;
    mapping(uint256 => uint256) public proposalSignatureCount;

    MultiSigConfig public multiSigConfig;

    uint256 public queueCount;
    uint256 public lastProcessedQueueIndex; // DoS 방지를 위한 인덱스

    uint256 public constant MIN_EXECUTION_DELAY = 1 hours;
    uint256 public constant MAX_EXECUTION_DELAY = 7 days;

    // 이벤트
    event ExecutionScheduled(uint256 indexed proposalId, uint256 scheduledTime);
    event ExecutionExecuted(uint256 indexed proposalId, address indexed executor);
    event ExecutionCancelled(uint256 indexed proposalId, address indexed canceller);
    event MultiSigSignatureAdded(
        uint256 indexed proposalId,
        address indexed signer
    );
    event MultiSigConfigUpdated(
        uint256 requiredSignatures,
        uint256 executionDelay
    );

    constructor(
        address _proposalContract,
        address payable _vaultContract,
        address _governanceToken,
        address admin
    ) {
        proposalContract = EnhancedProposal(_proposalContract);
        vaultContract = Vault(_vaultContract);
        governanceToken = GovernanceToken(_governanceToken);

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(EXECUTOR_ROLE, admin);
        _grantRole(EMERGENCY_ROLE, admin);

        // 멀티시그 초기 설정
        multiSigConfig.requiredSignatures = 2;
        multiSigConfig.executionDelay = 24 hours;
        multiSigConfig.signers[admin] = true;
    }

    // 멀티시그 서명자 추가
    function addMultiSigSigner(address signer)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        multiSigConfig.signers[signer] = true;
    }

    // 멀티시그 서명자 제거
    function removeMultiSigSigner(address signer)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        multiSigConfig.signers[signer] = false;
    }

    // 멀티시그 설정 업데이트
    function updateMultiSigConfig(
        uint256 requiredSignatures,
        uint256 executionDelay
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(
            requiredSignatures > 0,
            "AutoExecution: invalid required signatures"
        );
        require(
            executionDelay >= MIN_EXECUTION_DELAY,
            "AutoExecution: delay too short"
        );
        require(
            executionDelay <= MAX_EXECUTION_DELAY,
            "AutoExecution: delay too long"
        );

        multiSigConfig.requiredSignatures = requiredSignatures;
        multiSigConfig.executionDelay = executionDelay;
        emit MultiSigConfigUpdated(requiredSignatures, executionDelay);
    }

    // 제안 실행 스케줄링
    function scheduleExecution(uint256 proposalId, uint256 delay)
        external
        onlyRole(EXECUTOR_ROLE)
        nonReentrant
    {
        EnhancedProposal.ProposalData memory proposal = proposalContract
            .getProposal(proposalId);
        require(
            proposal.status == EnhancedProposal.Status.Passed,
            "AutoExecution: proposal not passed"
        );
        require(
            block.timestamp >= proposal.endTime,
            "AutoExecution: voting not ended"
        );
        require(delay >= MIN_EXECUTION_DELAY, "AutoExecution: delay too short");
        require(delay <= MAX_EXECUTION_DELAY, "AutoExecution: delay too long");

        uint256 scheduledTime = block.timestamp + delay;
        executionQueue[queueCount] = ExecutionQueue({
            proposalId: proposalId,
            scheduledTime: scheduledTime,
            isExecuted: false,
            executor: msg.sender
        });
        emit ExecutionScheduled(proposalId, scheduledTime);
        queueCount++;
    }

    // 긴급 실행 (긴급 제안용)
    function emergencyExecute(uint256 proposalId)
        external
        onlyRole(EMERGENCY_ROLE)
        nonReentrant
    {
        EnhancedProposal.ProposalData memory proposal = proposalContract
            .getProposal(proposalId);
        require(
            proposal.isEmergency,
            "AutoExecution: not emergency proposal"
        );
        require(
            proposal.status == EnhancedProposal.Status.Passed,
            "AutoExecution: proposal not passed"
        );

        _executeProposal(proposalId);
    }

    // 멀티시그 서명 추가
    function addSignature(uint256 proposalId) external {
        require(
            multiSigConfig.signers[msg.sender],
            "AutoExecution: not authorized signer"
        );
        require(
            !proposalSignatures[proposalId][msg.sender],
            "AutoExecution: already signed"
        );

        proposalSignatures[proposalId][msg.sender] = true;
        proposalSignatureCount[proposalId]++;

        emit MultiSigSignatureAdded(proposalId, msg.sender);
        // 충분한 서명이 있으면 실행
        if (
            proposalSignatureCount[proposalId] >=
            multiSigConfig.requiredSignatures
        ) {
            _executeProposal(proposalId);
        }
    }

    // 실행 가능한 제안 실행 (DoS 방지 로직 적용)
    function executeScheduledProposals() external nonReentrant {
        uint256 count = queueCount;
        for (uint256 i = 0; i < count; i++) {
            uint256 indexToProcess = (lastProcessedQueueIndex + i) % count;

            ExecutionQueue storage queue = executionQueue[indexToProcess];

            if (!queue.isExecuted && block.timestamp >= queue.scheduledTime) {
                queue.isExecuted = true; // 먼저 상태를 변경하여 재실행 방지

                try this._executeProposal(queue.proposalId) {
                    emit ExecutionExecuted(queue.proposalId, msg.sender);
                } catch {
                    // 실행 실패 시 로깅 또는 다른 처리 가능
                }

                lastProcessedQueueIndex = indexToProcess + 1;
                return; // 한 번에 하나만 처리하고 종료
            }
        }
    }

    // 제안 실행 (내부 함수)
    function _executeProposal(uint256 proposalId) internal {
        EnhancedProposal.ProposalData memory proposal = proposalContract
            .getProposal(proposalId);
        // 실행 조건 확인
        require(
            proposal.status == EnhancedProposal.Status.Passed,
            "AutoExecution: proposal not passed"
        );
        require(
            proposal.votesFor > proposal.votesAgainst,
            "AutoExecution: proposal not approved"
        );

        // 정족수 확인
        uint256 totalVotes = proposal.votesFor + proposal.votesAgainst;
        require(totalVotes > 0, "AutoExecution: no votes casted");

        EnhancedProposal.CategoryConfig memory config = proposalContract
            .getCategoryConfig(proposal.category);
        
        // 정밀도 손실 방지
        require(
            (proposal.votesFor * 100) >= (totalVotes * config.quorumPercent),
            "AutoExecution: quorum not reached"
        );
        
        // 금고에서 이체
        vaultContract.transfer(proposal.recipient, proposal.amount);

        // 제안 상태를 Executed로 변경
        proposalContract.setProposalStatus(
            proposalId,
            EnhancedProposal.Status.Executed
        );
    }

    // 실행 취소
    function cancelExecution(uint256 proposalId)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        for (uint256 i = 0; i < queueCount; i++) {
            if (
                executionQueue[i].proposalId == proposalId &&
                !executionQueue[i].isExecuted
            ) {
                executionQueue[i].isExecuted = true; // 취소 표시
                emit ExecutionCancelled(proposalId, msg.sender);
                break;
            }
        }
    }

   
    // 실행 대기열 조회
    function getExecutionQueue(uint256 index) external view returns (ExecutionQueue memory) {
        return executionQueue[index];
    }

    // 제안 서명 상태 조회
    function getProposalSignatures(uint256 proposalId) external view returns (uint256) {
        return proposalSignatureCount[proposalId];
    }

    // 서명자 확인
    function isSigner(address signer) external view returns (bool) {
        return multiSigConfig.signers[signer];
    }

    // 멀티시그 설정 조회
    function getMultiSigConfig() external view returns (uint256 requiredSignatures, uint256 executionDelay) {
        return (multiSigConfig.requiredSignatures, multiSigConfig.executionDelay);
    }

    // 실행 가능한 제안 확인
    function isExecutable(uint256 proposalId) external view returns (bool) {
        EnhancedProposal.ProposalData memory proposal = proposalContract.getProposal(proposalId);
        
        if (proposal.status != EnhancedProposal.Status.Passed) return false;
        if (proposal.votesFor <= proposal.votesAgainst) return false;
        
        uint256 totalVotes = proposal.votesFor + proposal.votesAgainst;
        if (totalVotes == 0) return false;

        uint256 approvalRateTimes100 = proposal.votesFor * 100;
        EnhancedProposal.CategoryConfig memory config = proposalContract.getCategoryConfig(proposal.category);
        return approvalRateTimes100 >= totalVotes * config.quorumPercent;
    }
} 