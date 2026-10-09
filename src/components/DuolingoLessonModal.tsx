import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Heart,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Flame,
  ArrowRight,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { DuolingoMascot } from './DuolingoMascot';
import { playNotificationSound } from '../utils/duolingoNotifications';
import { Lesson } from '../types';

interface DuolingoLessonModalProps {
  lesson: Lesson;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (earnedXP: number) => void;
  streakDays?: number;
}

export const DuolingoLessonModal: React.FC<DuolingoLessonModalProps> = ({
  lesson,
  isOpen,
  onClose,
  onComplete,
  streakDays = 5,
}) => {
  // Hearts / Lives
  const [hearts, setHearts] = useState<number>(5);
  const [heartsShaking, setHeartsShaking] = useState(false);

  // Lesson step progression: 0: Theory, 1: Word Bank, 2: Multiple Choice, 3: Final Punchline
  const [currentStep, setCurrentStep] = useState<number>(0);
  const totalSteps = 4;

  // Step 2: Word bank state
  // Prepare words from lesson or defaults
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const targetSlots = 2;
  const wordBankPool = [
    'pulmão',
    'precisão',
    'compasso',
    'pressão',
    'tropeço',
    'visão',
  ];

  // Step 3: Multiple choice state
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const quizOptions = [
    { id: 0, text: 'Rima rica conectando oxítonas com proparoxítonas', isCorrect: false },
    { id: 1, text: 'Encaixe perfeito na virada do compasso (4/4)', isCorrect: true },
    { id: 2, text: 'Falar o mais rápido possível sem respirar', isCorrect: false },
    { id: 3, text: 'Repetir a mesma palavra três vezes no final', isCorrect: false },
  ];

  // Step 4: Final rhyme input
  const [userRhymeInput, setUserRhymeInput] = useState<string>('');

  // Verification & feedback state
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong' | 'completed'>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');

  if (!isOpen) return null;

  // Sound effect helpers
  const handleWordSelect = (word: string) => {
    playNotificationSound('click');
    if (selectedWords.includes(word)) {
      setSelectedWords(selectedWords.filter((w) => w !== word));
    } else if (selectedWords.length < targetSlots) {
      setSelectedWords([...selectedWords, word]);
    }
  };

  const handleChoiceSelect = (id: number) => {
    playNotificationSound('click');
    setSelectedChoice(id);
  };

  // Play audio demonstration
  const handlePlayVoiceAudio = () => {
    playNotificationSound('lesson');
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        lesson.aiVoiceScript || lesson.title || 'Respiração profunda e ritmo constante no compasso!'
      );
      utterance.lang = 'pt-BR';
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Check current step answer
  const handleVerify = () => {
    if (currentStep === 0) {
      // Step 0 is theory - automatic continue
      playNotificationSound('correct');
      setStatus('correct');
      setFeedbackMessage('Excelente compreensão! Vamos para o exercício prático.');
      return;
    }

    if (currentStep === 1) {
      // Word bank check: needs at least 2 words and 'pulmão' or 'precisão'
      const hasKeyWords = selectedWords.includes('pulmão') || selectedWords.includes('precisão');
      if (selectedWords.length === targetSlots && hasKeyWords) {
        playNotificationSound('correct');
        setStatus('correct');
        setFeedbackMessage('Sensacional! A métrica encaixou perfeitamente no beat!');
      } else {
        triggerWrong('Tente usar "pulmão" e "precisão" para fechar a métrica perfeita.');
      }
      return;
    }

    if (currentStep === 2) {
      // Multiple choice check
      const correctOption = quizOptions.find((o) => o.isCorrect);
      if (selectedChoice === correctOption?.id) {
        playNotificationSound('correct');
        setStatus('correct');
        setFeedbackMessage('Mandou muito bem! Esse é o segredo do flow constante!');
      } else {
        triggerWrong('A resposta correta é: Encaixe perfeito na virada do compasso (4/4).');
      }
      return;
    }

    if (currentStep === 3) {
      // Final step: punchline
      if (userRhymeInput.trim().length >= 3) {
        playNotificationSound('complete');
        setStatus('completed');
      } else {
        triggerWrong('Escreva pelo menos um verso ou punchline para finalizar o treino!');
      }
    }
  };

  const triggerWrong = (correctMsg: string) => {
    playNotificationSound('wrong');
    setStatus('wrong');
    setFeedbackMessage(correctMsg);
    setHearts((prev) => Math.max(0, prev - 1));
    setHeartsShaking(true);
    setTimeout(() => setHeartsShaking(false), 600);
  };

  // Advance to next step
  const handleContinue = () => {
    if (status === 'completed') {
      onComplete(lesson.xpReward || 250);
      onClose();
      return;
    }

    setStatus('idle');
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      playNotificationSound('complete');
      setStatus('completed');
    }
  };

  const progressPercent = Math.min(100, Math.round(((currentStep + 1) / totalSteps) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4">
      <div className="relative w-full max-w-2xl bg-neutral-900 border-2 border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[90vh] max-h-[820px]">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-neutral-800 bg-neutral-900/90 z-20">
          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title="Fechar lição"
          >
            <X className="w-6 h-6" />
          </button>

          {/* 3D Duolingo Progress Bar */}
          <div className="flex-1 mx-4 sm:mx-8">
            <div className="relative h-4 sm:h-5 bg-neutral-800 rounded-full overflow-hidden p-0.5 border border-neutral-700">
              <motion.div
                className="h-full bg-[#58cc02] rounded-full relative overflow-hidden shadow-[0_2px_0_0_#46a302]"
                initial={{ width: '10%' }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 18 }}
              >
                {/* 3D Gloss Highlight */}
                <div className="absolute top-0.5 left-2 right-2 h-1 bg-white/30 rounded-full" />
              </motion.div>
            </div>
          </div>

          {/* Hearts / Vidas Counter */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-black text-sm sm:text-base ${
              heartsShaking ? 'animate-bounce text-red-500' : ''
            }`}
          >
            <Heart className="w-5 h-5 fill-red-500 text-red-500" />
            <span>{hearts}</span>
          </div>
        </div>

        {/* Lesson Body Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8 flex flex-col justify-center">
          {/* Completion Celebration Screen */}
          {status === 'completed' ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-4 flex flex-col items-center justify-center"
            >
              <div className="mb-4">
                <DuolingoMascot mood="celebrating" size="xl" />
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-sm mb-3">
                <Sparkles className="w-4 h-4 text-amber-400" />
                LIÇÃO CONCLUÍDA!
              </div>

              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-2">
                Mandou Muito Bem, MC!
              </h2>
              <p className="text-neutral-400 text-sm sm:text-base max-w-md mx-auto mb-6">
                Você dominou os conceitos de <strong className="text-emerald-400">{lesson.title}</strong>{' '}
                e garantiu o fogo da sua ofensiva.
              </p>

              {/* Stats Badges */}
              <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-6">
                <div className="p-4 rounded-2xl bg-neutral-800/80 border-2 border-neutral-700 flex flex-col items-center">
                  <span className="text-xs uppercase tracking-wider font-bold text-neutral-400 mb-1">XP Faturado</span>
                  <div className="flex items-center gap-1.5 text-2xl font-black text-emerald-400">
                    <Zap className="w-6 h-6 fill-emerald-400" />
                    +{lesson.xpReward || 250}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-800/80 border-2 border-neutral-700 flex flex-col items-center">
                  <span className="text-xs uppercase tracking-wider font-bold text-neutral-400 mb-1">Ofensiva</span>
                  <div className="flex items-center gap-1.5 text-2xl font-black text-orange-400">
                    <Flame className="w-6 h-6 fill-orange-400" />
                    {streakDays} Dias
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div>
              {/* Step 0: Mascot Theory */}
              {currentStep === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-start gap-4">
                    <DuolingoMascot mood="happy" size="lg" />
                    <div className="flex-1 rounded-2xl border-2 border-neutral-700 bg-neutral-800/90 p-4 relative shadow-lg">
                      <h3 className="text-lg font-black text-emerald-400 mb-1">
                        {lesson.title}
                      </h3>
                      <p className="text-sm text-neutral-200 leading-relaxed">
                        {lesson.description}
                      </p>
                    </div>
                  </div>

                  {/* Audio Demonstration Card */}
                  <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-950/20 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Volume2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">Ouvir Guia Rítmico com Voz</h4>
                        <p className="text-xs text-neutral-400">Escute a divisão métrica sugerida pelo Coruja</p>
                      </div>
                    </div>

                    <button
                      onClick={handlePlayVoiceAudio}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#58cc02] text-white font-black text-sm shadow-[0_4px_0_0_#46a302] hover:bg-[#46a302] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
                    >
                      <Volume2 className="w-4 h-4" />
                      OUVIR FLOW
                    </button>
                  </div>

                  {/* Flow Tips */}
                  <div className="rounded-2xl border border-neutral-800 bg-neutral-800/40 p-4 space-y-2">
                    <span className="text-xs font-bold tracking-wider uppercase text-neutral-400">Regra de Ouro</span>
                    <p className="text-sm text-neutral-300 font-medium italic">
                      "{lesson.tips?.[0] || lesson.theory || 'Respire no contratempo e solte a punchline na quarta batida do compasso.'}"
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Step 1: Word Bank ("Monte a Rima") */}
              {currentStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-start gap-3">
                    <DuolingoMascot mood="thinking" size="md" />
                    <div>
                      <h3 className="text-lg font-black text-white">Complete os espaços da rima:</h3>
                      <p className="text-xs text-neutral-400">Toque nas palavras para encaixar nos slots vazios</p>
                    </div>
                  </div>

                  {/* Verse with empty slots */}
                  <div className="p-6 rounded-2xl bg-neutral-800/60 border-2 border-neutral-700 text-center space-y-4">
                    <p className="text-base sm:text-lg font-medium text-neutral-300 leading-loose">
                      "No contratempo eu puxo o ar do{' '}
                      <span className="inline-block min-w-[100px] px-3 py-1.5 mx-1 border-b-2 border-dashed border-emerald-400 bg-emerald-500/10 rounded-lg text-emerald-300 font-bold text-base">
                        {selectedWords[0] || '_____'}
                      </span>
                      <br />
                      E solto o verso afiado com total{' '}
                      <span className="inline-block min-w-[100px] px-3 py-1.5 mx-1 border-b-2 border-dashed border-emerald-400 bg-emerald-500/10 rounded-lg text-emerald-300 font-bold text-base">
                        {selectedWords[1] || '_____'}
                      </span>
                      "
                    </p>
                  </div>

                  {/* Word Bank Blocks (3D Duolingo Tiles) */}
                  <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                    {wordBankPool.map((word) => {
                      const isChosen = selectedWords.includes(word);
                      return (
                        <button
                          key={word}
                          onClick={() => handleWordSelect(word)}
                          className={`px-4 py-2.5 rounded-xl font-bold text-sm sm:text-base transition-all ${
                            isChosen
                              ? 'bg-neutral-800 text-neutral-600 border border-neutral-700 cursor-default opacity-40 translate-y-1'
                              : 'bg-neutral-800 hover:bg-neutral-700 text-white border-2 border-neutral-600 shadow-[0_4px_0_0_#404040] active:translate-y-1 active:shadow-none'
                          }`}
                        >
                          {word}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Multiple Choice Quiz */}
              {currentStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-start gap-3">
                    <DuolingoMascot mood="urgent" size="md" />
                    <div>
                      <h3 className="text-lg font-black text-white">Qual é a melhor técnica para esta lição?</h3>
                      <p className="text-xs text-neutral-400">Escolha a resposta mais precisa</p>
                    </div>
                  </div>

                  {/* 3D Choice Buttons */}
                  <div className="space-y-3">
                    {quizOptions.map((opt, index) => {
                      const isSelected = selectedChoice === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleChoiceSelect(opt.id)}
                          className={`w-full p-4 rounded-2xl font-bold text-left text-sm sm:text-base border-2 transition-all flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-[#1cb0f6]/20 border-[#1cb0f6] text-[#1cb0f6] shadow-[0_4px_0_0_#1899d6]'
                              : 'bg-neutral-800/80 hover:bg-neutral-800 border-neutral-700 text-neutral-200 shadow-[0_4px_0_0_#262626] active:translate-y-1 active:shadow-none'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-lg border border-neutral-600 bg-neutral-700/50 flex items-center justify-center text-xs text-neutral-300 font-black">
                              {index + 1}
                            </span>
                            <span>{opt.text}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Step 3: Freestyle / Final Punchline Input */}
              {currentStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-start gap-3">
                    <DuolingoMascot mood="happy" size="md" />
                    <div>
                      <h3 className="text-lg font-black text-white">Desafio Final: Solte sua Punchline!</h3>
                      <p className="text-xs text-neutral-400">Rime algo que responda ao verso proposto</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-neutral-800/40 border border-neutral-700">
                    <span className="text-xs font-bold text-neutral-400 uppercase">Verso da Batalha:</span>
                    <p className="text-base font-semibold text-neutral-100 mt-1">
                      "Você diz que rima muito, mas falta precisão..."
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-400 mb-2">
                      Sua Resposta / Rima de Fechamento:
                    </label>
                    <textarea
                      value={userRhymeInput}
                      onChange={(e) => setUserRhymeInput(e.target.value)}
                      placeholder="Ex: Minha métrica é de aço e destrói sua ilusão..."
                      rows={3}
                      className="w-full rounded-2xl bg-neutral-800 border-2 border-neutral-700 p-4 text-white placeholder-neutral-500 font-medium focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                    />
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Signature Duolingo Bottom Footer (Status & Verification Drawer) */}
        <div
          className={`p-4 sm:p-6 border-t transition-all ${
            status === 'correct'
              ? 'bg-emerald-950/90 border-emerald-500/40'
              : status === 'wrong'
              ? 'bg-red-950/90 border-red-500/40'
              : status === 'completed'
              ? 'bg-neutral-900 border-neutral-800'
              : 'bg-neutral-900 border-neutral-800'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Feedback Info Box */}
            <div className="flex-1 w-full sm:w-auto">
              {status === 'correct' && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#58cc02] text-white flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-emerald-400">Sensacional!</h4>
                    <p className="text-xs text-neutral-300">{feedbackMessage}</p>
                  </div>
                </div>
              )}

              {status === 'wrong' && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#ff4b4b] text-white flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-red-400">Resposta Correta:</h4>
                    <p className="text-xs text-neutral-200">{feedbackMessage}</p>
                  </div>
                </div>
              )}

              {status === 'idle' && (
                <p className="text-xs text-neutral-500 font-medium hidden sm:block">
                  Dica: Ganhe +50 XP a cada etapa completada com sucesso!
                </p>
              )}
            </div>

            {/* Action 3D Button */}
            {status === 'idle' ? (
              <button
                onClick={handleVerify}
                className="w-full sm:w-48 py-3.5 px-6 rounded-2xl bg-[#58cc02] text-white font-black text-base tracking-wide border-b-4 border-[#46a302] hover:bg-[#46a302] active:translate-y-1 active:border-b-0 transition-all uppercase flex items-center justify-center gap-2"
              >
                <span>VERIFICAR</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : status === 'correct' ? (
              <button
                onClick={handleContinue}
                className="w-full sm:w-48 py-3.5 px-6 rounded-2xl bg-[#58cc02] text-white font-black text-base tracking-wide border-b-4 border-[#46a302] hover:bg-[#46a302] active:translate-y-1 active:border-b-0 transition-all uppercase flex items-center justify-center gap-2"
              >
                <span>CONTINUAR</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : status === 'wrong' ? (
              <button
                onClick={handleContinue}
                className="w-full sm:w-48 py-3.5 px-6 rounded-2xl bg-[#ff4b4b] text-white font-black text-base tracking-wide border-b-4 border-[#ea2b2b] hover:bg-[#ea2b2b] active:translate-y-1 active:border-b-0 transition-all uppercase flex items-center justify-center gap-2"
              >
                <span>CONTINUAR</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleContinue}
                className="w-full sm:w-64 py-4 px-8 rounded-2xl bg-[#58cc02] text-white font-black text-lg tracking-wide border-b-4 border-[#46a302] hover:bg-[#46a302] active:translate-y-1 active:border-b-0 transition-all uppercase flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30"
              >
                <Sparkles className="w-5 h-5" />
                <span>FINALIZAR LIÇÃO</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
