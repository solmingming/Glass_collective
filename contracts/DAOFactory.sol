// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./DAO.sol";
import "./Proposal.sol";
import "./Vault.sol";
import "./Execution.sol";

contract DAOFactory {
    address[] public deployedDAOs;

    event DAOCreated(
        address indexed daoAddress,
        address indexed creator,
        string name,
        string description,
        string category,
        bool isPrivate
    );

    function createDAO(
        string memory _name,
        string memory _description,
        string memory _category,
        address _owner,
        bool _isPrivate,
        string memory _inviteCode,
        uint256 _passCriteria,
        uint256 _votingDurationInSeconds,
        uint256 _entryFeeInWei,
        uint256 _absentPenaltyInWei,
        uint256 _countToExpel,
        uint256 _scoreToExpel
    ) external returns (address newDAOAddress) {
        // *** 1. 하위 컨트랙트 생성 시 팩토리 주소(address(this))를 전달하여 임시 관리자 권한을 부여합니다. ***
        Vault newVault = new Vault(_owner, address(0), address(this));
        Proposal newProposal = new Proposal(_owner, address(this));
        Execution newExecution = new Execution(address(newProposal), address(newVault));
        
        // *** 2. DAO 컨트랙트 생성 시 프론트엔드에서 받은 모든 규칙을 전달합니다. ***
        DAO newDAO = new DAO(
            address(newProposal),
            address(newVault),
            address(newExecution),
            _passCriteria,
            _votingDurationInSeconds,
            _absentPenaltyInWei,
            _countToExpel,
            _scoreToExpel,
            _entryFeeInWei,
            _isPrivate,
            _inviteCode
        );

        newDAOAddress = address(newDAO);

        // *** 3. 이제 팩토리는 임시 관리자 권한으로 필요한 설정을 수행할 수 있습니다. ***
        newProposal.setDaoAddress(newDAOAddress);
        newProposal.grantRole(newProposal.DAO_ROLE(), newDAOAddress);
        newExecution.setDaoAddress(newDAOAddress);
        newVault.grantRole(newVault.EXECUTOR_ROLE(), address(newExecution));
        
        // *** 4. (보안) 모든 설정이 끝난 후, 팩토리의 임시 관리자 권한을 스스로 제거합니다. ***
        newProposal.renounceFactoryAdminRole();
        newVault.renounceFactoryAdminRole();
        
        deployedDAOs.push(newDAOAddress);

        emit DAOCreated(newDAOAddress, _owner, _name, _description, _category, _isPrivate);

        return newDAOAddress;
    }

    function getAllDAOs() external view returns (address[] memory) {
        return deployedDAOs;
    }

    function getDAO_Count() external view returns (uint256) {
        return deployedDAOs.length;
    }
}