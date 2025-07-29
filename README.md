# Glass Collective DAO

투명하고 안전한 DAO 운영을 위한 완전한 스마트 컨트랙트 생태계입니다.

## 🏗️ 스마트 컨트랙트 아키텍처

### 핵심 컨트랙트

#### 1. **GovernanceToken.sol** - 거버넌스 토큰
- **기능**: 멤버십 토큰과 투표 가중치 관리
- **주요 특징**:
  - ERC20 표준 기반 거버넌스 토큰
  - 스테이킹 시스템 (5% 연간 보상)
  - 멤버 등급별 권한 차등화 (Bronze, Silver, Gold, Platinum)
  - 투표 가중치 계산 (보유 토큰 + 스테이킹 1.5배 가중치)
  - 일시정지 기능

#### 2. **EnhancedProposal.sol** - 향상된 제안 시스템
- **기능**: 카테고리별 제안, 긴급 제안, 제안 수정/취소
- **주요 특징**:
  - 5개 카테고리 (일반, 재무, 운영, 기술, 긴급)
  - 카테고리별 다른 투표 기간과 정족수
  - 긴급 제안 시스템 (단축된 투표 기간)
  - 제안 수정/취소 기능
  - 제안 이력 추적

#### 3. **AutoExecution.sol** - 자동화된 실행 시스템
- **기능**: 투표 종료 후 자동 실행, 멀티시그 보안
- **주요 특징**:
  - 스케줄링된 자동 실행
  - 멀티시그 서명 시스템
  - 재진입 공격 방지
  - 긴급 실행 기능
  - 실행 대기열 관리

### 기존 컨트랙트 (업데이트됨)

#### 4. **Voting.sol** - 투표 시스템 (업데이트)
- **기능**: 가중 투표 시스템
- **주요 특징**:
  - 토큰 기반 가중 투표
  - 중복투표 방지
  - 투표 기간 제한
  - 거버넌스 토큰 연동

#### 5. **Vault.sol** - 금고 시스템
- **기능**: DAO 자금 관리
- **주요 특징**:
  - ETH 입금/출금
  - 권한 기반 출금 (TREASURER_ROLE)
  - 잔액 조회

#### 6. **CorruptionMonitor.sol** - 부패 모니터링
- **기능**: DAO 투명성 지표 계산
- **주요 특징**:
  - 6가지 부패 지표 모니터링
  - 실시간 부패지수 계산

### 하위 호환성 컨트랙트

#### 7. **Proposal.sol** - 기본 제안 시스템
- **기능**: 기본 제안 관리 (하위 호환성)

#### 8. **Execution.sol** - 기본 실행 시스템
- **기능**: 기본 제안 실행 (하위 호환성)

## 🚀 새로운 기능들

### 1. **멤버십 토큰 시스템**
```solidity
// 토큰 스테이킹
await governanceToken.stake(ethers.parseEther("100"));

// 투표 가중치 확인
const votingPower = await governanceToken.getVotingPower(userAddress);

// 멤버 등급 확인
const tier = await governanceToken.getMemberTier(userAddress);
```

### 2. **카테고리별 제안 시스템**
```solidity
// 일반 제안 생성
await enhancedProposal.createProposal(
  "제안 제목",
  "제안 설명",
  ethers.parseEther("1"),
  recipientAddress,
  EnhancedProposal.Category.GENERAL
);

// 긴급 제안 생성
await enhancedProposal.createEmergencyProposal(
  "긴급 제안",
  "긴급 상황 대응",
  ethers.parseEther("5"),
  recipientAddress,
  emergencyThreshold
);
```

### 3. **자동화된 실행 시스템**
```solidity
// 제안 실행 스케줄링
await autoExecution.scheduleExecution(proposalId, 24 * 60 * 60); // 24시간 후

// 멀티시그 서명 추가
await autoExecution.addSignature(proposalId);

// 긴급 실행
await autoExecution.emergencyExecute(proposalId);
```

## 📊 카테고리별 설정

| 카테고리 | 투표 기간 | 정족수 | 최소 투표 파워 |
|---------|----------|--------|---------------|
| 일반 | 3일 | 50% | 100 토큰 |
| 재무 | 5일 | 60% | 500 토큰 |
| 운영 | 3일 | 50% | 100 토큰 |
| 기술 | 7일 | 70% | 1000 토큰 |
| 긴급 | 1일 | 40% | 100 토큰 |

## 🔐 보안 기능

### 멀티시그 시스템
- 최소 2개 서명 필요
- 24시간 실행 지연
- 서명자 관리 기능

### 재진입 공격 방지
- `ReentrancyGuard` 사용
- 안전한 상태 변경

### 일시정지 기능
- 긴급 상황 시 컨트랙트 일시정지
- 관리자만 재개 가능

## 🏃‍♂️ 배포 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 컴파일
```bash
npx hardhat compile
```

### 3. 배포
```bash
npx hardhat run scripts/deploy.js --network localhost
```

### 4. 테스트
```bash
npx hardhat test
```

## 📈 워크플로우

1. **토큰 보유** → 2. **스테이킹** → 3. **제안 생성** → 4. **투표 참여** → 5. **자동 실행**

### 상세 프로세스:
1. 사용자가 거버넌스 토큰을 보유
2. 토큰을 스테이킹하여 투표 파워 증가
3. 카테고리별 제안 생성
4. 가중 투표 참여
5. 투표 종료 후 자동 실행 또는 스케줄링된 실행

## 🔧 설정 및 관리

### 멤버 등급별 최소 토큰
- Bronze: 100 토큰
- Silver: 500 토큰  
- Gold: 1000 토큰
- Platinum: 5000 토큰

### 스테이킹 설정
- 최소 스테이킹: 100 토큰
- 연간 보상률: 5%
- 스테이킹 가중치: 1.5배

## 📝 라이선스

MIT License

## 🤝 기여

이 프로젝트는 Glass Collective DAO의 투명하고 안전한 거버넌스를 위한 오픈소스 프로젝트입니다.
