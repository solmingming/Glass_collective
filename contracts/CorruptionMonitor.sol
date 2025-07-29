// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title CorruptionMonitor
 * @dev DAO 부패지수 계산을 위한 모듈 (예시용)
 * - 다양한 메트릭을 업데이트
 * - 부패지수(Corruption Index) 계산 및 조회
 * - 수정: 관리자만 메트릭을 업데이트할 수 있도록 접근 제어 추가
 */
contract CorruptionMonitor is AccessControl {
    // 내부 매트릭 구조체
    struct Metrics {
        uint256 emergencyTransfers; // 긴급 이체 발생 건수
        uint256 lowParticipation; // 투표 참여율 저하 횟수
        uint256 dominantActions; // 소수 지갑 독점 행동
        uint256 untrackedTransfers; // 미등록 지출 건수
        uint256 gasWaste; // 가스 낭비 건수
        uint256 proposalConcentration; // 제안 집중도 지표
    }

    Metrics public metrics;
    event CorruptionIndexUpdated(uint256 index);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    // Metrics 업데이트
    function updateMetrics(
        uint256 emergency,
        uint256 lowPart,
        uint256 dominant,
        uint256 untracked,
        uint256 gas,
        uint256 concentration
    ) external onlyRole(DEFAULT_ADMIN_ROLE) { // 관리자만 호출 가능
        metrics = Metrics(
            emergency,
            lowPart,
            dominant,
            untracked,
            gas,
            concentration
        );
        emit CorruptionIndexUpdated(getCorruptionIndex());
    }

    // 부패지수 계산 (가중치는 예시)
    function getCorruptionIndex() public view returns (uint256) {
        uint256 raw = metrics.emergencyTransfers * 2 +
            metrics.lowParticipation * 3 +
            metrics.dominantActions * 2 +
            metrics.untrackedTransfers * 4 +
            metrics.gasWaste * 1 +
            metrics.proposalConcentration * 3;
        return raw;
    }
}