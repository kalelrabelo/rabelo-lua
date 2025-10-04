// Serviço para captura e logging de erros
class ErrorLoggerService {
  constructor() {
    this.setupGlobalErrorHandlers();
  }

  // Configurar capturadores globais de erro
  setupGlobalErrorHandlers() {
    // Capturar erros JavaScript não tratados
    window.addEventListener('error', (event) => {
      this.logError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        component: this.getCurrentComponent()
      });
    });

    // Capturar promises rejeitadas não tratadas
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        type: 'javascript',
        message: `Promise rejeitada: ${event.reason}`,
        stack: event.reason?.stack,
        component: this.getCurrentComponent()
      });
    });

    // Capturar erros do React (através de Error Boundaries)
    this.setupReactErrorHandler();
  }

  // Configurar manipulador de erros do React
  setupReactErrorHandler() {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Verificar se é um erro do React
      const errorMessage = args.join(' ');
      if (errorMessage.includes('React') || errorMessage.includes('Warning:')) {
        this.logError({
          type: 'warning',
          message: errorMessage,
          component: this.getCurrentComponent()
        });
      }
      originalConsoleError.apply(console, args);
    };
  }

  // Obter o componente atual baseado na URL
  getCurrentComponent() {
    const path = window.location.pathname;
    const hash = window.location.hash;
    
    if (hash) {
      return `Componente: ${hash.replace('#', '')}`;
    }
    
    if (path === '/') {
      return 'Dashboard';
    }
    
    return `Rota: ${path}`;
  }

  // Registrar erro de API
  logApiError(error, url, component) {
    const errorData = {
      type: 'api',
      message: error.message || 'Erro de API desconhecido',
      url: url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      component: component || this.getCurrentComponent(),
      responseData: error.response?.data
    };

    this.logError(errorData);
  }

  // Registrar erro personalizado
  logCustomError(type, message, component, additionalData = {}) {
    this.logError({
      type,
      message,
      component: component || this.getCurrentComponent(),
      ...additionalData
    });
  }

  // Função principal para registrar erros
  logError(errorData) {
    const error = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...errorData
    };

    // Salvar no localStorage
    this.saveErrorToStorage(error);

    // Disparar evento customizado para componentes que estão escutando
    window.dispatchEvent(new CustomEvent('systemError', { detail: error }));

    // Log no console para desenvolvimento
    console.group(`🚨 Sistema de Log de Erros - ${error.type.toUpperCase()}`);
    console.error('Erro capturado:', error);
    console.groupEnd();
  }

  // Salvar erro no localStorage
  saveErrorToStorage(error) {
    try {
      const existingErrors = JSON.parse(localStorage.getItem('systemErrors') || '[]');
      const updatedErrors = [error, ...existingErrors].slice(0, 100); // Manter apenas os últimos 100
      localStorage.setItem('systemErrors', JSON.stringify(updatedErrors));
    } catch (e) {
      console.error('Erro ao salvar log no localStorage:', e);
    }
  }

  // Obter todos os erros salvos
  getStoredErrors() {
    try {
      return JSON.parse(localStorage.getItem('systemErrors') || '[]');
    } catch (e) {
      console.error('Erro ao carregar logs do localStorage:', e);
      return [];
    }
  }

  // Limpar todos os erros
  clearErrors() {
    localStorage.removeItem('systemErrors');
    window.dispatchEvent(new CustomEvent('errorsCleared'));
  }

  // Remover erro específico
  removeError(errorId) {
    try {
      const errors = this.getStoredErrors();
      const filteredErrors = errors.filter(error => error.id !== errorId);
      localStorage.setItem('systemErrors', JSON.stringify(filteredErrors));
      window.dispatchEvent(new CustomEvent('errorRemoved', { detail: errorId }));
    } catch (e) {
      console.error('Erro ao remover log:', e);
    }
  }

  // Verificar se um menu não está carregando dados
  checkMenuDataLoading(menuName, hasData, isLoading) {
    if (!isLoading && !hasData) {
      this.logCustomError(
        'warning',
        `Menu "${menuName}" não está exibindo dados. Possível problema de conectividade ou dados vazios.`,
        menuName,
        { menuName, hasData, isLoading }
      );
    }
  }

  // Monitorar chamadas de API que demoram muito
  monitorApiPerformance(url, startTime, endTime) {
    const duration = endTime - startTime;
    if (duration > 5000) { // Mais de 5 segundos
      this.logCustomError(
        'warning',
        `API lenta detectada: ${url} levou ${duration}ms para responder`,
        'Performance Monitor',
        { url, duration }
      );
    }
  }
}

// Criar instância global
const errorLogger = new ErrorLoggerService();

// Exportar para uso em outros módulos
export default errorLogger;
