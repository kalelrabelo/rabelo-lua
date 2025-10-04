import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Sparkles, 
  Send, 
  User, 
  Bot, 
  Volume2, 
  VolumeX, 
  Brain,
  Activity,
  Mic,
  MicOff 
} from 'lucide-react'
import axios from 'axios'
import { playAudio } from '../utils/audioUtils'

const IALuaEnhanced = ({ onModalOpen }) => {
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      content: 'Senhor, como posso auxiliá-lo hoje?',
      emotion: 'confident',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [isListening, setIsListening] = useState(false)
  const [consciousness, setConsciousness] = useState(null)
  const [currentAudio, setCurrentAudio] = useState(null)
  
  const scrollRef = useRef(null)
  const audioRef = useRef(null)
  const recognitionRef = useRef(null)

  // Inicializar reconhecimento de voz
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.lang = 'pt-BR'
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
        setIsListening(false)
      }

      recognitionRef.current.onerror = (event) => {
        console.error('Erro no reconhecimento de voz:', event.error)
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }

    // Buscar status de consciência inicial
    fetchConsciousness()

    // Atualizar consciência periodicamente
    const interval = setInterval(fetchConsciousness, 30000) // A cada 30 segundos
    
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const fetchConsciousness = async () => {
    try {
      const response = await axios.get('/api/voice/consciousness')
      if (response.data.success) {
        setConsciousness(response.data.consciousness)
      }
    } catch (error) {
      console.error('Erro ao buscar consciência:', error)
    }
  }

  const playLuaAudio = async (audioBase64) => {
    if (!voiceEnabled || !audioBase64) return

    try {
      await playAudio(audioBase64, {
        onStart: () => {
          console.log('🎤 LUA iniciou a fala no chat');
        },
        onEnd: () => {
          console.log('✅ LUA terminou de falar no chat');
          setCurrentAudio(null);
        },
        onError: (error) => {
          console.error('❌ Erro na reprodução da voz da LUA (chat):', error);
          setCurrentAudio(null);
        }
      });
    } catch (error) {
      console.error('❌ Erro ao processar áudio da LUA:', error);
    }
  }

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Reconhecimento de voz não suportado neste navegador')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const processLuaResponse = (response, consciousness) => {
    // Detectar comandos para abrir modais
    const text = response.toLowerCase()
    
    // Analisar intenção baseada na consciência
    if (consciousness && consciousness.response_type === 'efficient') {
      // Modo eficiente - abrir modais imediatamente
      
      // Vales
      if (text.includes('vale') || text.includes('adiantamento')) {
        if (text.includes('josemir') || text.includes('josé') || text.includes('funcionário')) {
          onModalOpen('vales', { filter: 'Josemir', autoOpen: true })
        } else {
          onModalOpen('vales', { autoOpen: true })
        }
      }
      
      // Funcionários
      if (text.includes('cadastr') && text.includes('funcionário')) {
        onModalOpen('funcionarios', { mode: 'create', autoOpen: true })
      } else if (text.includes('funcionário') || text.includes('colaborador')) {
        onModalOpen('funcionarios', { autoOpen: true })
      }
      
      // Vendas
      if (text.includes('venda') || text.includes('pedido')) {
        if (text.includes('hoje') || text.includes('dia')) {
          const today = new Date().toISOString().split('T')[0]
          onModalOpen('vendas', { date: today, autoOpen: true })
        } else {
          onModalOpen('vendas', { autoOpen: true })
        }
      }
      
      // Clientes
      if (text.includes('cliente')) {
        onModalOpen('clientes', { autoOpen: true })
      }
      
      // Estoque/Produtos
      if (text.includes('estoque') || text.includes('produto')) {
        onModalOpen('estoque', { autoOpen: true })
      }
      
      // Encomendas
      if (text.includes('encomenda')) {
        onModalOpen('encomendas', { autoOpen: true })
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = { 
      type: 'user', 
      content: input,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await axios.post('/api/lua', {
        message: input,
        voice: voiceEnabled,
        context: {
          user: JSON.parse(localStorage.getItem('user') || '{}'),
          timestamp: new Date().toISOString(),
          voiceEnabled: voiceEnabled
        }
      })

      const botMessage = {
        type: 'bot',
        content: response.data.message || 'Desculpe, não entendi sua solicitação.',
        emotion: response.data.consciousness?.emotion || 'neutral',
        thought: response.data.consciousness?.thought_process,
        mood: response.data.consciousness?.mood,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, botMessage])
      
      // Atualizar consciência
      if (response.data.consciousness) {
        setConsciousness(response.data.consciousness)
      }
      
      // Tocar áudio se disponível
      if (response.data.audio && voiceEnabled) {
        await playLuaAudio(response.data.audio)
      }
      
      // Processar resposta para abrir modais relevantes
      processLuaResponse(botMessage.content, response.data.consciousness)
      
    } catch (error) {
      console.error('Erro ao enviar mensagem para Lua:', error)
      setMessages(prev => [...prev, {
        type: 'bot',
        content: 'Desculpe, ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.',
        emotion: 'concerned',
        timestamp: new Date()
      }])
    } finally {
      setLoading(false)
    }
  }

  const getEmotionColor = (emotion) => {
    const colors = {
      confident: 'text-purple-400',
      happy: 'text-green-400',
      curious: 'text-blue-400',
      empathetic: 'text-pink-400',
      playful: 'text-yellow-400',
      sarcastic: 'text-orange-400',
      concerned: 'text-red-400',
      neutral: 'text-gray-400'
    }
    return colors[emotion] || 'text-gray-400'
  }

  const getEmotionIcon = (emotion) => {
    const icons = {
      confident: '😎',
      happy: '😊',
      curious: '🤔',
      empathetic: '🤗',
      playful: '😄',
      sarcastic: '😏',
      concerned: '😟',
      neutral: '😐'
    }
    return icons[emotion] || '🤖'
  }

  return (
    <Card className="h-full flex flex-col bg-gray-900 border-purple-700/30 shadow-2xl">
      <CardHeader className="pb-4 bg-gradient-to-r from-purple-900/50 to-blue-900/50">
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400 animate-pulse" />
            <span className="font-bold">L.U.A</span>
            <span className="text-xs text-gray-400">v3.0</span>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Indicador de consciência */}
            {consciousness && (
              <div className="flex items-center gap-2 text-xs">
                <Brain className={`h-4 w-4 ${getEmotionColor(consciousness.current_emotion)}`} />
                <span className="text-gray-400">
                  {Math.round(consciousness.consciousness_level * 100)}%
                </span>
                <Activity className="h-4 w-4 text-green-400 animate-pulse" />
              </div>
            )}
            
            {/* Toggle de voz */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className="text-gray-400 hover:text-white"
            >
              {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          </div>
        </CardTitle>
        
        {/* Barra de humor */}
        {consciousness && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>Humor: {getEmotionIcon(consciousness.current_emotion)}</span>
              <span>{Math.round((consciousness.mood || 0.5) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div 
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${(consciousness.mood || 0.5) * 100}%` }}
              />
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-4">
        <ScrollArea ref={scrollRef} className="flex-1 pr-4 mb-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex items-start gap-2 max-w-[80%] ${
                    message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`p-2 rounded-full ${
                      message.type === 'user'
                        ? 'bg-gradient-to-br from-purple-500 to-blue-500'
                        : 'bg-gradient-to-br from-gray-700 to-gray-800'
                    }`}
                  >
                    {message.type === 'user' ? (
                      <User className="h-4 w-4 text-white" />
                    ) : (
                      <Bot className={`h-4 w-4 ${getEmotionColor(message.emotion)}`} />
                    )}
                  </div>
                  <div>
                    <div
                      className={`px-4 py-2 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white'
                          : 'bg-gradient-to-br from-gray-800 to-gray-900 text-gray-100'
                      } shadow-lg`}
                    >
                      {message.content}
                    </div>
                    {/* Mostrar pensamento interno (debug mode) */}
                    {message.thought && process.env.NODE_ENV === 'development' && (
                      <div className="mt-1 text-xs text-gray-500 italic px-2">
                        💭 {message.thought}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1 px-2">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-gradient-to-br from-gray-700 to-gray-800">
                    <Bot className="h-4 w-4 text-purple-400 animate-pulse" />
                  </div>
                  <div className="px-4 py-2 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Button
            type="button"
            onClick={toggleVoiceInput}
            disabled={loading}
            className={`${isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            {isListening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </Button>
          
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? "Ouvindo..." : "Digite sua mensagem, senhor..."}
            className="flex-1 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
            disabled={loading || isListening}
          />
          
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-xs border-gray-700 text-gray-300 hover:bg-gray-800"
            onClick={() => setInput('Mostre os vales de Josemir')}
          >
            Vales de Josemir
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs border-gray-700 text-gray-300 hover:bg-gray-800"
            onClick={() => setInput('Cadastre um novo funcionário')}
          >
            Novo Funcionário
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs border-gray-700 text-gray-300 hover:bg-gray-800"
            onClick={() => setInput('Mostre as vendas de hoje')}
          >
            Vendas do Dia
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs border-gray-700 text-gray-300 hover:bg-gray-800"
            onClick={() => setInput('Qual o status do sistema?')}
          >
            Status
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default IALuaEnhanced