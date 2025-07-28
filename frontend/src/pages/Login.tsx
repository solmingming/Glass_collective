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

  const connectWallet = async () => {
    setIsLoading(true);
    
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        
        if (accounts.length > 0) {
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