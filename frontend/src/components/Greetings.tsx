import React, { useEffect, useState, useRef } from "react";
import "../styles/Greetings.css";

// 한국어 인삿말
const koreanGreeting = { text: "안녕하세요, 글래스 컬렉티브!", font: "'Noto Sans KR', 'Nanum Gothic', Arial, sans-serif" };

// 기타 언어 인삿말
const otherGreetings = [
  { text: "Hello, Glass Collective!", font: "Montserrat, Arial, sans-serif" },
  { text: "¡Hola, Glass Collective!", font: "Montserrat, Arial, sans-serif" },
  { text: "Bonjour, Glass Collective!", font: "Montserrat, Arial, sans-serif" },
  { text: "こんにちは、グラス・コレクティブ！", font: "'Noto Sans JP', 'Kosugi Maru', Arial, sans-serif" },
  { text: "你好，玻璃集体！", font: "'Noto Sans SC', 'ZCOOL XiaoWei', Arial, sans-serif" },
  { text: "Привет, Гласс Коллектив!", font: "'PT Sans', 'Noto Sans', Arial, sans-serif" },
  { text: "مرحبًا، جلاس كولكتيف!", font: "'Noto Naskh Arabic', 'Amiri', Arial, sans-serif" },
  { text: "नमस्ते, ग्लास कलेक्टिव!", font: "'Noto Sans Devanagari', Arial, sans-serif" },
  { text: "สวัสดี กลาสคอลเลกทีฟ!", font: "'Noto Sans Thai', Arial, sans-serif" },
  { text: "Xin chào, Glass Collective!", font: "'Be Vietnam Pro', Arial, sans-serif" },
];

// greetings 배열을 '다른 언어 3개 → 한국어' 순서로 반복적으로 생성
const greetings: { text: string; font: string }[] = [];
for (let i = 0, j = 0; i < otherGreetings.length; i += 3) {
  greetings.push(otherGreetings[i % otherGreetings.length]);
  greetings.push(otherGreetings[(i + 1) % otherGreetings.length]);
  greetings.push(otherGreetings[(i + 2) % otherGreetings.length]);
  greetings.push(koreanGreeting);
}

const randomChar = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=~<>?";
  return chars[Math.floor(Math.random() * chars.length)];
};

const morphDuration = 300; // ms (애니메이션 전체 길이)
const morphSteps = 6;
const displayDuration = 700; // ms (고정된 문장 보여주는 시간)

const Greetings = () => {
  const [idx, setIdx] = useState(0);
  const [display, setDisplay] = useState(greetings[0].text);
  const [font, setFont] = useState(greetings[0].font);
  const [isMorphing, setIsMorphing] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let isCancelled = false;
    let step = 0;
    let prev = greetings[idx].text;
    let next = greetings[(idx + 1) % greetings.length].text;
    let nextFont = greetings[(idx + 1) % greetings.length].font;

    const morph = () => {
      setIsMorphing(true);
      step = 0;
      const maxLen = Math.max(prev.length, next.length);
      const morphInterval = setInterval(() => {
        if (isCancelled) return clearInterval(morphInterval);
        let str = "";
        for (let i = 0; i < maxLen; i++) {
          if (step < morphSteps - 2) {
            // 랜덤 문자로 채우기
            if (i < next.length) {
              str += randomChar();
            }
          } else {
            // 점차 목표 문장으로 맞추기
            if (i < next.length) {
              if (i < prev.length && prev[i] === next[i]) {
                str += next[i];
              } else {
                str += next[i];
              }
            }
          }
        }
        setDisplay(str);
        setFont(nextFont);
        step++;
        if (step >= morphSteps) {
          clearInterval(morphInterval);
          setDisplay(next);
          setFont(nextFont);
          setIsMorphing(false);
          // 다음 문장으로 넘어가기
          timeoutRef.current = setTimeout(() => {
            setIdx((prevIdx) => (prevIdx + 1) % greetings.length);
          }, displayDuration);
        }
      }, morphDuration / morphSteps);
    };

    // 문장 고정 시간 후 morph 시작
    if (!isMorphing) {
      timeoutRef.current = setTimeout(morph, displayDuration);
    }

    return () => {
      isCancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line
  }, [idx]);

  return (
    <div className="greetings">
      <span className="greetings__word" style={{ fontFamily: font }}>{display}</span>
    </div>
  );
};

export default Greetings; 