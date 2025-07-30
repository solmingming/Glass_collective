// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract Vault is AccessControl {
    bytes32 public constant TREASURER_ROLE = keccak256("TREASURER_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");

    event Deposited(address indexed from, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    // *** 1. MODIFIED: constructor가 factory 주소를 받도록 수정되었습니다. ***
    constructor(address initialAdmin, address executor, address factoryAddress) {
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(TREASURER_ROLE, initialAdmin);
        
        if (factoryAddress != address(0)) {
            _grantRole(DEFAULT_ADMIN_ROLE, factoryAddress);
        }

        if (executor != address(0)) {
            _grantRole(EXECUTOR_ROLE, executor);
        }
    }

    // *** 2. NEW: 팩토리가 임시 관리자 권한을 포기하는 함수가 추가되었습니다. ***
    function renounceFactoryAdminRole() external {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not an admin");
        renounceRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    receive() external payable {
        emit Deposited(msg.sender, msg.value);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function transfer(address payable to, uint256 amount) external onlyRole(EXECUTOR_ROLE) {
        require(address(this).balance >= amount, "Vault: insufficient balance");
        to.transfer(amount);
        emit Withdrawn(to, amount);
    }
}