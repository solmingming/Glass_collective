// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Proposal.sol";
import "./Vault.sol";

/**
 * @title Execution
 * @dev 투표가 통과된 제안을 실제로 집행하는 컨트랙트
 *      - 실행 조건 검사(isExecutable)
 *      - 금고에서 이체 후 제안 상태 변경
 */

contract Execution{
  Proposal public proposalContract;
  Vault public vaultContract;
  address public daoAddress;

  // 이벤트 : 제안 실행 완료
  event ProposalExecuted(uint256 indexed proposalId);
  event RuleChanged(string rule, uint256 beforeValue, uint256 afterValue);
  event MemberExpelled(address indexed member);

  constructor(
    //이미 배포된 다른 컨트랙트 주소들
    //외부에서 이 컨트랙트를 배포할때, 각각의 컨트랙트 주소를 넘겨줘야 함
    address _proposal,
    address _vault,
    address _dao
  ){
    // 각각의 address를 해당 컨트랙트 타입으로 형변환해서 직접 함수 호출이 가능하도록 만드는 작업
    // ex. proposalContract.getproposalId(id) 처럼 사용가능 
    proposalContract = Proposal(_proposal);
    vaultContract = Vault(payable(_vault));
    daoAddress = _dao;
  }

  modifier onlyDAO(){
    require(msg.sender == daoAddress, "Execution: only DAO can call this function");
    _;
  }

  // 출금 proposal 실행
  function executePayout(uint256 proposalId) external onlyDAO {
    Proposal.ProposalData memory p = proposalContract.getProposal(proposalId);
    require(p.status == Proposal.Status.Passed, "Proposal not passed");
    require(p.amount > 0, "No amount specified");
    require(address(vaultContract).balance >= p.amount, "Insufficient balance");
    require(p.recipient != address(0), "No recipient");

    vaultContract.transfer(p.recipient, p.amount);
    proposalContract.setProposalStatus(proposalId, Proposal.Status.Executed);
    emit ProposalExecuted(proposalId);
  }

  // 규칙변경 proposal 실행
  function executeRuleChange(uint256 proposalId) external onlyDAO {
      Proposal.ProposalData memory p = proposalContract.getProposal(proposalId);
      require(p.status == Proposal.Status.Passed, "Proposal not passed");
      require(keccak256(bytes(p.sanctionType)) == keccak256(bytes("rule-change")), "Not a rule-change proposal");

      proposalContract.setProposalStatus(proposalId, Proposal.Status.Executed);
      emit RuleChanged(p.sanctionType, p.beforeValue, p.afterValue);
  }

  // 멤버 추방 proposal 실행 (필요시)
  function executeMemberExpel(uint256 proposalId) external onlyDAO {
      Proposal.ProposalData memory p = proposalContract.getProposal(proposalId);
      require(p.status == Proposal.Status.Passed, "Proposal not passed");
      require(keccak256(bytes(p.sanctionType)) == keccak256(bytes("member-expel")), "Not a member-expel proposal");

      proposalContract.setProposalStatus(proposalId, Proposal.Status.Executed);
      emit MemberExpelled(p.targetMember);
  }

}