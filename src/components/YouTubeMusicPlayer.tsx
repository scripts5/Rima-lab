import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipForward, Volume2, VolumeX, Radio, ExternalLink, Video, Music2, Disc } from 'lucide-react';
import { Beat } from '../types';

interface YouTubeMusicPlayerProps {
  currentBeat: Beat;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext?: () => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  onEnded?: () => void;
  onSendToStudio?: (beat: Beat) => void;
  className?: string;
  defaultVideoMode?: boolean;
}

export const YouTubeMusicPlayer: React.FC<YouTubeMusicPlayerProps> = ({
  currentBeat,
  isPlaying,
  onTogglePlay,
  onNext,
  volume,
  onVolumeChange,
  onEnded,
  onSendToStudio,
  className = '',
  defaultVideoMode = false,
}) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [showVideo, setShowVideo] = useState(defaultVideoMode);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const videoId = currentBeat.youtubeVideoId || (
    currentBeat.youtubeUrl?.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i)?.[1]
  );

  // Send postMessage commands to YouTube IFrame API
  const sendCommand = (func: string, args: any[] = []) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func,
          args,
        }),
        '*'
      );
    }
  };

  // Sync play / pause state
  useEffect(() => {
    if (!isPlayerReady) return;
    if (isPlaying) {
      sendCommand('playVideo');
    } else {
      sendCommand('pauseVideo');
    }
  }, [isPlaying, isPlayerReady]);

  // Sync volume
  useEffect(() => {
    if (!isPlayerReady) return;
    sendCommand('setVolume', [volume]);
  }, [volume, isPlayerReady]);

  // Listen to postMessage events from YouTube player (e.g. video ended)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        if (typeof event.data !== 'string') return;
        const data = JSON.parse(event.data);
        
        // Player is ready
        if (data.event === 'onReady') {
          setIsPlayerReady(true);
          if (isPlaying) {
            sendCommand('playVideo');
          }
          sendCommand('setVolume', [volume]);
        }
        
        // Player state change: 0 = ENDED, 1 = PLAYING, 2 = PAUSED
        if (data.event === 'onStateChange') {
          if (data.info === 0) {
            // Video ended -> trigger next track
            if (onEnded) {
              onEnded();
            }
          }
        }
      } catch (err) {
        // Ignore non-JSON postMessages from other extensions/iframes
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [isPlaying, volume, onEnded]);

  if (!videoId) {
    return null;
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=${isPlaying ? 1 : 0}&origin=${typeof window !== 'undefined' ? window.location.origin : ''}&rel=0&modestbranding=1&playsinline=1`;

  return (
    <div
      id="rimabot-youtube-player-container"
      className={`rounded-2xl border border-neutral-800 bg-[#2b2d31] p-3 text-neutral-200 shadow-xl overflow-hidden ${className}`}
    >
      {/* Voice Status & Player Bar Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-neutral-700/60">
        <div className="flex items-center gap-2">
          <div className="relative flex h-3 w-3 items-center justify-center">
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-neutral-500'}`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isPlaying ? 'bg-emerald-500' : 'bg-neutral-500'}`} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-white tracking-wide">
              Reprodutor de Música YouTube • RimaBot
            </span>
            <span className="rounded bg-[#5865F2] px-1.5 py-0.2 text-[9px] font-black uppercase text-white">
              YOUTUBE AUDIO
            </span>
          </div>
        </div>

        {/* View Mode Toggle: Video vs Compact Audio */}
        <div className="flex items-center gap-1.5">
          <button
            id="yt-toggle-view-mode-btn"
            onClick={() => setShowVideo(!showVideo)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
              showVideo
                ? 'bg-amber-500 text-neutral-950 shadow-sm'
                : 'bg-[#1e1f22] text-neutral-300 hover:text-white border border-neutral-700/60'
            }`}
            title={showVideo ? 'Mudar para modo áudio compacto' : 'Exibir vídeo do YouTube'}
          >
            {showVideo ? <Video className="h-3 w-3" /> : <Music2 className="h-3 w-3" />}
            <span>{showVideo ? 'Ocultar Vídeo' : 'Ver Vídeo'}</span>
          </button>

          {currentBeat.youtubeUrl && (
            <a
              id="yt-external-link"
              href={currentBeat.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded-lg bg-[#1e1f22] text-neutral-400 hover:text-white border border-neutral-700/60 transition-colors"
              title="Abrir no YouTube oficial"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      {/* YouTube IFrame Embed Container */}
      <div className={showVideo ? 'mb-3 rounded-xl overflow-hidden border border-neutral-700/80 aspect-video bg-black shadow-inner' : 'hidden'}>
        <iframe
          ref={iframeRef}
          id="rimabot-active-yt-iframe"
          src={embedUrl}
          title={currentBeat.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0"
        />
      </div>

      {/* When video is hidden, keep iframe active in DOM with 1px size to keep audio playing */}
      {!showVideo && (
        <div className="w-0 h-0 overflow-hidden opacity-0 pointer-events-none absolute">
          <iframe
            ref={iframeRef}
            id="rimabot-active-yt-iframe-hidden"
            src={embedUrl}
            title={currentBeat.title}
            allow="autoplay; encrypted-media"
            className="w-1 h-1"
          />
        </div>
      )}

      {/* Music Player Info & Controls Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#1e1f22] p-2.5 rounded-xl border border-neutral-700/70">
        
        {/* Track Thumbnail & Titles */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative h-12 w-12 shrink-0 rounded-lg overflow-hidden border border-neutral-700 bg-neutral-900 shadow">
            {currentBeat.thumbnailUrl ? (
              <img
                src={currentBeat.thumbnailUrl}
                alt={currentBeat.title}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-neutral-800 text-neutral-400">
                <Disc className="h-6 w-6" />
              </div>
            )}
            {isPlaying && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-0.5">
                <span className="h-3 w-1 bg-amber-400 animate-pulse" />
                <span className="h-4 w-1 bg-amber-400 animate-pulse" style={{ animationDelay: '0.15s' }} />
                <span className="h-2 w-1 bg-amber-400 animate-pulse" style={{ animationDelay: '0.3s' }} />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-xs text-white truncate hover:text-amber-400 transition-colors">
              {currentBeat.title}
            </h4>
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-neutral-400 mt-0.5">
              <span className="text-amber-400 font-semibold truncate max-w-[140px]">
                {currentBeat.producer || 'YouTube Channel'}
              </span>
              <span>•</span>
              <span className="font-mono text-neutral-300">{currentBeat.bpm} BPM</span>
              <span>•</span>
              <span className="text-neutral-400">{currentBeat.style}</span>
            </div>
          </div>
        </div>

        {/* Player Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-800">
          {/* Play/Pause Button */}
          <button
            id="yt-player-toggle-btn"
            onClick={onTogglePlay}
            className={`flex items-center justify-center h-8 w-8 rounded-full transition-transform active:scale-90 shadow-md ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black'
                : 'bg-[#5865F2] hover:bg-[#4752c4] text-white'
            }`}
            title={isPlaying ? 'Pausar áudio do YouTube' : 'Tocar áudio do YouTube'}
          >
            {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
          </button>

          {/* Skip Button */}
          {onNext && (
            <button
              id="yt-player-skip-btn"
              onClick={onNext}
              className="p-1.5 rounded-lg bg-[#2b2d31] hover:bg-[#35373c] text-neutral-300 hover:text-white transition-colors border border-neutral-700/50"
              title="Pular para próxima música (/skip)"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          )}

          {/* Volume Control */}
          <div className="flex items-center gap-1.5 bg-[#2b2d31] px-2 py-1 rounded-lg border border-neutral-700/50">
            <button
              onClick={() => onVolumeChange(volume === 0 ? 80 : 0)}
              className="text-neutral-400 hover:text-white"
            >
              {volume === 0 ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => onVolumeChange(parseInt(e.target.value, 10))}
              className="w-14 h-1 bg-neutral-700 accent-amber-500 rounded-lg cursor-pointer"
            />
          </div>

          {/* Send to Freestyle Studio Button */}
          {onSendToStudio && (
            <button
              id="yt-player-send-studio-btn"
              onClick={() => onSendToStudio(currentBeat)}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 px-2.5 py-1 text-[11px] font-black text-neutral-950 transition-all shadow active:scale-95 shrink-0"
              title="Rimar com esta música no Studio de Freestyle"
            >
              <Radio className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Rimar no Studio</span>
              <span className="md:hidden">Studio</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
