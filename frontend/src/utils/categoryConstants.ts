// 카테고리 상수 정의
export const CATEGORY_COLOR_MAP = {
  art: { name: '🎨 Art', color: '#EF4444' },
  tech: { name: '💻 Tech', color: '#3B82F6' },
  education: { name: '📚 Education', color: '#10B981' },
  music: { name: '🎵 Music', color: '#FACC15' },
  project: { name: '🛠 Project', color: '#FB923C' },
  experimental: { name: '🧪 Experimental', color: '#8B5CF6' }
} as const;

export type CategoryType = keyof typeof CATEGORY_COLOR_MAP;

// 기존 카테고리 매핑 (CollectivesSearch에서 사용)
export const LEGACY_CATEGORY_MAP = {
  finance: 'tech',
  technology: 'tech',
  gaming: 'tech',
  glass: 'tech',
  environment: 'project',
  music: 'music',
  health: 'education',
  art: 'art',
  education: 'education'
} as const; 