import React, { useState } from 'react';
import { Download, Sparkles, Loader2, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { GenerationStatus } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const aspectRatios = ['1:1', '16:9', '9:16', '3:4', '4:3'];

const ImageGen: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setStatus(GenerationStatus.LOADING);
    setError(null);
    setResultImage(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-image', {
        body: { prompt, aspectRatio },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Failed to generate image');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.imageUrl) {
        setResultImage(data.imageUrl);
        setStatus(GenerationStatus.SUCCESS);
        toast({
          title: 'Image generated!',
          description: 'Your image has been created successfully.',
        });
      } else {
        throw new Error('No image returned');
      }
    } catch (err: any) {
      console.error('Image generation error:', err);
      setError(err.message || 'Failed to generate image');
      setStatus(GenerationStatus.ERROR);
      toast({
        title: 'Generation failed',
        description: err.message || 'Something went wrong',
        variant: 'destructive',
      });
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

        <form onSubmit={handleGenerate} className="flex flex-col gap-4 flex-1">
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A futuristic city with flying cars, neon lights, cyberpunk style..."
              className="h-32 bg-muted border-border resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Aspect Ratio</Label>
            <div className="grid grid-cols-3 gap-2">
              {aspectRatios.map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setAspectRatio(ratio)}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium border transition-all
                    ${
                      aspectRatio === ratio
                        ? 'bg-primary/20 border-primary text-primary'
                        : 'bg-muted border-border text-muted-foreground hover:border-muted-foreground'
                    }
                  `}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            disabled={status === GenerationStatus.LOADING || !prompt.trim()}
            size="lg"
            className="mt-auto w-full gap-2 gradient-brand text-primary-foreground hover:opacity-90"
          >
            {status === GenerationStatus.LOADING ? (
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
      <div className="bg-muted rounded-xl border border-border p-4 flex items-center justify-center relative overflow-hidden group min-h-[400px]">
        {status === GenerationStatus.IDLE && (
          <div className="text-center text-muted-foreground">
            <ImagePlaceholder />
            <p className="mt-4">Enter a prompt to generate an image</p>
          </div>
        )}

        {status === GenerationStatus.LOADING && (
          <div className="flex flex-col items-center gap-4 text-primary">
            <Loader2 size={48} className="animate-spin" />
            <p className="text-sm font-medium animate-pulse">Dreaming up your image...</p>
          </div>
        )}

        {status === GenerationStatus.ERROR && (
          <div className="text-destructive text-center px-6">
            <p className="mb-2">Something went wrong.</p>
            <p className="text-sm opacity-80">{error}</p>
            <button
              onClick={() => setStatus(GenerationStatus.IDLE)}
              className="mt-4 text-sm underline hover:text-foreground"
            >
              Try Again
            </button>
          </div>
        )}

        {status === GenerationStatus.SUCCESS && resultImage && (
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={resultImage}
              alt={prompt}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <a
                href={resultImage}
                download={`bs30-generated-${Date.now()}.png`}
                className="p-2 bg-background/80 hover:bg-background text-foreground rounded-lg backdrop-blur-sm transition-colors border border-border"
              >
                <Download size={20} />
              </a>
              <button
                onClick={handleGenerate}
                className="p-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg backdrop-blur-sm transition-colors"
                title="Regenerate"
              >
                <RefreshCcw size={20} />
              </button>
            </div>
          </div>
        )}
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
