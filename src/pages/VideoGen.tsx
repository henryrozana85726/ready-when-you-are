import React, { useState, useMemo } from 'react';
import { Play, Loader2, Upload, X, Coins, Info } from 'lucide-react';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GenerationStatus } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  getModelsByServer,
  calculatePrice,
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
        description: `Anda membutuhkan ${currentPrice.toLocaleString()} kredit tapi hanya memiliki ${credits.toLocaleString()} kredit`,
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

  // Get available aspect ratios based on generation type
  const availableAspectRatios = useMemo(() => {
    if (!selectedModel || selectedModel.aspectRatios.length === 0) return [];
    
    // Check if we should add 'auto' for image modes
    if (selectedModel.aspectRatioConditions?.addAutoForImageModes && 
        (generationType === 'image-to-video' || generationType === 'first-last-frame')) {
      return ['auto', ...selectedModel.aspectRatios];
    }
    
    return selectedModel.aspectRatios;
  }, [selectedModel, generationType]);

  // Check if aspect ratio should be shown
  const showAspectRatio = useMemo(() => {
    if (!selectedModel || availableAspectRatios.length === 0) return false;
    if (selectedModel.aspectRatioConditions?.textToVideoOnly && generationType !== 'text-to-video') return false;
    if (selectedModel.aspectRatioConditions?.hideWhenImageToVideoStandard && 
        generationType === 'image-to-video' && mode === 'standard') return false;
    return true;
  }, [selectedModel, availableAspectRatios, generationType, mode]);

  // Update aspect ratio when generation type changes for models with addAutoForImageModes
  React.useEffect(() => {
    if (!selectedModel?.aspectRatioConditions?.addAutoForImageModes) return;
    
    if (generationType === 'text-to-video') {
      // Switch to default (16:9) when switching to text-to-video
      if (aspectRatio === 'auto') {
        setAspectRatio(selectedModel.defaultAspectRatio);
      }
    } else {
      // Switch to 'auto' when switching to image modes
      setAspectRatio('auto');
    }
  }, [generationType, selectedModel]);

  return (
    <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr,1.5fr] gap-8 min-h-[calc(100vh-8rem)]">
      {/* Controls */}
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Video Generation</h2>
          <p className="text-muted-foreground">Create AI-powered videos from text or images.</p>
        </div>

        {/* Credits Badge */}
        <div className="flex items-center gap-2 px-4 py-2 bg-muted border border-border rounded-lg w-fit">
          <Coins size={16} className="text-primary" />
          <span className="text-sm text-muted-foreground">Credits:</span>
          <span className="font-bold text-foreground">{credits.toLocaleString()}</span>
        </div>

        {/* Server Tabs */}
        <Tabs value={server} onValueChange={handleServerChange}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="server1">Server 1</TabsTrigger>
            <TabsTrigger value="server2">Server 2</TabsTrigger>
          </TabsList>
        </Tabs>

        <form onSubmit={handleGenerate} className="flex flex-col gap-4 flex-1">
          {/* Model Selection */}
          <div className="space-y-2">
            <Label>Model</Label>
            <Select value={selectedModelId} onValueChange={handleModelChange}>
              <SelectTrigger className="bg-muted border-border">
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

          {/* Prompt */}
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the video you want to create..."
              className="h-32 bg-muted border-border resize-none"
              required
            />
          </div>

          {/* Negative Prompt */}
          {selectedModel?.supportsNegativePrompt && (
            <div className="space-y-2">
              <Label>Negative Prompt</Label>
              <Input
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="What to avoid..."
                className="bg-muted border-border"
              />
            </div>
          )}

          {/* Image Upload */}
          {selectedModel && (selectedModel.supportsImageToVideo || selectedModel.supportsFirstLastFrame) && (
            <div className="space-y-2">
              <Label>Images (optional, max {selectedModel.maxImages})</Label>
              <div className="flex flex-wrap gap-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
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
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {images.length < selectedModel.maxImages && (
                  <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                    <Upload size={18} className="text-muted-foreground" />
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
                {generationType === 'text-to-video' && 'Text to Video'}
                {generationType === 'image-to-video' && 'Image to Video'}
                {generationType === 'first-last-frame' && 'First & Last Frame'}
              </p>
            </div>
          )}

          {/* Options */}
          {selectedModel && (
            <div className="space-y-2">
              <Label>Options</Label>
              <div className="grid grid-cols-2 gap-2">
                {/* Aspect Ratio */}
                {showAspectRatio && (
                  <Select value={aspectRatio} onValueChange={setAspectRatio}>
                    <SelectTrigger className="bg-muted border-border">
                      <SelectValue placeholder="Aspect Ratio" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableAspectRatios.map((ar) => (
                        <SelectItem key={ar} value={ar} className="capitalize">{ar === 'auto' ? 'Auto' : ar}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Duration */}
                {selectedModel.durations.length > 0 && (
                  <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v))}>
                    <SelectTrigger className="bg-muted border-border">
                      <SelectValue placeholder="Duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedModel.durations.map((d) => (
                        <SelectItem key={d} value={String(d)}>{d}s</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Resolution */}
                {selectedModel.resolutions.length > 1 && (
                  <Select value={resolution} onValueChange={setResolution}>
                    <SelectTrigger className="bg-muted border-border">
                      <SelectValue placeholder="Resolution" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedModel.resolutions.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Mode */}
                {availableModes.length > 1 && (
                  <Select value={mode} onValueChange={setMode}>
                    <SelectTrigger className="bg-muted border-border">
                      <SelectValue placeholder="Mode" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModes.map((m) => (
                        <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          )}

          {/* Audio Option */}
          {selectedModel?.supportsAudio && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="audio"
                checked={audioEnabled}
                onCheckedChange={(checked) => setAudioEnabled(checked === true)}
              />
              <Label htmlFor="audio" className="cursor-pointer text-sm">
                Generate Audio
              </Label>
            </div>
          )}

          {/* Price Info */}
          {selectedModel && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info size={14} />
              <span>Estimated cost:</span>
              <span className="font-bold text-primary">{currentPrice.toLocaleString()} kredit</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={status === GenerationStatus.LOADING || !prompt.trim() || !selectedModel}
            size="lg"
            className="mt-auto w-full gap-2 gradient-brand text-primary-foreground hover:opacity-90"
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
        </form>
      </div>

      {/* Preview Area */}
      <div className="bg-muted rounded-xl border border-border p-4 flex items-center justify-center relative overflow-hidden group min-h-[400px]">
        {status === GenerationStatus.IDLE && (
          <div className="text-center text-muted-foreground">
            <VideoPlaceholder />
            <p className="mt-4">Select a model and enter a prompt to generate a video</p>
          </div>
        )}

        {status === GenerationStatus.LOADING && (
          <div className="flex flex-col items-center gap-4 text-primary">
            <Loader2 size={48} className="animate-spin" />
            <p className="text-sm font-medium animate-pulse">Creating your video...</p>
          </div>
        )}

        {status === GenerationStatus.ERROR && (
          <div className="text-destructive text-center px-6">
            <p className="mb-2">Something went wrong.</p>
            <button
              onClick={() => setStatus(GenerationStatus.IDLE)}
              className="mt-4 text-sm underline hover:text-foreground"
            >
              Try Again
            </button>
          </div>
        )}

        {status === GenerationStatus.SUCCESS && (
          <div className="relative w-full h-full flex items-center justify-center">
            <p className="text-muted-foreground">Video preview will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};

const VideoPlaceholder = () => (
  <svg
    className="w-24 h-24 mx-auto text-muted-foreground/50"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1}
      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
    />
  </svg>
);

export default VideoGen;
