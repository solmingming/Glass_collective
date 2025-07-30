import React, { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createNewNft, generateInviteCode, type NftData } from '../utils/nftUtils';
import { contractService, type DAOCreationData, type RuleSettings } from '../services/contractService'; 
import { CATEGORY_COLOR_MAP, type CategoryType } from '../utils/categoryConstants';
import '../styles/CreateDAO.css';
import '../styles/ArcColorChips.css';


// 클라우드 업로드 아이콘 SVG 컴포넌트
const UploadIcon: React.FC = () => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);


const CreateDao: React.FC = () => {
  const navigate = useNavigate();
  
  // 프로필 정보 상태
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const [collectiveType, setCollectiveType] = useState<'public' | 'private'>('public');
  const [inviteCode, setInviteCode] = useState<string>('');
  const [rules, setRules] = useState<RuleSettings>({
    threshold: 50,
    votingDuration: 7,
    entryFee: 0.05,
    penaltyFee: 0.001,
    countToExpel: 5,
    scoreToExpel: 20
  });

  //블록체인 연동을 위한 새로운 상태 추가 (로딩, 에러, 지갑 주소 관리리)
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // NFT 초대장 관련 상태
  const [nftInvitation, setNftInvitation] = useState<NftData | null>(null);
  const [isGeneratingNFT, setIsGeneratingNFT] = useState(false);
  
  // 카테고리 드롭다운 상태
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownButtonRef = useRef<HTMLButtonElement>(null);

  
  // *** 지갑 자동 연결을 위한 useEffect 추가 ***
  // 페이지가 로드될 때 자동으로 MetaMask 지갑 연결을 시도합니다.
  useEffect(() => {
    const connectWalletOnLoad = async () => {
      try {
        const address = await contractService.connectWallet();
        setWalletAddress(address);
      } catch (e: any) {
        setError("Please connect your MetaMask wallet to continue.");
      }
    };
    connectWalletOnLoad();
  }, []); // 빈 배열을 전달하여 컴포넌트 마운트 시 한 번만 실행되도록 합니다.


  // 랜덤 NFT 초대장 생성 함수
  const generateNFTInvitation = async () => {
    setIsGeneratingNFT(true);
    
    try {
      // 실제로는 여기서 스마트 컨트랙트의 mint 함수를 호출
      // await mintInvitationNFT(nftData);
      
      // 2초 로딩 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 공통 유틸리티 함수를 사용하여 일관된 NFT 생성
      const nftData = createNewNft(name || 'Collective', 'tech-innovators');
      setNftInvitation(nftData);
      
    } catch (error) {
      console.error('NFT 생성 실패:', error);
    } finally {
      setIsGeneratingNFT(false);
    }
  };

  // 컬렉티브 타입 변경 핸들러
  const handleCollectiveTypeChange = (type: 'public' | 'private') => {
    setCollectiveType(type);
    if (type === 'private') {
      // private 선택 시 인증코드 자동 생성
      setInviteCode(generateInviteCode());
    } else {
      // public 선택 시 인증코드 및 NFT 초기화
      setInviteCode('');
      setNftInvitation(null);
    }
  };

  // 슬라이더 값 변경 핸들러
  const handleRuleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRules(prevRules => ({
      ...prevRules,
      [name]: Number(value),
    }));
  };
  
  // 이미지 파일 변경 핸들러
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // 선택된 이미지 파일의 미리보기를 생성
      setProfileImage(URL.createObjectURL(file));
      // TODO: 실제로는 이 파일을 서버나 IPFS에 업로드해야 합니다.
    }
  };

  // 최종 "Create Collective" 버튼 클릭 핸들러
  const handleSubmit = async() => {
    console.log("Create Collective button clicked!");
    console.log("Form data:", { name, description, selectedCategory, walletAddress });
    
    if (!name.trim() || !description.trim() || !selectedCategory) {
      console.log("Validation failed: missing required fields");
      setError('Please fill in all required fields.'); 
      return;
    }

    if (!walletAddress) {
      console.log("Validation failed: wallet not connected");
      setError('Please connect your wallet first.'); 
      return;
    }

    console.log("Validation passed, starting DAO creation...");
    
    // 로딩 상태 시작 및 에러 메시지 초기화
    setIsCreating(true);
    setError(null);

    try {
      const newDAOData: DAOCreationData = {
        name: name.trim(),
        description: description.trim(),
        category: selectedCategory!,
        collectiveType: collectiveType,
        inviteCode: inviteCode,
        rules: rules,
      };

      console.log("Calling contractService.createDAO with data:", newDAOData);
      const daoAddress = await contractService.createDAO(newDAOData);
      console.log("DAO created successfully! Address:", daoAddress);
      alert(`Collective created successfully!\nDAO Address: ${daoAddress}`);
      navigate('/collectives-search');

    } catch (e: any) {
      console.error("Error creating DAO:", e);
      setError(e.message || 'Failed to create collective.');
    } finally {
      setIsCreating(false);
    }
  };

  // 카테고리 선택 핸들러
  const handleCategorySelect = (category: CategoryType | null) => {
    setSelectedCategory(category);
  };
  
  // 드롭다운 위치 계산 함수
  const calculateDropdownPosition = () => {
    if (dropdownButtonRef.current) {
      const rect = dropdownButtonRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const windowWidth = window.innerWidth;
      const dropdownHeight = 200; // 예상 드롭다운 높이
      const dropdownWidth = 250; // 예상 드롭다운 너비
      
      // 아래쪽 공간이 부족하면 위쪽에 표시
      const shouldShowAbove = rect.bottom + dropdownHeight > windowHeight;
      
      // 오른쪽 공간이 부족하면 왼쪽으로 조정
      let left = rect.left;
      if (left + dropdownWidth > windowWidth) {
        left = windowWidth - dropdownWidth - 10;
      }
      
      // 왼쪽 경계 체크
      if (left < 10) {
        left = 10;
      }
      
      setDropdownPosition({
        top: shouldShowAbove ? rect.top - dropdownHeight - 8 : rect.bottom + 4,
        left: left
      });
    }
  };

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.category-dropdown-container')) {
        setIsCategoryDropdownOpen(false);
      }
    };

    const handleResize = () => {
      if (isCategoryDropdownOpen) {
        calculateDropdownPosition();
      }
    };

    if (isCategoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('resize', handleResize);
      calculateDropdownPosition();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
    };
  }, [isCategoryDropdownOpen]);

  return (
    <div className="create-dao-container">
      <header className="page-header">
        <h1 className="page-title">Create Collective</h1>
        
        {/* 에러 메시지 표시 */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: '#dc2626',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {error}
          </div>
        )}
        
        <button 
          className="submit-button" 
          onClick={handleSubmit}
          disabled={isCreating}
          style={{
            padding: '16px 32px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            color: '#1f2937',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
            backdropFilter: 'blur(10px)',
            fontFamily: 'Space Grotesk, sans-serif',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textTransform: 'none'
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
          <span style={{ fontSize: '18px' }}>✨</span>
          {isCreating ? 'Creating...' : 'Create Collective'}
        </button>
      </header>

      <main className="main-content">
        {/* --- 왼쪽: 프로필 패널 --- */}
        <section className="panel profile-panel">
          <h2 className="panel-title">Collective profile</h2>
          <div className="image-uploader">
            <input 
              type="file" 
              id="profile-image-upload" 
              accept="image/*" 
              onChange={handleImageChange}
            />
            <label htmlFor="profile-image-upload" className="upload-label">
              {profileImage ? (
                <img src={profileImage} alt="Profile preview" className="image-preview" />
              ) : (
                <UploadIcon />
              )}
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input 
              type="text" 
              id="name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description:</label>
            <textarea 
              id="description" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* 카테고리 선택 섹션 */}
          <div className="form-group">
            <label>Category:</label>
            <div 
              className="category-dropdown-container"
              style={{ position: 'relative' }}
            >
              <button 
                ref={dropdownButtonRef}
                className="category-dropdown-button"
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                style={{
                  padding: '14px 20px',
                  backgroundColor: selectedCategory 
                    ? CATEGORY_COLOR_MAP[selectedCategory].color + '20'
                    : 'rgba(255, 255, 255, 0.95)',
                  color: selectedCategory 
                    ? CATEGORY_COLOR_MAP[selectedCategory].color
                    : '#6b7280',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  fontFamily: 'Space Grotesk, sans-serif',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  backdropFilter: 'blur(10px)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = selectedCategory 
                    ? CATEGORY_COLOR_MAP[selectedCategory].color + '30'
                    : 'rgba(255, 255, 255, 1)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = selectedCategory 
                    ? CATEGORY_COLOR_MAP[selectedCategory].color + '20'
                    : 'rgba(255, 255, 255, 0.95)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span>
                  {selectedCategory 
                    ? CATEGORY_COLOR_MAP[selectedCategory].name
                    : 'Select a category'
                  }
                </span>
                <span style={{ 
                  fontSize: '12px',
                  transition: 'transform 0.3s ease',
                  transform: isCategoryDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                }}>
                  ▼
                </span>
              </button>
              
              {isCategoryDropdownOpen && (
                <div 
                  className="category-dropdown-menu"
                  style={{
                    position: 'fixed',
                    top: `${dropdownPosition.top}px`,
                    left: `${dropdownPosition.left}px`,
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '12px',
                    padding: '8px',
                    zIndex: 9999,
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    minWidth: '200px',
                    width: 'auto',
                    animation: 'dropdownFadeIn 0.2s ease-out'
                  }}
                >
                  {Object.entries(CATEGORY_COLOR_MAP).map(([key, { name, color }]) => (
                    <button
                      key={key}
                      className="category-option"
                      onClick={() => {
                        handleCategorySelect(key as CategoryType);
                        setIsCategoryDropdownOpen(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        backgroundColor: 'transparent',
                        color: '#1f2937',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontFamily: 'Space Grotesk, sans-serif'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = color + '15';
                        e.currentTarget.style.color = color;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#1f2937';
                      }}
                    >
                      <div 
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: color,
                          flexShrink: 0
                        }}
                      />
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Collective Type:</label>
            <div className="type-selector">
              <button 
                className={collectiveType === 'public' ? 'active' : ''}
                onClick={() => handleCollectiveTypeChange('public')}
              >
                public
              </button>
              <button 
                className={collectiveType === 'private' ? 'active' : ''}
                onClick={() => handleCollectiveTypeChange('private')}
              >
                private
              </button>
            </div>
          </div>

          {/* Private 선택 시 인증코드 표시 */}
          {collectiveType === 'private' && inviteCode && (
            <div className="form-group invite-code-section">
              <label>Invite Code:</label>
              <div className="invite-code-container">
                <div className="invite-code">{inviteCode}</div>
                <button 
                  className="regenerate-btn"
                  onClick={() => setInviteCode(generateInviteCode())}
                  type="button"
                >
                  🔄
                </button>
              </div>
              <p className="invite-code-note">
                Share this code with members to join your private collective
              </p>
            </div>
          )}

          {/* Private 선택 시 NFT 초대장 생성 옵션 */}
          {collectiveType === 'private' && (
            <div className="form-group nft-invitation-section">
              <label>NFT Invitation:</label>
              
              {!nftInvitation ? (
                <div className="nft-generate-container">
                  <button 
                    className="generate-nft-btn"
                    onClick={generateNFTInvitation}
                    disabled={isGeneratingNFT}
                    type="button"
                    style={{
                      padding: '14px 24px',
                      backgroundColor: 'rgba(168, 85, 247, 0.1)',
                      color: '#a855f7',
                      border: '1px solid rgba(168, 85, 247, 0.2)',
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      fontFamily: 'Space Grotesk, sans-serif',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      opacity: isGeneratingNFT ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!isGeneratingNFT) {
                        e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.15)';
                        e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                        e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.1)';
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.2)';
                    }}
                  >
                    {isGeneratingNFT ? (
                      <>
                        <span style={{ fontSize: '16px', animation: 'spin 1s linear infinite' }}>⏳</span>
                        Generating NFT...
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize: '16px' }}>🎨</span>
                        Generate NFT Invitation
                      </>
                    )}
                  </button>
                  <p className="nft-generate-note">
                    Create a unique NFT that serves as an invitation to your collective
                  </p>
                </div>
              ) : (
                <div className="nft-display-container">
                  <div className="nft-card">
                    <div className="nft-image">
                      <img src={nftInvitation.image} alt={nftInvitation.name} />
                    </div>
                    <div className="nft-info">
                      <h4 className="nft-name">{nftInvitation.name}</h4>
                      <p className="nft-token-id">Token ID: {nftInvitation.tokenId}</p>
                      <div className="nft-attributes">
                        {nftInvitation.attributes.slice(0, 4).map((attr, index) => (
                          <span key={index} className="nft-attribute">
                            {attr.trait_type}: {attr.value}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="nft-actions">
                    <button 
                      className="regenerate-nft-btn"
                      onClick={generateNFTInvitation}
                      disabled={isGeneratingNFT}
                      type="button"
                      style={{
                        padding: '12px 20px',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        color: '#6366f1',
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        fontFamily: 'Space Grotesk, sans-serif',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        opacity: isGeneratingNFT ? 0.6 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!isGeneratingNFT) {
                          e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.15)';
                          e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
                          e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.1)';
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.2)';
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>🔄</span>
                      Regenerate
                    </button>
                    <button 
                      className="copy-nft-btn" 
                      type="button"
                      onClick={() => {
                        if (nftInvitation) {
                          navigator.clipboard.writeText(nftInvitation.tokenId);
                          // 간단한 피드백 (실제로는 토스트 메시지 등을 사용할 수 있음)
                          const btn = document.querySelector('.copy-nft-btn') as HTMLButtonElement;
                          if (btn) {
                            const originalText = btn.textContent;
                            btn.textContent = '✅ Copied!';
                            setTimeout(() => {
                              btn.textContent = originalText;
                            }, 2000);
                          }
                        }
                      }}
                      style={{
                        padding: '12px 20px',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        color: '#22c55e',
                        border: '1px solid rgba(34, 197, 94, 0.2)',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        fontFamily: 'Space Grotesk, sans-serif',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.15)';
                        e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
                        e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.1)';
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.2)';
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>📋</span>
                      Copy Token ID
                    </button>
                  </div>
                  <p className="nft-usage-note">
                    Share this NFT with members to grant access to your private collective
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* --- 오른쪽: 규칙 설정 패널 --- */}
        <section className="panel rules-panel">
          <h2 className="panel-title">Rule Book Settings</h2>
          
          <div className="rule-setting">
            <div className="rule-label">
              <span>Threshold</span>
              <span>{rules.threshold}%</span>
            </div>
            <input type="range" name="threshold" min="1" max="100" value={rules.threshold} onChange={handleRuleChange} />
          </div>

          <div className="rule-setting">
            <div className="rule-label">
              <span>Voting Duration</span>
              <span>{rules.votingDuration} days</span>
            </div>
            <input type="range" name="votingDuration" min="1" max="30" value={rules.votingDuration} onChange={handleRuleChange} />
          </div>

          <div className="rule-setting">
            <div className="rule-label">
              <span>Count to Expel</span>
              <span>{rules.countToExpel} times</span>
            </div>
            <input type="range" name="countToExpel" min="1" max="20" value={rules.countToExpel} onChange={handleRuleChange} />
          </div>

          <div className="rule-setting">
            <div className="rule-label">
              <span>Score to Expel</span>
              <span>{rules.scoreToExpel} times</span>
            </div>
            <input type="range" name="scoreToExpel" min="1" max="50" value={rules.scoreToExpel} onChange={handleRuleChange} />
          </div>

          <div className="rule-setting">
            <div className="rule-label">
              <span>Entry Fee</span>
              <span>{rules.entryFee / 100} ETH</span>
            </div>
            <input type="range" name="entryFee" min="0" max="100" value={rules.entryFee} onChange={handleRuleChange} />
          </div>

          <div className="rule-setting">
            <div className="rule-label">
              <span>Penalty Fee</span>
              <span>{rules.penaltyFee / 1000} ETH</span>
            </div>
            <input type="range" name="penaltyFee" min="0" max="100" value={rules.penaltyFee} onChange={handleRuleChange} />
          </div>

        </section>
      </main>
    </div>
  );
};

export default CreateDao;