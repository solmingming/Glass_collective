// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

interface IDAO {
    function countToExpel() external view returns (uint256);
    function scoreToExpel() external view returns (uint256);
}

contract Proposal is AccessControl {
    bytes32 public constant MEMBER_ROLE = keccak256("MEMBER_ROLE");
    bytes32 public constant DAO_ROLE = keccak256("DAO_ROLE");

    enum Status { Pending, Passed, Rejected, Executed }
    struct ProposalData {
        string title; string description; uint256 amount; address payable recipient;
        Status status; uint256 votesFor; uint256 votesAgainst; uint256 votesAbstain;
        uint256 startTime; address proposer; bool requireVote; string sanctionType;
        uint256 beforeValue; uint256 afterValue; address targetMember;
    }
    struct ProposalInput {
        string title; string description; uint256 amount; address payable recipient;
        bool requireVote; string sanctionType; uint256 beforeValue; uint256 afterValue;
        address targetMember;
    }

    ProposalData[] public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(address => uint256) public penaltyCount;
    mapping(address => uint256) public glassScore;
    address public daoAddress;
    address[] public members;
    mapping(address => bool) public isMember;

    event ProposalCreated(uint256 indexed id, address indexed proposer);
    event ProposalStatusChanged(uint256 indexed id, Status status);
    event Voted(uint256 indexed proposalId, address indexed voter, uint8 choice);
    event GlassScoreChanged(address indexed member, uint256 newScore);

    constructor(address initialAdmin, address factoryAddress){
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);

        if (factoryAddress != address(0)) {
            _grantRole(DEFAULT_ADMIN_ROLE, factoryAddress);
        }
        
        super.grantRole(MEMBER_ROLE, initialAdmin);
        members.push(initialAdmin);
        isMember[initialAdmin] = true;
        glassScore[initialAdmin] = 50;
        emit GlassScoreChanged(initialAdmin, 50);


        _setRoleAdmin(MEMBER_ROLE, DAO_ROLE);
    }

    function renounceFactoryAdminRole() external {
        // DEFAULT_ADMIN_ROLE의 관리자는 자기 자신(DEFAULT_ADMIN_ROLE)입니다.
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not an admin");
        renounceRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    
    function setDaoAddress(address _dao) external onlyRole(DEFAULT_ADMIN_ROLE) {
        daoAddress = _dao;
        _grantRole(DAO_ROLE, _dao);
    }
    
    /**
     * @dev [최종 수정] 잘못된 onlyRole 제어자를 제거하고 올바르게 오버라이딩합니다.
     */
    function grantRole(bytes32 role, address account) public override {
        // OpenZeppelin의 원래 함수가 모든 권한 검사를 처리하도록 먼저 호출합니다.
        super.grantRole(role, account);
        
        // 권한 부여가 성공한 후에만 커스텀 로직을 실행합니다.
        if (role == MEMBER_ROLE && !isMember[account]) {
            members.push(account);
            isMember[account] = true;
            glassScore[account] = 50;
            emit GlassScoreChanged(account, 50);
        }
    }

    /**
     * @dev [최종 수정] 잘못된 onlyRole 제어자를 제거하고 올바르게 오버라이딩합니다.
     */
    function revokeRole(bytes32 role, address account) public override {
        // OpenZeppelin의 원래 함수가 모든 권한 검사를 처리하도록 먼저 호출합니다.
        super.revokeRole(role, account);

        // 권한 회수가 성공한 후에만 커스텀 로직을 실행합니다.
        if (role == MEMBER_ROLE && isMember[account]) {
            isMember[account] = false;
            for (uint256 i = 0; i < members.length; i++) {
                if (members[i] == account) {
                    members[i] = members[members.length - 1];
                    members.pop();
                    break;
                }
            }
            penaltyCount[account] = 0;
        }
    }

    function addGlassScore(address member, uint256 amount) external onlyRole(DAO_ROLE) {
        uint256 newScore = glassScore[member] + amount;
        glassScore[member] = newScore > 100 ? 100 : newScore;
        emit GlassScoreChanged(member, newScore);
    }

    function subGlassScore(address member, uint256 amount) external onlyRole(DAO_ROLE) {
        uint256 currentScore = glassScore[member];
        uint256 newScore = currentScore >= amount ? currentScore - amount : 0;
        glassScore[member] = newScore;
        emit GlassScoreChanged(member, newScore);
        if (newScore < IDAO(daoAddress).scoreToExpel()) {
            revokeRole(MEMBER_ROLE, member);
        }
    }

    function addPenaltyAndExpel(address member) external onlyRole(DAO_ROLE) {
        penaltyCount[member] += 1;
        if (penaltyCount[member] >= IDAO(daoAddress).countToExpel()) {
            revokeRole(MEMBER_ROLE, member);
        }
    }
    
    function forceAbstain(uint256 proposalId, address member) external onlyRole(DAO_ROLE) {
        ProposalData storage p = proposals[proposalId];
        if (!hasVoted[proposalId][member]) {
            hasVoted[proposalId][member] = true;
            p.votesAbstain++;
            emit Voted(proposalId, member, 2);
        }
    }

    function createProposal(ProposalInput calldata input, address proposer) external onlyRole(DAO_ROLE) returns (uint256) {
        proposals.push(
            ProposalData({
                title: input.title, description: input.description, amount: input.amount,
                recipient: input.recipient, status: Status.Pending, votesFor: 0,
                votesAgainst: 0, votesAbstain: 0, startTime: block.timestamp, // solhint-disable-line not-rely-on-time
                proposer: proposer, requireVote: input.requireVote,
                sanctionType: input.sanctionType, beforeValue: input.beforeValue,
                afterValue: input.afterValue, targetMember: input.targetMember
            })
        );
        uint256 pid = proposals.length - 1;
        emit ProposalCreated(pid, proposer);
        return pid;
    }

    function vote(uint256 proposalId, uint8 choice, address voter) external onlyRole(DAO_ROLE) {
        ProposalData storage p = proposals[proposalId];
        require(p.requireVote, "Voting not required");
        require(!hasVoted[proposalId][voter], "Already voted");
        hasVoted[proposalId][voter] = true;
        if (choice == 0) { p.votesFor++; } 
        else if (choice == 1) { p.votesAgainst++; } 
        else if (choice == 2) { p.votesAbstain++; } 
        else { revert("Invalid vote choice"); }
        emit Voted(proposalId, voter, choice);
    }
    
    function setProposalStatus(uint256 id, Status status) external onlyRole(DAO_ROLE) {
        proposals[id].status = status;
        emit ProposalStatusChanged(id, status);
    }

    function getProposal(uint256 id) external view returns (ProposalData memory) { return proposals[id]; }
    function getAllProposals() external view returns (ProposalData[] memory) { return proposals; }
    function hasVotedForProposal(uint256 proposalId, address voter) external view returns (bool) { return hasVoted[proposalId][voter]; }
    function getAllMembers() external view returns (address[] memory) { return members; }
    function getMemberCount() external view returns (uint256) { return members.length; }
}