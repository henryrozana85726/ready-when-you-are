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
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Clock size={18} />
          History
        </h3>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-destructive text-sm">
        <AlertCircle size={16} className="inline mr-1" />
        Failed to load history
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Clock size={18} />
          History
        </h3>
        <p className="text-sm text-muted-foreground">Belum ada video yang digenerate</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <Clock size={18} />
        History ({history.length})
      </h3>
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-3">
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
