import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useNavigate } from "react-router-dom";
import { contractService } from "../services/contractService";
import "../styles/Header.css";

interface HeaderProps {
  walletAddress?: string;
  searchTerm?: string;
  setSearchTerm?: (v: string) => void;
  daoName?: string;
}

const formatAddress = (address: string) => {
  if (!address) return '';
  return address.slice(0, 10) + '...';
};

// ETH 잔고 포맷팅 함수
const formatEthBalance = (balance: number) => {
  if (balance >= 1) {
    return balance.toFixed(3);
  } else {
    return balance.toFixed(4);
  }
};

const Header: React.FC<HeaderProps> = ({ walletAddress, searchTerm, setSearchTerm, daoName }) => {
  const [ethBalance, setEthBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

  // ETH 잔고 조회 함수
  const fetchEthBalance = async (address: string) => {
    try {
      setIsLoadingBalance(true);
      
      // contractService의 getEthBalance 메서드 사용
      const ethValue = await contractService.getEthBalance(address);
      setEthBalance(ethValue);
      
    } catch (error) {
      console.error('Error fetching ETH balance:', error);
      setEthBalance(0);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // 로그아웃 함수
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await contractService.logout();
      
      // 로컬 스토리지에서 지갑 주소 제거
      localStorage.removeItem('walletAddress');
      
      // 랜딩 페이지로 이동
      navigate('/');
      
      // 페이지 새로고침으로 상태 초기화
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
      alert('로그아웃 중 오류가 발생했습니다.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // 지갑 주소가 변경될 때마다 잔고 조회
  useEffect(() => {
    if (walletAddress) {
      fetchEthBalance(walletAddress);
      
      // 30초마다 잔고 업데이트
      const interval = setInterval(() => {
        fetchEthBalance(walletAddress);
      }, 30000);
      
      return () => clearInterval(interval);
    } else {
      setEthBalance(0);
    }
  }, [walletAddress]);

  return (
    <header className="header">
      <div className="search-container">
        <input
          className="search-input"
          type="text"
          placeholder={daoName ? daoName+" page" : "search for a collective"}
          value={searchTerm ?? ''}
          onChange={e => setSearchTerm && setSearchTerm(e.target.value)}
        />
        <div className="search-icon">🔍</div>
      </div>
      <div className="header-right">
        {/* ETH 잔고 표시 */}
        <div className="eth-balance-container">
          <div className="eth-balance">
            {isLoadingBalance ? (
              <span className="loading-balance">⏳</span>
            ) : (
              <>
                <span className="eth-icon">Ξ</span>
                <span className="eth-amount">{formatEthBalance(ethBalance)} Sep ETH</span>
              </>
            )}
          </div>
        </div>
        
        {/* 지갑 주소 버튼 */}
        <button className="wallet-btn">
          {walletAddress ? formatAddress(walletAddress) : 'Connect Wallet'}
        </button>
        
        {/* 로그아웃 버튼 */}
        {walletAddress && (
          <button 
            className="logout-btn"
            onClick={handleLogout}
            disabled={isLoggingOut}
            title="로그아웃"
          >
            {isLoggingOut ? '⏳' : '🚪'}
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;