import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Slider } from "./ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { Volume2, Mic, Settings, Play, Save, RefreshCw, Loader2 } from 'lucide-react';
import axios from 'axios';

const VoiceSelector = ({ isOpen, onClose, onVoiceChange }) => {
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('luna_br');
  const [voiceConfig, setVoiceConfig] = useState({
    speed: 1.0,
    pitch: 1.0,
    emotion: 'neutral',
    volume: 1.0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewText, setPreviewText] = useState('Olá! Eu sou a assistente virtual Luna. Como posso ajudar você hoje?');
  const [mixMode, setMixMode] = useState(false);
  const [mixedVoices, setMixedVoices] = useState([]);
  const audioRef = useRef(null);

  // Buscar vozes disponíveis
  useEffect(() => {
    fetchVoices();
    loadSavedConfig();
  }, []);

  const fetchVoices = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/voices');
      setVoices(Object.entries(response.data.voices));
    } catch (error) {
      console.error('Erro ao buscar vozes:', error);
      toast.error('Erro ao carregar vozes disponíveis');
    }
  };

  const loadSavedConfig = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/voice/config');
      if (response.data.default) {
        const config = response.data.default;
        setSelectedVoice(config.voice_id);
        setVoiceConfig({
          speed: config.speed,
          pitch: config.pitch,
          emotion: config.emotion,
          volume: config.volume
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    }
  };

  const playPreview = async () => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    setIsLoading(true);

    try {
      const endpoint = mixMode ? '/api/tts/mix' : '/api/tts';
      const payload = mixMode ? {
        text: previewText,
        voices: mixedVoices.map(v => ({
          voice_id: v.id,
          speed: v.speed,
          pitch: v.pitch,
          emotion: v.emotion,
          volume: v.volume
        })),
        mix_ratio: mixedVoices.map(v => v.ratio),
        format: 'mp3'
      } : {
        text: previewText,
        voice_id: selectedVoice,
        speed: voiceConfig.speed,
        pitch: voiceConfig.pitch,
        emotion: voiceConfig.emotion,
        format: 'mp3'
      };

      const response = await axios.post(`http://localhost:8000${endpoint}`, payload);
      
      if (response.data.success) {
        // Reproduzir áudio
        if (audioRef.current) {
          audioRef.current.src = `http://localhost:8000${response.data.url}`;
          audioRef.current.play();
        }
        
        toast.success('Preview gerado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao gerar preview:', error);
      toast.error('Erro ao gerar preview de voz');
    } finally {
      setIsLoading(false);
    }
  };

  const saveVoiceConfig = async () => {
    try {
      const config = {
        voice_id: selectedVoice,
        speed: voiceConfig.speed,
        pitch: voiceConfig.pitch,
        emotion: voiceConfig.emotion,
        volume: voiceConfig.volume
      };

      await axios.post('http://localhost:8000/api/voice/save', config);
      
      // Notificar mudança ao componente pai
      if (onVoiceChange) {
        onVoiceChange(config);
      }
      
      toast.success('Configuração de voz salva com sucesso!');
      onClose();
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração de voz');
    }
  };

  const addVoiceToMix = () => {
    if (mixedVoices.length >= 3) {
      toast.error('Máximo de 3 vozes permitido na mistura');
      return;
    }

    const newVoice = {
      id: selectedVoice,
      name: voices.find(v => v[0] === selectedVoice)?.[1]?.name || selectedVoice,
      speed: voiceConfig.speed,
      pitch: voiceConfig.pitch,
      emotion: voiceConfig.emotion,
      volume: voiceConfig.volume,
      ratio: 1.0 / (mixedVoices.length + 1)
    };

    // Rebalancear proporções
    const updatedVoices = [...mixedVoices, newVoice];
    const totalRatio = 1.0;
    updatedVoices.forEach(v => {
      v.ratio = totalRatio / updatedVoices.length;
    });

    setMixedVoices(updatedVoices);
  };

  const removeVoiceFromMix = (index) => {
    const updatedVoices = mixedVoices.filter((_, i) => i !== index);
    
    // Rebalancear proporções
    if (updatedVoices.length > 0) {
      const totalRatio = 1.0;
      updatedVoices.forEach(v => {
        v.ratio = totalRatio / updatedVoices.length;
      });
    }

    setMixedVoices(updatedVoices);
  };

  const currentVoice = voices.find(v => v[0] === selectedVoice);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Seletor de Voz - Sistema Kokoro TTS
          </DialogTitle>
          <DialogDescription>
            Configure a voz da assistente virtual LUA com vozes naturais em português brasileiro
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="simple" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="simple">Configuração Simples</TabsTrigger>
            <TabsTrigger value="advanced">Avançado</TabsTrigger>
            <TabsTrigger value="mix">Misturador de Vozes</TabsTrigger>
          </TabsList>

          <TabsContent value="simple" className="space-y-4">
            {/* Lista de vozes */}
            <div className="space-y-2">
              <Label>Selecione uma voz</Label>
              <RadioGroup value={selectedVoice} onValueChange={setSelectedVoice}>
                <div className="grid grid-cols-2 gap-4">
                  {voices.map(([id, voice]) => (
                    <Card 
                      key={id} 
                      className={`cursor-pointer transition-all ${
                        selectedVoice === id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedVoice(id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <RadioGroupItem value={id} id={id} />
                          <Badge variant={voice.gender === 'female' ? 'default' : 'secondary'}>
                            {voice.gender === 'female' ? '♀' : voice.gender === 'male' ? '♂' : '⚪'}
                          </Badge>
                        </div>
                        <CardTitle className="text-sm">{voice.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-xs">
                          {voice.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {/* Controles básicos */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="speed">Velocidade: {voiceConfig.speed.toFixed(1)}x</Label>
                <Slider
                  id="speed"
                  min={0.5}
                  max={2}
                  step={0.1}
                  value={[voiceConfig.speed]}
                  onValueChange={(value) => setVoiceConfig({...voiceConfig, speed: value[0]})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pitch">Tom: {voiceConfig.pitch.toFixed(1)}x</Label>
                <Slider
                  id="pitch"
                  min={0.5}
                  max={2}
                  step={0.1}
                  value={[voiceConfig.pitch]}
                  onValueChange={(value) => setVoiceConfig({...voiceConfig, pitch: value[0]})}
                />
              </div>

              {currentVoice && currentVoice[1].emotions.length > 1 && (
                <div className="space-y-2">
                  <Label htmlFor="emotion">Emoção</Label>
                  <Select 
                    value={voiceConfig.emotion} 
                    onValueChange={(value) => setVoiceConfig({...voiceConfig, emotion: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currentVoice[1].emotions.map(emotion => (
                        <SelectItem key={emotion} value={emotion}>
                          {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Configurações Avançadas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="volume">Volume: {(voiceConfig.volume * 100).toFixed(0)}%</Label>
                  <Slider
                    id="volume"
                    min={0}
                    max={1}
                    step={0.05}
                    value={[voiceConfig.volume]}
                    onValueChange={(value) => setVoiceConfig({...voiceConfig, volume: value[0]})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preview-text">Texto de Preview</Label>
                  <textarea
                    id="preview-text"
                    className="w-full p-2 border rounded-md resize-none"
                    rows={3}
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                    placeholder="Digite o texto para testar a voz..."
                  />
                </div>

                {currentVoice && (
                  <div className="space-y-2 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm"><strong>Modelo:</strong> {currentVoice[1].model}</p>
                    <p className="text-sm"><strong>Taxa de amostragem:</strong> {currentVoice[1].sample_rate} Hz</p>
                    <p className="text-sm"><strong>Idioma:</strong> {currentVoice[1].language}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mix" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Misturador de Vozes (Experimental)</CardTitle>
                <CardDescription>
                  Combine até 3 vozes para criar efeitos únicos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={addVoiceToMix}
                  disabled={mixedVoices.length >= 3}
                  className="w-full"
                >
                  Adicionar Voz Atual à Mistura
                </Button>

                {mixedVoices.length > 0 && (
                  <div className="space-y-2">
                    {mixedVoices.map((voice, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">{voice.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">
                            {(voice.ratio * 100).toFixed(0)}%
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeVoiceFromMix(index)}
                          >
                            ✕
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {mixedVoices.length >= 2 && (
                  <Button 
                    onClick={() => {
                      setMixMode(true);
                      playPreview();
                    }}
                    className="w-full"
                    variant="secondary"
                  >
                    Testar Mistura
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button
              onClick={playPreview}
              disabled={isLoading || isPlaying}
              variant="outline"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Testar Voz
            </Button>
            
            <Button
              onClick={fetchVoices}
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Recarregar
            </Button>
          </div>

          <div className="flex gap-2">
            <Button onClick={onClose} variant="outline">
              Cancelar
            </Button>
            <Button onClick={saveVoiceConfig}>
              <Save className="w-4 h-4 mr-2" />
              Salvar Configuração
            </Button>
          </div>
        </DialogFooter>

        {/* Player de áudio invisível */}
        <audio
          ref={audioRef}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  );
};

export default VoiceSelector;