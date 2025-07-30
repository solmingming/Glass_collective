import React, { useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createNewNft, generateInviteCode, type NftData } from '../utils/nftUtils';
import '../styles/CreateDAO.css';

// 각 규칙의 상태를 관리하기 위한 타입 정의
interface RuleSettings {
  threshold: number;
  votingDuration: number;
  maxKickCount: number;
  entryFee: number;
  penaltyFee: number;
}

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
  const [collectiveType, setCollectiveType] = useState<'public' | 'private'>('public');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string>('');
  
  // NFT 초대장 관련 상태
  const [nftInvitation, setNftInvitation] = useState<NftData | null>(null);
  const [isGeneratingNFT, setIsGeneratingNFT] = useState(false);

  // 규칙 설정 상태
  const [rules, setRules] = useState<RuleSettings>({
    threshold: 50,
    votingDuration: 7,
    maxKickCount: 5,
    entryFee: 1,
    penaltyFee: 5,
  });

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
  const handleSubmit = () => {
    const collectiveData = {
      name,
      description,
      collectiveType,
      profileImage, // 실제로는 업로드된 이미지의 URL이 될 것입니다.
      inviteCode, // private일 때만 값이 있음
      nftInvitation, // NFT 초대장 데이터
      rules,
    };
    console.log('Creating Collective with data:', collectiveData);
    // TODO: 이 데이터를 사용하여 스마트 컨트랙트의 생성 함수를 호출합니다.
    
    // Collective 생성 후 collectives-search 페이지로 이동
    navigate('/collectives-search');
  };

  return (
    <div className="create-dao-container">
      <header className="page-header">
        <h1 className="page-title">Create Collective</h1>
        <button className="submit-button" onClick={handleSubmit}>
          create collective
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
                  >
                    {isGeneratingNFT ? (
                      <>
                        <span className="loading-spinner">⏳</span>
                        Generating NFT...
                      </>
                    ) : (
                      <>
                        🎨 Generate NFT Invitation
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
                    >
                      🔄 Regenerate
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
                    >
                      📋 Copy Token ID
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
              <span>Max Kick Count</span>
              <span>{rules.maxKickCount} times</span>
            </div>
            <input type="range" name="maxKickCount" min="1" max="20" value={rules.maxKickCount} onChange={handleRuleChange} />
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