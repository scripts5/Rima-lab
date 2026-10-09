import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  Zap,
  Heart,
  Bell,
  BookOpen,
  Crown,
  Lock,
  Check,
  Gift,
  Trophy,
  Play,
  Smartphone,
  Sparkles,
  ChevronDown,
  Info,
  Clock,
  X,
  Volume2,
} from 'lucide-react';
import { DuolingoMascot } from './DuolingoMascot';
import { DuolingoLessonModal } from './DuolingoLessonModal';
import {
  playNotificationSound,
  scheduleDelayedNativeNotification,
  sendNativeDeviceNotification,
  requestNativeNotificationPermission,
} from '../utils/duolingoNotifications';
import { LESSONS_DATA } from '../data/lessons';
import { Lesson } from '../types';

interface DuolingoLessonsViewProps {
  onSelectStudio?: () => void;
  userXP?: number;
  streakDays?: number;
  onAddXP?: (xp: number) => void;
}

export const DuolingoLessonsView: React.FC<DuolingoLessonsViewProps> = ({
  onSelectStudio,
  userXP = 1250,
  streakDays = 5,
  onAddXP,
}) => {
  // Current active track
  const [selectedTrack, setSelectedTrack] = useState<'speed_flow' | 'punchlines' | 'metrica'>('speed_flow');

  // Interactive Lesson Modal state
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState<boolean>(false);

  // Popover preview when tapping a path node
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Unit Guide Modal state
  const [guideModalUnit, setGuideModalUnit] = useState<number | null>(null);

  // Mobile Notification Test Modal state
  const [isPhoneNotifyModalOpen, setIsPhoneNotifyModalOpen] = useState<boolean>(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [testNotificationStatus, setTestNotificationStatus] = useState<string>('');

  // Completed lessons tracking
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([
    'lesson-1',
    'lesson-2',
  ]);

  // Treasure chest claimed tracking
  const [claimedChests, setClaimedChests] = useState<string[]>([]);
  const [chestRewardModal, setChestRewardModal] = useState<number | null>(null);

  // Units structured in Duolingo progression
  const units = [
    {
      unitNumber: 1,
      title: 'Fundamentos de Flow & Divisão 4/4',
      description: 'Aprenda a respiração diafragmática, métrica no tempo do beat e articulação rápida.',
      themeColor: '#58cc02', // Duolingo Green
      borderColor: '#46a302',
      guideTips: [
        'Respire pelo diafragma no compasso 3 e 4 para não faltar ar.',
        'Mantenha as tônicas alinhadas com a caixa e o bumbo do beat.',
        'Use rimas oxítonas para criar finais secos e impactantes.',
      ],
      nodes: [
        { id: 'u1-node-1', lessonId: 'lesson-1', title: 'Respiração Diafragmática', xp: 50, position: 'center' },
        { id: 'u1-node-2', lessonId: 'lesson-2', title: 'Divisão Rítmica 4x4', xp: 50, position: 'left' },
        { id: 'u1-chest-1', isChest: true, title: 'Baú Secreto de Flow', xp: 100, position: 'center' },
        { id: 'u1-node-3', lessonId: 'lesson-3', title: 'Encaixe no Contratempo', xp: 75, position: 'right' },
        { id: 'u1-trophy', isTrophy: true, title: 'Desafio da Unidade 1', xp: 150, position: 'center' },
      ],
    },
    {
      unitNumber: 2,
      title: 'Quebra de Expectativa & Punchlines',
      description: 'Construa narrativas de ataque, trocadilhos de duplo sentido e fechamentos letais.',
      themeColor: '#ff9600', // Duolingo Amber
      borderColor: '#d87f00',
      guideTips: [
        'A premissa deve preparar o ouvinte para uma direção antes de puxar o tapete.',
        'Evite rimas previsíveis (ex: amor/dor, coração/ilusão).',
        'Solte a punchline com volume e dicção máxima na quarta barra.',
      ],
      nodes: [
        { id: 'u2-node-1', lessonId: 'lesson-4', title: 'Setup e Premissa', xp: 75, position: 'center' },
        { id: 'u2-node-2', lessonId: 'lesson-5', title: 'Duplo Sentido Mortal', xp: 75, position: 'left' },
        { id: 'u2-chest-2', isChest: true, title: 'Baú Dourado de Punchlines', xp: 120, position: 'center' },
        { id: 'u2-node-3', lessonId: 'lesson-6', title: 'Punchline na 4ª Barra', xp: 100, position: 'right' },
        { id: 'u2-trophy', isTrophy: true, title: 'Batalha do Mestre', xp: 200, position: 'center' },
      ],
    },
    {
      unitNumber: 3,
      title: 'Speed Flow & Dicção Metralhadora',
      description: 'Dobre a velocidade sem perder o fôlego usando tercinas e trava-línguas rítmicos.',
      themeColor: '#1cb0f6', // Duolingo Electric Blue
      borderColor: '#1899d6',
      guideTips: [
        'Treine trava-línguas com rolha entre os dentes para soltar os lábios.',
        'Use tercinas (3 notas por tempo) para gerar sensação de aceleração.',
        'Mantenha a garganta relaxada para evitar fadiga vocal.',
      ],
      nodes: [
        { id: 'u3-node-1', lessonId: 'lesson-7', title: 'Tercinas e Chopper', xp: 100, position: 'center' },
        { id: 'u3-node-2', lessonId: 'lesson-8', title: 'Dicção com Trava-Línguas', xp: 100, position: 'right' },
        { id: 'u3-trophy', isTrophy: true, title: 'Troféu Metralhadora', xp: 250, position: 'center' },
      ],
    },
  ];

  // Helper to find lesson by ID or generate fallback
  const getLessonById = (id: string, title?: string, xp?: number): Lesson => {
    const found = LESSONS_DATA.find((l) => l.id === id);
    if (found) return found;
    return {
      id,
      title: title || 'Treino Especial do Coruja',
      description: 'Aperfeiçoe suas técnicas de métrica, fôlego e rimas assertivas.',
      category: 'Speed Flow',
      difficulty: 'Iniciante',
      durationMinutes: 8,
      xpReward: xp || 50,
      theory: 'Mantenha o queixo erguido e solte o verso com firmeza no tempo 1 do compasso.',
      exampleLyrics: ['Entro no compasso sem errar a divisão', 'Solto o verso rápido e mantenho a precisão'],
      tips: ['Respire pelo diafragma no compasso 4.'],
      exercisePrompt: 'Escreva um verso aplicando a técnica aprendida:',
      exerciseWords: ['pulmão', 'precisão', 'compasso'],
    };
  };

  // Launch a lesson
  const handleStartLesson = (lesson: Lesson) => {
    playNotificationSound('click');
    setActiveLesson(lesson);
    setIsLessonModalOpen(true);
    setSelectedNodeId(null);
  };

  // Claim treasure chest
  const handleOpenChest = (chestId: string, xpBonus: number) => {
    if (claimedChests.includes(chestId)) return;
    playNotificationSound('achievement');
    setClaimedChests([...claimedChests, chestId]);
    setChestRewardModal(xpBonus);
    if (onAddXP) onAddXP(xpBonus);
  };

  // Handler for phone screen-off notification test (5 seconds)
  const handleStartScreenOffTest = async () => {
    playNotificationSound('alert');
    setTestNotificationStatus('solicitando');

    // Request permission if not yet granted
    const permGranted = await requestNativeNotificationPermission();
    if (!permGranted) {
      setTestNotificationStatus('permissao_negada');
      return;
    }

    setTestNotificationStatus('agendado');
    setCountdownSeconds(5);

    // Schedule delayed notification in 5 seconds
    await scheduleDelayedNativeNotification({
      delaySeconds: 5,
      title: '🦉 Academia de Rimas • RimaLab',
      body: '🔥 Sua ofensiva de 5 dias tá em perigo! O Coruja te espera para a lição de hoje.',
      category: 'lesson',
      actionTab: 'lessons',
    });

    // Countdown interval
    let remaining = 5;
    const interval = setInterval(() => {
      remaining -= 1;
      setCountdownSeconds(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        setTestNotificationStatus('disparado');
        // Immediate in-app sound if user is still here
        playNotificationSound('streak');
      }
    }, 1000);
  };

  // Node position styling classes
  const getNodePositionClass = (pos: string) => {
    switch (pos) {
      case 'left':
        return '-translate-x-12 sm:-translate-x-16';
      case 'right':
        return 'translate-x-12 sm:translate-x-16';
      default:
        return 'translate-x-0';
    }
  };

  return (
    <div className="min-h-screen bg-[#0f171c] text-white pb-24">
      {/* Top Duolingo Gamification Header Bar */}
      <header className="sticky top-0 z-40 bg-[#131f24]/95 backdrop-blur-md border-b-2 border-neutral-800 px-4 py-3 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Track Selector */}
          <div className="relative">
            <button
              onClick={() => {
                const tracks: Array<'speed_flow' | 'punchlines' | 'metrica'> = ['speed_flow', 'punchlines', 'metrica'];
                const next = tracks[(tracks.indexOf(selectedTrack) + 1) % tracks.length];
                setSelectedTrack(next);
                playNotificationSound('click');
              }}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-neutral-800/90 border-2 border-neutral-700 hover:border-neutral-500 transition-all font-black text-xs sm:text-sm tracking-wide"
            >
              <span className="text-emerald-400">
                {selectedTrack === 'speed_flow' && '⚡ Speed Flow'}
                {selectedTrack === 'punchlines' && '🥊 Punchlines'}
                {selectedTrack === 'metrica' && '📚 Métrica & Rimas'}
              </span>
              <ChevronDown className="w-4 h-4 text-neutral-400" />
            </button>
          </div>

          {/* Gamification Stats: Streak, Gems, Hearts, Phone Alert */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Streak Flame */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-orange-500/10 border-2 border-orange-500/30 text-orange-400 font-black text-xs sm:text-sm shadow-sm"
              title="Dias de Ofensiva Seguidos"
            >
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 fill-orange-500 text-orange-500 animate-pulse" />
              <span>{streakDays}</span>
            </div>

            {/* Gems / XP */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-cyan-500/10 border-2 border-cyan-500/30 text-cyan-400 font-black text-xs sm:text-sm shadow-sm"
              title="Gemas e XP Acumulados"
            >
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-cyan-400 text-cyan-400" />
              <span>{userXP}</span>
            </div>

            {/* Hearts (Vidas) */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-red-500/10 border-2 border-red-500/30 text-red-400 font-black text-xs sm:text-sm shadow-sm"
              title="Vidas (5 / 5)"
            >
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-red-500 text-red-500" />
              <span>5</span>
            </div>

            {/* Test Phone Notification Button */}
            <button
              onClick={() => {
                playNotificationSound('click');
                setIsPhoneNotifyModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-[#58cc02]/20 border-2 border-[#58cc02] text-[#58cc02] hover:bg-[#58cc02] hover:text-white transition-all font-black text-xs sm:text-sm shadow-sm"
              title="Testar Notificações na Tela do Celular"
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">Alertas Celular</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-12">
        {/* Mascot Greeting Banner */}
        <section className="rounded-3xl border-2 border-neutral-800 bg-neutral-900/80 p-4 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#58cc02]/10 rounded-full blur-2xl pointer-events-none" />
          <DuolingoMascot
            mood="waving"
            size="lg"
            speechBubble="E aí, MC! Complete a lição de hoje para manter seu fogo aceso e destravar novos beats no Studio!"
          />
        </section>

        {/* Units Path */}
        {units.map((unit) => {
          return (
            <section key={unit.unitNumber} className="relative">
              {/* Duolingo Unit Header Card */}
              <div
                className="rounded-3xl p-5 sm:p-6 mb-8 text-white shadow-xl relative overflow-hidden transition-all"
                style={{
                  backgroundColor: unit.themeColor,
                  borderBottom: `6px solid ${unit.borderColor}`,
                }}
              >
                {/* 3D Gloss Highlight */}
                <div className="absolute top-1 left-4 right-4 h-2 bg-white/20 rounded-full pointer-events-none" />

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider bg-black/20 px-3 py-1 rounded-full inline-block mb-2">
                      SEÇÃO {unit.unitNumber}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight">{unit.title}</h2>
                    <p className="text-xs sm:text-sm text-white/90 font-medium mt-1 max-w-md">
                      {unit.description}
                    </p>
                  </div>

                  {/* Guia da Unidade Button */}
                  <button
                    onClick={() => {
                      playNotificationSound('click');
                      setGuideModalUnit(unit.unitNumber);
                    }}
                    className="flex-shrink-0 px-4 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 border-2 border-white/30 text-white font-black text-xs sm:text-sm transition-all flex items-center gap-2 active:scale-95"
                  >
                    <BookOpen className="w-4 h-4" />
                    GUIA DA UNIDADE
                  </button>
                </div>
              </div>

              {/* The Winding Path Nodes */}
              <div className="flex flex-col items-center gap-8 py-2 relative">
                {unit.nodes.map((node, nIdx) => {
                  const isCompleted = completedLessonIds.includes(node.lessonId || '');
                  const isCurrent = !isCompleted && (nIdx === 0 || completedLessonIds.includes(unit.nodes[nIdx - 1]?.lessonId || ''));
                  const isLocked = !isCompleted && !isCurrent;
                  const isChest = node.isChest;
                  const isChestClaimed = claimedChests.includes(node.id);
                  const isTrophy = node.isTrophy;

                  const posClass = getNodePositionClass(node.position);

                  return (
                    <div key={node.id} className={`relative flex flex-col items-center ${posClass} transition-transform`}>
                      {/* Hovering "COMEÇAR!" Callout Bubble on Active Node */}
                      {isCurrent && !isChest && (
                        <motion.div
                          initial={{ y: 5, opacity: 0 }}
                          animate={{ y: [0, -6, 0], opacity: 1 }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="absolute -top-12 z-20"
                        >
                          <div className="relative px-3.5 py-1.5 rounded-2xl bg-white text-neutral-900 font-black text-xs tracking-wider shadow-lg border-2 border-neutral-200 uppercase">
                            COMEÇAR!
                            {/* Down arrow */}
                            <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-0 h-0 border-l-6 border-l-transparent border-r-6 border-r-transparent border-t-6 border-t-white" />
                          </div>
                        </motion.div>
                      )}

                      {/* 3D Circular Path Button */}
                      {isChest ? (
                        /* Treasure Chest Node */
                        <button
                          onClick={() => handleOpenChest(node.id, node.xp)}
                          disabled={isChestClaimed}
                          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center transition-all ${
                            isChestClaimed
                              ? 'bg-neutral-800 border-b-4 border-neutral-950 text-neutral-600 opacity-60'
                              : 'bg-amber-500 border-b-6 border-amber-700 text-white shadow-lg shadow-amber-900/40 hover:scale-105 active:translate-y-1 active:border-b-2'
                          }`}
                          title={node.title}
                        >
                          <Gift className={`w-8 h-8 ${isChestClaimed ? '' : 'animate-bounce'}`} />
                        </button>
                      ) : isTrophy ? (
                        /* Unit Trophy Node */
                        <button
                          onClick={() => {
                            if (!isLocked) {
                              handleStartLesson(getLessonById('trophy-1', node.title, node.xp));
                            }
                          }}
                          disabled={isLocked}
                          className={`w-18 h-18 sm:w-22 sm:h-22 rounded-3xl flex items-center justify-center transition-all ${
                            isLocked
                              ? 'bg-neutral-800 border-b-4 border-neutral-900 text-neutral-600'
                              : 'bg-gradient-to-b from-amber-400 to-amber-600 border-b-6 border-amber-800 text-white shadow-xl shadow-amber-900/50 hover:scale-105 active:translate-y-1 active:border-b-2'
                          }`}
                          title={node.title}
                        >
                          <Trophy className="w-9 h-9" />
                        </button>
                      ) : (
                        /* Standard Lesson Node */
                        <button
                          onClick={() => {
                            if (isLocked) {
                              playNotificationSound('wrong');
                            } else {
                              setSelectedNodeId(selectedNodeId === node.id ? null : node.id);
                              playNotificationSound('click');
                            }
                          }}
                          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all relative ${
                            isCompleted
                              ? 'bg-[#58cc02] border-b-6 border-[#46a302] text-white shadow-md active:translate-y-1 active:border-b-2'
                              : isCurrent
                              ? 'bg-[#58cc02] border-b-6 border-[#46a302] text-white shadow-xl shadow-emerald-900/50 ring-4 ring-[#58cc02]/30 active:translate-y-1 active:border-b-2'
                              : 'bg-neutral-800 border-b-6 border-neutral-900 text-neutral-600 cursor-not-allowed'
                          }`}
                        >
                          {/* Inner 3D Highlight Ring */}
                          <div className="absolute top-1.5 left-2 right-2 h-3 bg-white/25 rounded-full pointer-events-none" />

                          {isCompleted ? (
                            <Check className="w-8 h-8 stroke-[3]" />
                          ) : isCurrent ? (
                            <Crown className="w-8 h-8 text-white animate-pulse" />
                          ) : (
                            <Lock className="w-7 h-7" />
                          )}
                        </button>
                      )}

                      {/* Node Subtitle Label */}
                      <span className="mt-2 text-xs font-bold text-neutral-400 max-w-[120px] text-center truncate">
                        {node.title}
                      </span>

                      {/* Duolingo Popover Card when tapping an active/completed node */}
                      <AnimatePresence>
                        {selectedNodeId === node.id && (
                          <motion.div
                            initial={{ scale: 0.85, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.85, opacity: 0, y: 10 }}
                            className="absolute top-24 z-30 w-72 p-4 rounded-3xl bg-neutral-900 border-2 border-neutral-700 shadow-2xl text-center space-y-3"
                          >
                            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                                {isCompleted ? '✓ Concluído' : 'Lição Pronta'}
                              </span>
                              <span className="text-xs font-bold text-neutral-400">+{node.xp} XP</span>
                            </div>

                            <h4 className="text-base font-black text-white">{node.title}</h4>
                            <p className="text-xs text-neutral-400">
                              Domine a métrica e proteja sua ofensiva diária.
                            </p>

                            <button
                              onClick={() => {
                                const target = getLessonById(node.lessonId || '', node.title, node.xp);
                                handleStartLesson(target);
                              }}
                              className="w-full py-3 px-4 rounded-2xl bg-[#58cc02] hover:bg-[#46a302] border-b-4 border-[#46a302] text-white font-black text-sm tracking-wide uppercase active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center gap-2"
                            >
                              <Play className="w-4 h-4 fill-white" />
                              <span>{isCompleted ? 'REVISAR (+XP)' : 'COMEÇAR (+50 XP)'}</span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>

      {/* Interactive Duolingo Lesson Modal */}
      {activeLesson && (
        <DuolingoLessonModal
          lesson={activeLesson}
          isOpen={isLessonModalOpen}
          onClose={() => setIsLessonModalOpen(false)}
          streakDays={streakDays}
          onComplete={(earnedXP) => {
            if (!completedLessonIds.includes(activeLesson.id)) {
              setCompletedLessonIds([...completedLessonIds, activeLesson.id]);
            }
            if (onAddXP) onAddXP(earnedXP);
            setIsLessonModalOpen(false);
          }}
        />
      )}

      {/* Unit Guide Modal ("Caderno de Dicas do Coruja") */}
      <AnimatePresence>
        {guideModalUnit !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-neutral-900 border-2 border-neutral-700 rounded-3xl p-6 shadow-2xl relative space-y-4"
            >
              <button
                onClick={() => setGuideModalUnit(null)}
                className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-[#58cc02]" />
                <h3 className="text-xl font-black text-white">
                  Guia da Unidade {guideModalUnit}
                </h3>
              </div>

              <div className="space-y-3 pt-2">
                {units
                  .find((u) => u.unitNumber === guideModalUnit)
                  ?.guideTips.map((tip, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-neutral-800/80 border border-neutral-700 flex items-start gap-3"
                    >
                      <span className="w-6 h-6 rounded-full bg-[#58cc02]/20 text-[#58cc02] font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-xs sm:text-sm text-neutral-200 font-medium leading-relaxed">
                        {tip}
                      </p>
                    </div>
                  ))}
              </div>

              <button
                onClick={() => setGuideModalUnit(null)}
                className="w-full py-3.5 rounded-2xl bg-[#58cc02] border-b-4 border-[#46a302] hover:bg-[#46a302] text-white font-black text-sm uppercase transition-all"
              >
                ENTENDI, BORA RIMAR!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Treasure Chest Bonus Reward Modal */}
      <AnimatePresence>
        {chestRewardModal !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              className="w-full max-w-sm bg-neutral-900 border-2 border-amber-500/50 rounded-3xl p-6 text-center shadow-2xl space-y-4"
            >
              <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-400 mx-auto flex items-center justify-center text-amber-400 animate-bounce">
                <Gift className="w-10 h-10" />
              </div>

              <h3 className="text-2xl font-black text-white">Baú Aberto!</h3>
              <p className="text-xs text-neutral-300">
                Você desbloqueou um bônus especial de treino e acumulou mais prestígio!
              </p>

              <div className="py-3 px-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black text-xl flex items-center justify-center gap-2">
                <Zap className="w-6 h-6 fill-amber-400" />
                +{chestRewardModal} XP BÔNUS
              </div>

              <button
                onClick={() => setChestRewardModal(null)}
                className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 border-b-4 border-amber-700 text-white font-black text-sm uppercase transition-all"
              >
                COLETAR RECOMPENSA
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Phone Screen-Off Notification Test Modal (As in user's request) */}
      <AnimatePresence>
        {isPhoneNotifyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="w-full max-w-md bg-neutral-900 border-2 border-neutral-700 rounded-3xl p-6 shadow-2xl relative space-y-5"
            >
              <button
                onClick={() => setIsPhoneNotifyModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Notificações na Tela do Celular</h3>
                  <p className="text-xs text-neutral-400">Estilo Duolingo & Notificações de Sistema</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-800/80 border border-neutral-700 text-xs text-neutral-300 leading-relaxed space-y-2">
                <p>
                  <strong>Como funciona:</strong> Ao iniciar o teste, a notificação será enviada diretamente para a{' '}
                  <span className="text-emerald-400 font-bold">barra de notificações e tela de bloqueio</span> do seu celular
                  (igual ao YouTube, Gmail ou Duolingo na sua foto).
                </p>
                <p className="text-neutral-400">
                  Toque no botão abaixo, saia do aplicativo ou bloqueie a tela do aparelho. Em 5 segundos o Coruja apitará no seu telefone!
                </p>
              </div>

              {/* Countdown or Status */}
              {testNotificationStatus === 'agendado' && (
                <div className="p-4 rounded-2xl bg-orange-500/10 border-2 border-orange-500/40 text-center space-y-2">
                  <div className="text-3xl font-black text-orange-400 animate-pulse">
                    {countdownSeconds}s
                  </div>
                  <p className="text-xs font-bold text-orange-300">
                    Bloqueie a tela do celular ou aperte Home agora para ver a notificação chegar!
                  </p>
                </div>
              )}

              {testNotificationStatus === 'disparado' && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/40 text-center text-emerald-400 font-bold text-xs">
                  ✓ Notificação de sistema enviada para a barra de notificações do seu celular!
                </div>
              )}

              {testNotificationStatus === 'permissao_negada' && (
                <div className="p-4 rounded-2xl bg-red-500/10 border-2 border-red-500/40 text-center text-red-400 font-bold text-xs">
                  As notificações estão bloqueadas no navegador. Permita o envio no ícone de cadeado na barra de endereço!
                </div>
              )}

              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={handleStartScreenOffTest}
                  className="w-full py-4 rounded-2xl bg-[#58cc02] border-b-4 border-[#46a302] hover:bg-[#46a302] text-white font-black text-sm tracking-wide uppercase transition-all flex items-center justify-center gap-2 active:translate-y-1 active:border-b-0"
                >
                  <Clock className="w-5 h-5" />
                  <span>TESTAR NO CELULAR (5 SEGUNDOS)</span>
                </button>

                <button
                  onClick={async () => {
                    playNotificationSound('alert');
                    await sendNativeDeviceNotification({
                      title: '🦉 Academia de Rimas • RimaLab',
                      body: '🎤 Sua lição de Speed Flow tá pronta! Entre agora para manter sua ofensiva.',
                      category: 'lesson',
                      priority: 'urgent',
                    });
                    setTestNotificationStatus('disparado');
                  }}
                  className="w-full py-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs uppercase transition-all"
                >
                  Disparar Notificação Imediata Agora
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
