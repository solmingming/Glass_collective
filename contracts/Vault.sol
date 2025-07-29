// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
* @title Vault
* @dev DAO의 금고 역할을 수행하는 컨트랙트
* - ETH 입금 받기 (receive)
* - 잔액 조회 (getBalance)
* - 권한 있는 역할(TREASURER_ROLE)만 출금 가능
* - 수정: .transfer() 대신 .call() 사용 및 재진입 공격 방지
*/
contract Vault is AccessControl, ReentrancyGuard {
    bytes32 public constant TREASURER_ROLE = keccak256("TREASURER_ROLE");

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(TREASURER_ROLE, admin);
    }

    receive() external payable {}

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function transfer(address payable to, uint256 amount)
        external
        onlyRole(TREASURER_ROLE)
        nonReentrant // 재진입 방지
    {
        require(
            address(this).balance >= amount,
            "Vault: insufficient balance"
        );

        // .transfer() 대신 call 사용
        (bool success, ) = to.call{value: amount}("");
        require(success, "Vault: transfer failed");
    }
}