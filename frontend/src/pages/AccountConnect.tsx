import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AccountConnect.css';

const AccountConnect: React.FC = () => {
  const navigate = useNavigate();
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);

  const banks = [
    { id: 'kb', name: 'KB국민은행', logo: '🏦' },
    { id: 'shinhan', name: '신한은행', logo: '🏦' },
    { id: 'woori', name: '우리은행', logo: '🏦' },
    { id: 'hana', name: '하나은행', logo: '🏦' },
    { id: 'nh', name: 'NH농협은행', logo: '🏦' },
    { id: 'ibk', name: 'IBK기업은행', logo: '🏦' },
  ];

  const handleBankSelect = (bankId: string) => {
    setSelectedBank(bankId);
  };

  const handleConnect = () => {
    if (!selectedBank) {
      alert('은행을 선택해주세요.');
      return;
    }

    setIsConnecting(true);
    
    // 계좌 연결 시뮬레이션
    setTimeout(() => {
      setIsConnecting(false);
      navigate('/dao-overview');
    }, 2000);
  };

  const handleBack = () => {
    navigate('/login');
  };

  return (
    <div className="account-connect-page">
      <div className="account-connect-container">
        <div className="header">
          <button className="back-btn" onClick={handleBack}>
            ← 뒤로
          </button>
          <h1 className="title">계좌 연결</h1>
        </div>

        <div className="content">
          <p className="description">
            연결할 은행을 선택해주세요
          </p>

          <div className="bank-list">
            {banks.map((bank) => (
              <button
                key={bank.id}
                className={`bank-item ${selectedBank === bank.id ? 'selected' : ''}`}
                onClick={() => handleBankSelect(bank.id)}
              >
                <span className="bank-logo">{bank.logo}</span>
                <span className="bank-name">{bank.name}</span>
              </button>
            ))}
          </div>

          <button
            className="connect-btn"
            onClick={handleConnect}
            disabled={!selectedBank || isConnecting}
          >
            {isConnecting ? (
              <div className="loading-content">
                <div className="loading-spinner"></div>
                <span>연결 중...</span>
              </div>
            ) : (
              <span>계좌 연결하기</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountConnect; 