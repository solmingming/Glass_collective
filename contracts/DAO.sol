// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Proposal.sol";
import "./Vault.sol";
import "./Execution.sol";

contract DAO {
    Proposal public proposalContract;
    Vault public vaultContract;
    Execution public executionContract;

    // *** 1. MODIFIED: 모든 규칙 변수들이 constructor에서 초기화되도록 변경되었습니다. ***
    uint256 public passCriteria;
    uint256 public votingDuration;
    uint256 public absentPenalty;
    uint256 public countToExpel;
    uint256 public scoreToExpel;
    uint256 public entryFee;
    
    // *** 2. NEW: Public/Private 구분을 위한 상태 변수가 추가되었습니다. ***
    bool public isPrivate;
    bytes32 public inviteCodeHash;

    mapping(uint256 => uint256) public proposalDeadline;
    mapping(uint256 => bool) public proposalExecuted;

    event ProposalPassed(uint256 indexed proposalId);
    event ProposalRejected(uint256 indexed proposalId);

    // *** 3. MODIFIED: 생성자가 DAO의 모든 설정 값을 인자로 받습니다. ***
    constructor(
        address _proposal,
        address _vault,
        address _execution,
        uint256 _passCriteria,
        uint256 _votingDurationInSeconds,
        uint256 _absentPenaltyInWei,
        uint256 _countToExpel,
        uint256 _scoreToExpel,
        uint256 _entryFeeInWei,
        bool _isPrivate,
        string memory _inviteCode
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

    // *** 4. MODIFIED: 가입 함수가 Public/Private용으로 분리되었습니다. ***
    function joinDAO() external payable {
        require(!isPrivate, "DAO: Use joinDAOWithCode for private collectives");
        _join(msg.value);
    }

    function joinDAOWithCode(string memory _inviteCode) external payable {
        require(isPrivate, "DAO: This is a public collective");
        require(keccak256(abi.encodePacked(_inviteCode)) == inviteCodeHash, "DAO: Invalid invite code");
        _join(msg.value);
    }

    function _join(uint256 _value) internal {
        require(!proposalContract.hasRole(proposalContract.MEMBER_ROLE(), msg.sender), "Already a member");
        require(_value == entryFee, "Incorrect join fee");
        (bool sent, ) = address(vaultContract).call{value: _value}("");
        require(sent, "Failed to send Ether to vault");
        proposalContract.grantRole(proposalContract.MEMBER_ROLE(), msg.sender);
    }
    
    // ... 이하 다른 함수들은 기존과 동일 (생략 없음) ...
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

    function vote(uint256 proposalId, uint8 choice) external {
        require(proposalContract.hasRole(proposalContract.MEMBER_ROLE(), msg.sender), "DAO: Caller is not a member");
        proposalContract.vote(proposalId, choice, msg.sender);
    }

    function finalizeProposal(uint256 proposalId) external {
        Proposal.ProposalData memory p = proposalContract.getProposal(proposalId);
        require(p.requireVote, "Not a voting proposal");
        require(block.timestamp > proposalDeadline[proposalId], "Voting period not ended");
        require(!proposalExecuted[proposalId], "Proposal already finalized");

        address[] memory members = proposalContract.getAllMembers();
        for (uint256 i = 0; i < members.length; i++) {
            if (!proposalContract.hasVotedForProposal(proposalId, members[i])) {
                proposalContract.addPenaltyAndExpel(members[i]);
                proposalContract.forceAbstain(proposalId, members[i]);
                (bool sent, ) = address(vaultContract).call{value: absentPenalty}("");
                require(sent, "Failed to send penalty to vault");
            }
        }
        p = proposalContract.getProposal(proposalId);

        uint256 totalEffectiveVotes = p.votesFor + p.votesAgainst + p.votesAbstain;
        uint256 passRate = totalEffectiveVotes == 0 ? 0 : (p.votesFor * 100) / totalEffectiveVotes;

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
        string memory sType = p.sanctionType;

        if (keccak256(bytes(sType)) == keccak256(bytes("treasury-out"))) { executionContract.executePayout(proposalId); }
        else if (keccak256(bytes(sType)) == keccak256(bytes("treasury-in"))) { executionContract.executeDeposit(proposalId); }
        else if (keccak256(bytes(sType)) == keccak256(bytes("rule-change"))) {
            string memory title = p.title;
            if (keccak256(bytes(title)) == keccak256(bytes("passCriteria"))) { passCriteria = p.afterValue; }
            else if (keccak256(bytes(title)) == keccak256(bytes("votingDuration"))) { votingDuration = p.afterValue; }
            else if (keccak256(bytes(title)) == keccak256(bytes("absentPenalty"))) { absentPenalty = p.afterValue; }
            else if (keccak256(bytes(title)) == keccak256(bytes("entryFee"))) { entryFee = p.afterValue; }
            else if (keccak256(bytes(title)) == keccak256(bytes("countToExpel"))) { countToExpel = p.afterValue; }
            else if (keccak256(bytes(title)) == keccak256(bytes("scoreToExpel"))) { scoreToExpel = p.afterValue; }
            executionContract.executeRuleChange(proposalId);
        }
    }
    
    function isMember(address user) external view returns (bool) {
        return proposalContract.hasRole(proposalContract.MEMBER_ROLE(), user);
    }
    function getTreasuryBalance() external view returns (uint256) { return vaultContract.getBalance(); }
    function getAllMembers() public view returns (address[] memory) { return proposalContract.getAllMembers(); }
    function getMemberCount() public view returns (uint256) { return proposalContract.getMemberCount(); }
}