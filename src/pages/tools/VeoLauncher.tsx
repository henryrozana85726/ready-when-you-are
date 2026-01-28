import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';

interface VeoLink {
  label: string;
  baseId: string;
}

const veoLinks: VeoLink[] = [
  { label: 'Veo2 Portrait', baseId: '11afkAEaY7X9gaP8cZ42mTAfIBIg5K7aI' },
  { label: 'Veo2 Landscape', baseId: '1Yx1r8WzllXIy0oFUYXhz0Uh8SOR4LtNV' },
  { label: 'Veo3.1 Portrait', baseId: '1GsGSFjIMKX3RBGl67EWs5lGDSRngZIAm' },
  { label: 'Veo3.1 Landscape', baseId: '17voy6VIbBUiRnE-pLZc-GlrHcxvFtQfy' },
];

const getGeminiUrl = (tabIndex: number, baseId: string): string => {
  if (tabIndex === 0) {
    return `https://gemini.google.com/gem-labs/${baseId}`;
  }
  return `https://gemini.google.com/u/${tabIndex}/gem-labs/${baseId}`;
};

const VeoLauncher: React.FC = () => {
  const tabs = Array.from({ length: 10 }, (_, i) => i);

  const handleLinkClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Veo Launcher</h1>
        <p className="text-muted-foreground">
          Quick access to Google Veo video generation labs for multiple accounts.
        </p>
      </div>

      {/* Tabs Grid */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {tabs.map((tabIndex) => (
          <Card 
            key={tabIndex} 
            className="border-border bg-card hover:border-primary/30 transition-colors"
          >
            <CardHeader className="pb-3 pt-4 px-4">
              <div className="flex items-center justify-between">
                <Badge variant="default" className="bg-primary text-primary-foreground font-semibold">
                  Tab {tabIndex + 1}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Akun {tabIndex + 1}
                </span>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0 space-y-1">
              {veoLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => handleLinkClick(getGeminiUrl(tabIndex, link.baseId))}
                  className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg text-left text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors group"
                >
                  <span>{link.label}</span>
                  <ExternalLink 
                    size={14} 
                    className="opacity-0 group-hover:opacity-100 transition-opacity" 
                  />
                </button>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default VeoLauncher;
