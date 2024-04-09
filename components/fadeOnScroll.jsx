import React, { useEffect, useState, useRef } from 'react';
import Box from '@mui/material/Box';

function FadeOnScroll(props) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (props.onceonly) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        } else {
          setIsVisible(entry.isIntersecting);
        }
      },
      {
        root: null,  // 使用瀏覽器視窗作為視口
        rootMargin: '0px',
        threshold: 0.1  // 元件有 10% 進入視口時觸發
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return (
    <Box ref={ref} sx={{
      opacity: isVisible ? 1 : 0,  // Control opacity
      transform: isVisible ? 'translateY(0)' : 'translateY(50px)',  // Control translateY
      transition: 'opacity 1000ms, transform 1000ms'  // Add transitions for both properties
    }}>
      {props.children}
    </Box>
  );
}

export default FadeOnScroll;
