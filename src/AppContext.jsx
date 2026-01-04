import React, { createContext, useContext, useState, useEffect } from 'react';
import { ollama } from './services/OllamaService';
import { VectorService } from './services/VectorService';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [vectorService, setVectorService] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initServices = async () => {
      try {
        const service = await VectorService.init();
        setVectorService(service);
      } catch (error) {
        console.error("Failed to initialize VectorService:", error);
      } finally {
        setIsInitializing(false);
      }
    };

    initServices();
  }, []);

  return (
    <AppContext.Provider value={{ vectorService, ollama, isInitializing }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
