import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Sparkles, Brain, Zap, Activity } from 'lucide-react';

const JarvisAI = ({ onCommand }) => {
  const [isListening, setIsListening] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState('Aguardando comando "Lua"...');
  const [particles, setParticles] = useState([]);
  const [pulseAnimation, setPulseAnimation] = useState(false);
  
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Inicializar reconhecimento de voz
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'pt-BR';
      
      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setStatus(isActive ? 'Escutando, senhor...' : 'Aguardando ativação...');
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
        // Sempre reiniciar a escuta para detecção contínua
        setTimeout(() => {
          if (recognitionRef.current && !isListening) {
            startListening();
          }
        }, 200);
      };
      
      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }
        
        const fullTranscript = finalTranscript || interimTranscript;
        setTranscript(fullTranscript);
        
        // Verificar palavra de ativação "Lua" de forma mais flexível
        if ((fullTranscript.toLowerCase().includes('lua') || 
             fullTranscript.toLowerCase().includes('lúa') ||
             fullTranscript.toLowerCase().includes('lia')) && !isActive) {
          activateJarvis();
        }
        
        // Processar comandos se estiver ativo (tanto final quanto interim para melhor responsividade)
        if (isActive && (finalTranscript || (interimTranscript && interimTranscript.length > 3))) {
          const textToProcess = finalTranscript || interimTranscript;
          processCommand(textToProcess);
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Erro no reconhecimento de voz:', event.error);
        setStatus(`Erro: ${event.error}`);
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isActive]);

  // Animação das partículas
  useEffect(() => {
    generateParticles();
    startAnimation();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const generateParticles = () => {
    const newParticles = [];
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 400,
        y: Math.random() * 400,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 2 + 1,
        angle: Math.random() * Math.PI * 2,
        opacity: Math.random() * 0.8 + 0.2,
        color: `hsl(${190 + Math.random() * 40}, 100%, ${50 + Math.random() * 30}%)`
      });
    }
    setParticles(newParticles);
  };

  const startAnimation = () => {
    const animate = () => {
      setParticles(prev => prev.map(particle => ({
        ...particle,
        x: particle.x + Math.cos(particle.angle) * particle.speed,
        y: particle.y + Math.sin(particle.angle) * particle.speed,
        angle: particle.angle + 0.02,
        opacity: particle.opacity * 0.995
      })).filter(p => p.opacity > 0.1));
      
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Erro ao iniciar reconhecimento:', error);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const activateJarvis = () => {
    setIsActive(true);
    setPulseAnimation(true);
    setStatus('LUA ativada - Pronta para servir');
    speak('Olá senhor. Sou a LUA, sua assistente virtual. Como posso ajudá-lo hoje?');
    
    setTimeout(() => setPulseAnimation(false), 2000);
    
    // Auto-desativar após 45 segundos de inatividade
    setTimeout(() => {
      if (isActive) {
        deactivateJarvis();
      }
    }, 45000);
  };

  const deactivateJarvis = () => {
    setIsActive(false);
    setStatus('Aguardando ativação...');
    speak('Estarei aqui quando precisar, senhor. Até logo.');
    stopListening();
  };

  const speak = (text) => {
    if (audioEnabled && synthRef.current) {
      synthRef.current.cancel(); // Cancelar falas anteriores
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.9; // Velocidade um pouco mais lenta e robótica
      utterance.pitch = 0.8; // Tom mais grave para voz feminina robotizada
      utterance.volume = 0.9;
      
      // Buscar voz feminina se disponível
      const voices = synthRef.current.getVoices();
      const femaleVoice = voices.find(voice => 
        (voice.lang.includes('pt') || voice.lang.includes('PT')) && 
        (voice.name.toLowerCase().includes('female') || 
         voice.name.toLowerCase().includes('woman') || 
         voice.name.toLowerCase().includes('maria') ||
         voice.name.toLowerCase().includes('cristina') ||
         voice.gender === 'female')
      );
      
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      
      // Continuar escutando após falar
      utterance.onend = () => {
        if (isActive && !isListening) {
          setTimeout(() => startListening(), 500);
        }
      };
      
      synthRef.current.speak(utterance);
    }
  };

  const processCommand = (command) => {
    const lowerCommand = command.toLowerCase();
    
    // Comandos de navegação
    if (lowerCommand.includes('dashboard') || lowerCommand.includes('painel')) {
      onCommand('dashboard');
      speak('Claro, senhor. Acessando o painel principal imediatamente.');
    }
    else if (lowerCommand.includes('cliente')) {
      onCommand('clientes');
      speak('Perfeitamente, senhor. Abrindo a gestão de clientes para o senhor.');
    }
    else if (lowerCommand.includes('funcionário') || lowerCommand.includes('funcionario')) {
      onCommand('funcionarios');
      speak('Entendido, senhor. Direcionando para a gestão de funcionários.');
    }
    else if (lowerCommand.includes('joia') || lowerCommand.includes('joias')) {
      onCommand('joias');
      speak('Sim, senhor. Acessando o catálogo de joias agora mesmo.');
    }
    else if (lowerCommand.includes('material') || lowerCommand.includes('materiais')) {
      onCommand('materiais');
      speak('Claro, senhor. Abrindo a gestão de materiais para sua análise.');
    }
    else if (lowerCommand.includes('pedra') || lowerCommand.includes('pedras')) {
      onCommand('pedras');
      speak('Perfeitamente, senhor. Acessando o catálogo de pedras preciosas.');
    }
    else if (lowerCommand.includes('vale') || lowerCommand.includes('vales')) {
      onCommand('vales');
      speak('Entendido, senhor. Abrindo o sistema de vales dos funcionários.');
    }
    else if (lowerCommand.includes('caixa')) {
      onCommand('caixa');
      speak('Sim, senhor. Direcionando para o controle de caixa financeiro.');
    }
    else if (lowerCommand.includes('custo') || lowerCommand.includes('custos')) {
      onCommand('custos');
      speak('Claro, senhor. Acessando a gestão de custos para sua revisão.');
    }
    else if (lowerCommand.includes('estoque')) {
      onCommand('estoque');
      speak('Perfeitamente, senhor. Abrindo o controle de estoque imediatamente.');
    }
    else if (lowerCommand.includes('encomenda')) {
      onCommand('encomendas');
      speak('Entendido, senhor. Direcionando para a gestão de encomendas.');
    }
    else if (lowerCommand.includes('folha') || lowerCommand.includes('pagamento')) {
      onCommand('folha-pagamento');
      speak('Sim, senhor. Acessando a folha de pagamento para sua análise.');
    }
    else if (lowerCommand.includes('sair') || lowerCommand.includes('tchau') || lowerCommand.includes('desativar')) {
      deactivateJarvis();
    }
    else if (lowerCommand.includes('obrigado') || lowerCommand.includes('obrigada')) {
      speak('Sempre às ordens, senhor. Posso ajudá-lo em algo mais?');
      setStatus('Aguardando próximo comando...');
    }
    else {
      speak('Desculpe, senhor. Não compreendi o comando. Poderia repetir de forma mais clara?');
      setStatus('Comando não compreendido - Aguardando...');
    }
    
    setTranscript('');
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Iniciar escuta automática
  useEffect(() => {
    startListening();
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Área de visualização da IA */}
      <div className={`mb-3 transition-all duration-500 ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
        <div className="bg-gray-800/90 backdrop-blur-md border border-blue-500/30 rounded-xl p-3 w-72 shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400' : 'bg-gray-400'} animate-pulse`}></div>
            <span className="text-blue-300 font-semibold text-sm">LUA - Assistente IA</span>
            <div className="ml-auto flex gap-1">
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                {audioEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>
            </div>
          </div>
          
          {/* Status */}
          <div className="text-xs text-gray-300 mb-2">{status}</div>
          
          {/* Transcrição */}
          {transcript && (
            <div className="text-xs text-blue-200 bg-blue-900/30 rounded-lg p-2 mb-2">
              "{transcript}"
            </div>
          )}
          
          {/* Comandos disponíveis */}
          <div className="text-xs text-gray-400">
            <div>Comandos: "dashboard", "clientes", "funcionários", "joias", "materiais", "vales", "estoque"...</div>
            <div className="mt-1">Diga "sair" para desativar</div>
          </div>
        </div>
      </div>

      {/* Orb principal - Menor */}
      <div className="relative">
        {/* Partículas de fundo */}
        <div className="absolute inset-0 w-14 h-14 rounded-full overflow-hidden">
          {particles.map(particle => (
            <div
              key={particle.id}
              className="absolute w-0.5 h-0.5 rounded-full"
              style={{
                left: `${(particle.x / 400) * 100}%`,
                top: `${(particle.y / 400) * 100}%`,
                backgroundColor: particle.color,
                opacity: particle.opacity,
                boxShadow: `0 0 ${particle.size}px ${particle.color}`
              }}
            />
          ))}
        </div>

        {/* Orb principal - Redimensionado */}
        <div 
          className={`
            relative w-14 h-14 rounded-full cursor-pointer transition-all duration-300
            ${isActive 
              ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 shadow-xl shadow-blue-500/50' 
              : 'bg-gradient-to-r from-gray-600 to-gray-700 shadow-md'
            }
            ${pulseAnimation ? 'animate-ping' : ''}
            ${isListening ? 'scale-110 shadow-xl shadow-green-500/50' : 'scale-100'}
            hover:scale-105
          `}
          onClick={toggleListening}
        >
          {/* Anéis de energia */}
          <div className={`absolute inset-0 rounded-full border ${isActive ? 'border-blue-400' : 'border-gray-500'} animate-pulse`}></div>
          <div className={`absolute inset-1 rounded-full border ${isActive ? 'border-purple-400/50' : 'border-gray-600/50'} animate-pulse`} style={{animationDelay: '0.5s'}}></div>
          
          {/* Ícone central */}
          <div className="absolute inset-0 flex items-center justify-center">
            {isListening ? (
              <div className="flex items-center gap-0.5">
                <div className="w-0.5 h-3 bg-white rounded animate-pulse"></div>
                <div className="w-0.5 h-4 bg-white rounded animate-pulse" style={{animationDelay: '0.1s'}}></div>
                <div className="w-0.5 h-2 bg-white rounded animate-pulse" style={{animationDelay: '0.2s'}}></div>
              </div>
            ) : isActive ? (
              <Brain className="w-6 h-6 text-white animate-pulse" />
            ) : (
              <Sparkles className="w-6 h-6 text-gray-300" />
            )}
          </div>
        </div>

        {/* Indicador de estado */}
        <div className="absolute -bottom-1 -right-1">
          {isListening && (
            <div className="w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
          )}
          {isActive && !isListening && (
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          )}
        </div>
      </div>

      {/* Efeitos visuais adicionais - Reduzidos */}
      {isActive && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-24 h-24 -top-5 -left-5 border border-blue-500/20 rounded-full animate-spin" style={{animationDuration: '10s'}}></div>
          <div className="absolute w-20 h-20 -top-3 -left-3 border border-purple-500/20 rounded-full animate-spin" style={{animationDuration: '8s', animationDirection: 'reverse'}}></div>
        </div>
      )}
    </div>
  );
};

export default JarvisAI;