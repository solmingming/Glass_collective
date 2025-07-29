// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title GovernanceToken
 * @dev DAO 거버넌스 토큰 - 멤버십과 투표 가중치 관리
 * - 토큰 보유량 기반 투표 가중치
 * - 스테이킹 시스템
 * - 멤버 등급별 권한 차등화
 */

contract GovernanceToken is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

    // 멤버 등급별 최소 토큰 보유량
    mapping(uint8 => uint256) public memberTiers;

    // 사용자별 스테이킹 정보
    struct StakingInfo {
        uint256 stakedAmount;
        uint256 stakingStartTime;
        uint256 lastRewardTime;
    }

    mapping(address => StakingInfo) public stakingInfo;

    // 스테이킹 관련 상수
    uint256 public constant MIN_STAKE_AMOUNT = 100 * 10**18; // 100 토큰
    uint256 public constant LOCK_PERIOD = 30 days;
    
    // 수정됨: 연간 보상률(5%)을 초당 보상률로 변환. 더 높은 정밀도를 위해 10**18을 곱해줌.
    // (5 * 10**18) / (100 * 365 days) = 1585489599188229
    uint256 public constant REWARD_RATE_PER_SECOND = 1585489599188229;

    // 이벤트
    event TokensStaked(address indexed user, uint256 amount);
    event TokensUnstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event MemberTierUpdated(uint8 tier, uint256 minAmount);

    constructor(
        string memory name,
        string memory symbol,
        address admin
    ) ERC20(name, symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(GOVERNANCE_ROLE, admin);

        // 멤버 등급별 최소 토큰 설정
        memberTiers[1] = 100 * 10**18; // Bronze: 100 토큰
        memberTiers[2] = 500 * 10**18; // Silver: 500 토큰
        memberTiers[3] = 1000 * 10**18; // Gold: 1000 토큰
        memberTiers[4] = 5000 * 10**18; // Platinum: 5000 토큰
    }

    // 토큰 민팅 (관리자만)
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    // 스테이킹
    function stake(uint256 amount) external {
        require(
            amount >= MIN_STAKE_AMOUNT,
            "GovernanceToken: insufficient stake amount"
        );
        require(
            balanceOf(msg.sender) >= amount,
            "GovernanceToken: insufficient balance"
        );

        _claimRewards(msg.sender); // 스테이킹 시 기존 보상을 먼저 정산

        _transfer(msg.sender, address(this), amount);

        StakingInfo storage info = stakingInfo[msg.sender];
        if (info.stakedAmount == 0) { // 최초 스테이킹 시 시간 기록
            info.stakingStartTime = block.timestamp;
            info.lastRewardTime = block.timestamp;
        }
        info.stakedAmount += amount;

        emit TokensStaked(msg.sender, amount);
    }

    // 언스테이킹
    function unstake(uint256 amount) external {
        _claimRewards(msg.sender); // 언스테이킹 시 보상 먼저 정산

        StakingInfo storage info = stakingInfo[msg.sender];
        require(
            info.stakedAmount >= amount,
            "GovernanceToken: insufficient staked amount"
        );

        info.stakedAmount -= amount;
        _transfer(address(this), msg.sender, amount);

        emit TokensUnstaked(msg.sender, amount);
    }

    // 보상 청구 (외부 호출용)
    function claimRewards() external {
        uint256 rewards = _claimRewards(msg.sender);
        require(rewards > 0, "GovernanceToken: no rewards to claim");
    }

    // 보상 청구 (내부 로직)
    function _claimRewards(address user) internal returns (uint256) {
        uint256 rewards = calculateRewards(user);
        if (rewards > 0) {
            stakingInfo[user].lastRewardTime = block.timestamp;
            _mint(user, rewards);
            emit RewardsClaimed(user, rewards);
        }
        return rewards;
    }

    // 보상 계산
    function calculateRewards(address user) public view returns (uint256) {
        StakingInfo storage info = stakingInfo[user];
        if (info.stakedAmount == 0) return 0;

        uint256 timeElapsed = block.timestamp - info.lastRewardTime;

        // 수정됨: 초당 보상률 기반으로 계산 (더 높은 정밀도를 위해 10**18 스케일 유지)
        return (info.stakedAmount * timeElapsed * REWARD_RATE_PER_SECOND) / 10**18;
    }

    // 투표 가중치 계산 (보유 토큰 + 스테이킹)
    function getVotingPower(address user) public view returns (uint256) {
        uint256 balance = balanceOf(user);
        uint256 staked = stakingInfo[user].stakedAmount;

        // 스테이킹된 토큰은 1.5배 가중치 (150%)
        return balance + (staked * 3 / 2);
    }

    // 멤버 등급 확인
    function getMemberTier(address user) external view returns (uint8) {
        uint256 votingPower = getVotingPower(user);
        if (votingPower >= memberTiers[4]) return 4; // Platinum
        if (votingPower >= memberTiers[3]) return 3; // Gold
        if (votingPower >= memberTiers[2]) return 2; // Silver
        if (votingPower >= memberTiers[1]) return 1; // Bronze
        return 0; // No tier
    }

    // 멤버 등급별 최소 토큰 설정 (관리자만)
    function setMemberTier(uint8 tier, uint256 minAmount)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        memberTiers[tier] = minAmount;
        emit MemberTierUpdated(tier, minAmount);
    }

    // 스테이킹된 토큰 잔액 조회
    function stakedBalanceOf(address user) external view returns (uint256) {
        return stakingInfo[user].stakedAmount;
    }

    // 스테이킹 시작 시간 조회
    function getStakingStartTime(address user) external view returns (uint256) {
        return stakingInfo[user].stakingStartTime;
    }
}