import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Greetings from '../components/Greetings';
import '../styles/Login.css';

// MetaMask 타입 정의
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (params: any) => void) => void;
      removeListener: (event: string, callback: (params: any) => void) => void;
    };
  }
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionType, setConnectionType] = useState<'wallet' | 'account' | null>(null);
  const [accountInfo, setAccountInfo] = useState<string>('');
  const [showBankModal, setShowBankModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [networkError, setNetworkError] = useState<string>('');

  // Sepolia 테스트넷 체인 ID
  const SEPOLIA_CHAIN_ID = '0xaa36a7'; // 11155111 in hex

  const banks = [
    { 
      id: 'kb', 
      name: 'KB국민은행', 
      logo: '/images/banks/kb-bank.png'
    },
    { 
      id: 'shinhan', 
      name: '신한은행', 
      logo: '/images/banks/shinhan-bank.png'
    },
    { 
      id: 'woori', 
      name: '우리은행', 
      logo: '/images/banks/woori-bank.png'
    },
    { 
      id: 'hana', 
      name: '하나은행', 
      logo: '/images/banks/hana-bank.png'
    },
    { 
      id: 'nh', 
      name: 'NH농협은행', 
      logo: '/images/banks/nh-bank.gif'
    },
    { 
      id: 'ibk', 
      name: 'IBK기업은행', 
      logo: '/images/banks/ibk-bank.svg'
    },
  ];

  // 네트워크 체크 함수
  const checkNetwork = async () => {
    try {
      const chainId = await window.ethereum?.request({ method: 'eth_chainId' });
      return chainId === SEPOLIA_CHAIN_ID;
    } catch (error) {
      console.error('네트워크 체크 실패:', error);
      return false;
    }
  };

  // Sepolia 네트워크로 전환 요청
  const switchToSepolia = async () => {
    try {
      await window.ethereum?.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
      setNetworkError('');
      return true;
    } catch (error: any) {
      if (error.code === 4902) {
        // 네트워크가 MetaMask에 추가되지 않은 경우
        try {
          await window.ethereum?.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: SEPOLIA_CHAIN_ID,
              chainName: 'Sepolia Test Network',
              nativeCurrency: {
                name: 'SepoliaETH',
                symbol: 'SEP',
                decimals: 18,
              },
              rpcUrls: ['https://sepolia.infura.io/v3/'],
              blockExplorerUrls: ['https://sepolia.etherscan.io/'],
            }],
          });
          setNetworkError('');
          return true;
        } catch (addError) {
          console.error('네트워크 추가 실패:', addError);
          setNetworkError('Sepolia 네트워크 추가에 실패했습니다.');
          return false;
        }
      } else {
        console.error('네트워크 전환 실패:', error);
        setNetworkError('네트워크 전환에 실패했습니다.');
        return false;
      }
    }
  };

  const connectWallet = async () => {
    setIsLoading(true);
    setNetworkError('');
    
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        
        if (accounts.length > 0) {
          // 네트워크 체크
          const isSepoliaNetwork = await checkNetwork();
          
          if (!isSepoliaNetwork) {
            setNetworkError('Sepolia 테스트넷으로 전환해주세요.');
            setIsLoading(false);
            return;
          }
          
          setAccountInfo(accounts[0]);
          setConnectionType('wallet');
          setIsConnected(true);
          setTimeout(() => {
            navigate('/collectives-search');
          }, 1000);
        }
      } else {
        alert('MetaMask가 설치되어 있지 않습니다. 계좌 연결을 이용해주세요.');
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      alert('지갑 연결에 실패했습니다. 계좌 연결을 이용해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const openBankModal = () => {
    setShowBankModal(true);
  };

  const closeBankModal = () => {
    setShowBankModal(false);
    setSelectedBank('');
  };

  const handleBankSelect = (bankId: string) => {
    setSelectedBank(bankId);
  };

  const handleAccountConnect = () => {
    if (!selectedBank) {
      alert('은행을 선택해주세요.');
      return;
    }

    setIsLoading(true);
    setShowBankModal(false);
    
    // 계좌 연결 시뮬레이션
    setTimeout(() => {
      const selectedBankName = banks.find(bank => bank.id === selectedBank)?.name || '';
      const mockAccountNumber = `ACC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      setAccountInfo(`${selectedBankName} ${mockAccountNumber}`);
      setConnectionType('account');
      setIsConnected(true);
      setIsLoading(false);
      setSelectedBank('');
      
      setTimeout(() => {
        navigate('/collectives-search');
      }, 1000);
    }, 2000);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-logo">
          <h1 className="logo-text">Glass Collective</h1>
        </div>

        <Greetings />

        <div className="welcome-text">
          <p>Web3 투명한 공동체에 오신 것을 환영합니다</p>
        </div>

        <div className="wallet-section">
          {/* 네트워크 에러 메시지 */}
          {networkError && (
            <div className="network-error">
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                <span>{networkError}</span>
              </div>
              <button
                type="button"
                className="switch-network-btn"
                onClick={switchToSepolia}
              >
                Sepolia로 전환
              </button>
            </div>
          )}

          {isConnected ? (
            <div className="connected-wallet">
              <div className="wallet-info">
                <span className="wallet-label">
                  {connectionType === 'wallet' ? '연결된 지갑' : '연결된 계좌'}
                </span>
                <span className="wallet-address">
                  {connectionType === 'wallet' 
                    ? `${accountInfo.slice(0, 6)}...${accountInfo.slice(-4)}`
                    : accountInfo
                  }
                </span>
              </div>
              <div className="connection-status">
                <span className="status-dot"></span>
                <span>연결됨</span>
              </div>
            </div>
          ) : (
            <div className="connection-options">
              <button
                type="button"
                className="wallet-connect-btn"
                onClick={connectWallet}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="loading-content">
                    <div className="loading-spinner"></div>
                    <span>연결 중...</span>
                  </div>
                ) : (
                  <span>MetaMask로 연결</span>
                )}
              </button>
              
              <div className="connection-divider">
                <span>또는</span>
              </div>
              
              <button
                type="button"
                className="account-connect-btn"
                onClick={openBankModal}
                disabled={isLoading}
              >
                <span>계좌로 연결</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 은행 선택 모달 */}
      {showBankModal && (
        <div className="modal-overlay" onClick={closeBankModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">은행 선택</h2>
              <button className="modal-close" onClick={closeBankModal}>
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <p className="modal-description">연결할 은행을 선택해주세요</p>
              
              <div className="bank-list">
                {banks.map((bank) => (
                  <button
                    key={bank.id}
                    className={`bank-item ${selectedBank === bank.id ? 'selected' : ''}`}
                    onClick={() => handleBankSelect(bank.id)}
                  >
                    <div className="bank-logo-container">
                      <img 
                        src={bank.logo} 
                        alt={bank.name} 
                        className="bank-logo"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const container = target.parentElement;
                          if (container) {
                            container.innerHTML = `<span class="bank-logo-fallback">${bank.name.charAt(0)}</span>`;
                          }
                        }}
                      />
                    </div>
                    <span className="bank-name">{bank.name}</span>
                  </button>
                ))}
              </div>
              
              <button
                className="modal-connect-btn"
                onClick={handleAccountConnect}
                disabled={!selectedBank}
              >
                계좌 연결하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login; 