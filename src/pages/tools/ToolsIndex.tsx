import React from 'react';
import { Rocket, Link2, FileImage, Volume2, ScanSearch, Wrench, Coins } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const tools = [
  {
    title: 'Veo Launcher',
    description: 'Luncurkan dan kelola proyek video generation dengan antrian batch processing untuk Veo 3.1.',
    icon: Rocket,
    iconColor: 'text-primary',
    bgColor: 'bg-primary/10',
    price: '1.5',
    priceUnit: 'per video',
    status: 'coming_soon',
  },
  {
    title: 'Affiliate Editor',
    description: 'Buat dan kelola tautan afiliasi dengan tracking analytics dan campaign management.',
    icon: Link2,
    iconColor: 'text-accent',
    bgColor: 'bg-accent/10',
    price: 'Free',
    priceUnit: '',
    status: 'coming_soon',
  },
  {
    title: 'Image Converter',
    description: 'Konversi gambar antar format (PNG, JPG, WebP, AVIF) dengan kompresi optimal.',
    icon: FileImage,
    iconColor: 'text-warning',
    bgColor: 'bg-warning/10',
    price: 'Free',
    priceUnit: '',
    status: 'coming_soon',
  },
  {
    title: 'Text to Speech',
    description: 'Konversi teks menjadi audio berkualitas tinggi dengan berbagai pilihan suara AI natural.',
    icon: Volume2,
    iconColor: 'text-success',
    bgColor: 'bg-success/10',
    price: '0.02',
    priceUnit: 'per 1000 karakter',
    status: 'coming_soon',
  },
  {
    title: 'Image/Video to Prompt',
    description: 'Generate prompt deskriptif dari gambar atau video menggunakan AI vision model.',
    icon: ScanSearch,
    iconColor: 'text-info',
    bgColor: 'bg-info/10',
    price: '0.01',
    priceUnit: 'per analisis',
    status: 'coming_soon',
  },
];

const ToolsIndex: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
          <Wrench className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          Tools
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Koleksi utility tools untuk meningkatkan produktivitas workflow kreatif Anda.
        </p>
      </div>

      {/* Tools Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <Card
            key={tool.title}
            className="group relative overflow-hidden border-border hover:border-primary/50 transition-all duration-300 card-hover"
          >
            <CardContent className="p-6 space-y-4">
              {/* Icon & Status */}
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-lg ${tool.bgColor} border border-border group-hover:scale-110 transition-transform duration-300`}>
                  <tool.icon className={tool.iconColor} size={24} />
                </div>
                {tool.status === 'coming_soon' && (
                  <Badge variant="secondary" className="text-xs">
                    Coming Soon
                  </Badge>
                )}
              </div>

              {/* Content */}
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-foreground">
                  {tool.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed min-h-[60px]">
                  {tool.description}
                </p>
              </div>

              {/* Price */}
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <Coins size={16} className="text-warning" />
                <span className="text-foreground font-semibold">
                  {tool.price === 'Free' ? 'Gratis' : `${tool.price} koin`}
                </span>
                {tool.priceUnit && (
                  <span className="text-muted-foreground text-sm">
                    {tool.priceUnit}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center md:text-left">
            <div className="p-3 rounded-full bg-primary/10">
              <Wrench className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-foreground font-medium">
                Tools sedang dalam pengembangan
              </p>
              <p className="text-muted-foreground text-sm">
                Fitur-fitur ini akan segera tersedia. Stay tuned untuk update terbaru!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ToolsIndex;
