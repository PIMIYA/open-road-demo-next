import React, { createContext, useEffect, useState, useContext } from 'react';
import { useRouter } from 'next/router';

export const GlobalContext = createContext();

function isMobileDevice() {
  const regex = /Mobi|Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  return regex.test(navigator.userAgent);
}

export const GlobalProvider = ({ children }) => {
  const router = useRouter();

  const [isMobile, setIsMobile] = useState(false);
  const [isLanded, setIsLanded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [keyVisualImgUrl, setKeyVisualImgUrl] = useState(false);

  useEffect(() => {
    if (router.pathname !== '/') {
      setIsLanded(true);
    }

    const handleMouseMove = (event) => {
      const { clientX, clientY } = event;
      setMousePosition({ x: clientX, y: clientY });
    };

    if (isMobileDevice()) {
      setIsMobile(true);
      setIsLanded(true);
    }

    document.body.addEventListener('mousemove', handleMouseMove);
  }, [router.pathname]);

  return (
    <GlobalContext.Provider value={{
      isLanded,
      setIsLanded,
      mousePosition,
      setMousePosition,
      keyVisualImgUrl,
      setKeyVisualImgUrl,
      isMobile,
    }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => useContext(GlobalContext);
