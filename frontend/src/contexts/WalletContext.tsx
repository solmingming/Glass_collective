// src/contexts/WalletContext.tsx

import React, { createContext, useState, useContext, useCallback } from 'react';
import type { ReactNode } from 'react';
import { contractService } from '../services/contractService';

// 컨텍스트가 제공할 값들의 타입 정의
interface WalletContextType {
  walletAddress: string | null;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void; // 연결 해제 함수도 추가 (선택사항)
}

// 컨텍스트 생성
const WalletContext = createContext<WalletContextType | undefined>(undefined);

// 다른 컴포넌트들이 컨텍스트를 쉽게 사용하도록 도와주는 커스텀 훅
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

// 컨텍스트를 하위 컴포넌트에 제공하는 Provider 컴포넌트
export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    try {
      const address = await contractService.connectWallet();
      setWalletAddress(address);
      console.log("Wallet connected globally:", address);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      // 필요하다면 에러 상태를 추가하여 사용자에게 알릴 수 있습니다.
    } finally {
      setIsConnecting(false);
    }
  }, []);
  
  const disconnectWallet = () => {
      setWalletAddress(null);
      // contractService 내부의 signer도 초기화하면 더 좋습니다 (선택사항)
      console.log("Wallet disconnected globally.");
  };

  const value = {
    walletAddress,
    isConnecting,
    connectWallet,
    disconnectWallet
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};