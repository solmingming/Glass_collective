// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Proposal.sol";
import "./Vault.sol";
import "./Execution.sol";

contract DAO {
    Proposal public proposalContract;
    Vault public vaultContract;
    Execution public executionContract;

    uint256 public passCriteria;
    uint256 public votingDuration;
    uint256 public absentPenalty;
    uint256 public countToExpel;
    uint256 public scoreToExpel;
    uint256 public entryFee;
    
    bool public isPrivate;
    // *** 1. FIX: inviteCodeHash를 bytes32로 유지 (이전과 동일, 올바른 방식) ***
    bytes32 public inviteCodeHash;

    mapping(uint256 => uint256) public proposalDeadline;
    mapping(uint256 => bool) public proposalExecuted;

    event ProposalPassed(uint256 indexed proposalId);
    event ProposalRejected(uint256 indexed proposalId);

    constructor(
        address _proposal, address _vault, address _execution,
        uint256 _passCriteria, uint256 _votingDurationInSeconds, uint256 _absentPenaltyInWei,
        uint256 _countToExpel, uint256 _scoreToExpel, uint256 _entryFeeInWei,
        bool _isPrivate, string memory _inviteCode
    ) {
        proposalContract = Proposal(_proposal);
        vaultContract = Vault(payable(_vault));
        executionContract = Execution(_execution);

        passCriteria = _passCriteria;
        votingDuration = _votingDurationInSeconds;
        absentPenalty = _absentPenaltyInWei;
        countToExpel = _countToExpel;
        scoreToExpel = _scoreToExpel;
        entryFee = _entryFeeInWei;
        isPrivate = _isPrivate;

        if (_isPrivate) {
            inviteCodeHash = keccak256(abi.encodePacked(_inviteCode));
        }
    }
    
    receive() external payable {}

    function joinDAO() external payable {
        require(!isPrivate, "This is a private DAO. Use joinDAOWithCode instead.");
        _join(msg.value);
    }
    
    function joinDAOWithCode(string memory _inviteCode) external payable {
        require(isPrivate, "This is a public DAO. Use joinDAO instead.");
        require(keccak256(abi.encodePacked(_inviteCode)) == inviteCodeHash, "Invalid invite code");
        _join(msg.value);
    }
    
    function _join(uint256 _value) internal {
        require(_value >= entryFee, "Insufficient entry fee");
        require(!proposalContract.hasRole(proposalContract.MEMBER_ROLE(), msg.sender), "Already a member");
        
        // Vault에 입금
        (bool sent, ) = address(vaultContract).call{value: _value}("");
        require(sent, "Failed to send entry fee to vault");
        
        // Proposal 컨트랙트에서 멤버 역할 부여
        proposalContract.grantRole(proposalContract.MEMBER_ROLE(), msg.sender);
    }
    
    function createProposal(
        string calldata title, string calldata description, uint256 amount,
        address payable recipient, bool requireVote, string calldata sanctionType,
        uint256 beforeValue, uint256 afterValue, address targetMember
    ) external returns (uint256) {
        require(proposalContract.hasRole(proposalContract.MEMBER_ROLE(), msg.sender), "DAO: Caller is not a member");
        Proposal.ProposalInput memory input = Proposal.ProposalInput({
            title: title, description: description, amount: amount, recipient: recipient,
            requireVote: requireVote, sanctionType: sanctionType, beforeValue: beforeValue,
            afterValue: afterValue, targetMember: targetMember
        });
        uint256 pid = proposalContract.createProposal(input, msg.sender);
        if (requireVote) {
            proposalDeadline[pid] = block.timestamp + votingDuration;
        } else {
            _executeProposal(pid);
        }
        return pid;
    }

    // *** 2. FIX: vote 함수에서 비효율적인 조기 종료 로직 제거 ***
    // vote 함수는 오직 투표만 담당하도록 단순하게 유지하는 것이 가장 안전하고 가스 효율적입니다.
    // 조기 종료는 finalizeProposal에서 처리합니다.
    function vote(uint256 proposalId, uint8 choice) external {
    // *** 1. MODIFIED: require 구문에 명확한 에러 메시지 추가 ***
    require(proposalContract.hasRole(proposalContract.MEMBER_ROLE(), msg.sender), "DAO:CALLER_IS_NOT_A_MEMBER");
    
    // proposalContract.vote 내부의 require 메시지는 이미 명확하므로 그대로 둡니다.
    proposalContract.vote(proposalId, choice, msg.sender);
}
    
    // finalizeProposal 함수를 간단하게 수정
    function finalizeProposal(uint256 proposalId) external {
        Proposal.ProposalData memory p = proposalContract.getProposal(proposalId);
        
        require(p.requireVote, "Not a voting proposal");
        require(!proposalExecuted[proposalId], "Proposal already finalized");

        uint256 totalVotes = p.votesFor + p.votesAgainst + p.votesAbstain;
        uint256 memberCount = proposalContract.getMemberCount();

        // 간단한 조건: 모든 멤버가 투표했거나 마감 시간이 지났으면 finalize 가능
        bool canFinalize = (totalVotes >= memberCount && memberCount > 0) || 
                          (proposalDeadline[proposalId] > 0 && block.timestamp > proposalDeadline[proposalId]);
        
        require(canFinalize, "Cannot finalize yet");

        // 마감 시간이 지났는데 모든 멤버가 투표하지 않았다면 미투표자에게 패널티
        if (proposalDeadline[proposalId] > 0 && block.timestamp > proposalDeadline[proposalId] && totalVotes < memberCount) {
            address[] memory members = proposalContract.getAllMembers();
            for (uint256 i = 0; i < members.length; i++) {
                if (!proposalContract.hasVotedForProposal(proposalId, members[i])) {
                    proposalContract.addPenaltyAndExpel(members[i]);
                    proposalContract.forceAbstain(proposalId, members[i]);
                    (bool sent, ) = address(vaultContract).call{value: absentPenalty}("");
                    require(sent, "Failed to send penalty to vault");
                }
            }
            // 패널티 적용 후 다시 투표 수 계산
            p = proposalContract.getProposal(proposalId);
            totalVotes = p.votesFor + p.votesAgainst + p.votesAbstain;
        }

        // 통과율 계산 및 상태 업데이트
        uint256 passRate = totalVotes == 0 ? 0 : (p.votesFor * 100) / totalVotes;

        if (passRate >= passCriteria) {
            proposalContract.setProposalStatus(proposalId, Proposal.Status.Passed);
            emit ProposalPassed(proposalId);
            _executeProposal(proposalId);
        } else {
            proposalContract.setProposalStatus(proposalId, Proposal.Status.Rejected);
            emit ProposalRejected(proposalId);
        }
        proposalExecuted[proposalId] = true;
    }
    


    function _executeProposal(uint256 proposalId) internal {
        Proposal.ProposalData memory p = proposalContract.getProposal(proposalId);
        
        if (keccak256(abi.encodePacked(p.sanctionType)) == keccak256(abi.encodePacked("treasury-in"))) {
            executionContract.executeDeposit(proposalId);
        } else if (keccak256(abi.encodePacked(p.sanctionType)) == keccak256(abi.encodePacked("treasury-out"))) {
            executionContract.executePayout(proposalId);
        } else if (keccak256(abi.encodePacked(p.sanctionType)) == keccak256(abi.encodePacked("rule-change"))) {
            executionContract.executeRuleChange(proposalId);
            // 규칙 변경 실행 후 DAO의 규칙 업데이트
            _updateDaoRule(p.title, p.afterValue);
        }
    }
    
    function _updateDaoRule(string memory ruleName, uint256 newValue) internal {
        if (keccak256(abi.encodePacked(ruleName)) == keccak256(abi.encodePacked("passCriteria"))) {
            passCriteria = newValue;
        } else if (keccak256(abi.encodePacked(ruleName)) == keccak256(abi.encodePacked("votingDuration"))) {
            votingDuration = newValue;
        } else if (keccak256(abi.encodePacked(ruleName)) == keccak256(abi.encodePacked("absentPenalty"))) {
            absentPenalty = newValue;
        } else if (keccak256(abi.encodePacked(ruleName)) == keccak256(abi.encodePacked("countToExpel"))) {
            countToExpel = newValue;
        } else if (keccak256(abi.encodePacked(ruleName)) == keccak256(abi.encodePacked("scoreToExpel"))) {
            scoreToExpel = newValue;
        } else if (keccak256(abi.encodePacked(ruleName)) == keccak256(abi.encodePacked("entryFee"))) {
            entryFee = newValue;
        }
    }
    
    function isMember(address user) external view returns (bool) { return proposalContract.hasRole(proposalContract.MEMBER_ROLE(), user); }
    function getTreasuryBalance() external view returns (uint256) { return vaultContract.getBalance(); }
    function getAllMembers() public view returns (address[] memory) { return proposalContract.getAllMembers(); }
    function getMemberCount() public view returns (uint256) { return proposalContract.getMemberCount(); }
}