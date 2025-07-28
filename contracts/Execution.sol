// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Proposal.sol";
import "./Voting.sol";
import "./Vault.sol";

/**
 * @title Execution
 * @dev 투표가 통과된 제안을 실제로 집행하는 컨트랙트
 *      - 실행 조건 검사(isExecutable)
 *      - 금고에서 이체 후 제안 상태 변경
 */

contract Execution{
  // proposal, voting, vault 타입의 상태 변수 3개 생성성
  Proposal public proposalContract;
  Voting public votingContract;
  Vault public vaultContract;

  //정족수 퍼센트,,, 과반수 통과 기준을 퍼센트(%)로 선정
  uint256 public quorumPercent = 50;

  // 이벤트 : 제안 실행 완료료
  event ProposalExecuted(uint256 indexed proposalId);

  constructor(
    //이미 배포된 다른 컨트랙트 주소들
    //외부에서 이 컨트랙트를 배포할때, 각각의 컨트랙트 주소를 넘겨줘야 함
    // ex. new Execution(proposalAddress, votingAddress, vaultAddress);
    address _proposal,
    address _voting,
    address payable _vault
  ){
    // 각각의 address를 해당 컨트랙트 타입으로 형변환해서 직접 함수 호출이 가능하도록 만드는 작업
    // ex. proposalContract.getproposalId(id) 처럼 사용가능 
    proposalContract = Proposal(_proposal);
    votingContract = Voting(_voting);
    vaultContract = Vault(_vault);
  }

  // 제안 실행 가능 여부 확인
  function isExecutable(uint256 proposalId) public view returns (bool){
    (uint256 forVotes, uint256 againstVotes) = votingContract.getVotes(proposalId);
    uint256 totalVotes = forVotes + againstVotes;
    if(totalVotes==0) return false;

    return (forVotes * 100 / totalVotes) >= quorumPercent;
  }

  function executeProposal(uint256 proposalId) external {
    require(isExecutable(proposalId), "Execution: quorum not reached");

    // 해당 proposalId에 해당하는 proposal의 복사본 p를 만듬듬
    Proposal.ProposalData memory p = proposalContract.getProposal(proposalId);

    require(p.status == Proposal.Status.Pending, "Execution: invalid status");

    //금고 이체
    vaultContract.transfer(p.recipient, p.amount);
    //제안 상태를 Executed로 변경
    proposalContract.setProposalStatus(proposalId, Proposal.Status.Executed);

    emit ProposalExecuted(proposalId);
  }
}