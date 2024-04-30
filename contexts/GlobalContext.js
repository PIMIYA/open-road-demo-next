import React, { createContext, useEffect, useState, useContext } from 'react';
import { useRouter } from 'next/router';

export const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
  const router = useRouter();

  const [isLanded, setIsLanded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (router.pathname !== '/') {
      setIsLanded(true);
    }

    const handleMouseMove = (event) => {
      const { clientX, clientY } = event;
      setMousePosition({ x: clientX, y: clientY });
    };

    document.body.addEventListener('mousemove', handleMouseMove);
  }, [router.pathname]);

  return (
    <GlobalContext.Provider value={{
      isLanded,
      setIsLanded,
      mousePosition,
      setMousePosition,
    }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => useContext(GlobalContext);
