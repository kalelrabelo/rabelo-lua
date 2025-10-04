import React from 'react'

function Header({ systemStatus }) {
  const getStatusColor = () => {
    if (!systemStatus) return 'bg-gray-500'
    if (systemStatus.status === 'healthy') return 'bg-green-500'
    if (systemStatus.status === 'error') return 'bg-red-500'
    return 'bg-yellow-500'
  }

  const getServiceStatus = (service) => {
    if (!systemStatus || !systemStatus.services) return false
    return systemStatus.services[service]
  }

  return (
    <div className="glass rounded-2xl p-6 shadow-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-5xl animate-float">🌙</div>
          <div>
            <h1 className="text-4xl font-bold text-white">Lua</h1>
            <p className="text-purple-200">Assistente de IA com Voz</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="text-right">
            <div className="flex items-center space-x-2">
              <span className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`}></span>
              <span className="text-white text-sm">Sistema</span>
            </div>
            <div className="text-xs text-purple-200 mt-1">
              TTS: {getServiceStatus('tts_engine') ? '✅' : '❌'}
              {' | '}
              Lua: {getServiceStatus('lua_assistant') ? '✅' : '❌'}
            </div>
          </div>
          
          <div className="text-white text-sm">
            <div>Kokoro-82M</div>
            <div className="text-xs text-purple-200">PT-BR</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Header