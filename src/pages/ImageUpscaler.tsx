import React, { useState, useCallback } from 'react';
import { ZoomIn, Upload, Download, Loader2, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const ImageUpscaler: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [upscaledImage, setUpscaledImage] = useState<string | null>(null);
  const [scale, setScale] = useState('2');
  const [isProcessing, setIsProcessing] = useState(false);

  const scales = [
    { value: '2', label: '2x Upscale' },
    { value: '4', label: '4x Upscale' },
  ];

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

  const handleUpscale = async () => {
    if (!selectedImage) return;
    
    setIsProcessing(true);
    // TODO: Implement image upscaling
    setTimeout(() => {
      setIsProcessing(false);
      // Placeholder for upscaled image
    }, 3000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-3">
          <ZoomIn className="text-primary" size={32} />
          Image Upscaler
        </h1>
        <p className="text-muted-foreground">
          Enhance and upscale your images using AI-powered technology
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Original Image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedImage ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="flex flex-col items-center justify-center min-h-[300px] bg-muted/50 rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer"
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer text-center">
                  <Upload size={48} className="mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-2">
                    Drag and drop an image here, or click to select
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
                  className="w-full h-auto rounded-lg border border-border"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={clearImage}
                >
                  <X size={16} />
                </Button>
                {selectedFile && (
                  <p className="mt-2 text-sm text-muted-foreground truncate">
                    {selectedFile.name}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Upscale Factor</Label>
              <Select value={scale} onValueChange={setScale}>
                <SelectTrigger>
                  <SelectValue placeholder="Select scale" />
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

            <Button 
              onClick={handleUpscale} 
              disabled={!selectedImage || isProcessing}
              className="w-full gradient-brand text-primary-foreground"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ZoomIn className="mr-2 h-4 w-4" />
                  Upscale Image
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Output Section */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Upscaled Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center min-h-[300px] bg-muted/50 rounded-lg border border-border">
              {upscaledImage ? (
                <div className="w-full">
                  <img
                    src={upscaledImage}
                    alt="Upscaled"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Upscaled image will appear here</p>
                </div>
              )}
            </div>

            {upscaledImage && (
              <Button variant="outline" className="w-full gap-2">
                <Download size={16} />
                Download Upscaled Image
              </Button>
            )}

            <div className="text-xs text-muted-foreground">
              <p>• AI-powered image enhancement</p>
              <p>• Preserves details and sharpness</p>
              <p>• Output format: PNG</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coming Soon Notice */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4">
          <p className="text-center text-sm text-muted-foreground">
            🚀 Image Upscaler feature is coming soon! Stay tuned for updates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageUpscaler;
