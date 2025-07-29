// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract Vault is AccessControl {
    bytes32 public constant TREASURER_ROLE = keccak256("TREASURER_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");

    event Deposited(address indexed from, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    constructor(address admin, address executor) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(TREASURER_ROLE, admin);
        if (executor != address(0)) {
            _grantRole(EXECUTOR_ROLE, executor);
        }
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