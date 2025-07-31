import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateNftFromTokenId, type NftData } from '../utils/nftUtils';
// import { LEGACY_CATEGORY_MAP, type CategoryType } from '../utils/categoryConstants';
import { type CategoryType } from '../utils/categoryConstants';
import { contractService, type DAO } from '../services/contractService'; 
import '../styles/CollectivesSearch.css';
import Header from './Header';
import LogoSidebar from './LogoSidebar';

interface Card extends DAO {
  id: string;
  name: string;
  participants: number;
  category: string;
  x: number;
  y: number;
  z: number;
  scale: number;
  opacity: number;
  zIndex: number;
  transform: string;
  isFocused: boolean;
  isVisible: boolean;
  translateY: number;
}

const CollectivesSearch: React.FC = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCategory, setFilteredCategory] = useState<CategoryType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<DAO[]>([]);  ////// 변경
  // `allDAOs`는 블록체인에서 가져온 원본 데이터를 저장합니다.
  const [allDAOs, setAllDAOs] = useState<DAO[]>([]);
  // ``visibleCards``는 필터링과 애니메이션 속성이 적용된, 화면에 실제 보이는 카드 데이터입니다.
  const [visibleCards, setVisibleCards] = useState<Card[]>([]);

  const [rotationAngle, setRotationAngle] = useState(0);
  const [targetRotation, setTargetRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [inertia, setInertia] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  // const [showNftModal, setShowNftModal] = useState(false);
  // const [nftCode, setNftCode] = useState('');
  // const [isValidatingNft, setIsValidatingNft] = useState(false);
  // const [nftValidationError, setNftValidationError] = useState('');
  const [showDragHint, setShowDragHint] = useState(true);
  // const [validatedNftInfo, setValidatedNftInfo] = useState<(NftData & { isValid: boolean }) | null>(null);

  // *** Private DAO 열람을 위한 모달 상태 추가 ***
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPrivateDao, setSelectedPrivateDao] = useState<DAO | null>(null);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [joinError, setJoinError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // DAO 서비스에서 데이터 가져오기
  const [collectives, setCollectives] = useState<DAO[]>([]);

  // 컴포넌트 마운트 시 DAO 데이터 로드
  useEffect(() => {
    const fetchDAOs = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedDAOs = await contractService.getAllDAOs();
        setAllDAOs(fetchedDAOs); 
      } catch (e: any) {
        setError(e.message || "Could not fetch collectives.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDAOs();
  }, []);

  // 카테고리별 컬러 매핑 (세련된 색감)
  const getCategoryColor = (category: string) => {
    const categoryColors = {
      finance: '#6366F1',      // 인디고 블루
      technology: '#0EA5E9',   // 스카이 블루
      gaming: '#8B5CF6',       // 바이올렛
      glass: '#06B6D4',        // 사이안
      environment: '#10B981',   // 에메랄드
      music: '#F59E0B',        // 앰버
      health: '#EF4444',       // 로즈
      art: '#EC4899',          // 핑크
      education: '#84CC16'      // 라임
    };

    return categoryColors[category as keyof typeof categoryColors] || '#3B82F6';
  };

  // 2D 원형 레이아웃 계산 (무한 스크롤)
  // *** 5. MODIFIED: 데이터 흐름을 명확하게 하는 레이아웃 업데이트 로직 ***
  // 이 useEffect는 원본 데이터나 필터, 회전값이 바뀔 때마다 실행되어
  // 화면에 보일 카드(visibleCards)를 다시 계산합니다.
  useEffect(() => {
    // 1. 검색어와 카테고리로 필터링
    const filtered = allDAOs.filter(dao => {
      const matchesSearch = dao.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dao.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !filteredCategory || dao.category === filteredCategory;
      return matchesSearch && matchesCategory;
    });

    // 2. 필터링된 데이터로 레이아웃 계산
    const container = containerRef.current;
    if (!container) return;

    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    const centerX = containerWidth / 2;
    // 원형을 아래쪽으로 이동하여 상단 부분만 보이도록 조정
    const centerY = containerHeight + 200; // 화면 아래쪽으로 이동
    const cardCount = filtered.length;
    
    if (cardCount === 0) {
        setVisibleCards([]);
        return;
    }
    
    // 카드 개수에 따라 반지름 조정 (카드가 적을 때도 적절한 간격 유지)
    const baseRadius = 400;
    const minRadius = 300; // 최소 반지름
    const maxRadius = 500; // 최대 반지름
    const radius = Math.max(minRadius, Math.min(maxRadius, baseRadius * (1 + (10 - cardCount) * 0.1))); // 카드가 적을수록 반지름 증가
    
    const newLayout: Card[] = filtered.map((dao, index) => {
      // 카드 개수에 따라 더 자연스러운 각도 분배
      let angleStep;
      if (cardCount <= 4) {
        angleStep = 90; // 4개 이하면 90도씩
      } else if (cardCount <= 6) {
        angleStep = 60; // 5-6개면 60도씩
      } else if (cardCount <= 8) {
        angleStep = 45; // 7-8개면 45도씩
      } else {
        angleStep = 360 / cardCount; // 9개 이상이면 균등 분할
      }
      
      const baseAngle = (-45 + angleStep * index) + rotationAngle; // 이전 버전의 각도 계산 사용
      const transform = `rotate(${baseAngle}deg) translate(${radius}px)`; // 이전 버전의 transform 사용
      
      return {
        ...dao, // DAO의 모든 데이터를 그대로 가져옴
        x: centerX,
        y: centerY,
        z: 0,
        scale: 1,
        opacity: 1,
        zIndex: 100,
        transform,
        isFocused: false,
        isVisible: true,
        translateY: 0
      };
    });

    setVisibleCards(newLayout);

  }, [allDAOs, searchTerm, filteredCategory, rotationAngle]); // 의존성 배열에 모든 관련 상태 포함

  // 물리 기반 부드러운 애니메이션
  useEffect(() => {
    const physicsTimer = setInterval(() => {
      if (!isDragging) {
        // 스프링 물리 효과
        const springStrength = 0.05; // 더 약한 스프링
        const damping = 0.9; // 더 부드러운 감쇠
        
        const distance = targetRotation - rotationAngle;
        const springForce = distance * springStrength;
        
        setVelocity(prev => (prev + springForce) * damping);
        setRotationAngle(prev => prev + velocity);
        
        // 휠 관성 효과
        if (Math.abs(inertia) > 0.01) {
          setRotationAngle(prev => prev + inertia);
          setInertia(prev => prev * 0.95); // 더 부드러운 관성 감소
        }
      }
    }, 16);
    
    return () => clearInterval(physicsTimer);
  }, [rotationAngle, targetRotation, velocity, inertia, isDragging]);

  // 자동 회전 효과 - 더 활성화
  useEffect(() => {
    const autoRotateTimer = setInterval(() => {
      // 드래그 중이 아니고, 관성과 속도가 모두 안정적일 때만 자동 회전
      if (!isDragging && Math.abs(inertia) < 0.05 && Math.abs(velocity) < 0.1) {
        setTargetRotation(prev => prev + 0.3); // 더 부드러운 자동 회전
      }
    }, 50); // 더 느린 간격으로 체크
    
    return () => clearInterval(autoRotateTimer);
  }, [isDragging, inertia, velocity]);

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setTargetRotation(prev => prev - 10); // 더 작은 키보드 제어
        setInertia(0); // 관성 초기화
        setVelocity(0); // 속도 초기화
      } else if (e.key === 'ArrowRight') {
        setTargetRotation(prev => prev + 10); // 더 작은 키보드 제어
        setInertia(0); // 관성 초기화
        setVelocity(0); // 속도 초기화
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 마우스 드래그 핸들러
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
    setInertia(0); // 드래그 시작 시 관성 초기화
    setVelocity(0); // 드래그 시작 시 속도 초기화
    setShowDragHint(false); // 드래그 시작하면 힌트 숨기기
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStartX;
    const sensitivity = 0.2; // 드래그 감도 더 감소
    const newRotation = rotationAngle + deltaX * sensitivity;
    
    setRotationAngle(newRotation);
    setTargetRotation(newRotation);
    setDragStartX(e.clientX);
  }, [isDragging, dragStartX, rotationAngle]);

  const handleMouseUp = useCallback((e?: React.MouseEvent) => {
    if (isDragging) {
      const currentX = e?.clientX || dragStartX;
      const deltaX = currentX - dragStartX;
      const sensitivity = 0.2; // 드래그 감도 더 감소
      const velocity = deltaX * sensitivity * 0.05; // 더 부드러운 관성 효과
      setInertia(velocity);
      setVelocity(velocity * 0.5); // 더 약한 속도 기반 관성
    }
    setIsDragging(false);
  }, [isDragging, dragStartX]);

  // 카드 클릭 핸들러
  const handleCardClick = (clickedDao: DAO) => {
    // 클릭된 카드를 찾아서 위로 올라오는 애니메이션 적용
    const clickedCard = cards.find(card => card.id === clickedDao.id);
    if (clickedCard) {
      // 카드를 위로 이동시키는 애니메이션
      const cardElement = document.querySelector(`[data-card-id="${clickedDao.id}"]`) as HTMLElement;
      if (cardElement) {
        cardElement.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        cardElement.style.transform += ' translateY(-30px) scale(1.05)';
        cardElement.style.zIndex = '9999';
        
        // 애니메이션 완료 후 페이지 이동
        setTimeout(() => {
          if (clickedDao.collectiveType === 'public') {
            // Public DAO는 즉시 상세 페이지로 이동
            navigate(`/collective/${clickedDao.id}/overview`);
          } else {
            // Private DAO는 인증 코드 입력 모달을 엽니다.
            setSelectedPrivateDao(clickedDao);
            setIsModalOpen(true);
            setInviteCodeInput(''); // 입력 필드 초기화
            setJoinError('');       // 에러 메시지 초기화
          }
        }, 600);
        return;
      }
    }
    // 애니메이션이 적용되지 않으면 바로 이동
    if (clickedDao.collectiveType === 'public') {
      // Public DAO는 즉시 상세 페이지로 이동
      navigate(`/collective/${clickedDao.id}/overview`);
    } else {
      // Private DAO는 인증 코드 입력 모달을 엽니다.
      setSelectedPrivateDao(clickedDao);
      setIsModalOpen(true);
      setInviteCodeInput(''); // 입력 필드 초기화
      setJoinError('');       // 에러 메시지 초기화
    }
  };

  // Create 버튼 클릭 핸들러
  const handleCreateClick = () => {
    navigate('/create-dao');
  };

  // 메타마스크 지갑 ID 불러옴
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts.length > 0) setWalletAddress(accounts[0]);
      });
    }
  }, []);

  // 드래그 힌트 자동 숨김 타이머
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowDragHint(false);
    }, 5000); // 5초 후 자동 숨김

    return () => clearTimeout(timer);
  }, []);

  const formatAddress = (address: string | null) => {
    if (!address) return '';
    return '0x' + address.slice(2, 10) + '...';
  };
  
  // *** NEW: 초대 코드 검증 및 페이지 이동 핸들러 ***
  const handleVerifyCodeAndNavigate = async () => {
    if (!selectedPrivateDao || !inviteCodeInput.trim()) {
      setJoinError('Please enter an invite code.');
      return;
    }
    
    setIsVerifying(true);
    setJoinError('');

    try {
      // contractService를 호출하여 코드를 온체인 해시값과 비교
      const isValid = await contractService.verifyInviteCode(selectedPrivateDao.id, inviteCodeInput);

      if (isValid) {
        // 검증 성공 시, state에 코드를 담아 Overview 페이지로 이동
        setIsModalOpen(false);
        navigate(`/collective/${selectedPrivateDao.id}/overview`, {
          state: { inviteCode: inviteCodeInput }
        });
      } else {
        setJoinError('Invalid invite code. Please try again.');
      }
    } catch (error) {
      console.error("Verification error:", error);
      setJoinError('An error occurred during verification.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="collectives-search-page" style={{ display: 'flex', height: '100vh' }}>
      <LogoSidebar />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Header walletAddress={walletAddress ?? undefined} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        
        <div style={{ display: 'flex', flex: 1, minHeight: 0, minWidth: 0 }}>
          <div className="main-content" style={{ flex: 1, minWidth: 0, position: 'relative' }}>
            {/* Create 버튼 */}
            <button 
              className="create-collective-button"
              onClick={handleCreateClick}
              style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                zIndex: 1000,
                padding: '14px 20px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                color: '#1f2937',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                backdropFilter: 'blur(10px)',
                fontFamily: 'Space Grotesk, sans-serif',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.12)';
                e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)';
              }}
            >
              <span style={{ fontSize: '16px' }}>+</span>
              Create Collective
            </button>

            {/* 2D 색상환 컨테이너 */}
            <div 
              ref={containerRef}
              className="circle-wrapper"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ 
                cursor: isDragging ? 'grabbing' : 'grab',
                position: 'relative',
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                userSelect: 'none'
              }}
            >
              {/* 드래그 힌트 오버레이 */}
              <div 
                style={{
                  position: 'absolute',
                  top: '15%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 999,
                  pointerEvents: 'none',
                  opacity: (isDragging || !showDragHint) ? 0 : 1,
                  transition: 'opacity 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '20px',
                  background: 'rgba(0, 0, 0, 0.8)',
                  padding: '24px 32px',
                  borderRadius: '16px',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}
              >
                <div style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: '#ffffff',
                  textAlign: 'center',
                  fontFamily: 'Space Grotesk, sans-serif',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
                }}>
                  🎯 드래그하여 탐색하세요
                </div>
                <div style={{
                  fontSize: '18px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  textAlign: 'center',
                  fontFamily: 'Space Grotesk, sans-serif'
                }}>
                  ← → 방향키로도 조작 가능
                </div>
                <div style={{
                  width: '70px',
                  height: '70px',
                  border: '3px solid rgba(255, 255, 255, 0.4)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'pulse 2s infinite, float 3s ease-in-out infinite',
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 0 30px rgba(255, 255, 255, 0.4)'
                }}>
                  <span style={{ 
                    fontSize: '28px',
                    animation: 'float 2s ease-in-out infinite'
                  }}>👆</span>
                </div>
                <div style={{
                  fontSize: '16px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  textAlign: 'center',
                  fontFamily: 'Space Grotesk, sans-serif',
                  animation: 'glow 2s ease-in-out infinite'
                }}>
                  💡 마우스를 클릭하고 드래그하세요
                </div>
              </div>
              {/* 카드들 */}
              {visibleCards.map((card) => {
                const backgroundColor = getCategoryColor(card.category);
                
                return (
                  <div
                    key={card.id}
                    data-card-id={card.id}
                    className={`circle-card ${card.collectiveType === 'private' ? 'private' : ''}`}
                    style={{
                      position: 'absolute',
                      left: `${card.x - 110}px`,
                      top: `${card.y - 170}px`,
                      transformOrigin: 'center center',
                      width: '180px',
                      height: '280px',
                      background: backgroundColor, // 그라데이션 제거하고 단색으로
                      borderRadius: '12px', // 더 둥근 모서리
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transform: `${card.transform} scale(${card.scale}) rotate(90deg) translateY(${card.translateY}px) ${Math.abs(inertia) > 1.5 ? 'rotate(' + (Math.random() * 8 - 4) + 'deg)' : ''}`,
                      opacity: Math.abs(inertia) > 1.5 
                        ? Math.min(1, card.opacity + 0.2)
                        : card.opacity,
                      zIndex: card.zIndex,
                      transition: Math.abs(inertia) > 1.5 
                        ? 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                        : 'all 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: Math.abs(inertia) > 0.8 
                        ? `0 4px 16px rgba(0, 0, 0, 0.15)`
                        : '0 2px 8px rgba(0, 0, 0, 0.1)',
                      color: 'white',
                      textAlign: 'center',
                      padding: '24px 16px',
                      userSelect: 'none',
                      border: 'none',
                      fontFamily: 'Space Grotesk, -apple-system, BlinkMacSystemFont, sans-serif',
                      backdropFilter: 'none', // 블러 효과 제거
                      WebkitBackdropFilter: 'none'
                    }}
                    onClick={() => handleCardClick(card)}
                  >

                    {card.collectiveType === 'private' && (
                        <div className="private-lock-icon">🔒</div>
                    )}

                    {/* 컬렉티브 사진 */}
                    <div 
                      className="card-image"
                      style={{
                        width: '70px',
                        height: '70px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 255, 255, 0.15)', // 더 투명하게
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '18px',
                        marginTop: '-8px',
                        border: '1px solid rgba(255, 255, 255, 0.2)', // 더 얇은 테두리
                        transition: 'all 0.3s ease',
                        overflow: 'hidden'
                      }}
                    >
                      <span style={{ 
                        fontSize: '28px',
                        opacity: 0.9
                      }}>
                        {card.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    
                    {/* 컬렉티브 이름 */}
                    <div 
                      className="card-title"
                      style={{
                        fontSize: '16px',
                        fontWeight: '600', // 더 얇게
                        lineHeight: '1.2',
                        marginBottom: '12px',
                        letterSpacing: '0.01em',
                        opacity: 0.95,
                        transition: 'all 0.3s ease',
                        wordBreak: 'break-word',
                        textAlign: 'center',
                        textShadow: 'none' // 텍스트 그림자 제거
                      }}
                    >
                      {card.name}
                    </div>
                    
                    {/* 컬렉티브 회원수 */}
                    <div 
                      className="card-participants"
                      style={{
                        fontSize: '11px',
                        fontWeight: '400', // 더 얇게
                        opacity: 0.8,
                        letterSpacing: '0.02em',
                        transition: 'all 0.3s ease',
                        textAlign: 'center',
                        textShadow: 'none', // 텍스트 그림자 제거
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '3px'
                      }}
                    >
                      <span>{card.participants.toLocaleString()}</span>
                      <span style={{ fontSize: '9px', opacity: 0.7 }}>members</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 검색 결과 없음 */}
            {cards.length === 0 && searchTerm && (
              <div className="no-results">
                <p>검색 결과가 없습니다.</p>
                <p>다른 검색어를 시도해보세요.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* *** 14. MODIFIED: NFT 모달을 Private DAO 인증 모달로 교체 *** */}
      {isModalOpen && selectedPrivateDao && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            <h2>Private Collective Access</h2>
            <p>Please provide the invite code to view the content of <strong>{selectedPrivateDao.name}</strong>.</p>
            <input
              type="text"
              className="modal-input"
              value={inviteCodeInput}
              onChange={(e) => setInviteCodeInput(e.target.value)}
              placeholder="Enter invite code"
              onKeyPress={(e) => e.key === 'Enter' && handleVerifyCodeAndNavigate()}
            />
            {joinError && <p className="modal-error">{joinError}</p>}
            <button 
              className="modal-submit-btn" 
              onClick={handleVerifyCodeAndNavigate}
              disabled={isVerifying}
            >
              {isVerifying ? 'Verifying...' : 'View Collective'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectivesSearch; 