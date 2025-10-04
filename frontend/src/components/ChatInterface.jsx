import React, { useState, useRef, useEffect } from 'react'

function ChatInterface({ messages, onSendMessage, isLoading, onClearHistory }) {
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (inputText.trim() && !isLoading) {
      onSendMessage(inputText)
      setInputText('')
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className="glass rounded-2xl p-6 shadow-2xl h-[600px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">
          <i className="fas fa-comments mr-2"></i>
          Conversa
        </h2>
        <button
          onClick={onClearHistory}
          className="text-purple-300 hover:text-white transition-colors"
          title="Limpar histórico"
        >
          <i className="fas fa-trash"></i>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-2xl ${
                message.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : message.error
                  ? 'bg-red-600 text-white'
                  : 'bg-white/20 text-white backdrop-blur'
              }`}
            >
              <div className="flex items-start space-x-2">
                <span className="text-2xl">
                  {message.role === 'user' ? '👤' : '🌙'}
                </span>
                <div className="flex-1">
                  <p className="text-sm">{message.content}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/20 text-white backdrop-blur p-4 rounded-2xl">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🌙</span>
                <div className="flex space-x-1">
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></span>
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="flex-1 px-4 py-3 rounded-xl bg-white/10 backdrop-blur text-white placeholder-purple-200 border border-purple-400/30 focus:outline-none focus:border-purple-400"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:opacity-50 text-white rounded-xl transition-colors duration-200 flex items-center space-x-2"
        >
          <i className="fas fa-paper-plane"></i>
          <span>Enviar</span>
        </button>
      </form>
    </div>
  )
}

export default ChatInterface