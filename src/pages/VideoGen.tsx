import React, { useState } from 'react';
import { Play, Loader2, AlertCircle, FileVideo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { GenerationStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';

const VideoGen: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  const { toast } = useToast();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setStatus(GenerationStatus.LOADING);
    setLoadingMessage('Submitting request...');
    setError(null);
    setVideoUrl(null);

    // Show loading messages during generation
    const msgs = [
      "Dreaming up your scene...",
      "Rendering frames in high definition...",
      "Applying cinematic lighting...",
      "Almost there, finalizing output...",
    ];
    let msgIdx = 0;
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % msgs.length;
      setLoadingMessage(msgs[msgIdx]);
    }, 4000);

    // Simulate video generation (placeholder - would need real API)
    setTimeout(() => {
      clearInterval(interval);
      setError('Video generation is coming soon! This feature requires additional backend setup.');
      setStatus(GenerationStatus.ERROR);
      toast({
        title: 'Coming Soon',
        description: 'Video generation will be available soon.',
        variant: 'default',
      });
    }, 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Video Generation</h2>
        <p className="text-muted-foreground">Create short, high-quality videos with AI.</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-6">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="video-prompt">Prompt</Label>
            <Textarea
              id="video-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A cinematic drone shot of a cyberpunk city at night, rain falling, neon reflections..."
              className="h-24 bg-muted border-border resize-none"
            />
          </div>

          <Button
            type="submit"
            disabled={status === GenerationStatus.LOADING || !prompt.trim()}
            size="lg"
            className="w-full gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {status === GenerationStatus.LOADING ? (
              <>
                <Loader2 className="animate-spin" /> {loadingMessage}
              </>
            ) : (
              <>
                <Play fill="currentColor" /> Generate Video
              </>
            )}
          </Button>
        </form>

        {(status === GenerationStatus.SUCCESS ||
          status === GenerationStatus.ERROR ||
          status === GenerationStatus.LOADING) && (
          <div className="border-t border-border pt-6">
            {status === GenerationStatus.LOADING && (
              <div className="h-64 flex flex-col items-center justify-center text-muted-foreground space-y-4 bg-muted/50 rounded-xl">
                <Loader2 size={40} className="animate-spin text-accent" />
                <p className="text-sm font-medium animate-pulse max-w-xs text-center">
                  {loadingMessage}
                </p>
                <p className="text-xs">This may take a minute or two.</p>
              </div>
            )}

            {status === GenerationStatus.ERROR && (
              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl flex items-start gap-3">
                <AlertCircle className="text-destructive shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-destructive">Generation Notice</h4>
                  <p className="text-muted-foreground text-sm mt-1">{error}</p>
                </div>
              </div>
            )}

            {status === GenerationStatus.SUCCESS && videoUrl && (
              <div className="space-y-2">
                <p className="text-sm text-success font-medium">
                  Video Generated Successfully!
                </p>
                <div className="aspect-video bg-background rounded-xl overflow-hidden shadow-2xl border border-border">
                  <video
                    src={videoUrl}
                    controls
                    autoPlay
                    loop
                    className="w-full h-full object-contain"
                  />
                </div>
                <a
                  href={videoUrl}
                  download={`bs30-video-${Date.now()}.mp4`}
                  className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent/80 mt-2"
                >
                  <FileVideo size={16} /> Download MP4
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoGen;
