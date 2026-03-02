import React from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface VideoItem {
  id: number;
  videoUrl: string;
  title?: string | null;
}

interface ExerciseMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseName: string;
  photoUrl?: string;
  videoUrl?: string;
  type: 'photo' | 'video';
  description?: string;
  videos?: VideoItem[];
}

function convertToEmbed(url: string): { embedUrl: string; isEmbed: boolean } {
  // YouTube
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1];
    if (videoId) return { embedUrl: `https://www.youtube.com/embed/${videoId}`, isEmbed: true };
  }
  // Vimeo
  if (url.includes('vimeo.com')) {
    const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
    if (videoId) return { embedUrl: `https://player.vimeo.com/video/${videoId}`, isEmbed: true };
  }
  return { embedUrl: url, isEmbed: false };
}

function VideoPlayer({ url, title }: { url: string; title: string }) {
  const { embedUrl, isEmbed } = convertToEmbed(url);

  if (isEmbed) {
    return (
      <div className="aspect-video bg-black rounded-lg overflow-hidden">
        <iframe
          src={embedUrl}
          title={title}
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <video
      src={url}
      controls
      className="w-full rounded-lg max-h-96"
      preload="metadata"
      playsInline
    >
      Seu navegador não suporta vídeo.
    </video>
  );
}

/**
 * Modal para exibir foto ou vídeo demonstrativo de um exercício
 */
export function ExerciseMediaModal({
  isOpen,
  onClose,
  exerciseName,
  photoUrl,
  videoUrl,
  type,
  description,
  videos = [],
}: ExerciseMediaModalProps) {
  const renderContent = () => {
    if (type === 'photo' && photoUrl) {
      return (
        <div className="flex items-center justify-center bg-muted rounded-lg p-4">
          <img
            src={photoUrl}
            alt={`Demonstração: ${exerciseName}`}
            className="max-w-full max-h-96 object-contain rounded-lg shadow-lg"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" font-size="16" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImagem não disponível%3C/text%3E%3C/svg%3E';
            }}
          />
        </div>
      );
    }

    if (type === 'video') {
      // Combinar vídeo direto do exercício + vídeos da tabela exercise_videos
      const allVideos: { url: string; title: string }[] = [];

      if (videoUrl) {
        allVideos.push({ url: videoUrl, title: "Vídeo principal" });
      }

      videos.forEach((v) => {
        // Evitar duplicatas
        if (v.videoUrl && v.videoUrl !== videoUrl) {
          allVideos.push({ url: v.videoUrl, title: v.title || "Vídeo de demonstração" });
        }
      });

      if (allVideos.length === 0) {
        return (
          <div className="flex items-center justify-center bg-muted rounded-lg p-12 text-muted-foreground">
            <p>Nenhum vídeo disponível para este exercício.</p>
          </div>
        );
      }

      return (
        <div className="space-y-4">
          {allVideos.map((v, i) => (
            <div key={i}>
              {allVideos.length > 1 && (
                <p className="text-sm font-medium text-gray-600 mb-2">{v.title}</p>
              )}
              <VideoPlayer url={v.url} title={`${exerciseName} - ${v.title}`} />
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center bg-muted rounded-lg p-12 text-muted-foreground">
        <p>
          {type === 'photo' ? 'Foto não disponível' : 'Vídeo não disponível'}
        </p>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {exerciseName}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {type === 'photo' ? 'Foto Demonstrativa' : 'Vídeo Demonstrativo'}
          </p>
        </DialogHeader>

        <div className="py-4">
          {renderContent()}
        </div>

        {description && (
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">Instruções:</h4>
            <div className="text-sm text-muted-foreground whitespace-pre-line">
              {description}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
