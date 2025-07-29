// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Proposal.sol";
import "./Vault.sol";

/**
 * @title Execution
 * @dev 통과된 제안을 실제로 집행하는 컨트랙트.
 */
contract Execution {
    Proposal public proposalContract;
    Vault public vaultContract;
    address public daoAddress;

    event ProposalExecuted(uint256 indexed proposalId);
    event RuleChanged(string rule, uint256 beforeValue, uint256 afterValue);

    constructor(address _proposal, address _vault) {
        proposalContract = Proposal(_proposal);
        vaultContract = Vault(payable(_vault));
    }

    function setDaoAddress(address _dao) external {
        require(daoAddress == address(0), "DAO address is already set");
        daoAddress = _dao;
    }

    modifier onlyDAO() {
        require(msg.sender == daoAddress, "Only DAO can call this function");
        _;
    }

    function executeDeposit(uint256 proposalId) external onlyDAO {
        Proposal.ProposalData memory p = proposalContract.getProposal(proposalId);
        require(p.status == Proposal.Status.Passed, "Proposal not passed");
        proposalContract.setProposalStatus(proposalId, Proposal.Status.Executed);
        emit ProposalExecuted(proposalId);
    }

    function executePayout(uint256 proposalId) external onlyDAO {
        Proposal.ProposalData memory p = proposalContract.getProposal(proposalId);
        require(p.status == Proposal.Status.Passed, "Proposal not passed");
        require(address(vaultContract).balance >= p.amount, "Insufficient balance in Vault");
        vaultContract.transfer(p.recipient, p.amount);
        proposalContract.setProposalStatus(proposalId, Proposal.Status.Executed);
        emit ProposalExecuted(proposalId);
    }

    function executeRuleChange(uint256 proposalId) external onlyDAO {
        Proposal.ProposalData memory p = proposalContract.getProposal(proposalId);
        require(p.status == Proposal.Status.Passed, "Proposal not passed");
        proposalContract.setProposalStatus(proposalId, Proposal.Status.Executed);
        emit RuleChanged(p.title, p.beforeValue, p.afterValue);
    }
}