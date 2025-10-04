/**
 * Utilitários de áudio robustos para reprodução de base64
 * Garante que o áudio seja totalmente carregado antes da reprodução
 */

/**
 * Reproduz áudio a partir de dados base64 MP3 com buffer completo
 * @param {string} base64Data - Dados de áudio em base64 (MP3)
 * @param {function} onStart - Callback chamado quando áudio inicia (opcional)
 * @param {function} onEnd - Callback chamado quando áudio termina (opcional)
 * @param {function} onError - Callback chamado em caso de erro (opcional)
 * @returns {Promise} - Promise que resolve quando áudio termina ou rejeita em erro
 */
export const playAudioFromBase64 = (base64Data, onStart = null, onEnd = null, onError = null) => {
  return new Promise((resolve, reject) => {
    try {
      if (!base64Data) {
        const error = new Error('Dados de áudio base64 não fornecidos');
        if (onError) onError(error);
        reject(error);
        return;
      }

      // Criar Blob do áudio MP3 a partir dos dados base64
      const audioBlob = new Blob(
        [Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))],
        { type: 'audio/mpeg' }  // MIME type correto para MP3
      );

      // Criar URL do objeto
      const audioUrl = URL.createObjectURL(audioBlob);

      // Criar elemento de áudio
      const audio = new Audio(audioUrl);
      
      // Configurações de áudio otimizadas para estabilidade
      audio.volume = 0.8;
      audio.preload = 'auto';
      audio.crossOrigin = 'anonymous'; // Evitar problemas de CORS
      
      // Configurações para evitar interrupções
      if (audio.preservesPitch !== undefined) {
        audio.preservesPitch = true;
      }
      if (audio.mozPreservesPitch !== undefined) {
        audio.mozPreservesPitch = true;
      }
      if (audio.webkitPreservesPitch !== undefined) {
        audio.webkitPreservesPitch = true;
      }

      // Flag para evitar múltiplas chamadas
      let hasEnded = false;

      // Função para limpar recursos
      const cleanup = () => {
        URL.revokeObjectURL(audioUrl);
      };

      // Aguardar carregamento completo antes de reproduzir
      audio.addEventListener('canplaythrough', () => {
        console.log('✅ Áudio totalmente carregado, iniciando reprodução');
        
        // Aguardar um pequeno delay para garantir buffer completo
        setTimeout(() => {
          audio.play()
            .then(() => {
              console.log('🎵 Reprodução de áudio iniciada com sucesso');
              if (onStart) onStart();
            })
            .catch((playError) => {
              console.error('❌ Erro ao iniciar reprodução:', playError);
              cleanup();
              if (onError) onError(playError);
              reject(playError);
            });
        }, 100); // 100ms para garantir buffer estável
      });

      // Evento de fim da reprodução
      audio.addEventListener('ended', () => {
        if (hasEnded) return;
        hasEnded = true;
        
        console.log('✅ Reprodução de áudio finalizada');
        cleanup();
        if (onEnd) onEnd();
        resolve();
      });

      // Evento de erro durante carregamento ou reprodução
      audio.addEventListener('error', (event) => {
        if (hasEnded) return;
        hasEnded = true;
        
        const error = new Error(`Erro no áudio: ${audio.error?.message || 'Erro desconhecido'}`);
        console.error('❌ Erro no elemento de áudio:', error);
        cleanup();
        if (onError) onError(error);
        reject(error);
      });

      // Evento de carregamento suspenso (normal em alguns navegadores)
      audio.addEventListener('suspend', () => {
        // Removido warning desnecessário - suspend é normal
        console.log('⏸️ Buffer de áudio otimizado');
      });

      // Evento de dados insuficientes (buffer vazio)
      audio.addEventListener('waiting', () => {
        console.log('⏳ Aguardando buffer de áudio...');
      });

      // Iniciar carregamento
      console.log('📥 Iniciando carregamento de áudio...');
      audio.load();

    } catch (error) {
      console.error('❌ Erro ao processar áudio base64:', error);
      if (onError) onError(error);
      reject(error);
    }
  });
};

/**
 * Função simplificada para reproduzir áudio com callbacks opcionais
 * @param {string} base64Data - Dados de áudio em base64
 * @param {Object} callbacks - Objeto com callbacks opcionais {onStart, onEnd, onError}
 * @returns {Promise}
 */
export const playAudio = (base64Data, callbacks = {}) => {
  return playAudioFromBase64(
    base64Data,
    callbacks.onStart,
    callbacks.onEnd,
    callbacks.onError
  );
};

/**
 * Utilitário para parar áudio em reprodução
 * (Para futuras extensões do sistema)
 */
export class AudioController {
  constructor() {
    this.currentAudio = null;
  }

  async play(base64Data, callbacks = {}) {
    // Parar áudio atual se existir
    this.stop();

    try {
      await playAudioFromBase64(
        base64Data,
        callbacks.onStart,
        () => {
          this.currentAudio = null;
          if (callbacks.onEnd) callbacks.onEnd();
        },
        (error) => {
          this.currentAudio = null;
          if (callbacks.onError) callbacks.onError(error);
        }
      );
    } catch (error) {
      this.currentAudio = null;
      throw error;
    }
  }

  stop() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (error) {
        console.warn('⚠️ Erro ao parar áudio:', error);
      }
      this.currentAudio = null;
    }
  }

  isPlaying() {
    return this.currentAudio && !this.currentAudio.paused;
  }
}

export default {
  playAudio,
  playAudioFromBase64,
  AudioController
};