import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateNftFromTokenId, type NftData } from '../utils/nftUtils';
import * as d3 from 'd3';
import '../styles/CollectivesSearch.css'; // CSS 파일을 import 합니다.
import Header from './Header';
import LogoSidebar from './LogoSidebar';
import contractService, { type Collective } from '../services/contractService';

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

  const [isLoading, setIsLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);
  const [displayedCollectives, setDisplayedCollectives] = useState<Collective[]>([]);

  // 실제 배포된 DAO 컨트랙트 주소로 변경해야 합니다.
  const allCollectives: Collective[] = [
    {
      id: 'DAO_TEST1',
      name: 'DAO_TEST1_NAME',
      description: 'DeFi와 투자 전략을 공유하는 금융 공동체',
      participants: 2340,
      category: 'finance',
      isActive: true,
      contractAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3'
    },
    {
      id: 'tech-startup',
      name: 'Tech\nStartup',
      description: '혁신적인 기술 스타트업 생태계',
      participants: 1890,
      category: 'technology',
      isActive: true,
      contractAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
    },
    {
      id: 'gaming-collective',
      name: 'Gaming\nCollective',
      description: '게임과 메타버스 생태계 구축',
      participants: 1567,
      category: 'gaming',
      isActive: true,
      contractAddress: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0'
    },
    {
      id: 'glass-collective',
      name: 'Glass\nCollective',
      description: '투명하고 공정한 Web3 공동체',
      participants: 1250,
      category: 'glass',
      isActive: true,
      contractAddress: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9'
    },
    {
      id: 'eco-collective',
      name: 'Eco\nCollective',
      description: '환경 보호를 위한 지속가능한 공동체',
      participants: 890,
      category: 'environment',
      isActive: true,
      contractAddress: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9'
    },
    {
      id: 'music-collective',
      name: 'Music\nCollective',
      description: '음악과 오디오 NFT 플랫폼',
      participants: 789,
      category: 'music',
      isActive: true,
      contractAddress: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707'
    },
    {
      id: 'health-collective',
      name: 'Health\nCollective',
      description: '웰빙과 건강 정보를 공유하는 공동체',
      participants: 678,
      category: 'health',
      isActive: true,
      contractAddress: '0x0165878A594ca255338adfa4d48449f69242Eb8F'
    },
    {
      id: 'art-collective',
      name: 'Art\nCollective',
      description: '디지털 아트와 NFT를 통한 창작자 공동체',
      participants: 567,
      category: 'art',
      isActive: true,
      contractAddress: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853'
    },
    {
      id: 'education-collective',
      name: 'Education\nCollective',
      description: '블록체인 교육과 지식 공유 플랫폼',
      participants: 432,
      category: 'education',
      isActive: true,
      contractAddress: '0x2279B7A0a67DB372996a5FAB50D91eAA73d2eBe6'
    }
  ];

  const [showNftModal, setShowNftModal] = useState(false);
  const [nftCode, setNftCode] = useState('');
  const [isValidatingNft, setIsValidatingNft] = useState(false);
  const [nftValidationError, setNftValidationError] = useState('');
  const [validatedNftInfo, setValidatedNftInfo] = useState<(NftData & { isValid: boolean }) | null>(null);

  const getBubbleRadius = (participants: number) => {
    const canvas = canvasRef.current;
    const mainArea = canvas ? Math.min(canvas.offsetWidth, canvas.offsetHeight) : 800;
    const minRadius = mainArea * 0.10 * 0.8;
    const maxRadius = mainArea * 0.22 * 0.8;
    const scale = Math.sqrt(participants) / Math.sqrt(2500);
    const radius = minRadius + (maxRadius - minRadius) * scale;
    console.log(`📏 Bubble radius for ${participants} participants: ${radius}px (canvas: ${canvas?.offsetWidth}x${canvas?.offsetHeight})`);
    return radius;
  };

  const getBubbleColor = (category: string, participants: number, scale: number) => {
    const minimalColors = {
      finance: '#f8fafc', technology: '#f1f5f9', gaming: '#f8fafc',
      glass: '#f1f5f9', environment: '#f8fafc', music: '#f1f5f9',
      health: '#f8fafc', art: '#f1f5f9', education: '#f8fafc'
    };
    const baseColor = minimalColors[category as keyof typeof minimalColors] || '#f8fafc';
    return {
      background: baseColor, opacity: 0.95, borderColor: 'rgba(0, 0, 0, 0.08)',
      glowColor: 'transparent', shadowColor: 'transparent'
    };
  };

  const shouldShowFullText = (radius: number) => radius > 90;

  const getFontSize = (radius: number, isTitle: boolean = true) => {
    const baseSize = radius * (isTitle ? 0.19 : 0.11);
    const min = radius / 20;
    const max = radius / 7;
    return Math.max(min, Math.min(max, baseSize));
  };

  const initializeSimulation = useCallback((collectivesToDisplay: Collective[]) => {
    console.log("🎯 initializeSimulation called with:", collectivesToDisplay.length, "collectives");
    
    const filtered = collectivesToDisplay.filter(collective =>
      collective.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collective.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    console.log("🔍 After search filter:", filtered.length, "collectives");

    const canvas = canvasRef.current;
    if (!canvas) {
      console.error("❌ Canvas ref not found!");
      return;
    }
    console.log("✅ Canvas found:", canvas);

    const rect = canvas.getBoundingClientRect();
    const containerWidth = rect.width;
    const containerHeight = rect.height;
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;

    const newBubbles = filtered.map((collective, index) => {
      const radius = getBubbleRadius(collective.participants);
      const angle = (index / filtered.length) * Math.PI * 2;
      const maxDistance = Math.min(containerWidth, containerHeight) * 0.7;
      const distance = radius + 20 + Math.random() * (maxDistance - radius - 20);
      return {
        id: collective.id, name: collective.name, participants: collective.participants,
        category: collective.category, x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance, vx: 0, vy: 0, radius: radius,
        scale: 1, opacity: 0.9, zIndex: 1, hover: false
      };
    });

    console.log("🫧 Created bubbles:", newBubbles.length, newBubbles);
    setBubbles(newBubbles);

    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    const simulation = d3.forceSimulation<Bubble>(newBubbles)
      .force('center', d3.forceCenter(centerX, centerY).strength(0.03))
      .force('charge', d3.forceManyBody().strength(-12))
      .force('collide', d3.forceCollide<Bubble>().radius((d: Bubble) => d.radius + 40).strength(1))
      .force('x', d3.forceX(centerX).strength(0.015))
      .force('y', d3.forceY(centerY).strength(0.015))
      .alphaDecay(0.025)
      .velocityDecay(0.35)
      .on('tick', () => {
        const updatedBubbles = simulation.nodes().map(bubble => {
          let newX = bubble.x, newY = bubble.y, newVx = bubble.vx, newVy = bubble.vy;
          const springStrength = 0.3, damping = 0.8, boundaryPadding = 5;

          if (newX - bubble.radius < boundaryPadding) {
            newVx = newVx * damping + ((boundaryPadding - (newX - bubble.radius)) * springStrength);
            newX = bubble.radius + boundaryPadding;
          } else if (newX + bubble.radius > containerWidth - boundaryPadding) {
            newVx = newVx * damping + (-( (newX + bubble.radius) - (containerWidth - boundaryPadding)) * springStrength);
            newX = containerWidth - bubble.radius - boundaryPadding;
          }

          if (newY - bubble.radius < boundaryPadding) {
            newVy = newVy * damping + ((boundaryPadding - (newY - bubble.radius)) * springStrength);
            newY = bubble.radius + boundaryPadding;
          } else if (newY + bubble.radius > containerHeight - boundaryPadding) {
            newVy = newVy * damping + (-( (newY + bubble.radius) - (containerHeight - boundaryPadding)) * springStrength);
            newY = containerHeight - bubble.radius - boundaryPadding;
          }

          const maxVelocity = 2;
          newVx = Math.max(-maxVelocity, Math.min(maxVelocity, newVx));
          newVy = Math.max(-maxVelocity, Math.min(maxVelocity, newVy));

          return { ...bubble, x: newX, y: newY, vx: newVx, vy: newVy };
        });
        setBubbles(updatedBubbles);
      });
    
    simulationRef.current = simulation;
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 1200);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const handleMouseLeave = useCallback(() => setMouse({ x: 0, y: 0 }), []);
  
  useEffect(() => {
    const filterAndDisplayCollectives = async () => {
      console.log("🔍 Filtering collectives, currentTab:", currentTab, "walletAddress:", walletAddress);
      setIsLoading(true);
      if (currentTab === 1 && walletAddress) {
        try {
          console.log("📋 All collectives:", allCollectives.length);
          const myDaos = await contractService.filterMyDAOs(allCollectives, walletAddress);
          console.log("✅ My DAOs found:", myDaos.length, myDaos);
          setDisplayedCollectives(myDaos);
        } catch (error) {
          console.error("❌ Failed to filter my DAOs:", error);
          setDisplayedCollectives([]);
        }
      } else {
        console.log("📋 Showing all collectives:", allCollectives.length);
        setDisplayedCollectives(allCollectives);
      }
      setIsLoading(false);
    };

    filterAndDisplayCollectives();
  }, [currentTab, walletAddress]);

  useEffect(() => {
    console.log("🎯 Initializing simulation with:", displayedCollectives.length, "collectives");
    // DOM이 준비될 때까지 약간 지연
    const timer = setTimeout(() => {
      initializeSimulation(displayedCollectives);
    }, 10);
    return () => clearTimeout(timer);
  }, [displayedCollectives, initializeSimulation]);

  useEffect(() => {
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, []);
  
  const handleBubbleClick = (id: string) => navigate(`/collective/${id}/overview`);
  const handleCreateClick = () => navigate('/create-dao');

  const handleJoinWithNft = () => {
    setShowNftModal(true);
    setNftCode('');
    setNftValidationError('');
    setValidatedNftInfo(null);
  };

  const handleJoinWithNftCode = async () => {
    if (!nftCode.trim()) {
      setNftValidationError('NFT 코드를 입력해주세요.');
      return;
    }
    setIsValidatingNft(true);
    setNftValidationError('');
    setValidatedNftInfo(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const tokenIdPattern = /^\d{13}-\d{1,4}$/;
      if (!tokenIdPattern.test(nftCode)) {
        throw new Error('유효하지 않은 NFT 코드 형식입니다. (예: 1703234567890-1234)');
      }
      const nftInfo = generateNftFromTokenId(nftCode, 'Tech Innovators', 'tech-innovators');
      setValidatedNftInfo({ ...nftInfo, isValid: true });
    } catch (error) {
      setNftValidationError(error instanceof Error ? error.message : 'NFT 검증에 실패했습니다.');
      setValidatedNftInfo(null);
    } finally {
      setIsValidatingNft(false);
    }
  };

  const handleConfirmJoinWithNft = () => {
    if (validatedNftInfo && validatedNftInfo.isValid) {
      navigate(`/collective/${validatedNftInfo.collectiveId}/overview`);
      handleCloseNftModal();
    }
  };

  const handleCloseNftModal = () => {
    setShowNftModal(false);
    setNftCode('');
    setNftValidationError('');
    setIsValidatingNft(false);
    setValidatedNftInfo(null);
  };

  useEffect(() => {
    const initializeWallet = async () => {
        await contractService.initializeProvider();
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    setWalletAddress(accounts[0]);
                }
                window.ethereum.on('accountsChanged', (newAccounts: string[]) => {
                    setWalletAddress(newAccounts.length > 0 ? newAccounts[0] : null);
                });
            } catch (error) {
                console.error("Error connecting to wallet:", error);
            }
        }
    };
    initializeWallet();
    return () => {
        if (window.ethereum?.removeListener) {
            window.ethereum.removeListener('accountsChanged', () => {});
        }
    }
  }, []);

  const formatAddress = (address: string | null) => {
    if (!address) return '';
    return '0x' + address.slice(2, 10) + '...';
  };

  const handleLogout = () => {
    // 지갑 연결 해제
    setWalletAddress(null);
    // 랜딩 페이지로 이동
    navigate('/');
  };
  
  const tabList = [
    { key: 'all', label: 'All' },
    { key: 'my', label: 'My DAOs' },
  ];
  const handleTabClick = (idx: number) => setCurrentTab(idx);
  
  return (
    <div className="collectives-search-page" style={{ display: 'flex', height: '100vh' }}>
      <LogoSidebar />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Header walletAddress={formatAddress(walletAddress)} searchTerm={searchTerm} setSearchTerm={setSearchTerm} onLogout={handleLogout} />

        <div style={{ padding: '0 24px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
          <div style={{ display: 'flex', gap: '28px' }}>
            {tabList.map((tab, idx) => (
              <button
                key={tab.key}
                onClick={() => handleTabClick(idx)}
                style={{
                  padding: '16px 4px', border: 'none', background: 'none', cursor: 'pointer',
                  fontSize: '15px', fontWeight: currentTab === idx ? '600' : '500',
                  color: currentTab === idx ? '#111827' : '#6b7280',
                  borderBottom: currentTab === idx ? '2px solid #111827' : '2px solid transparent',
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1, minHeight: 0, minWidth: 0 }}>
          <div className="main-content" style={{ flex: 1, minWidth: 0, position: 'relative' }}>
            <button className="create-collective-button" onClick={handleCreateClick} style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 1000, padding: '12px 24px', backgroundColor: '#000000', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'}} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#333333'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.15)'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#000000'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'; }}>
              Create
            </button>
            <button onClick={handleJoinWithNft} style={{ position: 'absolute', top: '20px', left: '120px', zIndex: 1000, padding: '12px 24px', background: 'linear-gradient(45deg, #667eea, #764ba2)', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(102, 126, 234, 0.3)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'; }}>
              🎫 Join with NFT
            </button>

            <div ref={canvasRef} className={`bubble-canvas ${isAnimating ? 'animating' : ''}`} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
              {isLoading ? (
                <div className="no-results"><p>Loading DAOs...</p></div>
              ) : bubbles.length === 0 ? (
                <div className="no-results">
                  <p>{searchTerm ? "검색 결과가 없습니다." : (currentTab === 1 ? "가입한 DAO가 없습니다." : "표시할 DAO가 없습니다.")}</p>
                  {currentTab === 1 && !searchTerm && <p>"All" 탭에서 새로운 DAO에 참여해보세요.</p>}
                </div>
              ) : (
                bubbles.map((bubble) => {
                  const { background, opacity, borderColor } = getBubbleColor(bubble.category, bubble.participants, bubble.scale);
                  const dx = mouse.x - bubble.x;
                  const dy = mouse.y - bubble.y;
                  const distance = Math.sqrt(dx * dx + dy * dy);
                  const maxDistance = 180;
                  let scale = 1, zIndex = 1, enhancedOpacity = opacity;
                  if (distance < maxDistance) {
                    const factor = 1 - distance / maxDistance;
                    scale = 1 + 0.12 * factor;
                    zIndex = Math.floor(15 * factor);
                    enhancedOpacity = Math.min(0.98, opacity + 0.1 * factor);
                  }
                  return (
                    <div key={bubble.id} className="collective-bubble" style={{ 
                      position: 'absolute', 
                      left: `${bubble.x - bubble.radius}px`, 
                      top: `${bubble.y - bubble.radius}px`, 
                      width: `${bubble.radius * 2}px`, 
                      height: `${bubble.radius * 2}px`, 
                      background: background,
                      border: `1px solid ${borderColor}`,
                      borderRadius: '50%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transform: `scale(${scale})`, 
                      opacity: enhancedOpacity, 
                      zIndex: zIndex, 
                      padding: `${bubble.radius * 0.15}px`,
                      transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                      color: '#374151',
                      textAlign: 'center',
                      userSelect: 'none',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)'
                    }} onClick={() => handleBubbleClick(bubble.id)} >
                      {shouldShowFullText(bubble.radius) ? (
                        <>
                          <div className="bubble-title" style={{ fontSize: `${getFontSize(bubble.radius, true)}px`, marginBottom: `${bubble.radius * 0.05}px`, maxWidth: `${bubble.radius * 1.6}px`, whiteSpace: 'pre-wrap' }}>
                            {bubble.name}
                          </div>
                          <div className="bubble-count" style={{ fontSize: `${getFontSize(bubble.radius, false)}px`, maxWidth: `${bubble.radius * 1.4}px` }}>
                            {bubble.participants.toLocaleString()} participants
                          </div>
                        </>
                      ) : (
                        <div className="bubble-count-only" style={{ fontSize: `${getFontSize(bubble.radius, true)}px`, maxWidth: `${bubble.radius * 1.6}px` }}>
                          {bubble.participants.toLocaleString()}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {showNftModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '90%', maxWidth: validatedNftInfo ? '600px' : '500px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)', position: 'relative' }}>
            <button onClick={handleCloseNftModal} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666' }}> × </button>
            <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px', color: '#000' }}> 🎫 Join with NFT Invitation </h2>
            <p style={{ color: '#666', marginBottom: '24px', fontSize: '14px' }}> NFT 초대장의 토큰 ID를 입력하여 Private Collective에 가입하세요. </p>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}> NFT Token ID: </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="text" value={nftCode} onChange={(e) => setNftCode(e.target.value)} placeholder="예: 1703234567890-1234" style={{ flex: 1, padding: '12px 16px', border: nftValidationError ? '2px solid #dc2626' : '2px solid #e9ecef', borderRadius: '8px', fontSize: '16px', fontFamily: 'Monaco, Menlo, monospace', letterSpacing: '1px', outline: 'none', transition: 'border-color 0.2s ease' }} onFocus={(e) => { if (!nftValidationError) e.target.style.borderColor = '#007bff'; }} onBlur={(e) => { if (!nftValidationError) e.target.style.borderColor = '#e9ecef'; }} />
                <button onClick={handleJoinWithNftCode} disabled={isValidatingNft || !nftCode.trim()} style={{ padding: '12px 20px', border: 'none', borderRadius: '8px', background: isValidatingNft || !nftCode.trim() ? '#ccc' : '#007bff', color: 'white', cursor: isValidatingNft || !nftCode.trim() ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap' }}> {isValidatingNft ? '⏳' : '🔍 Verify'} </button>
              </div>
              {nftValidationError && <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}> {nftValidationError} </p>}
            </div>
            {validatedNftInfo && (
              <div style={{ marginTop: '24px', padding: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '12px', color: 'white' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: 'white' }}> ✅ NFT Verified! </h3>
                <div style={{ background: 'rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '16px', backdropFilter: 'blur(10px)' }}>
                  <div style={{ background: 'white', borderRadius: '12px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: '#f0f0f0' }}>
                      <img src={validatedNftInfo.image} alt={validatedNftInfo.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1, color: '#333' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#000', margin: '0 0 8px 0' }}> {validatedNftInfo.name} </h4>
                      <p style={{ fontSize: '12px', color: '#666', margin: '0 0 12px 0', fontFamily: 'Monaco, Menlo, monospace' }}> Token ID: {validatedNftInfo.tokenId} </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {validatedNftInfo.attributes.slice(0, 4).map((attr, index) => ( <span key={index} style={{ background: '#f8f9fa', color: '#495057', padding: '4px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '500', border: '1px solid #e9ecef' }}> {attr.trait_type}: {attr.value} </span> ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                    <p style={{ fontSize: '14px', margin: '0 0 8px 0', color: 'rgba(255, 255, 255, 0.9)' }}> 이 NFT는 <strong>{validatedNftInfo.collectiveName}</strong>에 대한 초대장입니다. </p>
                    <p style={{ fontSize: '12px', margin: '0', color: 'rgba(255, 255, 255, 0.7)', fontStyle: 'italic' }}> 가입을 진행하시겠습니까? </p>
                  </div>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button onClick={handleCloseNftModal} style={{ padding: '12px 24px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff', color: '#666', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}> Cancel </button>
              {validatedNftInfo ? ( <button onClick={handleConfirmJoinWithNft} style={{ padding: '12px 24px', border: 'none', borderRadius: '8px', background: 'linear-gradient(45deg, #667eea, #764ba2)', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}> 🚀 Join {validatedNftInfo.collectiveName} </button> ) : ( <button disabled style={{ padding: '12px 24px', border: 'none', borderRadius: '8px', background: '#ccc', color: 'white', cursor: 'not-allowed', fontSize: '14px', fontWeight: '600' }}> Enter Token ID First </button> )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectivesSearch;