// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Proposal.sol";
import "./Vault.sol";
import "./Execution.sol";

contract DAO {
    Proposal public proposalContract;
    Vault public vaultContract;
    Execution public executionContract;

    uint256 public passCriteria = 50;
    uint256 public votingDuration = 3 days;
    uint256 public absentPenalty = 0.001 ether;
    uint256 public countToExpel = 5;
    uint256 public scoreToExpel = 20;
    uint256 public entryFee = 0 ether;

    mapping(uint256 => uint256) public proposalDeadline;
    mapping(uint256 => bool) public proposalExecuted;

    event ProposalPassed(uint256 indexed proposalId);
    event ProposalRejected(uint256 indexed proposalId);

    constructor(address _proposal, address _vault, address _execution) {
        proposalContract = Proposal(_proposal);
        vaultContract = Vault(payable(_vault));
        executionContract = Execution(_execution);
    }
    
    receive() external payable {}

    function joinDAO() external payable {
        require(!proposalContract.hasRole(proposalContract.MEMBER_ROLE(), msg.sender), "Already a member");
        require(msg.value == entryFee, "Incorrect join fee");
        (bool sent, ) = address(vaultContract).call{value: msg.value}("");
        require(sent, "Failed to send Ether to vault");
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
        proposalContract.addGlassScore(msg.sender, 3);
        if (requireVote) {
            proposalDeadline[pid] = block.timestamp + votingDuration;
        } else {
            _executeProposal(pid);
        }
        return pid;
    }

    function vote(uint256 proposalId, uint8 choice) external {
        require(proposalContract.hasRole(proposalContract.MEMBER_ROLE(), msg.sender), "DAO: Caller is not a member");
        proposalContract.addGlassScore(msg.sender, 1);
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
                proposalContract.subGlassScore(members[i], 3);
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
            
            if (keccak256(bytes(p.sanctionType)) != keccak256(bytes("execution-check"))) {
                string memory newTitle = string(abi.encodePacked("Execution Check: ", p.title));
                string memory newDesc = "Vote YES if the original proposal was executed correctly, NO otherwise.";
                uint256 newPid = proposalContract.createProposal(
                    Proposal.ProposalInput({
                        title: newTitle, description: newDesc, amount: 0, recipient: payable(address(0)),
                        requireVote: true, sanctionType: "execution-check", beforeValue: 0, afterValue: 0,
                        targetMember: p.proposer
                    }), address(this)
                );
                proposalDeadline[newPid] = block.timestamp + votingDuration;
            }
        } else {
            proposalContract.setProposalStatus(proposalId, Proposal.Status.Rejected);
            emit ProposalRejected(proposalId);
        }
        proposalExecuted[proposalId] = true;

        if (keccak256(bytes(p.sanctionType)) == keccak256(bytes("execution-check"))) {
            if (passRate >= passCriteria) {
                proposalContract.addGlassScore(p.targetMember, 4);
            } else {
                proposalContract.subGlassScore(p.targetMember, 10);
            }
        }
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

    function adminSubGlassScore(address member, uint256 amount) external {
        require(proposalContract.hasRole(proposalContract.DEFAULT_ADMIN_ROLE(), msg.sender), "Not admin");
        proposalContract.subGlassScore(member, amount);
    }

    function getTreasuryBalance() external view returns (uint256) { return vaultContract.getBalance(); }
    function getAllMembers() public view returns (address[] memory) { return proposalContract.getAllMembers(); }
    function getMemberCount() public view returns (uint256) { return proposalContract.getMemberCount(); }
}