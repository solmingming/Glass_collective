// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title Voting
 * @dev 제안에 대한 찬반 투표 로직을 구현하는 컨트랙트
 *      - 투표 시작(startVoting)
 *      - 투표 참여(vote)
 *      - 투표 결과 조회(getVotes, hasVoted)
 */

contract Voting is AccessControl{
  //DAO 구성원 역할
  bytes32 public constant MEMBER_ROLE = keccak256("MEMBER_ROLE");

  //단일제안 투표 기록 구조체
  struct VoteRecord{
    mapping(address=>bool) hasVoted; // 중복투표 방지
    //mapping: 일종의 해시테이블(key->value), address: 유저의 지갑 주소, bool: 투표여부... json 생각하면 편함
    uint256 votesFor; //찬성표
    uint256 votesAgainst; //반대표
    uint256 endTime; //투표마감시각
  }

  //proposalId -> VoteRecord 매핑
  //즉, 각 제안에 대한 투표 기록을 저장함 ex. voteRecords[0] -> 0번 제안의 투표 상태
  mapping(uint256=>VoteRecord) public voteRecords;
  // 투표기간 기본값 (예시. 3일)
  uint256 public votingDuration = 3 days;

  //proposalId번 제안에 대해 voter가 support(찬성,반대) 투표했다는 사실을 블록체인 로그에 기록하는 이벤트 선언
  //이 이벤트는 나중에 emit하여 사용될 수 있음 ex. emit Voted(1, msg.sender, true);
  //event는 이벤트 구조를 정의(어떤 데이터를 로그로 기록할지 정의)
  //emit은 정의된 이벤트를 실제로 로그에 기록록
  event Voted(uint256 indexed proposalId, address indexed voter, bool support);

  function startVoting(uint256 proposalId) external onlyRole(DEFAULT_ADMIN_ROLE){
    voteRecords[proposalId].endTime = block.timestamp + votingDuration;
  }

  function vote(uint256 proposalId, bool support) external onlyRole(MEMBER_ROLE){
    VoteRecord storage vr = voteRecords[proposalId];
    // storage: 블록체인에 저장 -> 영구 저장 + 원본에 접근 -> 가스비 더 많이 소비
    // memory : 임시 저장 공간(함수 실행중에만) + 원본은 그대로, 복사본에 접근근

    require(block.timestamp<=vr.endTime, "Voting: period ended");
    //마감 확인
    require(!vr.hasVoted[msg.sender], "Voting: already voted");

    vr.hasVoted[msg.sender] = true;
    if(support)  vr.votesFor++;
    else  vr.votesAgainst++;

    emit Voted(proposalId, msg.sender, support);
  }

  //투표 결과 조회
  function getVotes(uint256 proposalId)
    external
    view
    returns (uint256 forVotes, uint256 againstVotes)
  {
    VoteRecord storage vr = voteRecords[proposalId];
    return (vr.votesFor, vr.votesAgainst);  
  }

  // 특정 사용자가 해당 제안에 투표했느지 여부 조회
  function hasVoted(uint256 proposalId, address voter)
    external
    view
    returns (bool)
  {
    return voteRecords[proposalId].hasVoted[voter];
  }
}