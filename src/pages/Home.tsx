import React from 'react';
import { Link } from 'react-router-dom';
import { Image as ImageIcon, Video, Volume2, ZoomIn, MessageSquare, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    title: 'Image Generation',
    description: 'Create stunning visuals from text prompts using advanced AI models.',
    icon: ImageIcon,
    path: '/image',
    iconColor: 'text-primary',
    gradientClass: 'from-primary/20 to-primary/5',
  },
  {
    title: 'Video Generation',
    description: 'Generate high-quality videos with AI. Bring your ideas to motion.',
    icon: Video,
    path: '/video',
    iconColor: 'text-accent',
    gradientClass: 'from-accent/20 to-accent/5',
  },
  {
    title: 'Text to Speech',
    description: 'Convert your text into natural-sounding speech using AI voices.',
    icon: Volume2,
    path: '/tts',
    iconColor: 'text-warning',
    gradientClass: 'from-warning/20 to-warning/5',
  },
  {
    title: 'Image Upscaler',
    description: 'Enhance and upscale your images with AI-powered technology.',
    icon: ZoomIn,
    path: '/upscaler',
    iconColor: 'text-info',
    gradientClass: 'from-info/20 to-info/5',
  },
  {
    title: 'AI Assistant',
    description: 'Smart utilities for text analysis, chat, and creative writing.',
    icon: MessageSquare,
    path: '/tools',
    iconColor: 'text-success',
    gradientClass: 'from-success/20 to-success/5',
  },
];

const Home: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-fade-in">
      {/* Hero Section */}
      <div className="text-center space-y-6 py-12">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
          Welcome to{' '}
          <span className="gradient-text">BS30 Tools</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Unleash your creativity with our suite of world-class generative AI tools.
          Powered by the latest AI models.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Button asChild size="lg" className="gap-2 gradient-brand text-primary-foreground hover:opacity-90 transition-opacity">
            <Link to="/image">
              Start Creating <Sparkles size={18} />
            </Link>
          </Button>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {features.map((feature) => (
          <Link
            key={feature.path}
            to={feature.path}
            className="group relative p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300 card-hover overflow-hidden"
          >
            {/* Gradient overlay on hover */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${feature.gradientClass} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
            />

            <div className="relative z-10 space-y-4">
              {/* Icon */}
              <div className="p-3 bg-muted rounded-lg w-fit group-hover:scale-110 transition-transform duration-300 border border-border">
                <feature.icon className={feature.iconColor} size={28} />
              </div>

              {/* Content */}
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* CTA */}
              <div className="flex items-center text-primary text-sm font-medium group-hover:translate-x-1 transition-transform">
                Try now <ArrowRight size={16} className="ml-1" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Home;
