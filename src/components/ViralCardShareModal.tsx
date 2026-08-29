import React, { useRef, useState } from 'react';
import { 
  X, 
  Download, 
  Share2, 
  Copy, 
  Check, 
  Flame, 
  Crown, 
  Sparkles, 
  Award, 
  Mic, 
  Music, 
  Swords, 
  Smartphone,
  Instagram,
  QrCode
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { RhymeAnalysis, UserProfile, Beat } from '../types';

interface ViralCardShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: RhymeAnalysis;
  profile: UserProfile | null;
  currentBeat: Beat;
  transcript: string;
  onOpenAsyncDuel?: () => void;
  onShowToast: (title: string, message: string, type?: 'success' | 'info' | 'xp') => void;
}

export const ViralCardShareModal: React.FC<ViralCardShareModalProps> = ({
  isOpen,
  onClose,
  analysis,
  profile,
  currentBeat,
  transcript,
  onOpenAsyncDuel,
  onShowToast,
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCard, setCopiedCard] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '1:1' | '4:5'>('9:16');
  const [cardTheme, setCardTheme] = useState<'gold' | 'neon' | 'dark' | 'fire'>('gold');

  if (!isOpen) return null;

  const mcName = profile?.artisticName || 'MC RimaLab';
  const score = analysis.overallScore || 88;
  const verdict = analysis.evaluationVerdict || 'Sólido';
  const streak = profile?.streakDays || 1;
  const level = profile?.level || 1;

  // Extract best punchline or last 2 lines
  const lines = transcript.split('\n').filter(l => l.trim().length > 0);
  const highlightedVerse = lines.length >= 2 
    ? `${lines[lines.length - 2]}\n${lines[lines.length - 1]}`
    : lines[0] || 'Entro no compasso mandando o improviso real,\nAcademia de Rimas no estilo original!';

  // Render to Canvas for Direct Image Download (Stories 1080x1920)
  const handleDownloadCardImage = () => {
    setIsGeneratingImage(true);

    try {
      const canvas = document.createElement('canvas');
      const width = 1080;
      const height = aspectRatio === '9:16' ? 1920 : aspectRatio === '4:5' ? 1350 : 1080;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas 2D context not supported');
      }

      // Background Gradient
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      if (cardTheme === 'gold') {
        bgGrad.addColorStop(0, '#1c1300');
        bgGrad.addColorStop(0.5, '#0a0a0c');
        bgGrad.addColorStop(1, '#180c02');
      } else if (cardTheme === 'neon') {
        bgGrad.addColorStop(0, '#001a14');
        bgGrad.addColorStop(0.5, '#05070d');
        bgGrad.addColorStop(1, '#0a001a');
      } else if (cardTheme === 'fire') {
        bgGrad.addColorStop(0, '#260400');
        bgGrad.addColorStop(0.5, '#0a0a0c');
        bgGrad.addColorStop(1, '#1a0800');
      } else {
        bgGrad.addColorStop(0, '#121216');
        bgGrad.addColorStop(0.5, '#08080a');
        bgGrad.addColorStop(1, '#050507');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Top Decorative Grid / Glow
      const glowGrad = ctx.createRadialGradient(width / 2, 400, 50, width / 2, 400, 550);
      glowGrad.addColorStop(0, cardTheme === 'gold' ? 'rgba(245, 158, 11, 0.25)' : cardTheme === 'neon' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)');
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, width, 900);

      // Header Tag: ACADEMIA DE RIMAS
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚡ ACADEMIA DE RIMAS • DISCORD', width / 2, 140);

      // MC Vulgo / Name
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 68px sans-serif';
      ctx.fillText(mcName.toUpperCase(), width / 2, 240);

      // Subtitle / Level & Streak
      ctx.fillStyle = '#9ca3af';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText(`NÍVEL ${level} • 🔥 ${streak} DIAS DE STREAK`, width / 2, 300);

      // Main Score Big Badge (Circle or Rounded Box)
      const scoreY = aspectRatio === '9:16' ? 520 : 440;
      ctx.fillStyle = '#141419';
      ctx.strokeStyle = cardTheme === 'gold' ? '#f59e0b' : cardTheme === 'neon' ? '#10b981' : '#ef4444';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(width / 2, scoreY, 140, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Score Value
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 110px sans-serif';
      ctx.fillText(`${score}`, width / 2, scoreY + 30);

      ctx.fillStyle = cardTheme === 'gold' ? '#f59e0b' : '#10b981';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('/ 100 PTS', width / 2, scoreY + 80);

      // Verdict Pill
      const verdictY = scoreY + 200;
      ctx.fillStyle = cardTheme === 'gold' ? '#f59e0b' : '#10b981';
      ctx.font = '900 42px sans-serif';
      ctx.fillText(`VEREDITO: ${verdict.toUpperCase()}`, width / 2, verdictY);

      // Metrics Breakdown Box
      const metricsBoxY = verdictY + 80;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 3;
      ctx.roundRect(100, metricsBoxY, 880, 240, 24);
      ctx.fill();
      ctx.stroke();

      // 4 Metrics Inside Box
      const colW = 880 / 4;
      const metrics = [
        { label: 'RIMA', val: `${analysis.rhymeQuality}%`, color: '#f59e0b' },
        { label: 'MÉTRICA', val: `${analysis.metricScore || 78}%`, color: '#06b6d4' },
        { label: 'FLOW', val: `${analysis.flowScore}%`, color: '#10b981' },
        { label: 'PUNCH', val: `${analysis.punchlineImpact || 75}%`, color: '#f43f5e' },
      ];

      metrics.forEach((m, idx) => {
        const cx = 100 + colW * idx + colW / 2;
        ctx.fillStyle = '#9ca3af';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(m.label, cx, metricsBoxY + 70);

        ctx.fillStyle = m.color;
        ctx.font = '900 50px sans-serif';
        ctx.fillText(m.val, cx, metricsBoxY + 150);
      });

      // Highlighted Verse Box
      const verseY = metricsBoxY + 300;
      ctx.fillStyle = 'rgba(245, 158, 11, 0.08)';
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
      ctx.lineWidth = 3;
      ctx.roundRect(100, verseY, 880, 260, 24);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('🎤 PUNCHLINE / VERSO DE DESTAQUE:', width / 2, verseY + 60);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'italic bold 32px sans-serif';
      const verseLines = highlightedVerse.split('\n');
      verseLines.slice(0, 2).forEach((vl, idx) => {
        ctx.fillText(`"${vl.trim()}"`, width / 2, verseY + 130 + idx * 55);
      });

      // Beat Info Pill
      const beatY = verseY + 310;
      ctx.fillStyle = '#374151';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(`BEAT: ${currentBeat.title} (${currentBeat.bpm} BPM • ${currentBeat.style})`, width / 2, beatY);

      // Footer CTA & Branding
      if (aspectRatio === '9:16') {
        ctx.fillStyle = '#f59e0b';
        ctx.font = '900 36px sans-serif';
        ctx.fillText('QUER BATALHAR COMIGO?', width / 2, height - 180);

        ctx.fillStyle = '#9ca3af';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText('Treine de graça no link da bio • Discord Oficial', width / 2, height - 120);
      }

      // Convert Canvas to Blob and Trigger Download
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `rimalab_${mcName.toLowerCase().replace(/\s+/g, '_')}_score_${score}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);

        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#ffffff'],
        });

        onShowToast('📸 Imagem Gerada!', 'Card salvo para você postar nos Stories do Instagram ou TikTok.', 'success');
        setIsGeneratingImage(false);
      }, 'image/png');
    } catch (err) {
      console.error('Error generating card image:', err);
      onShowToast('Aviso', 'Não foi possível gerar a imagem automaticamente.', 'info');
      setIsGeneratingImage(false);
    }
  };

  const handleCopyShareText = () => {
    const text = `🔥 Acabei de tirar ${score}/100 no Studio da Academia de Rimas!\n🎤 MC: ${mcName} (Nível ${level})\n🥁 Beat: ${currentBeat.title} (${currentBeat.bpm} BPM)\n💥 Veredito: ${verdict}\n\nDesafie meu flow no link da bio: https://rimalab.app`;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
    onShowToast('📋 Texto Copiado!', 'Cole no Instagram, WhatsApp ou Twitter para desafiar seus amigos.', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-3xl border border-neutral-800 bg-neutral-950 p-4 sm:p-6 shadow-2xl space-y-5 max-h-[94vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header Title */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-neutral-950 font-black">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                Compartilhar Freestyle & Desafiar Amigos
              </h3>
              <p className="text-xs text-neutral-400">
                Gere um card visual para postar nos Stories do Instagram, TikTok ou WhatsApp.
              </p>
            </div>
          </div>

          {/* Theme Selector */}
          <div className="flex items-center gap-1.5 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
            <button
              onClick={() => setCardTheme('gold')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                cardTheme === 'gold' ? 'bg-amber-500 text-neutral-950 shadow' : 'text-neutral-400 hover:text-white'
              }`}
            >
              🟡 Ouro
            </button>
            <button
              onClick={() => setCardTheme('neon')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                cardTheme === 'neon' ? 'bg-emerald-500 text-neutral-950 shadow' : 'text-neutral-400 hover:text-white'
              }`}
            >
              🟢 Cyber Neon
            </button>
            <button
              onClick={() => setCardTheme('fire')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                cardTheme === 'fire' ? 'bg-rose-500 text-white shadow' : 'text-neutral-400 hover:text-white'
              }`}
            >
              🔴 Fogo
            </button>
          </div>
        </div>

        {/* Main Grid: Card Preview + Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* Left / Center: Interactive Card Preview (Stories / Vertical Format) */}
          <div className="md:col-span-6 flex justify-center">
            <div
              ref={cardRef}
              className={`w-full max-w-[320px] rounded-3xl p-5 border shadow-2xl relative overflow-hidden transition-all ${
                cardTheme === 'gold'
                  ? 'bg-gradient-to-b from-amber-950/40 via-neutral-950 to-orange-950/30 border-amber-500/50'
                  : cardTheme === 'neon'
                  ? 'bg-gradient-to-b from-emerald-950/40 via-neutral-950 to-cyan-950/30 border-emerald-500/50'
                  : 'bg-gradient-to-b from-rose-950/40 via-neutral-950 to-amber-950/30 border-rose-500/50'
              }`}
            >
              {/* Card Top Brand */}
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-amber-400">
                <span className="flex items-center gap-1">
                  <Mic className="h-3 w-3" />
                  Academia de Rimas
                </span>
                <span className="rounded-full bg-neutral-900 border border-neutral-800 px-2 py-0.5 text-neutral-300">
                  🔥 {streak}d Streak
                </span>
              </div>

              {/* MC Name & Level */}
              <div className="text-center my-3">
                <h4 className="text-xl font-black text-white tracking-tight uppercase">
                  {mcName}
                </h4>
                <p className="text-[11px] font-bold text-neutral-400">
                  Nível {level} • {currentBeat.style}
                </p>
              </div>

              {/* Central Score Wheel */}
              <div className="my-4 flex flex-col items-center justify-center">
                <div className={`flex h-24 w-24 flex-col items-center justify-center rounded-full border-4 shadow-lg ${
                  cardTheme === 'gold'
                    ? 'border-amber-500 bg-neutral-900 text-amber-400 shadow-amber-500/20'
                    : cardTheme === 'neon'
                    ? 'border-emerald-500 bg-neutral-900 text-emerald-400 shadow-emerald-500/20'
                    : 'border-rose-500 bg-neutral-900 text-rose-400 shadow-rose-500/20'
                }`}>
                  <span className="text-3xl font-black text-white leading-none">
                    {score}
                  </span>
                  <span className="text-[9px] font-bold uppercase mt-0.5">/ 100 PTS</span>
                </div>

                <div className="mt-2 text-center">
                  <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-3 py-0.5 text-[10px] font-black uppercase text-amber-300">
                    {verdict}
                  </span>
                </div>
              </div>

              {/* 4 Technical Scores */}
              <div className="grid grid-cols-2 gap-1.5 my-3 text-[10px]">
                <div className="rounded-xl bg-neutral-900/80 border border-neutral-800 p-2 text-center">
                  <span className="text-neutral-400 block font-bold">RIMA</span>
                  <strong className="text-amber-400 text-xs font-black">{analysis.rhymeQuality}%</strong>
                </div>
                <div className="rounded-xl bg-neutral-900/80 border border-neutral-800 p-2 text-center">
                  <span className="text-neutral-400 block font-bold">MÉTRICA</span>
                  <strong className="text-cyan-400 text-xs font-black">{analysis.metricScore || 78}%</strong>
                </div>
                <div className="rounded-xl bg-neutral-900/80 border border-neutral-800 p-2 text-center">
                  <span className="text-neutral-400 block font-bold">FLOW</span>
                  <strong className="text-emerald-400 text-xs font-black">{analysis.flowScore}%</strong>
                </div>
                <div className="rounded-xl bg-neutral-900/80 border border-neutral-800 p-2 text-center">
                  <span className="text-neutral-400 block font-bold">PUNCH</span>
                  <strong className="text-rose-400 text-xs font-black">{analysis.punchlineImpact || 75}%</strong>
                </div>
              </div>

              {/* Highlighted Verse snippet */}
              <div className="rounded-xl bg-neutral-900/90 border border-neutral-800 p-2.5 text-center my-2">
                <span className="text-[9px] font-black uppercase text-amber-400 block mb-1">
                  🎤 Punchline:
                </span>
                <p className="text-[11px] text-neutral-200 italic font-medium line-clamp-2">
                  "{highlightedVerse.split('\n')[0]}"
                </p>
              </div>

              {/* Beat Info */}
              <div className="text-center text-[10px] text-neutral-400 mt-2">
                Beat: <strong className="text-white">{currentBeat.title}</strong> ({currentBeat.bpm} BPM)
              </div>
            </div>
          </div>

          {/* Right Column: Actions & Quick Sharing Channels */}
          <div className="md:col-span-6 space-y-4">
            <div className="rounded-2xl bg-neutral-900/80 border border-neutral-800 p-4 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-amber-400" />
                Opções de Compartilhamento Viral
              </h4>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Mostre sua evolução para o cenário do rap! Baixe a imagem pronta com resolução HD para Instagram Stories ou envie para grupos de MCs.
              </p>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                
                {/* 1. Download Stories Image */}
                <button
                  onClick={handleDownloadCardImage}
                  disabled={isGeneratingImage}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-xs font-black text-neutral-950 shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  <span>{isGeneratingImage ? 'Gerando Imagem HD...' : 'Baixar Card para Stories (HD)'}</span>
                </button>

                {/* 2. Copy Text for Caption */}
                <button
                  onClick={handleCopyShareText}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 py-2.5 text-xs font-bold text-white border border-neutral-700 transition-colors"
                >
                  {copiedLink ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  <span>{copiedLink ? 'Copiado para Área de Transferência!' : 'Copiar Texto da Legenda'}</span>
                </button>

                {/* 3. Launch Asynchronous Duel with this Verse */}
                {onOpenAsyncDuel && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAsyncDuel();
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-950/80 hover:bg-purple-900/90 py-2.5 text-xs font-black text-purple-300 border border-purple-500/40 transition-colors"
                  >
                    <Swords className="h-4 w-4 text-purple-400" />
                    <span>Desafiar Amigo em Duelo com esse Verse</span>
                  </button>
                )}
              </div>
            </div>

            {/* Growth Tip Box */}
            <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-3.5 space-y-1 text-xs">
              <span className="font-bold text-amber-400 block">💡 Dica de Crescimento:</span>
              <p className="text-neutral-300 text-[11px] leading-relaxed">
                Marque <strong className="text-white">@rimalab.app</strong> no Instagram para ser repostado no perfil oficial da Academia de Rimas e ganhar +55 XP extra!
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
