import multiavatar from '@multiavatar/multiavatar/esm';

export interface NftData {
  tokenId: string;
  name: string;
  description: string;
  image: string;
  svgCode: string;
  collectiveName: string;
  collectiveId: string;
  attributes: Array<{trait_type: string; value: string}>;
}

// 12자리 인증코드 생성 함수 (숫자+영문 조합)
export const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// 토큰 ID를 기반으로 일관된 NFT 데이터 생성
export const generateNftFromTokenId = (
  tokenId: string, 
  collectiveName: string = 'Collective', 
  collectiveId: string = 'default-collective'
): NftData => {
  // 토큰 ID에서 시드 추출
  const parts = tokenId.split('-');
  const timestamp = parts[0];
  const randomPart = parts[1];
  
  // 토큰 ID를 기반으로 일관된 시드 생성
  const seedNumber = parseInt(timestamp.slice(-6) + randomPart.padStart(4, '0'), 10);
  
  // 고정된 배열들
  const colors = ['Crimson', 'Azure', 'Golden', 'Emerald', 'Violet', 'Silver'];
  const patterns = ['Geometric', 'Abstract', 'Floral', 'Cosmic', 'Minimal', 'Ornate'];
  const rarities = ['Common', 'Rare', 'Epic', 'Legendary'];
  const backgrounds = ['Gradient', 'Solid', 'Textured', 'Holographic'];
  
  // 시드 기반 일관된 속성 생성
  const color = colors[seedNumber % colors.length];
  const pattern = patterns[(seedNumber + 1) % patterns.length];
  const rarity = rarities[(seedNumber + 2) % rarities.length];
  const background = backgrounds[(seedNumber + 3) % backgrounds.length];
  
  // 토큰 ID 기반 아바타 시드 생성 (항상 동일한 결과)
  const avatarSeed = `${timestamp.slice(-4)}${randomPart}`.padEnd(12, '0');
  
  // multiavatar로 SVG 생성
  const svgCode = multiavatar(avatarSeed);
  
  // SVG를 데이터 URL로 변환
  const svgDataUrl = `data:image/svg+xml;base64,${btoa(svgCode)}`;
  
  return {
    tokenId,
    name: `${collectiveName} Invitation #${tokenId.slice(-4)}`,
    description: `Exclusive invitation to join the ${collectiveName} private collective. This NFT grants access to our community.`,
    image: svgDataUrl,
    svgCode: svgCode,
    collectiveName,
    collectiveId,
    attributes: [
      { trait_type: 'Color', value: color },
      { trait_type: 'Pattern', value: pattern },
      { trait_type: 'Rarity', value: rarity },
      { trait_type: 'Background', value: background },
      { trait_type: 'Collective', value: collectiveName },
      { trait_type: 'Avatar Seed', value: avatarSeed },
      { trait_type: 'Generated', value: new Date().toISOString().split('T')[0] }
    ]
  };
};

// 새로운 NFT 생성 (토큰 ID도 함께 생성)
export const createNewNft = (collectiveName: string = 'Collective', collectiveId: string = 'default-collective'): NftData => {
  // 토큰 ID 생성 (현재 시간 + 랜덤)
  const tokenId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  
  // 생성된 토큰 ID로 NFT 데이터 생성
  return generateNftFromTokenId(tokenId, collectiveName, collectiveId);
}; 