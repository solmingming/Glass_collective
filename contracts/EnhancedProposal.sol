// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./GovernanceToken.sol";

/**
 * @title EnhancedProposal
 * @dev 향상된 제안 시스템 - 카테고리별 제안, 긴급 제안, 제안 수정/취소
 * - 카테고리별 다른 투표 기간과 정족수
 * - 긴급 제안 시스템
 * - 제안 수정/취소 기능
 */

contract EnhancedProposal is AccessControl {
    bytes32 public constant MEMBER_ROLE = keccak256("MEMBER_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    GovernanceToken public governanceToken;

    // 제안 카테고리
    enum Category {
        GENERAL, // 일반 제안
        FINANCIAL, // 재무 제안
        OPERATIONAL, // 운영 제안
        TECHNICAL, // 기술 제안
        EMERGENCY // 긴급 제안
    }

    // 제안 상태
    enum Status {
        Pending,
        Active,
        Passed,
        Rejected,
        Executed,
        Cancelled,
        Modified
    }

    // 카테고리별 설정
    struct CategoryConfig {
        uint256 votingDuration; // 투표 기간
        uint256 quorumPercent; // 정족수 퍼센트
        uint256 minVotingPower; // 최소 투표 파워
        bool isActive; // 활성화 여부
    }

    // 제안 정보
    struct ProposalData {
        string title;
        string description;
        uint256 amount;
        address payable recipient;
        Category category;
        Status status;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 startTime;
        uint256 endTime;
        address proposer;
        uint256 version; // 수정 버전
        bool isEmergency;
        uint256 emergencyThreshold; // 긴급 임계값
    }

    // 제안 수정 이력
    struct ProposalHistory {
        uint256 timestamp;
        string title;
        string description;
        uint256 amount;
        address payable recipient;
        uint256 version;
    }

    mapping(uint256 => ProposalData) public proposals;
    mapping(uint256 => mapping(uint256 => ProposalHistory))
        public proposalHistory;
    mapping(Category => CategoryConfig) public categoryConfigs;

    uint256 public proposalCount;

    // 이벤트
    event ProposalCreated(
        uint256 indexed id,
        address indexed proposer,
        Category category
    );
    event ProposalModified(
        uint256 indexed id,
        address indexed modifierAddress,
        uint256 version
    );
    event ProposalCancelled(uint256 indexed id, address indexed canceller);
    event EmergencyProposalCreated(uint256 indexed id, address indexed proposer);
    event CategoryConfigUpdated(
        Category category,
        uint256 votingDuration,
        uint256 quorumPercent
    );

    constructor(address _governanceToken, address admin) {
        governanceToken = GovernanceToken(_governanceToken);
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MEMBER_ROLE, admin);
        _grantRole(EMERGENCY_ROLE, admin);

        // 카테고리별 기본 설정
        _setCategoryConfig(Category.GENERAL, 3 days, 50, 100 * 10**18);
        _setCategoryConfig(Category.FINANCIAL, 5 days, 60, 500 * 10**18);
        _setCategoryConfig(Category.OPERATIONAL, 3 days, 50, 100 * 10**18);
        _setCategoryConfig(Category.TECHNICAL, 7 days, 70, 1000 * 10**18);
        _setCategoryConfig(Category.EMERGENCY, 1 days, 40, 100 * 10**18);
    }

    // 카테고리 설정
    function _setCategoryConfig(
        Category category,
        uint256 votingDuration,
        uint256 quorumPercent,
        uint256 minVotingPower
    ) internal {
        categoryConfigs[category] = CategoryConfig({
            votingDuration: votingDuration,
            quorumPercent: quorumPercent,
            minVotingPower: minVotingPower,
            isActive: true
        });
    }

    // 카테고리 설정 업데이트 (관리자만)
    function updateCategoryConfig(
        Category category,
        uint256 votingDuration,
        uint256 quorumPercent,
        uint256 minVotingPower
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        categoryConfigs[category].votingDuration = votingDuration;
        categoryConfigs[category].quorumPercent = quorumPercent;
        categoryConfigs[category].minVotingPower = minVotingPower;

        emit CategoryConfigUpdated(category, votingDuration, quorumPercent);
    }

    // 제안 생성
    function createProposal(
        string calldata title,
        string calldata description,
        uint256 amount,
        address payable recipient,
        Category category
    ) external onlyRole(MEMBER_ROLE) returns (uint256) {
        require(
            categoryConfigs[category].isActive,
            "EnhancedProposal: category not active"
        );
        uint256 votingPower = governanceToken.getVotingPower(msg.sender);
        require(
            votingPower >= categoryConfigs[category].minVotingPower,
            "EnhancedProposal: insufficient voting power"
        );
        require(votingPower > 0, "EnhancedProposal: no voting power");

        uint256 proposalId = proposalCount++;
        uint256 votingDuration = categoryConfigs[category].votingDuration;
        proposals[proposalId] = ProposalData({
            title: title,
            description: description,
            amount: amount,
            recipient: recipient,
            category: category,
            status: Status.Pending,
            votesFor: 0,
            votesAgainst: 0,
            startTime: block.timestamp,
            endTime: block.timestamp + votingDuration,
            proposer: msg.sender,
            version: 1,
            isEmergency: false,
            emergencyThreshold: 0
        });
        emit ProposalCreated(proposalId, msg.sender, category);
        return proposalId;
    }

    // 긴급 제안 생성
    function createEmergencyProposal(
        string calldata title,
        string calldata description,
        uint256 amount,
        address payable recipient,
        uint256 emergencyThreshold
    ) external onlyRole(EMERGENCY_ROLE) returns (uint256) {
        uint256 proposalId = proposalCount++;
        uint256 votingDuration = categoryConfigs[Category.EMERGENCY]
            .votingDuration;

        proposals[proposalId] = ProposalData({
            title: title,
            description: description,
            amount: amount,
            recipient: recipient,
            category: Category.EMERGENCY,
            status: Status.Pending,
            votesFor: 0,
            votesAgainst: 0,
            startTime: block.timestamp,
            endTime: block.timestamp + votingDuration,
            proposer: msg.sender,
            version: 1,
            isEmergency: true,
            emergencyThreshold: emergencyThreshold
        });
        emit EmergencyProposalCreated(proposalId, msg.sender);
        return proposalId;
    }

    // 제안 수정 (제안자만, 투표 시작 전)
    function modifyProposal(
        uint256 proposalId,
        string calldata title,
        string calldata description,
        uint256 amount,
        address payable recipient
    ) external {
        ProposalData storage proposal = proposals[proposalId];
        require(
            msg.sender == proposal.proposer,
            "EnhancedProposal: not proposer"
        );
        require(
            proposal.status == Status.Pending,
            "EnhancedProposal: cannot modify active proposal"
        );
        require(
            block.timestamp < proposal.endTime,
            "EnhancedProposal: voting already started"
        );

        // 이력 저장
        proposalHistory[proposalId][proposal.version] = ProposalHistory({
            timestamp: block.timestamp,
            title: proposal.title,
            description: proposal.description,
            amount: proposal.amount,
            recipient: proposal.recipient,
            version: proposal.version
        });

        // 제안 수정
        proposal.title = title;
        proposal.description = description;
        proposal.amount = amount;
        proposal.recipient = recipient;
        proposal.version++;
        proposal.status = Status.Modified;

        emit ProposalModified(proposalId, msg.sender, proposal.version);
    }

    // 제안 취소 (제안자만)
    function cancelProposal(uint256 proposalId) external {
        ProposalData storage proposal = proposals[proposalId];
        require(
            msg.sender == proposal.proposer,
            "EnhancedProposal: not proposer"
        );
        require(
            proposal.status == Status.Pending ||
                proposal.status == Status.Modified,
            "EnhancedProposal: cannot cancel active proposal"
        );
        proposal.status = Status.Cancelled;
        emit ProposalCancelled(proposalId, msg.sender);
    }

    // 제안 활성화 (투표 시작)
    function activateProposal(uint256 proposalId)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        ProposalData storage proposal = proposals[proposalId];
        require(
            proposal.status == Status.Pending ||
                proposal.status == Status.Modified,
            "EnhancedProposal: invalid status"
        );
        proposal.status = Status.Active;
    }

    // 제안 상태 변경
    function setProposalStatus(uint256 proposalId, Status status)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        proposals[proposalId].status = status;
    }

    // 제안 조회
    function getProposal(uint256 proposalId)
        external
        view
        returns (ProposalData memory)
    {
        return proposals[proposalId];
    }

    // 수정됨: 페이지네이션 적용
    function getProposalsByCategory(
        Category category,
        uint256 _offset,
        uint256 _limit
    ) external view returns (uint256[] memory, uint256) {
        uint256[] memory allProposalsInCategory = new uint256[](proposalCount);
        uint256 categoryProposalCount = 0;
        for (uint256 i = 0; i < proposalCount; i++) {
            if (proposals[i].category == category) {
                allProposalsInCategory[categoryProposalCount] = i;
                categoryProposalCount++;
            }
        }

        // 페이지네이션 로직
        uint256 returnCount = 0;
        if (_offset >= categoryProposalCount) {
            return (new uint256[](0), categoryProposalCount);
        }

        if (_offset + _limit > categoryProposalCount) {
            returnCount = categoryProposalCount - _offset;
        } else {
            returnCount = _limit;
        }

        uint256[] memory result = new uint256[](returnCount);
        for (uint256 i = 0; i < returnCount; i++) {
            result[i] = allProposalsInCategory[_offset + i];
        }

        return (result, categoryProposalCount);
    }

    // 수정됨: 페이지네이션 적용
    function getEmergencyProposals(
        uint256 _offset,
        uint256 _limit
    ) external view returns (uint256[] memory, uint256) {
        uint256[] memory allEmergencyProposals = new uint256[](proposalCount);
        uint256 emergencyProposalCount = 0;
        for (uint256 i = 0; i < proposalCount; i++) {
            if (proposals[i].isEmergency) {
                allEmergencyProposals[emergencyProposalCount] = i;
                emergencyProposalCount++;
            }
        }

        // 페이지네이션 로직
        uint256 returnCount = 0;
        if (_offset >= emergencyProposalCount) {
            return (new uint256[](0), emergencyProposalCount);
        }

        if (_offset + _limit > emergencyProposalCount) {
            returnCount = emergencyProposalCount - _offset;
        } else {
            returnCount = _limit;
        }

        uint256[] memory result = new uint256[](returnCount);
        for (uint256 i = 0; i < returnCount; i++) {
            result[i] = allEmergencyProposals[_offset + i];
        }

        return (result, emergencyProposalCount);
    }

    // 제안 이력 조회
    function getProposalHistory(uint256 proposalId, uint256 version)
        external
        view
        returns (ProposalHistory memory)
    {
        return proposalHistory[proposalId][version];
    }

    // 카테고리 설정 조회
    function getCategoryConfig(Category category)
        external
        view
        returns (CategoryConfig memory)
    {
        return categoryConfigs[category];
    }
}