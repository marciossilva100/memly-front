// src/components/ConnectionStatus.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useConnection } from '../context/ConnectionContext';

export default function ConnectionStatus() {
  const { t } = useTranslation();
  const { isOnline, connectionType } = useConnection();
  const [showSlowConnection, setShowSlowConnection] = useState(false);
  const [lastPing, setLastPing] = useState(Date.now());

  useEffect(() => {
    // Verifica latência periodicamente
    const checkLatency = async () => {
      if (isOnline) {
        const start = Date.now();
        try {
          await fetch('/favicon.ico', { 
            method: 'HEAD',
            cache: 'no-store'
          });
          const latency = Date.now() - start;
          setShowSlowConnection(latency > 2000); // Conexão lenta se > 2 segundos
        } catch {
          // Ignora erros
        }
        setLastPing(Date.now());
      }
    };

    const interval = setInterval(checkLatency, 10000); // Verifica a cada 10 segundos
    return () => clearInterval(interval);
  }, [isOnline]);

  if (isOnline && !showSlowConnection) return null;

  return (
    <div className={`
      fixed top-0 left-0 right-0 z-50 p-2 text-center text-sm font-medium transition-all duration-300
      ${!isOnline 
        ? 'bg-red-500 text-white' 
        : 'bg-yellow-500 text-black'}
    `}>
      {!isOnline ? (
        <div className="flex items-center justify-center gap-2">
          <span>📡</span>
          <span>{t("offline_message")}</span>
          <button
            onClick={() => window.location.reload()}
            className="ml-2 px-2 py-1 bg-white text-red-500 rounded text-xs hover:bg-red-100"
          >
            {t("try_again")}
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2">
          <span>🐌</span>
          <span>{t("slow_connection_message")}</span>
        </div>
      )}
    </div>
  );
}