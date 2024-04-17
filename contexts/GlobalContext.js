import React, { createContext, useState, useContext } from 'react';

export const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
  const [isLanded, setIsLanded] = useState(false);

  const updateIsLanded = () => {
    setIsLanded(true);
  };

  return (
    <GlobalContext.Provider value={{ isLanded, updateIsLanded }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => useContext(GlobalContext);
