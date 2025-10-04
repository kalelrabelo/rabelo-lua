import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import ChatInterface from './components/ChatInterface'
import VoiceControls from './components/VoiceControls'
import Header from './components/Header'

// Configure axios
axios.defaults.baseURL = import.meta.env.DEV ? 'http://localhost:8000' : ''

function App() {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [selectedVoice, setSelectedVoice] = useState('luna')
  const [voices, setVoices] = useState([])
  const [speechSpeed, setSpeechSpeed] = useState(1.0)
  const [systemStatus, setSystemStatus] = useState(null)
  
  const audioRef = useRef(null)

  // Check system health on mount
  useEffect(() => {
    checkSystemHealth()
    loadVoices()
    
    // Welcome message
    const welcomeMsg = {
      id: Date.now(),
      role: 'assistant',
      content: 'Olá! Eu sou a Lua 🌙, sua assistente de IA. Como posso ajudar você hoje?',
      timestamp: new Date().toISOString()
    }
    setMessages([welcomeMsg])
  }, [])

  const checkSystemHealth = async () => {
    try {
      const response = await axios.get('/health')
      setSystemStatus(response.data)
    } catch (error) {
      console.error('Health check failed:', error)
      setSystemStatus({ status: 'error', services: {} })
    }
  }

  const loadVoices = async () => {
    try {
      const response = await axios.get('/api/voice/voices')
      if (response.data.success) {
        const voiceList = Object.entries(response.data.voices).map(([id, name]) => ({
          id,
          name
        }))
        setVoices(voiceList)
      }
    } catch (error) {
      console.error('Failed to load voices:', error)
    }
  }

  const sendMessage = async (text) => {
    if (!text.trim()) return

    // Add user message
    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)

    try {
      // Get text response
      const chatResponse = await axios.post('/api/chat', {
        message: text,
        user_id: 'web-user',
        context: { interface: 'web' }
      })

      if (chatResponse.data.success) {
        // Add assistant message
        const assistantMsg = {
          id: Date.now() + 1,
          role: 'assistant',
          content: chatResponse.data.response,
          timestamp: chatResponse.data.timestamp
        }
        setMessages(prev => [...prev, assistantMsg])

        // Generate and play audio
        await speakText(chatResponse.data.response)
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro. Por favor, tente novamente.',
        timestamp: new Date().toISOString(),
        error: true
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  const speakText = async (text) => {
    try {
      const response = await axios.post(
        '/api/voice/speak',
        {
          text,
          voice: selectedVoice,
          speed: speechSpeed
        },
        {
          responseType: 'blob'
        }
      )

      // Create audio URL and play
      const audioUrl = URL.createObjectURL(response.data)
      if (audioRef.current) {
        audioRef.current.src = audioUrl
        await audioRef.current.play()
      }
    } catch (error) {
      console.error('TTS error:', error)
    }
  }

  const handleVoiceInput = async (audioBlob) => {
    // Placeholder for voice input processing
    // This would integrate with a speech recognition service
    console.log('Voice input received:', audioBlob)
    
    // For now, simulate with a message
    const simulatedText = "Teste de entrada de voz"
    await sendMessage(simulatedText)
  }

  const clearHistory = async () => {
    try {
      await axios.delete('/api/chat/history')
      setMessages([{
        id: Date.now(),
        role: 'assistant',
        content: 'Histórico limpo! Como posso ajudar você?',
        timestamp: new Date().toISOString()
      }])
    } catch (error) {
      console.error('Failed to clear history:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Header systemStatus={systemStatus} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2">
            <ChatInterface
              messages={messages}
              onSendMessage={sendMessage}
              isLoading={isLoading}
              onClearHistory={clearHistory}
            />
          </div>
          
          <div className="lg:col-span-1">
            <VoiceControls
              voices={voices}
              selectedVoice={selectedVoice}
              onVoiceChange={setSelectedVoice}
              speechSpeed={speechSpeed}
              onSpeedChange={setSpeechSpeed}
              isRecording={isRecording}
              onToggleRecording={() => setIsRecording(!isRecording)}
              onVoiceInput={handleVoiceInput}
              onTestVoice={() => speakText('Olá! Esta é uma demonstração da minha voz.')}
            />
          </div>
        </div>

        {/* Hidden audio element for playback */}
        <audio ref={audioRef} className="hidden" />
      </div>
    </div>
  )
}

export default App