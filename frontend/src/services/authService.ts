// API 기본 설정
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// 개발 모드에서 모의 데이터 사용
const USE_MOCK = true; // 실제 API 서버가 준비되면 false로 변경

// 타입 정의
export interface WalletUser {
  walletAddress: string;
  username?: string;
  email?: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface EmailUser {
  email: string;
  username?: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface LoginResponse {
  success: boolean;
  user: WalletUser | EmailUser;
  token?: string;
  message?: string;
}

export interface SignupResponse {
  success: boolean;
  user: WalletUser | EmailUser;
  message?: string;
}

// 모의 데이터 저장소 (실제로는 서버 DB에 저장됨)
const mockUsers: (WalletUser | EmailUser)[] = [];

// 모의 API 함수들
const mockConnectWallet = async (walletAddress: string, username?: string): Promise<LoginResponse> => {
  // 기존 사용자 확인
  const existingUser = mockUsers.find(user => 
    'walletAddress' in user && user.walletAddress === walletAddress
  ) as WalletUser | undefined;

  if (existingUser) {
    // 기존 사용자 로그인
    existingUser.lastLoginAt = new Date().toISOString();
    return {
      success: true,
      user: existingUser,
      token: 'mock-jwt-token',
      message: '기존 사용자 로그인 성공'
    };
  } else {
    // 새 사용자 생성
    const newUser: WalletUser = {
      walletAddress,
      username,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };
    mockUsers.push(newUser);
    
    return {
      success: true,
      user: newUser,
      token: 'mock-jwt-token',
      message: '새 사용자 생성 성공'
    };
  }
};

const mockGetUserByWallet = async (walletAddress: string): Promise<WalletUser | null> => {
  const user = mockUsers.find(user => 
    'walletAddress' in user && user.walletAddress === walletAddress
  ) as WalletUser | undefined;
  
  return user || null;
};

const mockLoginWithEmail = async (email: string, password: string): Promise<LoginResponse> => {
  const user = mockUsers.find(user => 
    'email' in user && user.email === email
  ) as EmailUser | undefined;

  if (user) {
    user.lastLoginAt = new Date().toISOString();
    return {
      success: true,
      user,
      token: 'mock-jwt-token',
      message: '이메일 로그인 성공'
    };
  } else {
    throw new Error('사용자를 찾을 수 없습니다.');
  }
};

const mockSignupWithEmail = async (email: string, password: string, username?: string): Promise<SignupResponse> => {
  // 이메일 중복 확인
  const existingUser = mockUsers.find(user => 
    'email' in user && user.email === email
  );

  if (existingUser) {
    throw new Error('이미 존재하는 이메일입니다.');
  }

  // 새 사용자 생성
  const newUser: EmailUser = {
    email,
    username,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  };
  mockUsers.push(newUser);

  return {
    success: true,
    user: newUser,
    message: '회원가입 성공'
  };
};

// API 헬퍼 함수
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API 요청 실패');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// 지갑 연결 및 계정 생성/로그인
export const connectWallet = async (walletAddress: string, username?: string): Promise<LoginResponse> => {
  if (USE_MOCK) {
    // 개발 중 지연 효과 추가
    await new Promise(resolve => setTimeout(resolve, 1000));
    return mockConnectWallet(walletAddress, username);
  }
  
  return apiRequest('/auth/wallet/connect', {
    method: 'POST',
    body: JSON.stringify({
      walletAddress,
      username,
    }),
  });
};

// 지갑 주소로 사용자 조회
export const getUserByWallet = async (walletAddress: string): Promise<WalletUser | null> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockGetUserByWallet(walletAddress);
  }
  
  try {
    const response = await apiRequest(`/auth/wallet/${walletAddress}`);
    return response.user;
  } catch (error) {
    return null; // 사용자가 존재하지 않는 경우
  }
};

// 이메일 로그인
export const loginWithEmail = async (email: string, password: string): Promise<LoginResponse> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return mockLoginWithEmail(email, password);
  }
  
  return apiRequest('/auth/email/login', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
    }),
  });
};

// 이메일 회원가입
export const signupWithEmail = async (email: string, password: string, username?: string): Promise<SignupResponse> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return mockSignupWithEmail(email, password, username);
  }
  
  return apiRequest('/auth/email/signup', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      username,
    }),
  });
};

// 사용자 정보 업데이트
export const updateUserProfile = async (userId: string, updates: Partial<WalletUser | EmailUser>): Promise<WalletUser | EmailUser> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 500));
    // 모의 구현은 생략
    throw new Error('모의 환경에서는 지원하지 않습니다.');
  }
  
  return apiRequest(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
};

// 로그아웃
export const logout = async (): Promise<void> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return;
  }
  
  return apiRequest('/auth/logout', {
    method: 'POST',
  });
};

// 토큰 검증
export const verifyToken = async (token: string): Promise<boolean> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return token === 'mock-jwt-token';
  }
  
  try {
    await apiRequest('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    return true;
  } catch (error) {
    return false;
  }
}; 