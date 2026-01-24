import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Download, Play, Clock, Coins, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface VideoGeneration {
  id: string;
  prompt: string;
  status: string;
  output_url: string | null;
  credits_used: number;
  duration_seconds: number | null;
  resolution: string | null;
  aspect_ratio: string | null;
  audio_enabled: boolean | null;
  mode: string | null;
  model_name: string | null;
  error_message: string | null;
  created_at: string;
}

const VideoHistory: React.FC = () => {
  const { data: history, isLoading, error } = useQuery({
    queryKey: ['video-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('video_generations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as VideoGeneration[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
          <Clock size={18} />
          History
        </h3>
        <div className="space-y-2 flex-1">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-destructive text-sm">
        <AlertCircle size={16} className="inline mr-1" />
        Failed to load history
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
        <svg
          className="w-24 h-24 mx-auto text-muted-foreground/50 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        <p>Select a model and enter a prompt to generate a video</p>
        <p className="text-xs mt-2">Your video history will appear here</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
        <Clock size={18} />
        History ({history.length})
      </h3>
      <ScrollArea className="flex-1">
        <div className="grid gap-3 pr-4">
          {history.map((item) => (
            <HistoryItem key={item.id} item={item} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

const HistoryItem: React.FC<{ item: VideoGeneration }> = ({ item }) => {
  const statusConfig = {
    completed: { label: 'Selesai', variant: 'default' as const, icon: Play },
    pending: { label: 'Proses', variant: 'secondary' as const, icon: Loader2 },
    failed: { label: 'Gagal', variant: 'destructive' as const, icon: AlertCircle },
  };

  const status = statusConfig[item.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <div className="p-3 bg-muted/50 border border-border rounded-lg space-y-2 hover:bg-muted transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-foreground line-clamp-2 flex-1">{item.prompt}</p>
        <Badge variant={status.variant} className="shrink-0 text-xs">
          <StatusIcon size={12} className={item.status === 'pending' ? 'animate-spin mr-1' : 'mr-1'} />
          {status.label}
        </Badge>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>{format(new Date(item.created_at), 'dd MMM yyyy HH:mm', { locale: idLocale })}</span>
        {item.model_name && <span>• {item.model_name}</span>}
        {item.duration_seconds && <span>• {item.duration_seconds}s</span>}
        {item.resolution && <span>• {item.resolution}</span>}
        {item.aspect_ratio && <span>• {item.aspect_ratio}</span>}
        {item.audio_enabled && <span>• 🔊 Audio</span>}
        <span className="flex items-center gap-1">
          <Coins size={10} />
          {item.credits_used}
        </span>
      </div>

      {/* Error message */}
      {item.status === 'failed' && item.error_message && (
        <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">
          {item.error_message}
        </p>
      )}

      {/* Video preview & download */}
      {item.status === 'completed' && item.output_url && (
        <div className="flex items-center gap-2 pt-1">
          <video
            src={item.output_url}
            className="h-16 w-auto rounded border border-border"
            muted
            preload="metadata"
          />
          <a
            href={item.output_url}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Download size={12} />
            Download
          </a>
        </div>
      )}
    </div>
  );
};

export default VideoHistory;
