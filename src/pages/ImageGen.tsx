import React, { useState, useMemo } from 'react';
import { Sparkles, Loader2, Upload, X, Coins, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  getImageModelsByServer,
  calculateImagePrice,
} from '@/config/imageModels';
import { supabase } from '@/integrations/supabase/client';
import ImageHistory from '@/components/ImageHistory';
import { useQueryClient } from '@tanstack/react-query';

type GenerationType = 'text-to-image' | 'image-to-image';

const ImageGen: React.FC = () => {
  const { credits, refreshCredits } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State
  const [server, setServer] = useState<'server1' | 'server2'>('server1');
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('');
  const [resolution, setResolution] = useState('');
  const [outputFormat, setOutputFormat] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Get models for selected server
  const models = useMemo(() => getImageModelsByServer(server), [server]);
  
  // Get selected model
  const selectedModel = useMemo(
    () => models.find((m) => m.id === selectedModelId),
    [models, selectedModelId]
  );

  // Determine generation type based on uploaded images
  const generationType: GenerationType = useMemo(() => {
    return images.length > 0 ? 'image-to-image' : 'text-to-image';
  }, [images.length]);

  // Calculate current price
  const currentPrice = useMemo(() => {
    if (!selectedModel) return 0;
    return calculateImagePrice(selectedModel, { resolution });
  }, [selectedModel, resolution]);

  // Reset form when model changes
  const handleModelChange = (modelId: string) => {
    setSelectedModelId(modelId);
    const model = models.find((m) => m.id === modelId);
    if (model) {
      setAspectRatio(model.defaultAspectRatio);
      setResolution(model.defaultResolution);
      setOutputFormat(model.defaultOutputFormat);
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
    
    const maxImages = selectedModel?.maxImages || 1;
    const newImages = [...images, ...Array.from(files)].slice(0, maxImages);
    
    // Check file constraints for server 2
    if (selectedModel?.imageConstraints) {
      const { maxSizeMb, allowedFormats } = selectedModel.imageConstraints;
      const validImages = newImages.filter(file => {
        const sizeMb = file.size / (1024 * 1024);
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (maxSizeMb && sizeMb > maxSizeMb) {
          toast({
            title: 'File terlalu besar',
            description: `Maksimal ${maxSizeMb}MB per file`,
            variant: 'destructive',
          });
          return false;
        }
        if (allowedFormats && ext && !allowedFormats.includes(ext)) {
          toast({
            title: 'Format tidak didukung',
            description: `Format yang diizinkan: ${allowedFormats.join(', ')}`,
            variant: 'destructive',
          });
          return false;
        }
        return true;
      });
      setImages(validImages);
    } else {
      setImages(newImages);
    }
  };

  // Remove image
  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Convert file to base64 data URL
  const fileToBase64 = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Get available aspect ratios based on generation type
  const availableAspectRatios = useMemo(() => {
    if (!selectedModel || selectedModel.aspectRatios.length === 0) return [];
    
    // Check if we should add 'auto' for image mode
    if (selectedModel.aspectRatioConditions?.addAutoForImageMode && generationType === 'image-to-image') {
      return ['auto', ...selectedModel.aspectRatios];
    }
    
    return selectedModel.aspectRatios;
  }, [selectedModel, generationType]);

  // Update aspect ratio when generation type changes for models with addAutoForImageMode
  React.useEffect(() => {
    if (!selectedModel?.aspectRatioConditions?.addAutoForImageMode) return;
    
    if (generationType === 'text-to-image') {
      // Switch to default when switching to text-to-image
      if (aspectRatio === 'auto') {
        setAspectRatio(selectedModel.defaultAspectRatio);
      }
    } else {
      // Switch to 'auto' when switching to image mode
      setAspectRatio('auto');
    }
  }, [generationType, selectedModel]);

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

    setIsGenerating(true);

    try {
      // Convert images to base64
      const imageBase64s = await Promise.all(images.map(fileToBase64));

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create pending record FIRST so it shows immediately in history
      const { data: pendingRecord, error: insertError } = await supabase
        .from('image_generations')
        .insert({
          user_id: user.id,
          prompt,
          aspect_ratio: aspectRatio,
          resolution,
          output_format: outputFormat,
          model_id: selectedModel.id,
          model_name: selectedModel.name,
          server,
          status: 'pending',
          credits_used: currentPrice,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Failed to create pending record:', insertError);
        throw new Error('Failed to start generation');
      }

      // Immediately refresh history to show the pending thumbnail
      queryClient.invalidateQueries({ queryKey: ['image-history'] });

      // Now call the edge function with the generation ID
      const { data, error: fnError } = await supabase.functions.invoke('generate-image', {
        body: {
          generationId: pendingRecord.id,
          prompt,
          aspectRatio,
          resolution,
          outputFormat,
          images: imageBase64s,
          modelId: selectedModel.id,
          modelName: selectedModel.name,
          server,
          creditsToUse: currentPrice,
        },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Failed to generate image');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.imageUrl) {
        // Refresh history and credits
        await refreshCredits();
        queryClient.invalidateQueries({ queryKey: ['image-history'] });
        
        toast({
          title: 'Gambar berhasil dibuat!',
          description: `${currentPrice.toLocaleString()} kredit telah digunakan.`,
        });
      } else {
        throw new Error('No image returned');
      }
    } catch (err: any) {
      console.error('Image generation error:', err);
      // Refresh history to show the failed item
      queryClient.invalidateQueries({ queryKey: ['image-history'] });
      toast({
        title: 'Gagal membuat gambar',
        description: err.message || 'Terjadi kesalahan',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr,1.5fr] gap-8 min-h-[calc(100vh-8rem)]">
      {/* Controls */}
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Image Generation</h2>
          <p className="text-muted-foreground">Transform your words into visual art.</p>
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
                <SelectValue placeholder="Pilih model..." />
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
              placeholder="A futuristic city with flying cars, neon lights, cyberpunk style..."
              className="h-32 bg-muted border-border resize-none"
              required
            />
          </div>

          {/* Image Upload */}
          {selectedModel && selectedModel.supportsImageToImage && (
            <div className="space-y-2">
              <Label>
                Images (opsional, maks {selectedModel.maxImages})
                {selectedModel.imageConstraints && (
                  <span className="text-xs text-muted-foreground ml-2">
                    (maks {selectedModel.imageConstraints.maxSizeMb}MB, {selectedModel.imageConstraints.allowedFormats?.join('/')})
                  </span>
                )}
              </Label>
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
                      multiple
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {generationType === 'text-to-image' && 'Text to Image'}
                {generationType === 'image-to-image' && 'Image to Image'}
              </p>
            </div>
          )}

          {/* Options */}
          {selectedModel && (
            <div className="space-y-2">
              <Label>Options</Label>
              <div className="grid grid-cols-2 gap-2">
                {/* Aspect Ratio */}
                {availableAspectRatios.length > 0 && (
                  <Select value={aspectRatio} onValueChange={setAspectRatio}>
                    <SelectTrigger className="bg-muted border-border">
                      <SelectValue placeholder="Aspect Ratio" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableAspectRatios.map((ar) => (
                        <SelectItem key={ar} value={ar} className="capitalize">
                          {ar === 'auto' ? 'Auto' : ar}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Resolution */}
                {selectedModel.resolutions.length > 0 && (
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

                {/* Output Format */}
                {selectedModel.outputFormats.length > 0 && (
                  <Select value={outputFormat} onValueChange={setOutputFormat}>
                    <SelectTrigger className="bg-muted border-border">
                      <SelectValue placeholder="Format" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedModel.outputFormats.map((f) => (
                        <SelectItem key={f} value={f} className="uppercase">{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          )}

          {/* Price Info */}
          {selectedModel && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info size={14} />
              <span>Estimasi biaya:</span>
              <span className="font-bold text-primary">{currentPrice.toLocaleString()} kredit</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={isGenerating || !prompt.trim() || !selectedModel}
            size="lg"
            className="mt-auto w-full gap-2 gradient-brand text-primary-foreground hover:opacity-90"
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Sparkles /> Generate Image
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Preview Area */}
      <div className="bg-muted rounded-xl border border-border p-4 flex flex-col relative overflow-hidden min-h-[400px]">
        {/* Always show history - pending items will show as thumbnails */}
        <ImageHistory onUsePrompt={(p) => setPrompt(p)} />
      </div>
    </div>
  );
};

const ImagePlaceholder = () => (
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
      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

export default ImageGen;
