import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { CATEGORY_COLOR_MAP, type CategoryType } from '../utils/categoryConstants';

interface ArcColorChipsProps {
  selectedCategory: CategoryType | null;
  onCategorySelect: (category: CategoryType | null) => void;
}

const ArcColorChips: React.FC<ArcColorChipsProps> = ({ 
  selectedCategory, 
  onCategorySelect 
}) => {
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const categories = Object.entries(CATEGORY_COLOR_MAP);
  const totalCategories = categories.length;
  
  // 각 카테고리의 위치 계산 (반원형 호)
  const getCategoryPosition = (index: number, currentRotation: number) => {
    const angleStep = 120 / (totalCategories - 1); // 120도 호를 totalCategories-1로 나눔
    const baseAngle = -60 + (index * angleStep); // -60도에서 시작
    const currentAngle = baseAngle + currentRotation;
    
    // 호의 반지름
    const radius = 180;
    
    // 2D 위치 계산 (3D 대신 2D로 단순화)
    const x = Math.sin((currentAngle * Math.PI) / 180) * radius;
    const y = Math.cos((currentAngle * Math.PI) / 180) * radius * 0.3; // Y축 압축
    
    // 스케일 계산 (중앙에 가까울수록 크게)
    const distanceFromCenter = Math.abs(currentAngle);
    const scale = Math.max(0.7, 1 - (distanceFromCenter / 60) * 0.3);
    
    // z-index 계산 (중앙에 가까울수록 높게)
    const zIndex = Math.max(1, 10 - Math.abs(distanceFromCenter / 10));
    
    return { x, y, scale, zIndex, angle: currentAngle };
  };

  // 드래그 핸들러
  const handleDrag = (event: any, info: PanInfo) => {
    const newRotation = rotation + info.delta.x * 0.5;
    setRotation(newRotation);
  };

  // 휠 스크롤 핸들러
  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    const delta = event.deltaX || event.deltaY;
    const newRotation = rotation + delta * 0.3;
    setRotation(newRotation);
  };

  // 카테고리 클릭 핸들러
  const handleCategoryClick = (category: CategoryType) => {
    const newSelected = selectedCategory === category ? null : category;
    onCategorySelect(newSelected);
  };

  // 자동 회전 (선택사항 - 사용자가 상호작용하지 않을 때만)
  useEffect(() => {
    if (!isDragging && !selectedCategory) {
      const interval = setInterval(() => {
        setRotation(prev => prev + 0.2);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isDragging, selectedCategory]);

  return (
    <div 
      ref={containerRef}
      className="arc-color-chips-container"
      onWheel={handleWheel}
    >
      <div className="arc-chips-wrapper">
        {categories.map(([key, { name, color }], index) => {
          const position = getCategoryPosition(index, rotation);
          
          return (
            <motion.div
              key={key}
              className={`arc-chip ${selectedCategory === key ? 'selected' : ''}`}
              style={{
                backgroundColor: color,
                x: position.x,
                y: position.y,
                scale: position.scale,
                zIndex: position.zIndex,
              }}
              whileHover={{ 
                scale: position.scale * 1.1,
                y: position.y - 10,
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: position.scale * 0.95 }}
              onClick={() => handleCategoryClick(key as CategoryType)}
              drag="x"
              dragConstraints={{ left: -50, right: 50 }}
              dragElastic={0.1}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={() => setIsDragging(false)}
              onDrag={handleDrag}
              dragMomentum={false}
            >
              <div className="chip-content">
                <span className="chip-icon">{name.split(' ')[0]}</span>
                <span className="chip-name">{name.split(' ')[1]}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* 중앙 포인터 */}
      <div className="center-pointer" />
      
      {/* 필터 해제 버튼 */}
      {selectedCategory && (
        <motion.button
          className="clear-filter-btn"
          onClick={() => onCategorySelect(null)}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Clear Filter
        </motion.button>
      )}
    </div>
  );
};

export default ArcColorChips; 