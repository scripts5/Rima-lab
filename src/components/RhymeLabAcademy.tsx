import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  Award, 
  Play, 
  Sparkles, 
  ChevronRight, 
  Check, 
  Flame, 
  Lock, 
  FileText, 
  Lightbulb, 
  Zap, 
  Volume2, 
  VolumeX, 
  Square, 
  Clock, 
  Radio, 
  Gauge, 
  Target, 
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Sliders,
  Send
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Lesson, UserProfile, SkillFocusType } from '../types';
import { aiVoiceTutor } from '../lib/speech/aiVoiceTutor';

interface RhymeLabAcademyProps {
  lessons: Lesson[];
  profile?: UserProfile | null;
  onCompleteLesson: (lessonId: string, customLyrics: string) => Promise<boolean>;
  onSendToStudio: (lyricsPrompt: string) => void;
  onOpenSkillTracks?: (skillId?: string) => void;
}

export const RhymeLabAcademy: React.FC<RhymeLabAcademyProps> = ({
  lessons,
  profile,
  onCompleteLesson,
  onSendToStudio,
  onOpenSkillTracks,
}) => {
  const [selectedLesson, setSelectedLesson] = useState<Lesson>(lessons[0] || null);
  const [userExerciseText, setUserExerciseText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [completedSuccess, setCompletedSuccess] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>('Speed Flow');
  
  // AI Voice State
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speakingType, setSpeakingType] = useState<'theory' | 'example' | 'drill' | null>(null);

  // Speed Flow Metronome State
  const [isMetronomeActive, setIsMetronomeActive] = useState<boolean>(false);
  const [currentBeatPulse, setCurrentBeatPulse] = useState<number>(1);
  const [drillBpm, setDrillBpm] = useState<number>(90);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      aiVoiceTutor.stop();
      aiVoiceTutor.stopMetronome();
    };
  }, []);

  // Update selected lesson when category changes or when current becomes locked
  useEffect(() => {
    const currentAvailable = getFilteredLessons();
    if (currentAvailable.length > 0 && (!selectedLesson || !currentAvailable.some(l => l.id === selectedLesson.id))) {
      setSelectedLesson(currentAvailable[0]);
    }
  }, [activeCategory, lessons]);

  // Update drill BPM when lesson changes
  useEffect(() => {
    if (selectedLesson?.interactiveDrill?.targetBpm) {
      setDrillBpm(selectedLesson.interactiveDrill.targetBpm);
    }
    setUserExerciseText('');
    setCompletedSuccess(false);
    aiVoiceTutor.stop();
    aiVoiceTutor.stopMetronome();
    setIsSpeaking(false);
    setIsMetronomeActive(false);
  }, [selectedLesson?.id]);

  const categories = [
    'Speed Flow',
    'Punchlines',
    'Minha Trilha',
    'Fundamentos',
    'Encaixe no Beat',
    'Contagem de Versos',
    'Gastação',
    'Ideológica',
    'Todos'
  ];

  // Helper to check if a lesson is locked based on prerequisite
  const isLessonLocked = (lesson: Lesson): boolean => {
    if (!lesson.prerequisiteLessonId) return false;
    const prereq = lessons.find(l => l.id === lesson.prerequisiteLessonId);
    return !prereq?.isCompleted;
  };

  const getFilteredLessons = (): Lesson[] => {
    return lessons.filter(l => {
      if (activeCategory === 'Todos') return true;
      if (activeCategory === 'Speed Flow') return l.track === 'speedflow' || l.category === 'Speed Flow';
      if (activeCategory === 'Punchlines') return l.track === 'punchline' || l.category === 'Punchlines';
      if (activeCategory === 'Minha Trilha') {
        const userSkills = profile?.focusSkills || ['speedflow', 'punchline', 'encaixe_beat'];
        const skillMatches: Record<string, string[]> = {
          speedflow: ['Speed Flow', 'Métrica & Flow'],
          punchline: ['Punchlines', 'Batalhas & Improviso'],
          encaixe_beat: ['Encaixe no Beat', 'Fundamentos'],
          contagem_versos: ['Contagem de Versos'],
          flow: ['Métrica & Flow', 'Speed Flow'],
        };
        const allowed = new Set<string>();
        userSkills.forEach(s => {
          (skillMatches[s] || []).forEach(c => allowed.add(c));
        });
        if (profile?.trainingType === 'gastacao') allowed.add('Gastação');
        if (profile?.trainingType === 'ideologica') allowed.add('Ideológica');
        return allowed.has(l.category) || (l.track && userSkills.includes(l.track as any));
      }
      return l.category === activeCategory;
    });
  };

  const filteredLessons = getFilteredLessons();

  const handleLessonSelect = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setUserExerciseText('');
    setCompletedSuccess(false);
    aiVoiceTutor.stop();
    aiVoiceTutor.stopMetronome();
    setIsSpeaking(false);
    setIsMetronomeActive(false);
  };

  // AI Voice Playback Handlers
  const handlePlayTheoryVoice = () => {
    if (isSpeaking && speakingType === 'theory') {
      aiVoiceTutor.stop();
      setIsSpeaking(false);
      setSpeakingType(null);
      return;
    }

    if (!selectedLesson) return;
    const textToRead = selectedLesson.aiVoiceScript || `${selectedLesson.title}. ${selectedLesson.theory}`;
    
    setIsSpeaking(true);
    setSpeakingType('theory');
    aiVoiceTutor.speak(textToRead, {
      rate: selectedLesson.track === 'speedflow' ? 1.12 : 1.02,
      onEnd: () => {
        setIsSpeaking(false);
        setSpeakingType(null);
      },
      onError: () => {
        setIsSpeaking(false);
        setSpeakingType(null);
      }
    });
  };

  const handlePlayExamplesVoice = () => {
    if (isSpeaking && speakingType === 'example') {
      aiVoiceTutor.stop();
      setIsSpeaking(false);
      setSpeakingType(null);
      return;
    }

    if (!selectedLesson?.exampleLyrics?.length) return;
    const lyricsText = `Ouça o exemplo prático: ${selectedLesson.exampleLyrics.join('. ')}`;

    setIsSpeaking(true);
    setSpeakingType('example');
    aiVoiceTutor.speak(lyricsText, {
      rate: selectedLesson.track === 'speedflow' ? 1.25 : 1.05,
      pitch: 0.92,
      onEnd: () => {
        setIsSpeaking(false);
        setSpeakingType(null);
      },
      onError: () => {
        setIsSpeaking(false);
        setSpeakingType(null);
      }
    });
  };

  const handleStopAudio = () => {
    aiVoiceTutor.stop();
    aiVoiceTutor.stopMetronome();
    setIsSpeaking(false);
    setSpeakingType(null);
    setIsMetronomeActive(false);
  };

  // Metronome Toggle for Speed Flow
  const handleToggleMetronome = () => {
    if (isMetronomeActive) {
      aiVoiceTutor.stopMetronome();
      setIsMetronomeActive(false);
    } else {
      setIsMetronomeActive(true);
      aiVoiceTutor.startMetronome(drillBpm, (beat) => {
        setCurrentBeatPulse(beat);
      });
    }
  };

  const handleSubmitExercise = async () => {
    if (!selectedLesson || !userExerciseText.trim()) return;

    setIsSubmitting(true);
    try {
      const ok = await onCompleteLesson(selectedLesson.id, userExerciseText);
      if (ok) {
        setCompletedSuccess(true);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#6366f1', '#ec4899'],
        });

        // AI voice celebration
        const celebrationText = `Excelente! Você concluiu ${selectedLesson.title} e garantiu mais ${selectedLesson.xpReward} XP! Continue no treino para dominar o topo das batalhas.`;
        aiVoiceTutor.speak(celebrationText, { rate: 1.05 });
      }
    } catch (err) {
      console.error('Error completing lesson:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Track stats
  const speedFlowLessons = lessons.filter(l => l.track === 'speedflow' || l.category === 'Speed Flow');
  const speedFlowCompleted = speedFlowLessons.filter(l => l.isCompleted).length;
  const punchlineLessons = lessons.filter(l => l.track === 'punchline' || l.category === 'Punchlines');
  const punchlineCompleted = punchlineLessons.filter(l => l.isCompleted).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      
      {/* Academy Header Banner */}
      <div className="rounded-2xl border border-neutral-800 bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/40 p-6 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="h-5 w-5 text-amber-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Academia RimaLab • Metodologia Oficial
              </span>
              <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-black text-red-400 border border-red-500/40 flex items-center gap-1">
                <Radio className="h-3 w-3 animate-pulse" />
                Voz de IA Integrada
              </span>
            </div>
            <h1 className="text-2xl font-black text-white sm:text-3xl">
              Trilhas Progressivas & Treinos Interativos
            </h1>
            <p className="text-sm text-neutral-400 max-w-2xl mt-1">
              Evolua do Nível 1 ao Nível 4 em <strong>Speed Flow</strong> e <strong>Punchlines</strong>. Desbloqueie lições avançadas completando os treinos com mentor de voz em tempo real.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onOpenSkillTracks && (
              <button
                id="btn-open-skilltracks"
                onClick={() => onOpenSkillTracks()}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-xs font-black text-neutral-950 hover:brightness-110 shadow-lg shadow-amber-500/20 transition-all"
              >
                <Zap className="h-4 w-4" />
                <span>Laboratório de Habilidades</span>
              </button>
            )}

            {/* Total Academy Progress */}
            <div className="flex items-center gap-3 bg-neutral-950/90 px-4 py-2.5 rounded-xl border border-neutral-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] text-neutral-400 font-semibold">Total Concluído</span>
                <p className="text-sm font-black text-white">
                  {lessons.filter(l => l.isCompleted).length} de {lessons.length} Aulas
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Specialized Track Progress Cards (Speed Flow & Punchline) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 pt-4 border-t border-neutral-800">
          
          {/* Speed Flow Track Card */}
          <div 
            onClick={() => setActiveCategory('Speed Flow')}
            className={`cursor-pointer rounded-xl p-3.5 border transition-all ${
              activeCategory === 'Speed Flow'
                ? 'bg-amber-500/10 border-amber-500/60 shadow-lg shadow-amber-500/10'
                : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                    Trilha Speed Flow ⚡
                    <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.2 rounded">
                      4 Níveis
                    </span>
                  </h4>
                  <p className="text-[11px] text-neutral-400">Diafragma, Dicção 120+ BPM & Double Time</p>
                </div>
              </div>
              <span className="text-xs font-black text-amber-400">
                {speedFlowCompleted}/{speedFlowLessons.length}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${(speedFlowCompleted / Math.max(1, speedFlowLessons.length)) * 100}%` }}
              />
            </div>
          </div>

          {/* Punchline Track Card */}
          <div 
            onClick={() => setActiveCategory('Punchlines')}
            className={`cursor-pointer rounded-xl p-3.5 border transition-all ${
              activeCategory === 'Punchlines'
                ? 'bg-orange-500/10 border-orange-500/60 shadow-lg shadow-orange-500/10'
                : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/20 text-orange-400">
                  <Target className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                    Trilha Punchlines 🥊
                    <span className="text-[10px] text-orange-400 font-bold bg-orange-500/10 px-1.5 py-0.2 rounded">
                      4 Níveis
                    </span>
                  </h4>
                  <p className="text-[11px] text-neutral-400">Estrutura 4x4, Quebra de Expectativa & Rebatida</p>
                </div>
              </div>
              <span className="text-xs font-black text-orange-400">
                {punchlineCompleted}/{punchlineLessons.length}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-orange-500 to-red-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${(punchlineCompleted / Math.max(1, punchlineLessons.length)) * 100}%` }}
              />
            </div>
          </div>

        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-neutral-800/80">
          {categories.map((cat) => {
            const isSpeed = cat === 'Speed Flow';
            const isPunch = cat === 'Punchlines';
            const isTrilha = cat === 'Minha Trilha';
            const isSelected = activeCategory === cat;

            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? isSpeed
                      ? 'bg-amber-500 text-neutral-950 shadow-md font-black scale-105'
                      : isPunch
                      ? 'bg-orange-500 text-neutral-950 shadow-md font-black scale-105'
                      : isTrilha
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-neutral-950 shadow-md scale-105 font-black'
                      : 'bg-amber-500 text-neutral-950 shadow-md font-black'
                    : isSpeed
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                    : isPunch
                    ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30 hover:bg-orange-500/20'
                    : isTrilha
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/40 hover:bg-amber-500/20'
                    : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-neutral-200'
                }`}
              >
                {isSpeed && <Zap className="h-3.5 w-3.5" />}
                {isPunch && <Target className="h-3.5 w-3.5" />}
                {isTrilha && <Sparkles className="h-3.5 w-3.5" />}
                <span>{cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Academy Grid: Left Lessons Roadmap / List + Right Interactive Stage */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        
        {/* Left Column: Lesson Track Roadmap & Navigation (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Lições Disponíveis ({filteredLessons.length})
            </span>
            <span className="text-[11px] text-neutral-500">
              {activeCategory}
            </span>
          </div>

          <div className="space-y-2.5">
            {filteredLessons.map((lesson, idx) => {
              const isSelected = selectedLesson?.id === lesson.id;
              const isLocked = isLessonLocked(lesson);

              return (
                <div key={lesson.id} className="relative">
                  <button
                    disabled={isLocked}
                    onClick={() => handleLessonSelect(lesson)}
                    className={`w-full flex items-start gap-3 rounded-xl p-3.5 text-left transition-all relative ${
                      isLocked
                        ? 'bg-neutral-950/60 border border-neutral-800/60 opacity-65 cursor-not-allowed'
                        : isSelected
                        ? 'bg-amber-500/15 border-2 border-amber-500/80 shadow-lg shadow-amber-500/10'
                        : 'bg-neutral-900/80 border border-neutral-800 hover:bg-neutral-800/60 hover:border-neutral-700'
                    }`}
                  >
                    {/* Status / Number Badge */}
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      lesson.isCompleted
                        ? 'bg-emerald-500 text-neutral-950 font-bold'
                        : isLocked
                        ? 'bg-neutral-800 text-neutral-500'
                        : isSelected
                        ? 'bg-amber-500 text-neutral-950 font-black'
                        : 'bg-neutral-800 text-neutral-300'
                    }`}>
                      {lesson.isCompleted ? (
                        <Check className="h-4 w-4 stroke-[3]" />
                      ) : isLocked ? (
                        <Lock className="h-3.5 w-3.5 text-neutral-500" />
                      ) : lesson.tier ? (
                        <span className="text-xs font-black">N{lesson.tier}</span>
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>

                    {/* Lesson Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                            {lesson.category}
                          </span>
                          {lesson.tier && (
                            <span className="text-[9px] bg-neutral-800 text-amber-300 px-1.5 py-0.2 rounded font-bold">
                              Nível {lesson.tier}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded">
                          +{lesson.xpReward} XP
                        </span>
                      </div>

                      <h3 className={`text-xs font-bold line-clamp-2 mt-1 ${
                        isLocked ? 'text-neutral-500' : isSelected ? 'text-amber-400' : 'text-white'
                      }`}>
                        {lesson.title}
                      </h3>

                      <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-1">
                        <span>{lesson.durationMinutes} min</span>
                        <span>•</span>
                        <span>{lesson.difficulty}</span>
                        {isLocked && (
                          <span className="text-[10px] text-amber-500/80 font-semibold flex items-center gap-1 ml-auto">
                            <Lock className="h-3 w-3" /> Bloqueado
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Connected Track Indicator if part of tiered progression */}
                  {lesson.tier && lesson.tier < 4 && idx < filteredLessons.length - 1 && (
                    <div className="flex justify-center my-0.5">
                      <div className={`h-2 w-0.5 ${lesson.isCompleted ? 'bg-emerald-500' : 'bg-neutral-800'}`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Interactive Lesson Detail, AI Voice Tutor & Practice Stage (8 cols) */}
        {selectedLesson ? (
          <div className="lg:col-span-8 space-y-5">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-6 shadow-xl space-y-6">
              
              {/* Lesson Header & Tier Badge */}
              <div className="border-b border-neutral-800 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-400 border border-amber-500/30">
                      {selectedLesson.category}
                    </span>
                    {selectedLesson.tier && (
                      <span className="rounded-md bg-orange-500/20 px-2.5 py-1 text-xs font-black text-orange-400 border border-orange-500/30">
                        Nível {selectedLesson.tier} de 4
                      </span>
                    )}
                    <span className="text-xs text-neutral-400">
                      Dificuldade: <strong className="text-neutral-200">{selectedLesson.difficulty}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-400 border border-amber-500/20">
                    <Award className="h-3.5 w-3.5" />
                    <span>+{selectedLesson.xpReward} XP ao Concluir</span>
                  </div>
                </div>

                <h2 className="text-xl font-black text-white sm:text-2xl mt-1">
                  {selectedLesson.title}
                </h2>
                <p className="text-sm text-neutral-300 mt-1.5">
                  {selectedLesson.description}
                </p>
              </div>

              {/* AI Voice Coach Interactive Bar */}
              <div className="rounded-xl border border-amber-500/40 bg-gradient-to-r from-neutral-950 via-amber-950/20 to-neutral-950 p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Volume2 className={`h-5 w-5 ${isSpeaking ? 'animate-bounce text-amber-300' : ''}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-white">Mentor IA de Voz</span>
                      {isSpeaking && (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-1.5 py-0.2 rounded-full animate-pulse">
                          Reproduzindo áudio...
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400">
                      Ouça a explicação falada e a declamação com métrica de rap
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    id="btn-play-theory-voice"
                    onClick={handlePlayTheoryVoice}
                    className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition-all ${
                      isSpeaking && speakingType === 'theory'
                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                        : 'bg-amber-500 text-neutral-950 hover:brightness-110 shadow-md shadow-amber-500/20'
                    }`}
                  >
                    {isSpeaking && speakingType === 'theory' ? (
                      <>
                        <Square className="h-3.5 w-3.5 fill-current" />
                        <span>Pausar Explicação</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 fill-current" />
                        <span>Ouvir Aula em Voz de IA</span>
                      </>
                    )}
                  </button>

                  {selectedLesson.exampleLyrics && selectedLesson.exampleLyrics.length > 0 && (
                    <button
                      id="btn-play-example-voice"
                      onClick={handlePlayExamplesVoice}
                      className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                        isSpeaking && speakingType === 'example'
                          ? 'bg-red-500 text-white'
                          : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700 hover:text-white border border-neutral-700'
                      }`}
                    >
                      {isSpeaking && speakingType === 'example' ? (
                        <>
                          <Square className="h-3.5 w-3.5 fill-current" />
                          <span>Parar Exemplo</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-3.5 w-3.5" />
                          <span>Ouvir Flow do Exemplo</span>
                        </>
                      )}
                    </button>
                  )}

                  {isSpeaking && (
                    <button
                      onClick={handleStopAudio}
                      className="p-2 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700"
                      title="Silenciar Voz"
                    >
                      <VolumeX className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Theory Content */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  Metodologia & Teoria Estrutural
                </h3>
                <div className="rounded-xl bg-neutral-950 p-4 border border-neutral-800 text-sm text-neutral-200 leading-relaxed whitespace-pre-line font-sans">
                  {selectedLesson.theory}
                </div>
              </div>

              {/* Example Lyrics */}
              {selectedLesson.exampleLyrics && selectedLesson.exampleLyrics.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-amber-500" />
                      Aplicação Prática no Beat
                    </h3>
                  </div>
                  <div className="rounded-xl bg-neutral-950 p-4 border border-neutral-800 space-y-2 font-mono text-xs sm:text-sm">
                    {selectedLesson.exampleLyrics.map((verse, i) => (
                      <div key={i} className="text-neutral-200 flex items-start gap-2.5">
                        <span className="text-neutral-600 select-none font-bold text-xs pt-0.5">{i + 1}</span>
                        <span className={verse.includes('DOUBLE TIME') || verse.includes('PUNCHLINE') ? 'text-amber-300 font-bold' : ''}>
                          {verse}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Specialized Interactive Drill: Metronome for Speed Flow OR Punchline Finish for Punchlines */}
              {selectedLesson.interactiveDrill && (
                <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                        {selectedLesson.interactiveDrill.type === 'speed_metronome' ? (
                          <Gauge className="h-4 w-4" />
                        ) : (
                          <Target className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white">
                          {selectedLesson.interactiveDrill.type === 'speed_metronome'
                            ? 'Drill Interativo de Metrônomo (Speed Flow)'
                            : 'Drill Interativo de Fechamento de Punchline'}
                        </h4>
                        <p className="text-[11px] text-neutral-400">
                          {selectedLesson.interactiveDrill.drillDescription}
                        </p>
                      </div>
                    </div>

                    {/* Speed Metronome Controls if speed drill */}
                    {selectedLesson.interactiveDrill.type === 'speed_metronome' && (
                      <div className="flex items-center gap-2 bg-neutral-900 px-3 py-1.5 rounded-xl border border-neutral-800">
                        <span className="text-xs font-black text-amber-400">{drillBpm} BPM</span>
                        <button
                          onClick={() => setDrillBpm(Math.max(60, drillBpm - 5))}
                          className="px-1.5 py-0.5 text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded"
                        >
                          -5
                        </button>
                        <button
                          onClick={() => setDrillBpm(Math.min(180, drillBpm + 5))}
                          className="px-1.5 py-0.5 text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded"
                        >
                          +5
                        </button>
                        <button
                          id="btn-toggle-metronome"
                          onClick={handleToggleMetronome}
                          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                            isMetronomeActive
                              ? 'bg-red-500 text-white'
                              : 'bg-amber-500 text-neutral-950 hover:brightness-110'
                          }`}
                        >
                          {isMetronomeActive ? <Square className="h-3 w-3 fill-current" /> : <Play className="h-3 w-3 fill-current" />}
                          <span>{isMetronomeActive ? 'Parar' : 'Iniciar'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Metronome Beat Pulse Dots */}
                  {selectedLesson.interactiveDrill.type === 'speed_metronome' && (
                    <div className="flex items-center justify-center gap-4 py-2 bg-neutral-900/60 rounded-xl border border-neutral-800">
                      {[1, 2, 3, 4].map((beatNum) => (
                        <div key={beatNum} className="flex flex-col items-center gap-1">
                          <div
                            className={`h-6 w-6 rounded-full transition-all flex items-center justify-center text-[10px] font-black ${
                              isMetronomeActive && currentBeatPulse === beatNum
                                ? beatNum === 1
                                  ? 'bg-amber-400 text-neutral-950 scale-125 shadow-lg shadow-amber-400/50'
                                  : 'bg-amber-500/80 text-neutral-950 scale-110'
                                : 'bg-neutral-800 text-neutral-500'
                            }`}
                          >
                            {beatNum}
                          </div>
                          <span className="text-[9px] text-neutral-500 uppercase font-bold">
                            {beatNum === 1 ? 'Kick' : beatNum === 4 ? 'Snare' : `T${beatNum}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Setup Verses Display for Punchline Drills */}
                  {selectedLesson.interactiveDrill.setupVerses && (
                    <div className="space-y-1.5 bg-neutral-900/90 p-3 rounded-xl border border-neutral-800 font-mono text-xs">
                      {selectedLesson.interactiveDrill.setupVerses.map((sv, idx) => (
                        <div key={idx} className="text-neutral-300 flex items-center gap-2">
                          <span className="text-amber-500 font-bold">{idx + 1}.</span>
                          <span>{sv}</span>
                        </div>
                      ))}
                      <div className="text-orange-400 font-bold flex items-center gap-2 pt-1 border-t border-neutral-800">
                        <span>4.</span>
                        <span>[SEU GOLPE / PUNCHLINE NO 4º COMPASSO AQUI]</span>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-neutral-400 bg-amber-950/20 p-2.5 rounded-lg border border-amber-500/20 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-400 shrink-0" />
                    <span><strong>Dica do Mentor:</strong> {selectedLesson.interactiveDrill.drillHint}</span>
                  </div>
                </div>
              )}

              {/* MC Tips */}
              {selectedLesson.tips && selectedLesson.tips.length > 0 && (
                <div className="space-y-2 rounded-xl bg-amber-950/20 p-4 border border-amber-500/30">
                  <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Lightbulb className="h-4 w-4" />
                    Dicas dos Campeões de Batalha
                  </h4>
                  <ul className="list-disc pl-5 text-xs text-neutral-300 space-y-1">
                    {selectedLesson.tips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Practical Exercise Arena */}
              <div className="space-y-4 pt-2 border-t border-neutral-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-400" />
                    Exercício Prático para Concluir & Desbloquear Próximo Nível
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {selectedLesson.exercisePrompt}
                  </p>
                </div>

                {/* Suggested Words */}
                {selectedLesson.exerciseWords && selectedLesson.exerciseWords.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-medium text-neutral-400">Palavras-guia da lição:</span>
                    {selectedLesson.exerciseWords.map((w, idx) => (
                      <span
                        key={idx}
                        className="rounded-md bg-neutral-800 px-2 py-0.5 text-xs font-semibold text-amber-300 border border-neutral-700"
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                )}

                <textarea
                  id="lesson-exercise-textarea"
                  rows={4}
                  value={userExerciseText}
                  onChange={(e) => setUserExerciseText(e.target.value)}
                  placeholder="Escreva seus versos aplicando o que você treinou nesta lição..."
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 p-3.5 text-sm text-neutral-100 placeholder-neutral-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans"
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    onClick={() => onSendToStudio(userExerciseText || selectedLesson.exercisePrompt)}
                    className="flex items-center gap-1.5 text-xs font-bold text-neutral-400 hover:text-amber-400 transition-colors"
                  >
                    <span>Levar para o Studio com Beat</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>

                  <button
                    id="submit-lesson-exercise-btn"
                    disabled={isSubmitting || userExerciseText.trim().length < 6}
                    onClick={handleSubmitExercise}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-xs font-black text-neutral-950 shadow-lg shadow-amber-500/20 hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>Validando exercício...</span>
                    ) : completedSuccess || selectedLesson.isCompleted ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Lição Concluída (+{selectedLesson.xpReward} XP)</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Enviar Resposta & Desbloquear</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 flex flex-col items-center justify-center p-12 rounded-2xl border border-neutral-800 bg-neutral-900/60 text-center">
            <BookOpen className="h-12 w-12 text-neutral-600 mb-3" />
            <h3 className="text-base font-bold text-white">Selecione uma lição para começar</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm">
              Escolha uma aula na lista ao lado para acessar os exercícios teóricos, drills de áudio e voz de IA.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
