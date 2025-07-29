import React, { useEffect, useRef, useState } from 'react';

interface ScrollSnapProps {
  children: React.ReactNode;
  sections: string[];
  onSectionChange?: (sectionId: string) => void;
  onScrollProgress?: (progress: number) => void;
  snapThreshold?: number;
  scrollDelay?: number;
}

const ScrollSnap: React.FC<ScrollSnapProps> = ({
  children,
  sections,
  onSectionChange,
  onScrollProgress,
  snapThreshold = 0.5,
  scrollDelay = 1000
}) => {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 스크롤을 특정 섹션으로 이동하는 함수
  const scrollToSection = (sectionId: string, index: number) => {
    if (isScrolling) return;
    
    setIsScrolling(true);
    const element = document.getElementById(sectionId);
    
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      
      setCurrentSectionIndex(index);
      onSectionChange?.(sectionId);
      
      // 스크롤 완료 후 딜레이 해제 (마지막 섹션에서는 더 짧게)
      const delay = index === sections.length - 1 ? scrollDelay * 0.4 : scrollDelay;
      setTimeout(() => {
        setIsScrolling(false);
      }, delay);
    }
  };

  // 다음 섹션으로 이동
  const goToNextSection = () => {
    if (currentSectionIndex < sections.length - 1) {
      const nextIndex = currentSectionIndex + 1;
      scrollToSection(sections[nextIndex], nextIndex);
    }
    // 마지막 섹션에서는 더 이상 스크롤하지 않음
  };

  // 이전 섹션으로 이동
  const goToPrevSection = () => {
    if (currentSectionIndex > 0) {
      const prevIndex = currentSectionIndex - 1;
      scrollToSection(sections[prevIndex], prevIndex);
    }
    // 첫 번째 섹션에서는 더 이상 스크롤하지 않음
  };

  // 키보드 이벤트 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isScrolling) return;
      
      switch (e.key) {
        case 'ArrowDown':
        case 'PageDown':
          e.preventDefault();
          if (currentSectionIndex < sections.length - 1) {
            goToNextSection();
          }
          break;
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          if (currentSectionIndex > 0) {
            goToPrevSection();
          }
          break;
        case 'Home':
          e.preventDefault();
          scrollToSection(sections[0], 0);
          break;
        case 'End':
          e.preventDefault();
          scrollToSection(sections[sections.length - 1], sections.length - 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSectionIndex, isScrolling, sections]);

  // 마우스 휠 이벤트 처리
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (isScrolling) {
        e.preventDefault();
        return;
      }

      // 스크롤 방향 감지
      const delta = e.deltaY;
      const threshold = 25; // 휠 스크롤 임계값을 더 낮춤

      if (Math.abs(delta) > threshold) {
        e.preventDefault();
        
        if (delta > 0) {
          // 아래로 스크롤 - 마지막 섹션이 아닐 때만
          if (currentSectionIndex < sections.length - 1) {
            goToNextSection();
          }
        } else {
          // 위로 스크롤 - 첫 번째 섹션이 아닐 때만
          if (currentSectionIndex > 0) {
            goToPrevSection();
          }
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, [currentSectionIndex, isScrolling, sections]);

  // 스크롤 위치에 따른 섹션 감지
  useEffect(() => {
    const handleScroll = () => {
      if (isScrolling) return;

      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // 스크롤 진행도 계산
      const scrollableHeight = documentHeight - windowHeight;
      const progress = scrollableHeight > 0 ? (scrollPosition / scrollableHeight) * 100 : 0;
      onScrollProgress?.(Math.min(progress, 100));

      // 현재 스크롤 위치에 해당하는 섹션 찾기
      for (let i = 0; i < sections.length; i++) {
        const element = document.getElementById(sections[i]);
        if (element) {
          const rect = element.getBoundingClientRect();
          const elementTop = rect.top + scrollPosition;
          const elementBottom = elementTop + rect.height;

          // 마지막 섹션인 경우 특별 처리
          if (i === sections.length - 1) {
            // 마지막 섹션에서는 스크롤이 하단에 가까우면 해당 섹션으로 인식
            if (scrollPosition + windowHeight >= documentHeight - windowHeight * 0.1) {
              if (currentSectionIndex !== i) {
                setCurrentSectionIndex(i);
                onSectionChange?.(sections[i]);
              }
              break;
            }
          }

          // 일반적인 섹션 감지
          if (scrollPosition >= elementTop - windowHeight * 0.1 &&
              scrollPosition < elementBottom - windowHeight * 0.1) {
            if (currentSectionIndex !== i) {
              setCurrentSectionIndex(i);
              onSectionChange?.(sections[i]);
            }
            break;
          }
        }
      }
    };

    // 스크롤 이벤트에 디바운스 적용
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(handleScroll, 100);

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [currentSectionIndex, isScrolling, sections, snapThreshold, onSectionChange]);

  return (
    <div ref={containerRef} className="scroll-snap-container">
      {children}
    </div>
  );
};

export default ScrollSnap; 