// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

// DAO 인터페이스 선언 (countToExpel, scoreToExpel 읽기용)
interface IDAO {
    function countToExpel() external view returns (uint256);
    function scoreToExpel() external view returns (uint256);
}

contract Proposal is AccessControl {
    bytes32 public constant MEMBER_ROLE = keccak256("MEMBER_ROLE");
    bytes32 public constant DAO_ROLE = keccak256("DAO_ROLE");

    enum Status { Pending, Passed, Rejected, Executed }

    struct ProposalData {
        string title;
        string description;
        uint256 amount;
        address payable recipient;
        Status status;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 votesAbstain;
        uint256 startTime;
        address proposer;
        bool requireVote;
        string sanctionType;
        uint256 beforeValue;
        uint256 afterValue;
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

    constructor(address admin, address dao){
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MEMBER_ROLE, admin);
        _grantRole(DAO_ROLE, dao);
        daoAddress = dao;
        members.push(admin);
        isMember[admin] = true;
        glassScore[admin] = 50;
    }

    /// @notice DAO에서 멤버 권한 부여, 멤버 목록/GlassScore 초기화
    function grantRole(bytes32 role, address account) public override onlyRole(DAO_ROLE) {
        super.grantRole(role, account);
        if (role == MEMBER_ROLE && !isMember[account]) {
            members.push(account);
            isMember[account] = true;
            glassScore[account] = 50;
            emit GlassScoreChanged(account, 50);
        }
    }

    /// @notice DAO에서 멤버 권한 회수, 멤버 목록에서 제거
    function revokeRole(bytes32 role, address account) public override onlyRole(DAO_ROLE) {
        super.revokeRole(role, account);
        if (role == MEMBER_ROLE && isMember[account]) {
            isMember[account] = false;
            for (uint256 i = 0; i < members.length; i++) {
                if (members[i] == account) {
                    members[i] = members[members.length - 1];
                    members.pop();
                    break;
                }
            }
        }
    }

    /// @notice GlassScore 증가 (최대 100)
    function addGlassScore(address member, uint256 amount) external onlyRole(DAO_ROLE) {
        uint256 newScore = glassScore[member] + amount;
        if (newScore > 100) newScore = 100;
        glassScore[member] = newScore;
        emit GlassScoreChanged(member, newScore);
    }

    /// @notice GlassScore 감소 (최소 0, 자동 추방)
    function subGlassScore(address member, uint256 amount) external onlyRole(DAO_ROLE) {
        uint256 newScore = glassScore[member] > amount ? glassScore[member] - amount : 0;
        glassScore[member] = newScore;
        emit GlassScoreChanged(member, newScore);
        uint256 expelLimit = IDAO(daoAddress).scoreToExpel();
        if (glassScore[member] < expelLimit) {
            revokeRole(MEMBER_ROLE, member);
            penaltyCount[member] = 0;
            isMember[member] = false;
            for (uint256 i = 0; i < members.length; i++) {
                if (members[i] == member) {
                    members[i] = members[members.length - 1];
                    members.pop();
                    break;
                }
            }
        }
    }

    /// @notice 페널티 부과 및 countToExpel 미만시 자동 추방
    function addPenaltyAndExpel(address member) external {
        penaltyCount[member] += 1;
        uint256 expelLimit = IDAO(daoAddress).countToExpel();
        if (penaltyCount[member] >= expelLimit) {
            revokeRole(MEMBER_ROLE, member);
            penaltyCount[member] = 0;
            isMember[member] = false;
            for (uint256 i = 0; i < members.length; i++) {
                if (members[i] == member) {
                    members[i] = members[members.length - 1];
                    members.pop();
                    break;
                }
            }
        }
    }

    /// @notice 미참여 멤버 강제 기권처리 (DAO에서만 호출)
    function forceAbstain(uint256 proposalId, address member) external onlyRole(DAO_ROLE) {
        ProposalData storage p = proposals[proposalId];
        if (!hasVoted[proposalId][member]) {
            hasVoted[proposalId][member] = true;
            p.votesAbstain++;
            emit Voted(proposalId, member, 2);
        }
    }

    /// @notice 제안 생성 (멤버만 가능)
    function createProposal(
        string calldata title,
        string calldata description,
        uint256 amount,
        address payable recipient,
        bool requireVote,
        string calldata sanctionType,
        uint256 beforeValue,
        uint256 afterValue,
        address targetMember
    ) external onlyRole(MEMBER_ROLE) returns (uint256) {
        proposals.push(
            ProposalData({
                title: title,
                description: description,
                amount: amount,
                recipient: recipient,
                status: Status.Pending,
                votesFor: 0,
                votesAgainst: 0,
                votesAbstain: 0,
                startTime: block.timestamp,
                proposer: msg.sender,
                requireVote: requireVote,
                sanctionType: sanctionType,
                beforeValue: beforeValue,
                afterValue: afterValue,
                targetMember: targetMember
            })
        );
        uint256 pid = proposals.length - 1;
        emit ProposalCreated(pid, msg.sender);
        return pid;
    }

    /// @notice 투표 (0: 찬성, 1: 반대, 2: 기권)
    function vote(uint256 proposalId, uint8 choice) external onlyRole(MEMBER_ROLE) {
        ProposalData storage p = proposals[proposalId];
        require(p.requireVote, "Voting not required for this proposal");
        require(!hasVoted[proposalId][msg.sender], "Voting: already voted");

        hasVoted[proposalId][msg.sender] = true;
        if (choice == 0) {
            p.votesFor++;
        } else if (choice == 1) {
            p.votesAgainst++;
        } else if (choice == 2) {
            p.votesAbstain++;
        } else {
            revert("Invalid vote choice");
        }
        emit Voted(proposalId, msg.sender, choice);
    }

    /// @notice 단일 제안 정보 조회
    function getProposal(uint256 id) external view returns (ProposalData memory) {
        return proposals[id];
    }

    /// @notice 전체 제안 목록 조회
    function getAllProposals() external view returns (ProposalData[] memory) {
        return proposals;
    }

    /// @notice DAO에서 제안 상태 변경 (Passed/Rejected/Executed 등)
    function setProposalStatus(uint256 id, Status status)
        external
        onlyRole(DAO_ROLE)
    {
        proposals[id].status = status;
        emit ProposalStatusChanged(id, status);
    }

    /// @notice 특정 사용자가 해당 제안에 투표했는지 여부
    function hasVotedForProposal(uint256 proposalId, address voter) external view returns (bool) {
        return hasVoted[proposalId][voter];
    }

    /// @notice 투표 결과(찬성/반대/기권) 조회
    function getVotes(uint256 proposalId) external view returns (uint256 forVotes, uint256 againstVotes, uint256 abstainVotes) {
        ProposalData storage p = proposals[proposalId];
        return (p.votesFor, p.votesAgainst, p.votesAbstain);
    }

    /// @notice 멤버 전체 목록 반환
    function getAllMembers() external view returns (address[] memory) {
        return members;
    }

    /// @notice 멤버 수 반환
    function getMemberCount() external view returns (uint256) {
        return members.length;
    }
}