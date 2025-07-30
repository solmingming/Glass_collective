import React, { useState, useEffect, useCallback } from "react";
import "../styles/Header.css";

interface HeaderProps {
  walletAddress?: string;
  searchTerm?: string;
  setSearchTerm?: (v: string) => void;
  daoName?: string;
  onLogout?: () => void;
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

const Header: React.FC<HeaderProps> = ({ walletAddress, searchTerm, setSearchTerm, daoName, onLogout }) => {
  const [ethBalance, setEthBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Sepolia 네트워크 체인 ID
  const SEPOLIA_CHAIN_ID = '0xaa36a7'; // 11155111 in hex

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

  // ETH 잔고 조회 함수
  const fetchEthBalance = useCallback(async (address: string) => {
    if (!window.ethereum) {
      console.error('MetaMask not found');
      return;
    }

    try {
      setIsLoadingBalance(true);
      
      // 네트워크 체크
      const isSepoliaNetwork = await checkNetwork();
      if (!isSepoliaNetwork) {
        console.warn('Sepolia 네트워크가 아닙니다. 잔고 조회를 건너뜁니다.');
        setEthBalance(0);
        return;
      }
      
      // 웹3 provider를 통해 잔고 조회
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });
      
      // Wei를 ETH로 변환 (1 ETH = 10^18 Wei)
      const ethValue = parseInt(balance, 16) / Math.pow(10, 18);
      setEthBalance(ethValue);
      
    } catch (error) {
      console.error('Error fetching ETH balance:', error);
      setEthBalance(0);
    } finally {
      setIsLoadingBalance(false);
    }
  }, []);

  // 지갑 주소가 변경될 때마다 잔고 조회
  useEffect(() => {
    if (walletAddress) {
      fetchEthBalance(walletAddress);
    } else {
      setEthBalance(0);
    }
  }, [walletAddress, fetchEthBalance]);

  // 네트워크 변경 감지
  useEffect(() => {
    if (window.ethereum && walletAddress) {
      const handleChainChanged = () => {
        console.log('네트워크가 변경되었습니다. 잔고를 다시 조회합니다.');
        fetchEthBalance(walletAddress);
      };

      window.ethereum.on('chainChanged', handleChainChanged);
      
      return () => {
        if (window.ethereum?.removeListener) {
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [walletAddress, fetchEthBalance]);

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
          <div 
            className="eth-balance" 
            onClick={() => walletAddress && fetchEthBalance(walletAddress)}
            style={{ cursor: walletAddress ? 'pointer' : 'default' }}
            title={walletAddress ? '클릭하여 잔고 새로고침' : ''}
          >
            {isLoadingBalance ? (
              <span className="loading-balance">⏳</span>
            ) : (
              <>
                <span className="eth-amount">{formatEthBalance(ethBalance)}</span>
                <span className="eth-symbol">SepoliaETH</span>
              </>
            )}
          </div>
        </div>
        
        {/* 지갑 주소 버튼 */}
        <button className="wallet-btn">
          {walletAddress ? formatAddress(walletAddress) : '0x0EFA118A...'}
        </button>
        
        {/* 로그아웃 버튼 */}
        {walletAddress && onLogout && (
          <button 
            className="logout-btn" 
            onClick={onLogout}
            title="로그아웃"
          >
            🚪
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;