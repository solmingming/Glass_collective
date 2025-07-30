import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateNftFromTokenId, type NftData } from '../utils/nftUtils';
import * as d3 from 'd3';
import '../styles/CollectivesSearch.css';
import Header from './Header';
import LogoSidebar from './LogoSidebar';

interface Collective {
  id: string;
  name: string;
  description: string;
  participants: number;
  category: string;
  isActive: boolean;
}

interface Bubble {
  id: string;
  name: string;
  participants: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  scale: number;
  opacity: number;
  zIndex: number;
  hover: boolean;
  category: string;
}

interface SimulationNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  memberCount: number;
  category: string;
  description: string;
  radius: number;
}

const CollectivesSearch: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<Bubble, undefined> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [isAnimating, setIsAnimating] = useState(true);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  // 고품질 컬렉티브 데이터
  const collectives: Collective[] = [
    {
      id: 'DAO_TEST1',
      name: 'DAO_TEST1_NAME',
      description: 'DeFi와 투자 전략을 공유하는 금융 공동체',
      participants: 2340,
      category: 'finance',
      isActive: true
    },
    {
      id: 'tech-startup',
      name: 'Tech\nStartup',
      description: '혁신적인 기술 스타트업 생태계',
      participants: 1890,
      category: 'technology',
      isActive: true
    },
    {
      id: 'gaming-collective',
      name: 'Gaming\nCollective',
      description: '게임과 메타버스 생태계 구축',
      participants: 1567,
      category: 'gaming',
      isActive: true
    },
    {
      id: 'glass-collective',
      name: 'Glass\nCollective',
      description: '투명하고 공정한 Web3 공동체',
      participants: 1250,
      category: 'glass',
      isActive: true
    },
    {
      id: 'eco-collective',
      name: 'Eco\nCollective',
      description: '환경 보호를 위한 지속가능한 공동체',
      participants: 890,
      category: 'environment',
      isActive: true
    },
    {
      id: 'music-collective',
      name: 'Music\nCollective',
      description: '음악과 오디오 NFT 플랫폼',
      participants: 789,
      category: 'music',
      isActive: true
    },
    {
      id: 'health-collective',
      name: 'Health\nCollective',
      description: '웰빙과 건강 정보를 공유하는 공동체',
      participants: 678,
      category: 'health',
      isActive: true
    },
    {
      id: 'art-collective',
      name: 'Art\nCollective',
      description: '디지털 아트와 NFT를 통한 창작자 공동체',
      participants: 567,
      category: 'art',
      isActive: true
    },
    {
      id: 'education-collective',
      name: 'Education\nCollective',
      description: '블록체인 교육과 지식 공유 플랫폼',
      participants: 432,
      category: 'education',
      isActive: true
    }
  ];

  // NFT 가입 관련 상태
  const [showNftModal, setShowNftModal] = useState(false);
  const [nftCode, setNftCode] = useState('');
  const [isValidatingNft, setIsValidatingNft] = useState(false);
  const [nftValidationError, setNftValidationError] = useState('');
  const [validatedNftInfo, setValidatedNftInfo] = useState<(NftData & { isValid: boolean }) | null>(null);

  // 고품질 버블 크기 계산
  const getBubbleRadius = (participants: number) => {
    // 메인 영역의 60%만 차지하도록 조정
    const mainArea = canvasRef.current ? Math.min(canvasRef.current.offsetWidth, canvasRef.current.offsetHeight) : 800;
    // 버블 최대/최소 반지름을 전체 영역의 0.10~0.22로 설정 (0.7배 축소)
    const minRadius = mainArea * 0.10 * 0.8;
    const maxRadius = mainArea * 0.22 * 0.8;
    const scale = Math.sqrt(participants) / Math.sqrt(2500);
    return minRadius + (maxRadius - minRadius) * scale;
  };

  // 미니멀한 색상 팔레트
  const getBubbleColor = (category: string, participants: number, scale: number) => {
    const minimalColors = {
      finance: '#f8fafc',
      technology: '#f1f5f9',
      gaming: '#f8fafc',
      glass: '#f1f5f9',
      environment: '#f8fafc',
      music: '#f1f5f9',
      health: '#f8fafc',
      art: '#f1f5f9',
      education: '#f8fafc'
    };

    const baseColor = minimalColors[category as keyof typeof minimalColors] || '#f8fafc';
    
    // 미니멀한 투명도
    const opacity = 0.95;
    
    return {
      background: baseColor,
      opacity: opacity,
      borderColor: 'rgba(0, 0, 0, 0.08)',
      glowColor: 'transparent',
      shadowColor: 'transparent'
    };
  };

  // 텍스트 표시 여부 결정 (더 큰 버블에서만 전체 텍스트 표시)
  const shouldShowFullText = (radius: number) => radius > 90;

  // 폰트 크기 계산 (버블 크기에 비례, 절반으로)
  const getFontSize = (radius: number, isTitle: boolean = true) => {
    // 기존보다 절반으로
    const baseSize = radius * (isTitle ? 0.19 : 0.11);
    const min = radius / 20;
    const max = radius / 7;
    return Math.max(min, Math.min(max, baseSize));
  };

  // 고품질 d3.forceSimulation 초기화
  const initializeSimulation = useCallback(() => {
    const filtered = collectives.filter(collective =>
      collective.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collective.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const containerWidth = rect.width;
    const containerHeight = rect.height;
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;

    // 고품질 버블 데이터 생성
    const newBubbles = filtered.map((collective, index) => {
      const radius = getBubbleRadius(collective.participants);
      const angle = (index / filtered.length) * Math.PI * 2;
      const maxDistance = Math.min(containerWidth, containerHeight) * 0.7; // 컨테이너 크기의 30%로 제한
      const distance = radius + 20 + Math.random() * (maxDistance - radius - 20);
      
      return {
        id: collective.id,
        name: collective.name,
        participants: collective.participants,
        category: collective.category,
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        vx: 0,
        vy: 0,
        radius: radius,
        scale: 1,
        opacity: 0.9,
        zIndex: 1,
        hover: false
      };
    });

    setBubbles(newBubbles);

    // 기존 시뮬레이션 정리
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    // 둥둥 떠다니는 d3.forceSimulation 생성
    const simulation = d3.forceSimulation<Bubble>(newBubbles)
      .force('center', d3.forceCenter(centerX, centerY).strength(0.03)) // 더 약한 중앙 끌림
      .force('charge', d3.forceManyBody().strength(-12)) // 약한 반발력
      .force('collide', d3.forceCollide<Bubble>().radius((d: Bubble) => d.radius + 40).strength(1)) // 완전히 넓은 간격, 절대 겹치지 않게
      .force('x', d3.forceX(centerX).strength(0.015)) // 매우 약한 X축 중력
      .force('y', d3.forceY(centerY).strength(0.015)) // 매우 약한 Y축 중력
      .alphaDecay(0.025) // 부드러운 감속
      .velocityDecay(0.35) // 적당한 마찰
      .on('tick', () => {
        // 경계 제한 로직 추가 (Spring Easing)
        const updatedBubbles = simulation.nodes().map(bubble => {
          let newX = bubble.x;
          let newY = bubble.y;
          let newVx = bubble.vx;
          let newVy = bubble.vy;

          // Spring 상수 설정
          const springStrength = 0.3;
          const damping = 0.8;
          const boundaryPadding = 5; // 경계에서 약간의 여백

          // X축 경계 제한 (Spring Easing)
          if (newX - bubble.radius < boundaryPadding) {
            const overshoot = boundaryPadding - (newX - bubble.radius);
            const springForce = overshoot * springStrength;
            newVx = newVx * damping + springForce;
            newX = bubble.radius + boundaryPadding;
          } else if (newX + bubble.radius > containerWidth - boundaryPadding) {
            const overshoot = (newX + bubble.radius) - (containerWidth - boundaryPadding);
            const springForce = -overshoot * springStrength;
            newVx = newVx * damping + springForce;
            newX = containerWidth - bubble.radius - boundaryPadding;
          }

          // Y축 경계 제한 (Spring Easing)
          if (newY - bubble.radius < boundaryPadding) {
            const overshoot = boundaryPadding - (newY - bubble.radius);
            const springForce = overshoot * springStrength;
            newVy = newVy * damping + springForce;
            newY = bubble.radius + boundaryPadding;
          } else if (newY + bubble.radius > containerHeight - boundaryPadding) {
            const overshoot = (newY + bubble.radius) - (containerHeight - boundaryPadding);
            const springForce = -overshoot * springStrength;
            newVy = newVy * damping + springForce;
            newY = containerHeight - bubble.radius - boundaryPadding;
          }

          // 속도 제한 (과도한 튕김 방지)
          const maxVelocity = 2;
          newVx = Math.max(-maxVelocity, Math.min(maxVelocity, newVx));
          newVy = Math.max(-maxVelocity, Math.min(maxVelocity, newVy));

          return {
            ...bubble,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy
          };
        });

        setBubbles(updatedBubbles);
      });

    simulationRef.current = simulation;
  }, [searchTerm]);

  // 고품질 마우스 이벤트 핸들러
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    setMouse({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMouse({ x: 0, y: 0 });
  }, []);

  // 초기화 및 애니메이션 시작
  useEffect(() => {
    initializeSimulation();
    const timer = setTimeout(() => setIsAnimating(false), 1200);
    return () => clearTimeout(timer);
  }, [initializeSimulation]);

  // 검색어 변경 시 시뮬레이션 재시작
  useEffect(() => {
    initializeSimulation();
  }, [searchTerm, initializeSimulation]);

  // 컴포넌트 언마운트 시 시뮬레이션 정리
  useEffect(() => {
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, []);

  // 윈도우 리사이즈 시 시뮬레이션 재시작
  // useEffect(() => {
  //   const handleResize = () => {
  //     if (simulationRef.current) {
  //       simulationRef.current.stop();
  //       setTimeout(() => {
  //         initializeSimulation();
  //       }, 100);
  //     }
  //   };

  //   window.addEventListener('resize', handleResize);
  //   return () => window.removeEventListener('resize', handleResize);
  // }, [initializeSimulation]);

  // 버블 클릭 핸들러
  const handleBubbleClick = (id: string) => {
    navigate(`/collective/${id}/overview`);
  };

  // Create 버튼 클릭 핸들러
  const handleCreateClick = () => {
    navigate('/create-dao');
  };

  // NFT 모달 열기
  const handleJoinWithNft = () => {
    setShowNftModal(true);
    setNftCode('');
    setNftValidationError('');
    setValidatedNftInfo(null);
  };

  // NFT 코드 검증 및 DAO 가입 함수
  const handleJoinWithNftCode = async () => {
    if (!nftCode.trim()) {
      setNftValidationError('NFT 코드를 입력해주세요.');
      return;
    }

    setIsValidatingNft(true);
    setNftValidationError('');
    setValidatedNftInfo(null);

    try {
      // 실제로는 블록체인에서 NFT 정보를 조회
      // const nftInfo = await validateNFTCode(nftCode);
      
      // 시뮬레이션: NFT 코드 검증
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 토큰 ID 패턴 검증 (예: 1703234567890-1234 형태 - 13자리 타임스탬프 + 하이픈 + 1-4자리 랜덤)
      const tokenIdPattern = /^\d{13}-\d{1,4}$/;
      if (!tokenIdPattern.test(nftCode)) {
        throw new Error('유효하지 않은 NFT 코드 형식입니다. (예: 1703234567890-1234)');
      }

      // 공통 유틸리티 함수를 사용하여 일관된 NFT 정보 생성
      const nftInfo = generateNftFromTokenId(nftCode, 'Tech Innovators', 'tech-innovators');
      setValidatedNftInfo({
        ...nftInfo,
        isValid: true
      });

    } catch (error) {
      console.error('NFT 검증 실패:', error);
      setNftValidationError(error instanceof Error ? error.message : 'NFT 검증에 실패했습니다.');
      setValidatedNftInfo(null);
    } finally {
      setIsValidatingNft(false);
    }
  };

  // NFT로 DAO 가입 확인
  const handleConfirmJoinWithNft = () => {
    if (validatedNftInfo && validatedNftInfo.isValid) {
      console.log('NFT 검증 성공:', validatedNftInfo);
      navigate(`/collective/${validatedNftInfo.collectiveId}/overview`);
      handleCloseNftModal();
    }
  };

  // NFT 모달 닫기
  const handleCloseNftModal = () => {
    setShowNftModal(false);
    setNftCode('');
    setNftValidationError('');
    setIsValidatingNft(false);
    setValidatedNftInfo(null);
  };

  // 메타마스크 지갑 ID 불러옴
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts.length > 0) setWalletAddress(accounts[0]);
      });
    }
  }, []);

  //주소 포맷 함수
  const formatAddress = (address: string | null) => {
    if (!address) return '';
    return '0x' + address.slice(2, 10) + '...';
  };
  
  const tabList = [
    { key: 'all', path: '/collectives-search', label: 'All' },
    { key: 'my', path: '/collectives-search/my', label: 'My DAOs' },
    { key: 'fav', path: '/collectives-search/favorites', label: 'Favorites' },
  ];
  const [currentTab, setCurrentTab] = useState(0);
  const handleTabClick = (idx: number) => setCurrentTab(idx);
  
  return (
    <div className="collectives-search-page" style={{ display: 'flex', height: '100vh' }}>
      <LogoSidebar />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Header walletAddress={formatAddress(walletAddress)} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
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
                padding: '12px 24px',
                backgroundColor: '#000000',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#333333';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#000000';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
              }}
            >
              Create
            </button>
            
            {/* Join with NFT 버튼 */}
            <button 
              onClick={handleJoinWithNft}
              style={{
                position: 'absolute',
                top: '20px',
                left: '120px',
                zIndex: 1000,
                padding: '12px 24px',
                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(102, 126, 234, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
              }}
            >
              🎫 Join with NFT
            </button>

            {/* 둥둥 떠다니는 Bubble Canvas */}
            <div 
              ref={canvasRef}
              className={`bubble-canvas ${isAnimating ? 'animating' : ''}`}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              {bubbles.map((bubble) => {
                const { background, opacity, borderColor, glowColor, shadowColor } = getBubbleColor(bubble.category, bubble.participants, bubble.scale);
                const showFullText = shouldShowFullText(bubble.radius);
                
                // 고품질 마우스 반응 계산
                const dx = mouse.x - bubble.x;
                const dy = mouse.y - bubble.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const maxDistance = 180;
                
                let scale = 1;
                let zIndex = 1;
                let enhancedOpacity = opacity;
                
                if (distance < maxDistance) {
                  const factor = 1 - distance / maxDistance;
                  scale = 1 + 0.12 * factor;
                  zIndex = Math.floor(15 * factor);
                  enhancedOpacity = Math.min(0.98, opacity + 0.1 * factor);
                }
                
                return (
                  <div
                    key={bubble.id}
                    className="collective-bubble"
                    style={{
                      position: 'absolute',
                      left: `${bubble.x - bubble.radius}px`,
                      top: `${bubble.y - bubble.radius}px`,
                      width: `${bubble.radius * 2}px`,
                      height: `${bubble.radius * 2}px`,
                      background: background,
                      border: `1px solid ${borderColor}`,
                      transform: `scale(${scale})`,
                      opacity: enhancedOpacity,
                      zIndex: zIndex,
                      borderRadius: '50%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                      color: '#374151',
                      textAlign: 'center',
                      padding: `${bubble.radius * 0.15}px`,
                      userSelect: 'none',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)'
                    }}
                    onClick={() => handleBubbleClick(bubble.id)}
                  >
                    {shouldShowFullText(bubble.radius) ? (
                      <>
                        <div 
                          className="bubble-title"
                          style={{
                            fontSize: `${getFontSize(bubble.radius, true)}px`,
                            lineHeight: '1.1',
                            marginBottom: `${bubble.radius * 0.05}px`,
                            maxWidth: `${bubble.radius * 1.6}px`,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {bubble.name}
                        </div>
                        <div 
                          className="bubble-count"
                          style={{
                            fontSize: `${getFontSize(bubble.radius, false)}px`,
                            lineHeight: '1',
                            maxWidth: `${bubble.radius * 1.4}px`,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {bubble.participants.toLocaleString()} participants
                        </div>
                      </>
                    ) : (
                      <div 
                        className="bubble-count-only"
                        style={{
                          fontSize: `${getFontSize(bubble.radius, true)}px`,
                          lineHeight: '1.1',
                          maxWidth: `${bubble.radius * 1.6}px`,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {bubble.participants.toLocaleString()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 검색 결과 없음 */}
            {bubbles.length === 0 && searchTerm && (
              <div className="no-results">
                <p>검색 결과가 없습니다.</p>
                <p>다른 검색어를 시도해보세요.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* NFT 코드 입력 모달 */}
      {showNftModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            width: '90%',
            maxWidth: validatedNftInfo ? '600px' : '500px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            position: 'relative'
          }}>
            {/* 닫기 버튼 */}
            <button
              onClick={handleCloseNftModal}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              ×
            </button>

            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: '600', 
              marginBottom: '8px',
              color: '#000'
            }}>
              🎫 Join with NFT Invitation
            </h2>
            
            <p style={{ 
              color: '#666', 
              marginBottom: '24px',
              fontSize: '14px'
            }}>
              NFT 초대장의 토큰 ID를 입력하여 Private Collective에 가입하세요.
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500',
                color: '#333'
              }}>
                NFT Token ID:
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={nftCode}
                  onChange={(e) => setNftCode(e.target.value)}
                  placeholder="예: 1703234567890-1234"
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: nftValidationError ? '2px solid #dc2626' : '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontFamily: 'Monaco, Menlo, monospace',
                    letterSpacing: '1px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => {
                    if (!nftValidationError) {
                      e.target.style.borderColor = '#007bff';
                    }
                  }}
                  onBlur={(e) => {
                    if (!nftValidationError) {
                      e.target.style.borderColor = '#e9ecef';
                    }
                  }}
                />
                <button
                  onClick={handleJoinWithNftCode}
                  disabled={isValidatingNft || !nftCode.trim()}
                  style={{
                    padding: '12px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    background: isValidatingNft || !nftCode.trim()
                      ? '#ccc' 
                      : '#007bff',
                    color: 'white',
                    cursor: isValidatingNft || !nftCode.trim() ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {isValidatingNft ? '⏳' : '🔍 Verify'}
                </button>
              </div>
              {nftValidationError && (
                <p style={{ 
                  color: '#dc2626', 
                  fontSize: '12px', 
                  marginTop: '4px',
                  margin: '4px 0 0 0'
                }}>
                  {nftValidationError}
                </p>
              )}
            </div>

            {/* NFT 정보 표시 */}
            {validatedNftInfo && (
              <div style={{
                marginTop: '24px',
                padding: '20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                color: 'white'
              }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  marginBottom: '16px',
                  color: 'white'
                }}>
                  ✅ NFT Verified!
                </h3>
                
                <div style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '16px',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    gap: '16px',
                    alignItems: 'center',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      flexShrink: 0,
                      background: '#f0f0f0'
                    }}>
                      <img 
                        src={validatedNftInfo.image} 
                        alt={validatedNftInfo.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                    <div style={{ flex: 1, color: '#333' }}>
                      <h4 style={{ 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        color: '#000', 
                        margin: '0 0 8px 0' 
                      }}>
                        {validatedNftInfo.name}
                      </h4>
                      <p style={{ 
                        fontSize: '12px', 
                        color: '#666', 
                        margin: '0 0 12px 0',
                        fontFamily: 'Monaco, Menlo, monospace'
                      }}>
                        Token ID: {validatedNftInfo.tokenId}
                      </p>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px'
                      }}>
                        {validatedNftInfo.attributes.slice(0, 4).map((attr, index) => (
                          <span key={index} style={{
                            background: '#f8f9fa',
                            color: '#495057',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '10px',
                            fontWeight: '500',
                            border: '1px solid #e9ecef'
                          }}>
                            {attr.trait_type}: {attr.value}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '12px',
                    textAlign: 'center'
                  }}>
                    <p style={{ 
                      fontSize: '14px',
                      margin: '0 0 8px 0',
                      color: 'rgba(255, 255, 255, 0.9)'
                    }}>
                      이 NFT는 <strong>{validatedNftInfo.collectiveName}</strong>에 대한 초대장입니다.
                    </p>
                    <p style={{ 
                      fontSize: '12px',
                      margin: '0',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontStyle: 'italic'
                    }}>
                      가입을 진행하시겠습니까?
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div style={{ 
              display: 'flex', 
              gap: '12px',
              justifyContent: 'flex-end',
              marginTop: '24px'
            }}>
              <button
                onClick={handleCloseNftModal}
                style={{
                  padding: '12px 24px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: '#fff',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              
              {validatedNftInfo ? (
                <button
                  onClick={handleConfirmJoinWithNft}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  🚀 Join {validatedNftInfo.collectiveName}
                </button>
              ) : (
                <button
                  disabled
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    background: '#ccc',
                    color: 'white',
                    cursor: 'not-allowed',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Enter Token ID First
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectivesSearch; 