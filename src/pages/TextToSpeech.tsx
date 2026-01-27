import React, { useState } from 'react';
import { Volume2, Play, Pause, Download, Loader2, Coins, Info } from 'lucide-react';
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
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';

const TextToSpeech: React.FC = () => {
  const { credits } = useAuth();
  const [server, setServer] = useState<'server1' | 'server2'>('server1');
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('alloy');
  const [speed, setSpeed] = useState([1.0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const voices = [
    { id: 'alloy', name: 'Alloy' },
    { id: 'echo', name: 'Echo' },
    { id: 'fable', name: 'Fable' },
    { id: 'onyx', name: 'Onyx' },
    { id: 'nova', name: 'Nova' },
    { id: 'shimmer', name: 'Shimmer' },
  ];

  const currentPrice = 0.5; // Placeholder price

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    setIsGenerating(true);
    // TODO: Implement TTS generation
    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleServerChange = (newServer: string) => {
    setServer(newServer as 'server1' | 'server2');
  };

  return (
    <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr,1.5fr] gap-8 min-h-[calc(100vh-8rem)]">
      {/* Controls */}
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Text to Speech</h2>
          <p className="text-muted-foreground">Convert text into natural-sounding speech.</p>
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
          {/* Text Input */}
          <div className="space-y-2">
            <Label htmlFor="text">Text</Label>
            <Textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter the text you want to convert to speech..."
              className="h-40 bg-muted border-border resize-none"
              required
            />
            <p className="text-xs text-muted-foreground">
              {text.length}/4,096 karakter
            </p>
          </div>

          {/* Voice Selection */}
          <div className="space-y-2">
            <Label>Voice</Label>
            <Select value={voice} onValueChange={setVoice}>
              <SelectTrigger className="bg-muted border-border">
                <SelectValue placeholder="Pilih voice..." />
              </SelectTrigger>
              <SelectContent>
                {voices.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Speed Slider */}
          <div className="space-y-2">
            <Label>Speed: {speed[0].toFixed(1)}x</Label>
            <Slider
              value={speed}
              onValueChange={setSpeed}
              min={0.5}
              max={2.0}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Price Info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info size={14} />
            <span>Estimasi biaya:</span>
            <span className="font-bold text-primary">{currentPrice.toLocaleString()} kredit</span>
          </div>

          <Button
            type="submit"
            disabled={isGenerating || !text.trim()}
            size="lg"
            className="mt-auto w-full gap-2 gradient-brand text-primary-foreground hover:opacity-90"
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Volume2 size={18} /> Generate Speech
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Preview Area */}
      <div className="bg-muted rounded-xl border border-border p-6 flex flex-col relative overflow-hidden min-h-[400px]">
        <h3 className="text-lg font-semibold text-foreground mb-4">Output</h3>
        
        <div className="flex-1 flex flex-col items-center justify-center">
          {audioUrl ? (
            <div className="space-y-6 w-full max-w-md">
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePlayPause}
                  className="h-16 w-16 rounded-full border-2"
                >
                  {isPlaying ? <Pause size={28} /> : <Play size={28} />}
                </Button>
              </div>
              <Button variant="outline" className="w-full gap-2">
                <Download size={16} />
                Download Audio
              </Button>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              <Volume2 size={64} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg mb-2">Generated audio will appear here</p>
              <p className="text-sm">Enter text and click Generate Speech</p>
            </div>
          )}
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-auto pt-4 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">
            🚀 Text to Speech feature is coming soon! Stay tuned for updates.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TextToSpeech;
