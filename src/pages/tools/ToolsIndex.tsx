import React from 'react';
import { Link } from 'react-router-dom';
import { Rocket, Link2, FileImage, Volume2, ScanSearch, ArrowRight, Wrench } from 'lucide-react';

const tools = [
  {
    title: 'Veo Launcher',
    description: 'Launch and manage Veo video generation projects.',
    icon: Rocket,
    path: '/tools/veo-launcher',
    iconColor: 'text-primary',
    gradientClass: 'from-primary/20 to-primary/5',
  },
  {
    title: 'Affiliate Editor',
    description: 'Create and manage affiliate links and campaigns.',
    icon: Link2,
    path: '/tools/affiliate-editor',
    iconColor: 'text-accent',
    gradientClass: 'from-accent/20 to-accent/5',
  },
  {
    title: 'Image Converter',
    description: 'Convert images between different formats easily.',
    icon: FileImage,
    path: '/tools/image-converter',
    iconColor: 'text-warning',
    gradientClass: 'from-warning/20 to-warning/5',
  },
  {
    title: 'Text to Speech',
    description: 'Convert text to natural-sounding speech using AI.',
    icon: Volume2,
    path: '/tools/text-to-speech',
    iconColor: 'text-success',
    gradientClass: 'from-success/20 to-success/5',
  },
  {
    title: 'Image/Video to Prompt',
    description: 'Generate prompts from images or videos using AI.',
    icon: ScanSearch,
    path: '/tools/image-video-to-prompt',
    iconColor: 'text-info',
    gradientClass: 'from-info/20 to-info/5',
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
          A collection of utility tools to enhance your creative workflow.
        </p>
      </div>

      {/* Tools Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <Link
            key={tool.path}
            to={tool.path}
            className="group relative p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300 card-hover overflow-hidden"
          >
            {/* Gradient overlay on hover */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${tool.gradientClass} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
            />

            <div className="relative z-10 space-y-4">
              {/* Icon */}
              <div className="p-3 bg-muted rounded-lg w-fit group-hover:scale-110 transition-transform duration-300 border border-border">
                <tool.icon className={tool.iconColor} size={24} />
              </div>

              {/* Content */}
              <div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {tool.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {tool.description}
                </p>
              </div>

              {/* CTA */}
              <div className="flex items-center text-primary text-sm font-medium group-hover:translate-x-1 transition-transform">
                Open tool <ArrowRight size={16} className="ml-1" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ToolsIndex;
