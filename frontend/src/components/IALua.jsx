import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sparkles, Send, User, Bot } from 'lucide-react'
import axios from 'axios'

const IALua = ({ onModalOpen }) => {
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      content: 'Olá! Eu sou a Lua, sua assistente de IA. Como posso ajudá-lo hoje?'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const processLuaResponse = (response) => {
    // Detectar comandos para abrir modais
    const text = response.toLowerCase()
    
    // Vales
    if (text.includes('vale') || text.includes('adiantamento')) {
      if (text.includes('josemir') || text.includes('josé') || text.includes('funcionário')) {
        onModalOpen('vales', { filter: 'Josemir' })
      } else {
        onModalOpen('vales', {})
      }
    }
    
    // Funcionários
    if (text.includes('cadastr') && text.includes('funcionário')) {
      onModalOpen('funcionarios', { mode: 'create' })
    } else if (text.includes('funcionário') || text.includes('colaborador')) {
      onModalOpen('funcionarios', {})
    }
    
    // Vendas
    if (text.includes('venda') || text.includes('pedido')) {
      if (text.includes('hoje') || text.includes('dia')) {
        const today = new Date().toISOString().split('T')[0]
        onModalOpen('vendas', { date: today })
      } else {
        onModalOpen('vendas', {})
      }
    }
    
    // Clientes
    if (text.includes('cliente')) {
      onModalOpen('clientes', {})
    }
    
    // Estoque/Produtos
    if (text.includes('estoque') || text.includes('produto')) {
      onModalOpen('estoque', {})
    }
    
    // Encomendas
    if (text.includes('encomenda')) {
      onModalOpen('encomendas', {})
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = { type: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await axios.post('/api/lua', {
        message: input,
        context: {
          user: JSON.parse(localStorage.getItem('user') || '{}'),
          timestamp: new Date().toISOString()
        }
      })

      const botMessage = {
        type: 'bot',
        content: response.data.response || response.data.message || 'Desculpe, não entendi sua solicitação.'
      }
      
      setMessages(prev => [...prev, botMessage])
      
      // Processar resposta para abrir modais relevantes
      processLuaResponse(botMessage.content)
      
    } catch (error) {
      console.error('Erro ao enviar mensagem para Lua:', error)
      setMessages(prev => [...prev, {
        type: 'bot',
        content: 'Desculpe, ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.'
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="h-full flex flex-col bg-gray-800 border-gray-700">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-white">
          <Sparkles className="h-5 w-5 text-purple-400" />
          IA Lua - Assistente Virtual
        </CardTitle>
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
                        ? 'bg-purple-500'
                        : 'bg-gray-700'
                    }`}
                  >
                    {message.type === 'user' ? (
                      <User className="h-4 w-4 text-white" />
                    ) : (
                      <Bot className="h-4 w-4 text-purple-400" />
                    )}
                  </div>
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-100'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-gray-700">
                    <Bot className="h-4 w-4 text-purple-400" />
                  </div>
                  <div className="px-4 py-2 rounded-lg bg-gray-700">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 bg-gray-700 border-gray-600 text-white"
            disabled={loading}
          />
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-xs border-gray-600 text-gray-300"
            onClick={() => setInput('Mostre os vales de Josemir')}
          >
            Vales de Josemir
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs border-gray-600 text-gray-300"
            onClick={() => setInput('Cadastre um novo funcionário')}
          >
            Novo Funcionário
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs border-gray-600 text-gray-300"
            onClick={() => setInput('Mostre as vendas de hoje')}
          >
            Vendas do Dia
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default IALua