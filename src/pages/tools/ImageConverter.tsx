import React from 'react';
import { FileImage } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const ImageConverter: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Image Converter</h2>
          <p className="text-muted-foreground">Convert images between different formats.</p>
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center">
              <FileImage className="w-8 h-8 text-warning" />
            </div>
            <p className="text-muted-foreground">
              🖼️ Image Converter is coming soon! Stay tuned for updates.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageConverter;
