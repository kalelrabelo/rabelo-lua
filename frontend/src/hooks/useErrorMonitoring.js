import { useEffect, useRef } from 'react';
import errorLogger from '../services/errorLogger';

// Hook personalizado para monitoramento de erros em componentes
export const useErrorMonitoring = (componentName, data = null, isLoading = false) => {
  const hasLoggedEmptyData = useRef(false);
  const mountTime = useRef(Date.now());

  useEffect(() => {
    // Resetar flag quando dados mudam
    if (data !== null) {
      hasLoggedEmptyData.current = false;
    }
  }, [data]);

  useEffect(() => {
    // Verificar se o componente não está carregando dados após um tempo razoável
    const checkDataTimeout = setTimeout(() => {
      if (!isLoading && !data && !hasLoggedEmptyData.current) {
        errorLogger.checkMenuDataLoading(componentName, !!data, isLoading);
        hasLoggedEmptyData.current = true;
      }
    }, 3000); // Aguardar 3 segundos

    return () => clearTimeout(checkDataTimeout);
  }, [componentName, data, isLoading]);

  // Função para logar erros específicos do componente
  const logComponentError = (message, additionalData = {}) => {
    errorLogger.logCustomError('javascript', message, componentName, additionalData);
  };

  // Função para logar avisos do componente
  const logComponentWarning = (message, additionalData = {}) => {
    errorLogger.logCustomError('warning', message, componentName, additionalData);
  };

  return {
    logComponentError,
    logComponentWarning
  };
};

// Hook para monitoramento de performance de componentes
export const usePerformanceMonitoring = (componentName) => {
  const renderCount = useRef(0);
  const mountTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    
    // Alertar sobre muitos re-renders
    if (renderCount.current > 10) {
      errorLogger.logCustomError(
        'warning',
        `Componente ${componentName} renderizou ${renderCount.current} vezes. Possível problema de performance.`,
        componentName,
        { renderCount: renderCount.current }
      );
    }
  });

  useEffect(() => {
    // Monitorar tempo de montagem
    const mountDuration = Date.now() - mountTime.current;
    if (mountDuration > 2000) {
      errorLogger.logCustomError(
        'warning',
        `Componente ${componentName} demorou ${mountDuration}ms para montar. Possível problema de performance.`,
        componentName,
        { mountDuration }
      );
    }
  }, [componentName]);

  return {
    renderCount: renderCount.current
  };
};

// Hook para capturar erros de boundary
export const useErrorBoundary = (componentName) => {
  const logError = (error, errorInfo) => {
    errorLogger.logCustomError(
      'javascript',
      `Error Boundary capturou erro em ${componentName}: ${error.message}`,
      componentName,
      {
        error: error.toString(),
        errorInfo: errorInfo?.componentStack,
        stack: error.stack
      }
    );
  };

  return { logError };
};
