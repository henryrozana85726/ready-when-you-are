import React, { useState, useCallback } from 'react';
import { ZoomIn, Upload, Download, Loader2, X, Image as ImageIcon, Coins, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

const ImageUpscaler: React.FC = () => {
  const { credits } = useAuth();
  const [server, setServer] = useState<'server1' | 'server2'>('server1');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [upscaledImage, setUpscaledImage] = useState<string | null>(null);
  const [scale, setScale] = useState('2');
  const [isProcessing, setIsProcessing] = useState(false);

  const scales = [
    { value: '2', label: '2x Upscale' },
    { value: '4', label: '4x Upscale' },
  ];

  const currentPrice = scale === '4' ? 2 : 1; // Placeholder price

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      setUpscaledImage(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      setUpscaledImage(null);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const clearImage = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setUpscaledImage(null);
  };

  const handleUpscale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImage) return;
    
    setIsProcessing(true);
    // TODO: Implement image upscaling
    setTimeout(() => {
      setIsProcessing(false);
    }, 3000);
  };

  const handleServerChange = (newServer: string) => {
    setServer(newServer as 'server1' | 'server2');
  };

  return (
    <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr,1.5fr] gap-8 min-h-[calc(100vh-8rem)]">
      {/* Controls */}
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Image Upscaler</h2>
          <p className="text-muted-foreground">Enhance and upscale your images with AI.</p>
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

        <form onSubmit={handleUpscale} className="flex flex-col gap-4 flex-1">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Upload Image</Label>
            {!selectedImage ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="flex flex-col items-center justify-center h-48 bg-muted rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer"
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer text-center p-4">
                  <Upload size={32} className="mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground mb-1">
                    Drag and drop or click to select
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports: JPG, PNG, WebP (Max 10MB)
                  </p>
                </label>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={selectedImage}
                  alt="Selected"
                  className="w-full h-48 object-contain rounded-lg border border-border bg-background"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={clearImage}
                >
                  <X size={14} />
                </Button>
                {selectedFile && (
                  <p className="mt-2 text-sm text-muted-foreground truncate">
                    {selectedFile.name}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Upscale Factor */}
          <div className="space-y-2">
            <Label>Upscale Factor</Label>
            <Select value={scale} onValueChange={setScale}>
              <SelectTrigger className="bg-muted border-border">
                <SelectValue placeholder="Pilih scale..." />
              </SelectTrigger>
              <SelectContent>
                {scales.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price Info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info size={14} />
            <span>Estimasi biaya:</span>
            <span className="font-bold text-primary">{currentPrice.toLocaleString()} kredit</span>
          </div>

          <Button
            type="submit"
            disabled={!selectedImage || isProcessing}
            size="lg"
            className="mt-auto w-full gap-2 gradient-brand text-primary-foreground hover:opacity-90"
          >
            {isProcessing ? (
              <>
                <Loader2 className="animate-spin" /> Processing...
              </>
            ) : (
              <>
                <ZoomIn size={18} /> Upscale Image
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Preview Area */}
      <div className="bg-muted rounded-xl border border-border p-6 flex flex-col relative overflow-hidden min-h-[400px]">
        <h3 className="text-lg font-semibold text-foreground mb-4">Result</h3>
        
        <div className="flex-1 flex flex-col items-center justify-center">
          {upscaledImage ? (
            <div className="w-full space-y-4">
              <img
                src={upscaledImage}
                alt="Upscaled"
                className="w-full h-auto rounded-lg border border-border"
              />
              <Button variant="outline" className="w-full gap-2">
                <Download size={16} />
                Download Upscaled Image
              </Button>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              <ImageIcon size={64} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg mb-2">Upscaled image will appear here</p>
              <p className="text-sm">Upload an image and click Upscale Image</p>
            </div>
          )}
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-auto pt-4 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">
            🚀 Image Upscaler feature is coming soon! Stay tuned for updates.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImageUpscaler;
