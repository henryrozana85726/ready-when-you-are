import React, { useState } from 'react';
import { Volume2, Play, Pause, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

const TextToSpeech: React.FC = () => {
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

  const handleGenerate = async () => {
    if (!text.trim()) return;
    
    setIsGenerating(true);
    // TODO: Implement TTS generation
    setTimeout(() => {
      setIsGenerating(false);
      // Placeholder for audio URL
    }, 2000);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-3">
          <Volume2 className="text-primary" size={32} />
          Text to Speech
        </h1>
        <p className="text-muted-foreground">
          Convert your text into natural-sounding speech using AI
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Input Text</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Enter the text you want to convert to speech..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[200px] resize-none"
            />
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Voice</Label>
                <Select value={voice} onValueChange={setVoice}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select voice" />
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
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={!text.trim() || isGenerating}
              className="w-full gradient-brand text-primary-foreground"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Volume2 className="mr-2 h-4 w-4" />
                  Generate Speech
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Output Section */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Output</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center min-h-[200px] bg-muted/50 rounded-lg border border-border">
              {audioUrl ? (
                <div className="space-y-4 w-full p-4">
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handlePlayPause}
                      className="h-12 w-12 rounded-full"
                    >
                      {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                    </Button>
                  </div>
                  <Button variant="outline" className="w-full gap-2">
                    <Download size={16} />
                    Download Audio
                  </Button>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <Volume2 size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Generated audio will appear here</p>
                </div>
              )}
            </div>

            <div className="text-xs text-muted-foreground">
              <p>• Maximum 4,096 characters per request</p>
              <p>• Supports multiple languages</p>
              <p>• Output format: MP3</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coming Soon Notice */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4">
          <p className="text-center text-sm text-muted-foreground">
            🚀 Text to Speech feature is coming soon! Stay tuned for updates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TextToSpeech;
