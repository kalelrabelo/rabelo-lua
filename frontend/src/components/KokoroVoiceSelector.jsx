import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Volume2, 
  Settings, 
  Check, 
  X, 
  Play, 
  Pause, 
  Download,
  Upload,
  Loader,
  Plus,
  Minus,
  Save,
  RefreshCw,
  Sliders,
  Blend
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import axios from 'axios';

const KokoroVoiceSelector = ({ onClose, onVoiceSelected }) => {
  const [voices, setVoices] = useState([]);
  const [loadingVoices, setLoadingVoices] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [mixedVoices, setMixedVoices] = useState([]);
  const [voiceWeights, setVoiceWeights] = useState({});
  const [isMixMode, setIsMixMode] = useState(false);
  
  const [testText, setTestText] = useState('Olá, eu sou a LUA. Como posso ajudar você hoje?');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPlaying, setCurrentPlaying] = useState(null);
  
  const [voiceSettings, setVoiceSettings] = useState({
    speed: 1.0,
    pitch: 1.0,
    energy: 0.9,
    emotion: 'confident'
  });
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [currentConfig, setCurrentConfig] = useState(null);
  const [engineStatus, setEngineStatus] = useState(null);
  
  const audioRef = useRef(null);
  const playingAudioRef = useRef(null);

  // Carregar vozes e configuração ao montar
  useEffect(() => {
    loadVoices();
    loadCurrentConfig();
    checkEngineStatus();
  }, []);

  const checkEngineStatus = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/voice/status');
      setEngineStatus(response.data.status);
    } catch (error) {
      console.error('Erro ao verificar status do engine:', error);
      toast.error('Sistema de voz não está disponível');
    }
  };

  const loadVoices = async () => {
    setLoadingVoices(true);
    try {
      const response = await axios.get('http://localhost:5000/api/voice/voices');
      if (response.data.success) {
        setVoices(response.data.voices || []);
        toast.success(`${response.data.total} vozes carregadas do Kokoro`);
      }
    } catch (error) {
      console.error('Erro ao carregar vozes:', error);
      toast.error('Erro ao carregar vozes do Kokoro');
      // Vozes de fallback caso o servidor não esteja disponível
      setVoices([
        {
          id: 'af_bella',
          name: 'Bella (Feminina)',
          description: 'Voz feminina suave e profissional',
          language: 'multi',
          engine: 'kokoro',
          selected: false
        },
        {
          id: 'am_adam',
          name: 'Adam (Masculino)',
          description: 'Voz masculina profunda e confiante',
          language: 'multi',
          engine: 'kokoro',
          selected: false
        }
      ]);
    } finally {
      setLoadingVoices(false);
    }
  };

  const loadCurrentConfig = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/voice/config');
      if (response.data.success) {
        const config = response.data.config;
        setCurrentConfig(config);
        
        if (config.voice_mix) {
          // Parse do mix de vozes
          setIsMixMode(true);
          parseMixConfig(config.voice_mix);
        } else if (config.voice_id) {
          setSelectedVoice(config.voice_id);
        }
        
        if (config.settings) {
          setVoiceSettings({
            ...voiceSettings,
            ...config.settings
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    }
  };

  const parseMixConfig = (mixString) => {
    // Parse formato: "af_bella+af_sky:0.6,0.4"
    try {
      const [voicesPart, weightsPart] = mixString.split(':');
      const voiceIds = voicesPart.split('+');
      const weights = weightsPart ? weightsPart.split(',').map(Number) : [];
      
      setMixedVoices(voiceIds);
      const weightsObj = {};
      voiceIds.forEach((id, index) => {
        weightsObj[id] = weights[index] || (1.0 / voiceIds.length);
      });
      setVoiceWeights(weightsObj);
    } catch (error) {
      console.error('Erro ao fazer parse do mix:', error);
    }
  };

  const handleVoiceSelect = (voiceId) => {
    if (isMixMode) {
      // No modo mix, adicionar/remover vozes da mistura
      if (mixedVoices.includes(voiceId)) {
        const newMixed = mixedVoices.filter(id => id !== voiceId);
        setMixedVoices(newMixed);
        const newWeights = { ...voiceWeights };
        delete newWeights[voiceId];
        setVoiceWeights(newWeights);
      } else {
        const newMixed = [...mixedVoices, voiceId];
        setMixedVoices(newMixed);
        // Distribuir pesos igualmente
        const weight = 1.0 / newMixed.length;
        const newWeights = {};
        newMixed.forEach(id => {
          newWeights[id] = weight;
        });
        setVoiceWeights(newWeights);
      }
    } else {
      setSelectedVoice(voiceId);
    }
  };

  const adjustWeight = (voiceId, newWeight) => {
    const clampedWeight = Math.max(0, Math.min(1, newWeight));
    setVoiceWeights({
      ...voiceWeights,
      [voiceId]: clampedWeight
    });
  };

  const normalizeWeights = () => {
    const total = Object.values(voiceWeights).reduce((sum, w) => sum + w, 0);
    if (total > 0) {
      const normalized = {};
      Object.keys(voiceWeights).forEach(id => {
        normalized[id] = voiceWeights[id] / total;
      });
      setVoiceWeights(normalized);
      toast.success('Pesos normalizados');
    }
  };

  const generatePreview = async () => {
    if (!isMixMode && !selectedVoice) {
      toast.error('Selecione uma voz primeiro');
      return;
    }
    
    if (isMixMode && mixedVoices.length < 2) {
      toast.error('Selecione pelo menos 2 vozes para mixar');
      return;
    }

    setIsGenerating(true);
    stopAudio();

    try {
      let response;
      
      if (isMixMode) {
        // Gerar mix de vozes
        const weights = mixedVoices.map(id => voiceWeights[id] || 0);
        response = await axios.post('http://localhost:5000/api/voice/mix', {
          voices: mixedVoices,
          weights: weights,
          text: testText,
          speed: voiceSettings.speed
        });
      } else {
        // Gerar com voz única
        response = await axios.post('http://localhost:5000/api/voice/preview', {
          voice_id: selectedVoice,
          text: testText,
          speed: voiceSettings.speed
        });
      }

      if (response.data.success && response.data.audio_base64) {
        playAudioFromBase64(response.data.audio_base64, response.data.format || 'wav');
        toast.success('Preview gerado com sucesso');
      } else {
        toast.error('Falha ao gerar preview');
      }
    } catch (error) {
      console.error('Erro ao gerar preview:', error);
      toast.error('Erro ao gerar preview de voz');
    } finally {
      setIsGenerating(false);
    }
  };

  const playAudioFromBase64 = (base64Audio, format = 'wav') => {
    try {
      const audioBlob = base64ToBlob(base64Audio, `audio/${format}`);
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (playingAudioRef.current) {
        playingAudioRef.current.pause();
        URL.revokeObjectURL(playingAudioRef.current.src);
      }
      
      const audio = new Audio(audioUrl);
      playingAudioRef.current = audio;
      
      audio.onended = () => {
        setCurrentPlaying(null);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.play();
      setCurrentPlaying('preview');
    } catch (error) {
      console.error('Erro ao reproduzir áudio:', error);
      toast.error('Erro ao reproduzir áudio');
    }
  };

  const base64ToBlob = (base64, mimeType) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  const stopAudio = () => {
    if (playingAudioRef.current) {
      playingAudioRef.current.pause();
      playingAudioRef.current = null;
      setCurrentPlaying(null);
    }
  };

  const saveVoiceConfig = async () => {
    try {
      let configData = {
        speed: voiceSettings.speed,
        pitch: voiceSettings.pitch
      };
      
      if (isMixMode) {
        if (mixedVoices.length < 2) {
          toast.error('Selecione pelo menos 2 vozes para salvar mix');
          return;
        }
        const weights = mixedVoices.map(id => voiceWeights[id] || 0);
        configData.voice_mix = `${mixedVoices.join('+')}:${weights.join(',')}`;
      } else {
        if (!selectedVoice) {
          toast.error('Selecione uma voz primeiro');
          return;
        }
        configData.voice_id = selectedVoice;
      }
      
      const response = await axios.post('http://localhost:5000/api/voice/config', configData);
      
      if (response.data.success) {
        toast.success('Configuração de voz salva com sucesso');
        setCurrentConfig(response.data.config);
        if (onVoiceSelected) {
          onVoiceSelected(response.data.config);
        }
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração de voz');
    }
  };

  const resetToDefault = () => {
    setSelectedVoice('af_bella');
    setMixedVoices([]);
    setVoiceWeights({});
    setIsMixMode(false);
    setVoiceSettings({
      speed: 1.0,
      pitch: 1.0,
      energy: 0.9,
      emotion: 'confident'
    });
    toast.info('Configurações resetadas para padrão');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Seletor de Voz Kokoro
          </CardTitle>
          <div className="flex gap-2">
            {engineStatus && (
              <div className="text-sm px-3 py-1 rounded bg-green-100 text-green-800">
                {engineStatus.engine}: {engineStatus.status}
              </div>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="overflow-y-auto max-h-[calc(90vh-100px)]">
          <Tabs defaultValue="simple" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="simple">Voz Simples</TabsTrigger>
              <TabsTrigger value="mix">Mix de Vozes</TabsTrigger>
              <TabsTrigger value="advanced">Avançado</TabsTrigger>
            </TabsList>
            
            {/* Aba de Voz Simples */}
            <TabsContent value="simple" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loadingVoices ? (
                  <div className="col-span-2 flex justify-center py-8">
                    <Loader className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  voices.map(voice => (
                    <Card 
                      key={voice.id}
                      className={`cursor-pointer transition-all ${
                        selectedVoice === voice.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => {
                        setIsMixMode(false);
                        handleVoiceSelect(voice.id);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{voice.name}</h4>
                            <p className="text-sm text-gray-600">{voice.description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              ID: {voice.id} | Idioma: {voice.language}
                            </p>
                          </div>
                          {selectedVoice === voice.id && (
                            <Check className="h-5 w-5 text-blue-500" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
            
            {/* Aba de Mix de Vozes */}
            <TabsContent value="mix" className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-blue-800">
                  Selecione múltiplas vozes e ajuste os pesos para criar uma voz única misturada.
                </p>
              </div>
              
              <div className="space-y-4">
                {voices.map(voice => (
                  <div key={voice.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={mixedVoices.includes(voice.id)}
                          onCheckedChange={() => {
                            setIsMixMode(true);
                            handleVoiceSelect(voice.id);
                          }}
                        />
                        <div>
                          <Label className="font-medium">{voice.name}</Label>
                          <p className="text-xs text-gray-500">{voice.description}</p>
                        </div>
                      </div>
                    </div>
                    
                    {mixedVoices.includes(voice.id) && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-4">
                          <Label className="w-20 text-sm">Peso:</Label>
                          <Slider
                            value={[voiceWeights[voice.id] || 0.5]}
                            onValueChange={(value) => adjustWeight(voice.id, value[0])}
                            min={0}
                            max={1}
                            step={0.05}
                            className="flex-1"
                          />
                          <span className="w-16 text-sm font-mono">
                            {((voiceWeights[voice.id] || 0.5) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {mixedVoices.length >= 2 && (
                  <Button 
                    onClick={normalizeWeights}
                    variant="outline" 
                    className="w-full"
                  >
                    <Blend className="h-4 w-4 mr-2" />
                    Normalizar Pesos
                  </Button>
                )}
              </div>
            </TabsContent>
            
            {/* Aba Avançada */}
            <TabsContent value="advanced" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Velocidade da Fala</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Slider
                      value={[voiceSettings.speed]}
                      onValueChange={(value) => setVoiceSettings({
                        ...voiceSettings,
                        speed: value[0]
                      })}
                      min={0.5}
                      max={2.0}
                      step={0.1}
                      className="flex-1"
                    />
                    <span className="w-12 text-sm">{voiceSettings.speed.toFixed(1)}x</span>
                  </div>
                </div>
                
                <div>
                  <Label>Tom (Pitch)</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Slider
                      value={[voiceSettings.pitch]}
                      onValueChange={(value) => setVoiceSettings({
                        ...voiceSettings,
                        pitch: value[0]
                      })}
                      min={0.5}
                      max={1.5}
                      step={0.05}
                      className="flex-1"
                    />
                    <span className="w-12 text-sm">{voiceSettings.pitch.toFixed(2)}</span>
                  </div>
                </div>
                
                {currentConfig && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Configuração Atual:</h4>
                    <pre className="text-xs bg-white p-2 rounded">
                      {JSON.stringify(currentConfig, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
          
          {/* Área de Teste */}
          <div className="mt-6 space-y-4 border-t pt-4">
            <div>
              <Label>Texto de Teste</Label>
              <Input
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Digite o texto para testar a voz..."
                className="mt-2"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={generatePreview}
                disabled={isGenerating || (!selectedVoice && mixedVoices.length < 2)}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : currentPlaying === 'preview' ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Parar Preview
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Gerar Preview
                  </>
                )}
              </Button>
              
              <Button 
                onClick={saveVoiceConfig}
                variant="default"
                disabled={!selectedVoice && mixedVoices.length < 2}
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar como Padrão
              </Button>
              
              <Button 
                onClick={resetToDefault}
                variant="outline"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Resetar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KokoroVoiceSelector;