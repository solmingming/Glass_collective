// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Proposal.sol";
import "./Vault.sol";

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
        proposalContract.setProposalStatus(proposalId, Proposal.Status.Executed);
        emit ProposalExecuted(proposalId);
    }

    function executePayout(uint256 proposalId) external onlyDAO {
        Proposal.ProposalData memory p = proposalContract.getProposal(proposalId);
        require(address(vaultContract).balance >= p.amount, "Insufficient balance");
        vaultContract.transfer(p.recipient, p.amount);
        proposalContract.setProposalStatus(proposalId, Proposal.Status.Executed);
        emit ProposalExecuted(proposalId);
    }

    function executeRuleChange(uint256 proposalId) external onlyDAO {
        Proposal.ProposalData memory p = proposalContract.getProposal(proposalId);
        proposalContract.setProposalStatus(proposalId, Proposal.Status.Executed);
        emit RuleChanged(p.title, p.beforeValue, p.afterValue);
    }
}