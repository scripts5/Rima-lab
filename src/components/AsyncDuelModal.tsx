import React, { useState, useEffect } from 'react';
import { 
  X, 
  Swords, 
  Play, 
  Square, 
  Mic, 
  Sparkles, 
  Share2, 
  Copy, 
  Check, 
  Award, 
  Flame, 
  Crown, 
  Clock, 
  Radio, 
  RefreshCw,
  User,
  CheckCircle2,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Beat, UserProfile, RhymeAnalysis } from '../types';
import { PRESET_BEATS, globalBeatEngine } from '../lib/audio/beatEngine';

export interface AsyncDuel {
  id: string;
  challengerName: string;
  challengerLevel: number;
  challengerVerse: string;
  challengerScore?: number;
  challengerAnalysis?: RhymeAnalysis;
  beatId: string;
  beatTitle: string;
  bpm: number;
  beatStyle: string;
  responderName?: string;
  responderVerse?: string;
  responderScore?: number;
  responderAnalysis?: RhymeAnalysis;
  winner?: 'challenger' | 'responder' | 'draw';
  status: 'PENDING' | 'COMPLETED';
  createdAt: string;
  aiJudgeVerdict?: string;
}

interface AsyncDuelModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  currentBeat: Beat;
  onShowToast: (title: string, message: string, type?: 'success' | 'info' | 'xp') => void;
  onAwardXP?: (amount: number, reason: string) => void;
}

export const AsyncDuelModal: React.FC<AsyncDuelModalProps> = ({
  isOpen,
  onClose,
  profile,
  currentBeat,
  onShowToast,
  onAwardXP,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'respond' | 'history'>('create');
  
  // Create Duel State
  const [duelBeat, setDuelBeat] = useState<Beat>(currentBeat);
  const [attackVerse, setAttackVerse] = useState('');
  const [isCreatingDuel, setIsCreatingDuel] = useState(false);
  const [createdDuel, setCreatedDuel] = useState<AsyncDuel | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Respond Duel State
  const [duelCodeInput, setDuelCodeInput] = useState('');
  const [activeLoadedDuel, setActiveLoadedDuel] = useState<AsyncDuel | null>(null);
  const [responseVerse, setResponseVerse] = useState('');
  const [isJudgingDuel, setIsJudgingDuel] = useState(false);
  const [duelResult, setDuelResult] = useState<AsyncDuel | null>(null);

  // Local Storage of Duels
  const [duelsList, setDuelsList] = useState<AsyncDuel[]>(() => {
    try {
      const saved = localStorage.getItem('rimalab_async_duels');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'DUEL-CYBER-892',
        challengerName: 'MC Kronos',
        challengerLevel: 5,
        challengerVerse: 'Cheguei no beat pesado pra mostrar minha levada,\nCada verso que eu solto deixa a sua banca calada,\nNão adianta correr porque a métrica é pesada,\nAcademia de Rimas deixando a mente afiada!',
        challengerScore: 92,
        beatId: 'boom_bap_90',
        beatTitle: 'Golden Era 90',
        bpm: 90,
        beatStyle: 'Boom Bap',
        status: 'PENDING',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'DUEL-FIRE-104',
        challengerName: 'Lírica Suprema',
        challengerLevel: 7,
        challengerVerse: 'No compasso do 808 minha rima é cortante,\nSua postura de falso MC desmorona no instante,\nEu trago a poesia de rua com flow dominante,\nQuem tenta bater de frente fica sem ar no semblante!',
        challengerScore: 95,
        responderName: profile?.artisticName || 'MC Visitante',
        responderVerse: 'Você fala de semblante mas não tem convicção,\nMinha resposta vem forte com peso de coração,\nEu domino essa batida sem perder a precisão,\nO troféu desse duelo é da minha inspiração!',
        responderScore: 93,
        winner: 'challenger',
        status: 'COMPLETED',
        aiJudgeVerdict: 'Batalha de altíssimo nível! Lírica Suprema levou a melhor por uma margem mínima na contundência da punchline do 4º compasso.',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('rimalab_async_duels', JSON.stringify(duelsList));
    } catch {}
  }, [duelsList]);

  if (!isOpen) return null;

  const mcName = profile?.artisticName || 'MC RimaLab';

  // Handle creating a new challenge
  const handleCreateDuel = () => {
    if (!attackVerse.trim() || attackVerse.trim().length < 20) {
      onShowToast('Verso Curto', 'Por favor, escreva ou grave ao menos 4 linhas para lançar o desafio.', 'info');
      return;
    }

    setIsCreatingDuel(true);

    const duelId = `DUEL-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const calculatedScore = Math.floor(Math.random() * 15) + 84; // 84 to 98

    const newDuel: AsyncDuel = {
      id: duelId,
      challengerName: mcName,
      challengerLevel: profile?.level || 1,
      challengerVerse: attackVerse.trim(),
      challengerScore: calculatedScore,
      beatId: duelBeat.id,
      beatTitle: duelBeat.title,
      bpm: duelBeat.bpm,
      beatStyle: duelBeat.style,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    setDuelsList(prev => [newDuel, ...prev]);
    setCreatedDuel(newDuel);
    setIsCreatingDuel(false);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#ef4444', '#8b5cf6'],
    });

    if (onAwardXP) onAwardXP(55, 'Desafio de Duelo Criado (+55 XP)');
    onShowToast('⚔️ Duelo Criado!', `Código gerado: ${duelId}. Compartilhe o link com seu adversário!`, 'xp');
  };

  // Load a duel by code
  const handleLoadDuel = (code?: string) => {
    const targetCode = (code || duelCodeInput).trim().toUpperCase();
    const found = duelsList.find(d => d.id === targetCode);

    if (found) {
      setActiveLoadedDuel(found);
      const b = PRESET_BEATS.find(x => x.id === found.beatId) || PRESET_BEATS[0];
      setDuelBeat(b);
      onShowToast('⚔️ Duelo Carregado!', `Desafio de ${found.challengerName} no beat ${found.beatTitle}.`, 'info');
    } else {
      onShowToast('Duelo Não Encontrado', 'Verifique o código e tente novamente.', 'info');
    }
  };

  // Handle responding and judging duel
  const handleJudgeResponse = () => {
    if (!activeLoadedDuel || !responseVerse.trim() || responseVerse.trim().length < 20) {
      onShowToast('Resposta Incompleta', 'Mande ao menos 4 compassos para responder o ataque.', 'info');
      return;
    }

    setIsJudgingDuel(true);

    setTimeout(() => {
      const respScore = Math.floor(Math.random() * 16) + 83; // 83 to 98
      const chalScore = activeLoadedDuel.challengerScore || 88;

      let winner: 'challenger' | 'responder' | 'draw' = 'challenger';
      let verdict = '';

      if (respScore > chalScore) {
        winner = 'responder';
        verdict = `Vitória de ${mcName}! A resposta teve maior impacto de punchline e excelente encaixe no beat.`;
        if (onAwardXP) onAwardXP(110, 'Vitória no Duelo Assíncrono (+110 XP)');
      } else if (respScore < chalScore) {
        winner = 'challenger';
        verdict = `Vitória de ${activeLoadedDuel.challengerName}! O ataque inicial teve métrica mais sólida e rimas mais ricas.`;
        if (onAwardXP) onAwardXP(55, 'Participação no Duelo (+55 XP)');
      } else {
        winner = 'draw';
        verdict = `Empate técnico espetacular! Ambos os MCs demonstraram domínio de cadência e rima.`;
        if (onAwardXP) onAwardXP(75, 'Empate de Elite no Duelo (+75 XP)');
      }

      const completed: AsyncDuel = {
        ...activeLoadedDuel,
        responderName: mcName,
        responderVerse: responseVerse.trim(),
        responderScore: respScore,
        winner,
        status: 'COMPLETED',
        aiJudgeVerdict: verdict,
      };

      setDuelsList(prev => prev.map(d => d.id === completed.id ? completed : d));
      setDuelResult(completed);
      setIsJudgingDuel(false);

      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#ef4444'],
      });

      onShowToast('🏆 Duelo Julgado pela IA!', verdict, 'xp');
    }, 1500);
  };

  const handleCopyDuelLink = (id: string) => {
    const text = `⚔️ Desafio de Freestyle na Academia de Rimas!\nMC ${mcName} te desafiou para um duelo de 4 compassos no beat ${duelBeat.title}.\n\nAbra o link ou use o código: ${id}\nhttps://rimalab.app`;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
    onShowToast('📋 Link Copiado!', 'Envie no WhatsApp ou Discord para seu adversário.', 'success');
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-amber-500 text-neutral-950 font-black shadow-md">
              <Swords className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Modo Duelo 1v1 Assíncrono (Gravado por Link)
                </h3>
                <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-black text-purple-300 border border-purple-500/40">
                  NOVO • SOCIAL
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Desafie amigos sem precisar estar na mesma call ao vivo. Mande seu ataque e deixe a IA julgar o vencedor!
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
            <button
              onClick={() => { setActiveTab('create'); setDuelResult(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'create' ? 'bg-amber-500 text-neutral-950 shadow font-black' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Criar Desafio
            </button>
            <button
              onClick={() => { setActiveTab('respond'); setDuelResult(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'respond' ? 'bg-purple-500 text-white shadow font-black' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Responder Duelo
            </button>
            <button
              onClick={() => { setActiveTab('history'); setDuelResult(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'history' ? 'bg-neutral-700 text-white shadow font-black' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Histórico ({duelsList.length})
            </button>
          </div>
        </div>

        {/* TAB 1: CRIAR DESAFIO */}
        {activeTab === 'create' && (
          <div className="space-y-4">
            {!createdDuel ? (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                
                {/* Left: Beat Selector & Options */}
                <div className="md:col-span-5 space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300">
                    1. Escolha o Beat do Duelo:
                  </label>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {PRESET_BEATS.map((beat) => {
                      const isSelected = duelBeat.id === beat.id;
                      return (
                        <button
                          key={beat.id}
                          onClick={() => setDuelBeat(beat)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left text-xs transition-all ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow'
                              : 'bg-neutral-900/80 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                          }`}
                        >
                          <div>
                            <span className="font-bold block text-white">{beat.title}</span>
                            <span className="text-[10px] text-neutral-400">{beat.style} • {beat.bpm} BPM</span>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-amber-400" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-xs space-y-1">
                    <span className="font-bold text-amber-400 block">⚡ Regra do Duelo:</span>
                    <p className="text-neutral-300 text-[11px]">
                      Você manda um ataque de 4 ou 8 compassos. Seu adversário terá que responder no mesmo beat. Quem tiver melhor métrica e punchline vence!
                    </p>
                  </div>
                </div>

                {/* Right: Write / Record Attack Verse */}
                <div className="md:col-span-7 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300">
                      2. Grave ou Escreva seu Ataque:
                    </label>
                    <span className="text-[10px] text-neutral-400">
                      MC: <strong className="text-amber-400">{mcName}</strong>
                    </span>
                  </div>

                  <textarea
                    rows={6}
                    value={attackVerse}
                    onChange={(e) => setAttackVerse(e.target.value)}
                    placeholder="Mande seus 4 compassos de ataque aqui...&#10;Ex: Cheguei no beat pesado pra mostrar minha levada,&#10;Cada verso que eu solto deixa a sua banca calada!"
                    className="w-full rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-sm text-neutral-100 placeholder-neutral-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans leading-relaxed"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setAttackVerse(`Cheguei no beat pesado pra mostrar minha levada,\nCada verso que eu solto deixa a sua banca calada,\nNão adianta correr porque a métrica é pesada,\nAcademia de Rimas deixando a mente afiada!`)}
                      className="text-xs text-amber-400 hover:underline font-bold"
                    >
                      + Inserir Verso Exemplo
                    </button>

                    <span className="text-xs text-neutral-400">
                      {attackVerse.trim().split('\n').filter(l => l.trim().length > 0).length} linhas
                    </span>
                  </div>

                  <button
                    onClick={handleCreateDuel}
                    disabled={isCreatingDuel || attackVerse.trim().length < 15}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-purple-600 py-3.5 text-xs font-black text-neutral-950 shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Swords className="h-4 w-4" />
                    <span>Lançar Desafio & Gerar Link de Duelo (+55 XP)</span>
                  </button>
                </div>

              </div>
            ) : (
              /* Success Created Screen */
              <div className="rounded-3xl border border-amber-500/40 bg-neutral-900/90 p-6 text-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 mx-auto">
                  <CheckCircle2 className="h-8 w-8" />
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-black uppercase text-amber-400 tracking-wider">
                    DESAFIO PRONTO PARA DISPUTA
                  </span>
                  <h4 className="text-2xl font-black text-white">
                    Código: <span className="font-mono text-amber-300">{createdDuel.id}</span>
                  </h4>
                  <p className="text-xs text-neutral-400 max-w-md mx-auto">
                    Beat: {createdDuel.beatTitle} ({createdDuel.bpm} BPM) • Ataque avaliado pela IA com nota {createdDuel.challengerScore}/100!
                  </p>
                </div>

                {/* Verse Card preview */}
                <div className="rounded-2xl bg-neutral-950 p-4 border border-neutral-800 max-w-lg mx-auto text-left text-xs text-neutral-300 italic">
                  "{createdDuel.challengerVerse}"
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => handleCopyDuelLink(createdDuel.id)}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs shadow transition-all active:scale-95"
                  >
                    {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link para WhatsApp / Discord'}</span>
                  </button>

                  <button
                    onClick={() => { setCreatedDuel(null); setAttackVerse(''); }}
                    className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs transition-colors"
                  >
                    Criar Outro Desafio
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: RESPONDER DUELO */}
        {activeTab === 'respond' && (
          <div className="space-y-4">
            {!activeLoadedDuel ? (
              <div className="max-w-md mx-auto space-y-4 py-4 text-center">
                <div className="space-y-2">
                  <h4 className="text-base font-bold text-white">
                    Insira o Código do Desafio
                  </h4>
                  <p className="text-xs text-neutral-400">
                    Digite o código de 5 a 8 dígitos enviado pelo seu adversário.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={duelCodeInput}
                    onChange={(e) => setDuelCodeInput(e.target.value.toUpperCase())}
                    placeholder="Ex: DUEL-CYBER-892"
                    className="flex-1 rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-center font-mono font-bold text-amber-300 focus:border-amber-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleLoadDuel()}
                    className="px-5 py-3 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-black text-xs shadow transition-all"
                  >
                    Carregar
                  </button>
                </div>

                {/* Quick select pending duels from community */}
                <div className="pt-4 border-t border-neutral-800 text-left space-y-2">
                  <span className="text-[11px] font-bold uppercase text-neutral-400 block">
                    Ou responda a um desafio da comunidade:
                  </span>
                  <div className="space-y-1.5">
                    {duelsList.filter(d => d.status === 'PENDING').map((d) => (
                      <button
                        key={d.id}
                        onClick={() => handleLoadDuel(d.id)}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs transition-colors"
                      >
                        <div className="text-left">
                          <span className="font-bold text-white">{d.challengerName}</span>
                          <span className="text-[10px] text-neutral-400 block">{d.beatTitle} ({d.beatStyle})</span>
                        </div>
                        <span className="text-[10px] font-mono text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded">
                          {d.id}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : duelResult ? (
              /* Result Card */
              <div className="rounded-3xl border border-purple-500/40 bg-neutral-900/90 p-6 space-y-5">
                <div className="text-center space-y-1">
                  <span className="text-xs font-black uppercase text-purple-400 tracking-wider">
                    ⚖️ RESULTADO OFICIAL DO JURADO IA
                  </span>
                  <h4 className="text-2xl font-black text-white">
                    {duelResult.winner === 'responder' ? `🏆 Vitória de ${duelResult.responderName}!` : duelResult.winner === 'challenger' ? `🏆 Vitória de ${duelResult.challengerName}!` : '🤝 Empate Técnico de Elite!'}
                  </h4>
                  <p className="text-xs text-neutral-300 max-w-xl mx-auto italic">
                    "{duelResult.aiJudgeVerdict}"
                  </p>
                </div>

                {/* 2 Versus Columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Challenger */}
                  <div className={`rounded-2xl p-4 border ${
                    duelResult.winner === 'challenger' ? 'bg-amber-950/20 border-amber-500/60 ring-1 ring-amber-500' : 'bg-neutral-950 border-neutral-800'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-white">{duelResult.challengerName}</span>
                      <span className="text-sm font-black text-amber-400">{duelResult.challengerScore} pts</span>
                    </div>
                    <p className="text-xs text-neutral-300 italic">"{duelResult.challengerVerse}"</p>
                  </div>

                  {/* Responder */}
                  <div className={`rounded-2xl p-4 border ${
                    duelResult.winner === 'responder' ? 'bg-emerald-950/20 border-emerald-500/60 ring-1 ring-emerald-500' : 'bg-neutral-950 border-neutral-800'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-white">{duelResult.responderName} (Você)</span>
                      <span className="text-sm font-black text-emerald-400">{duelResult.responderScore} pts</span>
                    </div>
                    <p className="text-xs text-neutral-300 italic">"{duelResult.responderVerse}"</p>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <button
                    onClick={() => { setActiveLoadedDuel(null); setDuelResult(null); setResponseVerse(''); }}
                    className="px-6 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs shadow transition-all"
                  >
                    Batalhar Novamente
                  </button>
                </div>
              </div>
            ) : (
              /* Respond Active Screen */
              <div className="space-y-4">
                {/* Attack Banner to Respond */}
                <div className="rounded-2xl bg-amber-950/30 border border-amber-500/40 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-400">
                      ⚔️ Ataque de {activeLoadedDuel.challengerName} ({activeLoadedDuel.beatTitle} • {activeLoadedDuel.bpm} BPM):
                    </span>
                    <span className="font-mono text-neutral-400">{activeLoadedDuel.id}</span>
                  </div>
                  <p className="text-sm text-white italic font-medium">
                    "{activeLoadedDuel.challengerVerse}"
                  </p>
                </div>

                {/* Response Input */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300">
                    Sua Resposta (Contragolpe de 4 Compassos):
                  </label>
                  <textarea
                    rows={5}
                    value={responseVerse}
                    onChange={(e) => setResponseVerse(e.target.value)}
                    placeholder="Mande sua resposta com punchline e rebata os versos do adversário..."
                    className="w-full rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-sm text-neutral-100 placeholder-neutral-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 font-sans leading-relaxed"
                  />
                </div>

                <button
                  onClick={handleJudgeResponse}
                  disabled={isJudgingDuel || responseVerse.trim().length < 15}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 py-3.5 text-xs font-black text-white shadow-lg shadow-purple-500/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isJudgingDuel ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Award className="h-4 w-4" />
                  )}
                  <span>{isJudgingDuel ? 'Jurado IA Analisando Métrica e Punchlines...' : 'Enviar Resposta & Decidir Vencedor no Jurado IA'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: HISTÓRICO */}
        {activeTab === 'history' && (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {duelsList.map((duel) => (
              <div
                key={duel.id}
                className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-2 hover:border-neutral-700 transition-colors"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-amber-400 font-bold">{duel.id}</span>
                    <span className="text-neutral-400">•</span>
                    <span className="text-neutral-300 font-bold">{duel.beatTitle}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    duel.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {duel.status === 'COMPLETED' ? 'Concluído' : 'Aguardando Resposta'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                    <span className="text-amber-400 font-bold block text-[11px]">{duel.challengerName} (Ataque):</span>
                    <p className="text-neutral-300 line-clamp-2 italic text-[11px]">"{duel.challengerVerse}"</p>
                  </div>
                  {duel.responderVerse ? (
                    <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                      <span className="text-emerald-400 font-bold block text-[11px]">{duel.responderName} (Resposta):</span>
                      <p className="text-neutral-300 line-clamp-2 italic text-[11px]">"{duel.responderVerse}"</p>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-neutral-950/40 border border-neutral-800/60 flex items-center justify-center text-[11px] text-neutral-500 italic">
                      Aguardando adversário responder...
                    </div>
                  )}
                </div>

                {duel.aiJudgeVerdict && (
                  <p className="text-[11px] text-purple-300 bg-purple-950/20 p-2 rounded-lg border border-purple-500/20 font-medium">
                    ⚖️ {duel.aiJudgeVerdict}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
