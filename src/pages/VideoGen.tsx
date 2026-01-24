import React, { useState, useMemo } from 'react';
import { Play, Loader2, Upload, X, DollarSign, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GenerationStatus } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  getModelsByServer,
  calculatePrice,
  ModelWithPricing,
} from '@/config/videoModels';

type GenerationType = 'text-to-video' | 'image-to-video' | 'first-last-frame';

const VideoGen: React.FC = () => {
  const { credits } = useAuth();
  const { toast } = useToast();
  
  // State
  const [server, setServer] = useState<'server1' | 'server2'>('server1');
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('');
  const [duration, setDuration] = useState<number>(0);
  const [resolution, setResolution] = useState('720p');
  const [mode, setMode] = useState('standard');
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);

  // Get models for selected server
  const models = useMemo(() => getModelsByServer(server), [server]);
  
  // Get selected model
  const selectedModel = useMemo(
    () => models.find((m) => m.id === selectedModelId),
    [models, selectedModelId]
  );

  // Determine generation type based on uploaded images
  const generationType: GenerationType = useMemo(() => {
    if (images.length === 0) return 'text-to-video';
    if (images.length === 1) return 'image-to-video';
    return 'first-last-frame';
  }, [images.length]);

  // Calculate current price
  const currentPrice = useMemo(() => {
    if (!selectedModel) return 0;
    return calculatePrice(selectedModel, {
      duration,
      audioOn: audioEnabled,
      mode,
      resolution,
    });
  }, [selectedModel, duration, audioEnabled, mode, resolution]);

  // Reset form when model changes
  const handleModelChange = (modelId: string) => {
    setSelectedModelId(modelId);
    const model = models.find((m) => m.id === modelId);
    if (model) {
      setAspectRatio(model.defaultAspectRatio);
      setDuration(model.defaultDuration);
      setResolution(model.defaultResolution);
      setMode(model.defaultMode);
      setAudioEnabled(false);
      setImages([]);
    }
  };

  // Handle server change
  const handleServerChange = (newServer: string) => {
    setServer(newServer as 'server1' | 'server2');
    setSelectedModelId('');
    setImages([]);
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const maxImages = selectedModel?.maxImages || 2;
    const newImages = [...images, ...Array.from(files)].slice(0, maxImages);
    setImages(newImages);
  };

  // Remove image
  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Handle generate
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModel || !prompt.trim()) return;

    if (credits < currentPrice) {
      toast({
        title: 'Kredit tidak cukup',
        description: `Anda membutuhkan $${currentPrice.toFixed(2)} tapi hanya memiliki $${credits.toFixed(2)}`,
        variant: 'destructive',
      });
      return;
    }

    setStatus(GenerationStatus.LOADING);
    toast({
      title: 'Segera hadir!',
      description: 'Fitur video generation sedang dalam pengembangan.',
    });
    
    // Simulate loading then reset
    setTimeout(() => {
      setStatus(GenerationStatus.IDLE);
    }, 2000);
  };

  // Get available modes based on generation type
  const availableModes = useMemo(() => {
    if (!selectedModel?.modeConditions) return selectedModel?.modes || [];
    
    switch (generationType) {
      case 'text-to-video':
        return selectedModel.modeConditions.textToVideo || selectedModel.modes;
      case 'image-to-video':
        return selectedModel.modeConditions.imageToVideo || selectedModel.modes;
      case 'first-last-frame':
        return selectedModel.modeConditions.firstLastFrame || selectedModel.modes;
      default:
        return selectedModel.modes;
    }
  }, [selectedModel, generationType]);

  // Check if aspect ratio should be shown
  const showAspectRatio = useMemo(() => {
    if (!selectedModel || selectedModel.aspectRatios.length === 0) return false;
    if (selectedModel.aspectRatioConditions?.textToVideoOnly && generationType !== 'text-to-video') return false;
    if (selectedModel.aspectRatioConditions?.hideWhenImageToVideoStandard && 
        generationType === 'image-to-video' && mode === 'standard') return false;
    return true;
  }, [selectedModel, generationType, mode]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Video Generation</h2>
          <p className="text-muted-foreground">Create AI-powered videos from text or images.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg">
          <DollarSign size={16} className="text-primary" />
          <span className="text-sm text-muted-foreground">Credits:</span>
          <span className="font-bold text-foreground">${credits.toFixed(2)}</span>
        </div>
      </div>

      {/* Server Tabs */}
      <Tabs value={server} onValueChange={handleServerChange}>
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="server1">Server 1 (fal.ai)</TabsTrigger>
          <TabsTrigger value="server2">Server 2 (GMI Cloud)</TabsTrigger>
        </TabsList>

        <TabsContent value={server} className="mt-6">
          <div className="bg-card border border-border rounded-xl p-6 space-y-6">
            {/* Model Selection */}
            <div className="space-y-2">
              <Label>Select Model</Label>
              <Select value={selectedModelId} onValueChange={handleModelChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a video model..." />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedModel && (
              <form onSubmit={handleGenerate} className="space-y-6">
                {/* Prompt */}
                <div className="space-y-2">
                  <Label>Prompt</Label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the video you want to create..."
                    className="h-24 bg-muted border-border resize-none"
                    required
                  />
                </div>

                {/* Negative Prompt */}
                {selectedModel.supportsNegativePrompt && (
                  <div className="space-y-2">
                    <Label>Negative Prompt (optional)</Label>
                    <Input
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      placeholder="What to avoid..."
                      className="bg-muted border-border"
                    />
                  </div>
                )}

                {/* Image Upload */}
                {(selectedModel.supportsImageToVideo || selectedModel.supportsFirstLastFrame) && (
                  <div className="space-y-2">
                    <Label>
                      Upload Images (optional, max {selectedModel.maxImages})
                    </Label>
                    <div className="flex flex-wrap gap-3">
                      {images.map((img, idx) => (
                        <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-border">
                          <img
                            src={URL.createObjectURL(img)}
                            alt={`Upload ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-1 right-1 p-1 bg-background/80 rounded-full hover:bg-background"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      {images.length < selectedModel.maxImages && (
                        <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                          <Upload size={20} className="text-muted-foreground" />
                          <span className="text-xs text-muted-foreground mt-1">Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {generationType === 'text-to-video' && 'No image = Text to Video'}
                      {generationType === 'image-to-video' && '1 image = Image to Video'}
                      {generationType === 'first-last-frame' && '2 images = First & Last Frame'}
                    </p>
                  </div>
                )}

                {/* Options Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Aspect Ratio */}
                  {showAspectRatio && (
                    <div className="space-y-2">
                      <Label>Aspect Ratio</Label>
                      <Select value={aspectRatio} onValueChange={setAspectRatio}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedModel.aspectRatios.map((ar) => (
                            <SelectItem key={ar} value={ar}>{ar}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Duration */}
                  {selectedModel.durations.length > 0 && (
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedModel.durations.map((d) => (
                            <SelectItem key={d} value={String(d)}>{d}s</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Resolution */}
                  {selectedModel.resolutions.length > 1 && (
                    <div className="space-y-2">
                      <Label>Resolution</Label>
                      <Select value={resolution} onValueChange={setResolution}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedModel.resolutions.map((r) => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Mode */}
                  {availableModes.length > 1 && (
                    <div className="space-y-2">
                      <Label>Mode</Label>
                      <Select value={mode} onValueChange={setMode}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableModes.map((m) => (
                            <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Audio Option */}
                {selectedModel.supportsAudio && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="audio"
                      checked={audioEnabled}
                      onCheckedChange={(checked) => setAudioEnabled(checked === true)}
                    />
                    <Label htmlFor="audio" className="cursor-pointer">
                      Generate Audio
                    </Label>
                  </div>
                )}

                {/* Price & Submit */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Info size={16} className="text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Estimated cost:</span>
                    <span className="text-lg font-bold text-primary">${currentPrice.toFixed(2)}</span>
                  </div>
                  <Button
                    type="submit"
                    disabled={status === GenerationStatus.LOADING || !prompt.trim()}
                    size="lg"
                    className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    {status === GenerationStatus.LOADING ? (
                      <>
                        <Loader2 className="animate-spin" /> Generating...
                      </>
                    ) : (
                      <>
                        <Play fill="currentColor" /> Generate Video
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VideoGen;
