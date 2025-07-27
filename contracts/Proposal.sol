// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title Proposal
 * @dev 제안의 등록과 상태 관리를 담당하는 컨트랙트
 *      - 제안 생성(createProposal)
 *      - 단일/전체 제안 조회(getProposal, getAllProposals)
 *      - 상태 변경(on-chain admin only)
 */

// proposal 컨트랙트는 AccessControl 컨트랙트 상속 (역할 생성, 부여 등등 정의)
contract Proposal is AccessControl{
  //DAO "구성원 역할"을 나타내기 위한 고유 ID 정의
  bytes32 public constant MEMBER_ROLE = keccak256("MEMBER_ROLE");

  // enum: 열거형 타입 / status : 제안의 상태를 나타냄
  // pending: 투표가 아직 진행중 / passed, rejected: 통과/기각된 제안 / Executed: 실제 실행완료된 제안
  enum Status { Pending, Passed, Rejected, Executed }

  //제안의 구체적인 정보를 담은 데이터 구조체
  struct ProposalData {
    string title;              // 제안 제목
    string description;        // 상세 설명
    uint256 amount;            // 요청 금액 (wei)
    address payable recipient; // 자금을 받는 사람
    Status status;             // 제안 현재 상태 (pending, passed...)
    uint256 votesFor;          // 찬성표 수
    uint256 votesAgainst;      // 반대표 수
    uint256 startTime;         // 제안 생성 시각 (block.timestamp)
  }

  event ProposalCreated(uint256 indexed id, address indexed proposer);
  event ProposalStatusChanged(uint256 indexed id, Status status);
  // 제안을 저장하는 배열 ( 배열 이름은 proposals이라고 정의)
  // + proposals(0) -> 첫번째 제안 반환 / proposals.length -> 총 제안 개수 조회 가능
  ProposalData[] public proposals;

  constructor(address admin){
    _grantRole(DEFAULT_ADMIN_ROLE, admin); // admin에게 관리자 권안 부여
    _grantRole(MEMBER_ROLE, admin); // admin에게 구성원 역할 부여
  }

  //DAO 구성원이 새로운 제안(Proposal)을 등록할 수 있는 함수수
  function createProposal( // string calldata: 외부 입력으로 받고 가스 절약
        string calldata title,
        string calldata description,
        uint256 amount, // 제안이 요청하는 Ether 양 (단위:Wei)
        address payable recipient //Ether을 수령할 대상 주소 (출금이므로 payable 필요)
    ) external onlyRole(MEMBER_ROLE) returns (uint256) { // DAO 멤버만 제안을 호출할 수 있고 uint256형태로 반환
        // ProposalData 구조체 초기화 후 배열에 추가
        proposals.push(
            ProposalData({
                title: title,
                description: description,
                amount: amount,
                recipient: recipient,
                status: Status.Pending, // 제안의 초기 상태는 pending
                votesFor: 0, // 초기엔 투표한 사람 없음 -> 찬성0, 반대0
                votesAgainst: 0,
                startTime: block.timestamp // 제안이 생성된 시각각
            })
        );
        // 새로 추가된 제안 ID는 배열의 마지막 인덱스 -> length-1로 게산산
        uint256 pid = proposals.length - 1;
        // 블록체인 로그를 생성하는 부분 (msg.sender는 이 함수를 호출한 계정(=제안자))
        emit ProposalCreated(pid, msg.sender);
        // 새로 생성된 제안의 ID(배열 인덱스) 반환,,, 외부에서 사용 가능
        return pid;
    }

    //단일 제안 정보 조회
    //제안id를 받아서 ProposalData 구조체를 메모리에 복사하여 반환
    //view:상태변경 없이 블록체인 데이터를 읽기 전용으로 조회
    function getProposal(uint256 id) external view returns (ProposalData memory){
      return proposals[id];
    }

    function getAllProposals() external view returns (ProposalData[] memory){
      return proposals;
    }

    // DAO의 제안의 상태를 변경하는 관리자 전용 함수 (통과or기각or 실행되었는지 등등...)
    function setProposalStatus(uint256 id, Status status)
      external
      onlyRole(DEFAULT_ADMIN_ROLE)
    {
      proposals[id].status = status;
      // 이벤트 발생, 프론트엔드나 다른 시스템이 제안 상태 변경을 실시간 감지할 수 있도록 로그를 남김김
      emit ProposalStatusChanged(id, status);
    }

    // * 추가적인 아이디어 *
    // 투표 결과에 따라 자동으로 Passed/rejected 결정
    // 자금 송금이 완료되면 executed로 자동 변경
    // startTime이후 일정 시간만 수정 가능 등 제한 추가
}