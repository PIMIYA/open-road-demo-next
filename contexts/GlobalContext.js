import React, { createContext, useEffect, useState, useContext } from 'react';
import { useRouter } from 'next/router';

export const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
  const router = useRouter();

  const [isLanded, setIsLanded] = useState(false);

  useEffect(() => {
    if (router.pathname !== '/') {
      setIsLanded(true);
    }
  }, [router.pathname]);

  return (
    <GlobalContext.Provider value={{ isLanded, setIsLanded }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => useContext(GlobalContext);
