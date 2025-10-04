import React, { useState, useEffect } from 'react'

function VoiceControls({
  voices,
  selectedVoice,
  onVoiceChange,
  speechSpeed,
  onSpeedChange,
  isRecording,
  onToggleRecording,
  onVoiceInput,
  onTestVoice
}) {
  const [volumeLevel, setVolumeLevel] = useState(0)
  
  // Simulate volume level animation when recording
  useEffect(() => {
    let interval
    if (isRecording) {
      interval = setInterval(() => {
        setVolumeLevel(Math.random() * 100)
      }, 100)
    } else {
      setVolumeLevel(0)
    }
    return () => clearInterval(interval)
  }, [isRecording])

  return (
    <div className="space-y-6">
      {/* Voice Selection */}
      <div className="glass rounded-2xl p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-4">
          <i className="fas fa-microphone-alt mr-2"></i>
          Configurações de Voz
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-purple-200 text-sm mb-2">
              Voz Selecionada
            </label>
            <select
              value={selectedVoice}
              onChange={(e) => onVoiceChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/10 backdrop-blur text-white border border-purple-400/30 focus:outline-none focus:border-purple-400"
            >
              {voices.map((voice) => (
                <option key={voice.id} value={voice.id} className="bg-purple-900">
                  {voice.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-purple-200 text-sm mb-2">
              Velocidade: {speechSpeed.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={speechSpeed}
              onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
              className="w-full accent-purple-500"
            />
            <div className="flex justify-between text-xs text-purple-300 mt-1">
              <span>0.5x</span>
              <span>1.0x</span>
              <span>2.0x</span>
            </div>
          </div>
          
          <button
            onClick={onTestVoice}
            className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <i className="fas fa-play"></i>
            <span>Testar Voz</span>
          </button>
        </div>
      </div>

      {/* Voice Input */}
      <div className="glass rounded-2xl p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-4">
          <i className="fas fa-microphone mr-2"></i>
          Entrada de Voz
        </h3>
        
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <button
              onClick={onToggleRecording}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                isRecording 
                  ? 'bg-red-600 hover:bg-red-700 animate-pulse-glow' 
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              <i className={`fas fa-microphone text-3xl text-white ${isRecording ? 'animate-pulse' : ''}`}></i>
            </button>
            
            {isRecording && (
              <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping"></div>
            )}
          </div>
          
          {isRecording && (
            <div className="w-full">
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-100"
                  style={{ width: `${volumeLevel}%` }}
                ></div>
              </div>
              <p className="text-center text-purple-200 text-sm mt-2">
                Gravando... Clique para parar
              </p>
            </div>
          )}
          
          {!isRecording && (
            <p className="text-center text-purple-200 text-sm">
              Clique para gravar sua mensagem
            </p>
          )}
        </div>
      </div>

      {/* Voice Features */}
      <div className="glass rounded-2xl p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-4">
          <i className="fas fa-magic mr-2"></i>
          Recursos
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <i className="fas fa-check-circle text-green-400"></i>
            <span className="text-purple-200 text-sm">TTS em Português (PT-BR)</span>
          </div>
          <div className="flex items-center space-x-3">
            <i className="fas fa-check-circle text-green-400"></i>
            <span className="text-purple-200 text-sm">Múltiplas vozes disponíveis</span>
          </div>
          <div className="flex items-center space-x-3">
            <i className="fas fa-check-circle text-green-400"></i>
            <span className="text-purple-200 text-sm">Controle de velocidade</span>
          </div>
          <div className="flex items-center space-x-3">
            <i className="fas fa-check-circle text-green-400"></i>
            <span className="text-purple-200 text-sm">Modelo Kokoro-82M</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VoiceControls