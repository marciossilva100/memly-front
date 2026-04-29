// src/context/ConnectionContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const ConnectionContext = createContext();

export function ConnectionProvider({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState('unknown');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verifica tipo de conexão
    const checkConnection = () => {
      if ('connection' in navigator) {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection) {
          setConnectionType(connection.effectiveType || connection.type);
          
          const handleChange = () => {
            setConnectionType(connection.effectiveType || connection.type);
            // Se for 2G ou slow-2G, trata como conexão lenta
            if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
              console.log('Conexão muito lenta detectada');
            }
          };
          
          connection.addEventListener('change', handleChange);
          return () => connection.removeEventListener('change', handleChange);
        }
      }
    };

    checkConnection();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <ConnectionContext.Provider value={{ isOnline, connectionType }}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  return context;
}