// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
* @title Vault
* @dev DAO의 금고 역할을 수행하는 컨트랙트
*      - ETH 입금 받기 (receive)
*      - 잔액 조회 (getBalance)
*      - 권한 있는 역할(TREASURER_ROLE)만 출금 가능
*/

// Valut는 AccessControl이라는 기존 컨트랙트를 상속받음
// AccessControl은 OpenZeppelin 라이브러리에서 제공하는 컨트랙트, 역할 생성/부여/확인/접근 제어 가능
// **** 회계 담당(Vault) 역할 정의 ****
contract Vault is AccessControl {

  // TREASURE ROLE 이라는 역할을 가진 사람만 실행 가능한 함수.. 의 권한 검사를 할 때 사용될 고유ID
  // 즉, 당신은 TREASURE_ROLE 역할을 수행할 수 있습니까? 를 찾을 수 있는 ID

  // bytes32: 32바이트 고정 길이 데이터타입
  // public : 외부에서 읽을 수 있음 (ex. Valut.TREASURE_ROLE())
  // constant : 상수 선언, 한번 설정되면 변경 불가능한 불변 변수
  // keccak256 : TREASURE_ROLE이라는 문자열을 keccak256이라는 해시함수로 해싱 -> 결과 : bytes32 형식
  // + 이더리움에서 가장 많이 사용되는 암호학적 해시 함수, 고유한 32바이트 해시를 만들어서 역할 식별시 사용
  bytes32 public constant TREASURER_ROLE = keccak256("TREASURER_ROLE");

  //constructor : solidity에서 컨트랙트가 처음 배포될 때 딱 한번만 실행되는 특별한 함수
  constructor(address admin){ // address admin: 배포할때 전달받는 주소형 인자, 이 주소에게 관리자 권한 부여
  
    // _setupRole : AccessControl 컨트랙트에서 제공하는 내부 함수
    // DEFAULT_ADMIN_ROLE : 모든 역할을 관리할 수 있는 최상위 권한
    _grantRole(DEFAULT_ADMIN_ROLE, admin); // 최고 관리자 권한 부여
    _grantRole(TREASURER_ROLE, admin); // 회계 담당자 역할 권한 부여
  }

  // receive : Ether를 받기 위한 특별한 함수
  // external : 이 함수는 외부에서 호출만 가능
  // payable : 이더를 "받을 수 있는" 함수
  receive() external payable{
    // 의도적으로 빈 함수.. Ether만 받고 아무것도 수행 X
    // 컨트랙트로 Ether을 직접 전송할 때, 데이터 없이 이더만 전송할 때 실행됨!
  }

  // 이 컨트랙트에 얼마나 많은 Ether가 있는지 조회하는 함수
  // ex. uint balance = Valut.getBalance() 를 통해 보유 이더량을 조회 가능
  // getBalance라는 함수, 매개변수x, external(컨트랙트 외부에서만 호출 가능, 내부에서 호출하려면 this.getBalance처럼 사용
  // view : 읽기 전용 함수(가스 소모x) / returns (uint256): 256비트 부호 없는정수를 리턴함
  // why? 이더리움에서 Ether 잔액은 항상 uint256 wei 단위로 표현됨
  function getBalance() external view returns (uint256){
    return address(this).balance;
    //현재 컨트랙트(this)의 주소를 가져와서 이더 잔액을 반환
  }

  //스마트 컨트랙트에 보관된 Ether을 특정 주소로 송금하는 함수 (TREASURER_ROLE 권한을 가진 사람만 가능)
  // address payable to : 이더를 전송할 대상 주소, payable이 붙어 있어야 .trnasfer() 가능
  // uint256 amount : 전송할 이더 금액 (단위 : wei)
  // TREASURER_ROLE 권한을 가진 계정만 호출 가능 + 그렇지 않을시 해당 트랜잭션은 revert(철회?)됨됨
  function transfer(address payable to, uint256 amount)
    external
    onlyRole(TREASURER_ROLE)
  {
    // 잔액 확인
    // require : 조건 검증 구문, 조건이 false일시 트랜잭션 실패 + "vault: insufficient balance" 메시지 출력력
    require(address(this).balance >= amount,
            "Vault: insufficient balance");
    // 실제 전송
    to.transfer(amount); //실제 전송
    // .transfer()은 2300gas만 전달되는 안전한 전송 방식임 (실패시 자동 revert)

    // 추가적인 아이디어
    // grantRole(TREASURER_ROLE,) 를 통해 DAO 투표로 회계 담당자 교체
    // emit TransferLog(...) 로 출금 로그 남기기기
  }
}