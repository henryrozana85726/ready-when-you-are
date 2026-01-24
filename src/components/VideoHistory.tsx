import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Download, Play, Clock, Coins, AlertCircle, Loader2, X, Video } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

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
  const [selectedVideo, setSelectedVideo] = useState<VideoGeneration | null>(null);

  const { data: history, isLoading, error } = useQuery({
    queryKey: ['video-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('video_generations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(24); // 4x6 grid = 24 items

      if (error) throw error;
      return data as VideoGeneration[];
    },
    refetchInterval: (query) => {
      const data = query.state.data as VideoGeneration[] | undefined;
      return data?.some((x) => x.status === 'pending') ? 5000 : false;
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
          <Clock size={18} />
          History
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-video w-full rounded-lg" />
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 pr-4">
          {history.map((item) => (
            <ThumbnailItem
              key={item.id}
              item={item}
              onClick={() => setSelectedVideo(item)}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Video Detail Dialog */}
      <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedVideo && <VideoDetailContent video={selectedVideo} onClose={() => setSelectedVideo(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface ThumbnailItemProps {
  item: VideoGeneration;
  onClick: () => void;
}

const ThumbnailItem: React.FC<ThumbnailItemProps> = ({ item, onClick }) => {
  const isPending = item.status === 'pending';
  const isFailed = item.status === 'failed';
  const isCompleted = item.status === 'completed';

  return (
    <button
      onClick={onClick}
      className="relative aspect-video bg-muted/50 border border-border rounded-lg overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all group focus:outline-none focus:ring-2 focus:ring-primary"
    >
      {/* Video thumbnail or placeholder */}
      {isCompleted && item.output_url ? (
        <video
          src={item.output_url}
          className="w-full h-full object-cover"
          muted
          preload="metadata"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <Video size={24} className="text-muted-foreground/50" />
        </div>
      )}

      {/* Status overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {/* Status badge */}
      <div className="absolute top-1 right-1">
        {isPending && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
            <Loader2 size={10} className="animate-spin mr-0.5" />
            Proses
          </Badge>
        )}
        {isFailed && (
          <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5">
            <AlertCircle size={10} className="mr-0.5" />
            Gagal
          </Badge>
        )}
      </div>

      {/* Play icon overlay for completed videos */}
      {isCompleted && item.output_url && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center">
            <Play size={20} className="text-primary-foreground ml-0.5" />
          </div>
        </div>
      )}

      {/* Credits badge */}
      <div className="absolute bottom-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-background/80">
          <Coins size={10} className="mr-0.5" />
          {item.credits_used}
        </Badge>
      </div>
    </button>
  );
};

interface VideoDetailContentProps {
  video: VideoGeneration;
  onClose: () => void;
}

const VideoDetailContent: React.FC<VideoDetailContentProps> = ({ video }) => {
  const statusConfig = {
    completed: { label: 'Selesai', variant: 'default' as const, icon: Play },
    pending: { label: 'Sedang Diproses', variant: 'secondary' as const, icon: Loader2 },
    failed: { label: 'Gagal', variant: 'destructive' as const, icon: AlertCircle },
  };

  const status = statusConfig[video.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Badge variant={status.variant}>
            <StatusIcon size={12} className={video.status === 'pending' ? 'animate-spin mr-1' : 'mr-1'} />
            {status.label}
          </Badge>
          <span className="text-sm font-normal text-muted-foreground">
            {format(new Date(video.created_at), 'dd MMMM yyyy, HH:mm', { locale: idLocale })}
          </span>
        </DialogTitle>
        <DialogDescription className="text-left">
          {video.prompt}
        </DialogDescription>
      </DialogHeader>

      {/* Video preview */}
      {video.status === 'completed' && video.output_url && (
        <div className="relative rounded-lg overflow-hidden bg-black">
          <video
            src={video.output_url}
            className="w-full max-h-[400px] object-contain"
            controls
            muted
          />
        </div>
      )}

      {/* Pending state */}
      {video.status === 'pending' && (
        <div className="flex flex-col items-center justify-center py-12 bg-muted/30 rounded-lg">
          <Loader2 size={48} className="animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Video sedang diproses...</p>
          <p className="text-xs text-muted-foreground mt-1">Estimasi 1-3 menit</p>
        </div>
      )}

      {/* Error state */}
      {video.status === 'failed' && (
        <div className="flex flex-col items-center justify-center py-8 bg-destructive/10 rounded-lg">
          <AlertCircle size={48} className="text-destructive mb-4" />
          <p className="text-destructive font-medium">Gagal membuat video</p>
          {video.error_message && (
            <p className="text-xs text-destructive/80 mt-2 text-center max-w-md">
              {video.error_message}
            </p>
          )}
        </div>
      )}

      {/* Metadata */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        {video.model_name && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Model</p>
            <p className="font-medium truncate">{video.model_name}</p>
          </div>
        )}
        {video.duration_seconds && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Durasi</p>
            <p className="font-medium">{video.duration_seconds} detik</p>
          </div>
        )}
        {video.resolution && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Resolusi</p>
            <p className="font-medium">{video.resolution}</p>
          </div>
        )}
        {video.aspect_ratio && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Rasio</p>
            <p className="font-medium">{video.aspect_ratio}</p>
          </div>
        )}
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Audio</p>
          <p className="font-medium">{video.audio_enabled ? '🔊 Ya' : '🔇 Tidak'}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Kredit</p>
          <p className="font-medium flex items-center gap-1">
            <Coins size={14} />
            {video.credits_used}
          </p>
        </div>
      </div>

      {/* Download button */}
      {video.status === 'completed' && video.output_url && (
        <div className="flex justify-end pt-2">
          <Button asChild>
            <a href={video.output_url} download target="_blank" rel="noopener noreferrer">
              <Download size={16} className="mr-2" />
              Download Video
            </a>
          </Button>
        </div>
      )}
    </>
  );
};

export default VideoHistory;
