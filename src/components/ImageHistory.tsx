import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Download, Clock, Coins, AlertCircle, Loader2, Image, Copy, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';

const ITEMS_PER_PAGE = 24;

interface ImageGeneration {
  id: string;
  prompt: string;
  status: string;
  output_url: string | null;
  credits_used: number;
  resolution: string | null;
  aspect_ratio: string | null;
  output_format: string | null;
  model_name: string | null;
  server: string | null;
  error_message: string | null;
  created_at: string;
}

interface ImageHistoryProps {
  onUsePrompt?: (prompt: string) => void;
}

const ImageHistory: React.FC<ImageHistoryProps> = ({ onUsePrompt }) => {
  const [selectedImage, setSelectedImage] = useState<ImageGeneration | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  // First, get total count
  const { data: totalCount } = useQuery({
    queryKey: ['image-history-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('image_generations')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    },
  });

  const { data: history, isLoading, error } = useQuery({
    queryKey: ['image-history', currentPage],
    queryFn: async () => {
      const from = currentPage * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from('image_generations')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return data as ImageGeneration[];
    },
    refetchInterval: (query) => {
      const data = query.state.data as ImageGeneration[] | undefined;
      return data?.some((x) => x.status === 'pending') ? 5000 : false;
    },
  });

  const totalPages = Math.ceil((totalCount || 0) / ITEMS_PER_PAGE);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
          <Clock size={18} />
          History
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-lg" />
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
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p>Pilih model dan masukkan prompt untuk generate gambar</p>
        <p className="text-xs mt-2">Riwayat gambar akan muncul di sini</p>
      </div>
    );
  }

  const handleUsePrompt = (image: ImageGeneration) => {
    if (onUsePrompt) {
      onUsePrompt(image.prompt);
      setSelectedImage(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Clock size={18} />
          History ({totalCount || 0})
        </h3>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              <ChevronLeft size={16} />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[60px] text-center">
              {currentPage + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        )}
      </div>
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 pr-4">
          {history.map((item) => (
            <ThumbnailItem
              key={item.id}
              item={item}
              onClick={() => setSelectedImage(item)}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Image Detail Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedImage && (
            <ImageDetailContent 
              image={selectedImage} 
              onClose={() => setSelectedImage(null)}
              onUsePrompt={() => handleUsePrompt(selectedImage)}
              showUsePrompt={!!onUsePrompt}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface ThumbnailItemProps {
  item: ImageGeneration;
  onClick: () => void;
}

const ThumbnailItem: React.FC<ThumbnailItemProps> = ({ item, onClick }) => {
  const isPending = item.status === 'pending';
  const isFailed = item.status === 'failed';
  const isCompleted = item.status === 'completed';

  return (
    <button
      onClick={onClick}
      className="relative aspect-square bg-muted/50 border border-border rounded-lg overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all group focus:outline-none focus:ring-2 focus:ring-primary"
    >
      {/* Image thumbnail or placeholder */}
      {isCompleted && item.output_url ? (
        <img
          src={item.output_url}
          alt={item.prompt}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <Image size={24} className="text-muted-foreground/50" />
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

interface ImageDetailContentProps {
  image: ImageGeneration;
  onClose: () => void;
  onUsePrompt: () => void;
  showUsePrompt: boolean;
}

const ImageDetailContent: React.FC<ImageDetailContentProps> = ({ image, onUsePrompt, showUsePrompt }) => {
  const { toast } = useToast();

  const statusConfig = {
    completed: { label: 'Selesai', variant: 'default' as const, icon: Image },
    pending: { label: 'Sedang Diproses', variant: 'secondary' as const, icon: Loader2 },
    failed: { label: 'Gagal', variant: 'destructive' as const, icon: AlertCircle },
  };

  const status = statusConfig[image.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = status.icon;

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(image.prompt);
      toast({
        title: 'Prompt disalin!',
        description: 'Prompt berhasil disalin ke clipboard',
      });
    } catch {
      toast({
        title: 'Gagal menyalin',
        description: 'Tidak dapat menyalin ke clipboard',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Badge variant={status.variant}>
            <StatusIcon size={12} className={image.status === 'pending' ? 'animate-spin mr-1' : 'mr-1'} />
            {status.label}
          </Badge>
          <span className="text-sm font-normal text-muted-foreground">
            {format(new Date(image.created_at), 'dd MMMM yyyy, HH:mm', { locale: idLocale })}
          </span>
        </DialogTitle>
        <DialogDescription className="text-left space-y-2">
          <div className="bg-muted/50 rounded-lg p-3">
            <p>{image.prompt}</p>
          </div>
        </DialogDescription>
      </DialogHeader>

      {/* Prompt action buttons */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleCopyPrompt} className="flex-1">
          <Copy size={14} className="mr-2" />
          Copy Prompt
        </Button>
        {showUsePrompt && (
          <Button variant="outline" size="sm" onClick={onUsePrompt} className="flex-1">
            <RotateCcw size={14} className="mr-2" />
            Gunakan Prompt
          </Button>
        )}
      </div>

      {/* Image preview */}
      {image.status === 'completed' && image.output_url && (
        <div className="relative rounded-lg overflow-hidden bg-black">
          <img
            src={image.output_url}
            alt={image.prompt}
            className="w-full max-h-[400px] object-contain"
          />
        </div>
      )}

      {/* Pending state */}
      {image.status === 'pending' && (
        <div className="flex flex-col items-center justify-center py-12 bg-muted/30 rounded-lg">
          <Loader2 size={48} className="animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Gambar sedang diproses...</p>
          <p className="text-xs text-muted-foreground mt-1">Estimasi 10-30 detik</p>
        </div>
      )}

      {/* Error state */}
      {image.status === 'failed' && (
        <div className="flex flex-col items-center justify-center py-8 bg-destructive/10 rounded-lg">
          <AlertCircle size={48} className="text-destructive mb-4" />
          <p className="text-destructive font-medium">Gagal membuat gambar</p>
          {image.error_message && (
            <p className="text-xs text-destructive/80 mt-2 text-center max-w-md">
              {image.error_message}
            </p>
          )}
        </div>
      )}

      {/* Metadata */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        {image.model_name && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Model</p>
            <p className="font-medium truncate">{image.model_name}</p>
          </div>
        )}
        {image.resolution && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Resolusi</p>
            <p className="font-medium">{image.resolution}</p>
          </div>
        )}
        {image.aspect_ratio && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Rasio</p>
            <p className="font-medium">{image.aspect_ratio}</p>
          </div>
        )}
        {image.output_format && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Format</p>
            <p className="font-medium uppercase">{image.output_format}</p>
          </div>
        )}
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Server</p>
          <p className="font-medium">{image.server === 'server1' ? 'Server 1' : 'Server 2'}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Kredit</p>
          <p className="font-medium flex items-center gap-1">
            <Coins size={14} />
            {image.credits_used}
          </p>
        </div>
      </div>

      {/* Download button */}
      {image.status === 'completed' && image.output_url && (
        <div className="flex justify-end pt-2">
          <Button asChild>
            <a href={image.output_url} download target="_blank" rel="noopener noreferrer">
              <Download size={16} className="mr-2" />
              Download Gambar
            </a>
          </Button>
        </div>
      )}
    </>
  );
};

export default ImageHistory;
