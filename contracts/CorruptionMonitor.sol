// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title CorruptionMonitor
 * @dev DAO 부패지수 계산을 위한 모듈 (예시용)
 *      - 다양한 메트릭을 업데이트
 *      - 부패지수(Corruption Index) 계산 및 조회
 */
contract CorruptionMonitor {
  // 내부 매트릭 구조체 (metric: 어떤 시스템의 상태를 숫자로 측정한 값... 수치화된 관측 지표)
  struct Metrics{
    uint256 emergencyTransfers;      // 긴급 이체 발생 건수
    uint256 lowParticipation;        // 투표 참여율 저하 횟수
    uint256 dominantActions;         // 소수 지갑 독점 행동
    uint256 untrackedTransfers;      // 미등록 지출 건수
    uint256 gasWaste;                // 가스 낭비 건수
    uint256 proposalConcentration;   // 제안 집중도 지표
  }

  // Metrics 구조체 타입인 metrics 선언
  Metrics public metrics;

  //부패 지수 업데이트
  event CorruptionIndexUpdated(uint256 index);

  // Metrics 업데이트트
  function updateMetrics(
    uint256 emergency,
    uint256 lowPart,
    uint256 dominant,
    uint256 untracked,
    uint256 gas,
    uint256 concentration
  ) external{
      metrics = Metrics(emergency, lowPart, dominant, untracked, gas, concentration);
      
      emit CorruptionIndexUpdated(getCorruptionIndex());
  }

  //부패지수 계산 (일단 예시로 든 계산식임)
  function getCorruptionIndex() public view returns (uint256){
    uint256 raw = metrics.emergencyTransfers * 2
      + metrics.lowParticipation * 3
      + metrics.dominantActions * 2
      + metrics.untrackedTransfers * 4
      + metrics.gasWaste * 1
      + metrics.proposalConcentration * 3;
    return raw;
  }
}