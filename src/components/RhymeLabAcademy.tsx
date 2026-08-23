import React, { useState } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  Award, 
  Play, 
  Sparkles, 
  HelpCircle, 
  ArrowRight, 
  ChevronRight, 
  Check, 
  Flame, 
  Lock, 
  FileText,
  Lightbulb
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Lesson } from '../types';

interface RhymeLabAcademyProps {
  lessons: Lesson[];
  onCompleteLesson: (lessonId: string, customLyrics: string) => Promise<boolean>;
  onSendToStudio: (lyricsPrompt: string) => void;
}

export const RhymeLabAcademy: React.FC<RhymeLabAcademyProps> = ({
  lessons,
  onCompleteLesson,
  onSendToStudio,
}) => {
  const [selectedLesson, setSelectedLesson] = useState<Lesson>(lessons[0] || null);
  const [userExerciseText, setUserExerciseText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [completedSuccess, setCompletedSuccess] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>('Todos');

  const categories = ['Todos', 'Fundamentos', 'Métrica & Flow', 'Punchlines', 'Batalhas & Improviso', 'Vocabulário'];

  const filteredLessons = lessons.filter(l => {
    if (activeCategory === 'Todos') return true;
    return l.category === activeCategory;
  });

  const handleLessonSelect = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setUserExerciseText('');
    setCompletedSuccess(false);
  };

  const handleSubmitExercise = async () => {
    if (!selectedLesson || !userExerciseText.trim()) return;

    setIsSubmitting(true);
    try {
      const ok = await onCompleteLesson(selectedLesson.id, userExerciseText);
      if (ok) {
        setCompletedSuccess(true);
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#6366f1'],
        });
      }
    } catch (err) {
      console.error('Error completing lesson:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      
      {/* Academy Header Banner */}
      <div className="rounded-2xl border border-neutral-800 bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/30 p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="h-5 w-5 text-amber-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Academia RimaLab
              </span>
            </div>
            <h1 className="text-2xl font-black text-white sm:text-3xl">
              Cursos & Metodologia de Rimas
            </h1>
            <p className="text-sm text-neutral-400 max-w-2xl mt-1">
              Domine os fundamentos da métrica poética, esquemas de rimas, construção de punchlines e técnicas avançadas de improviso.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-neutral-950/80 px-4 py-2.5 rounded-xl border border-neutral-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs text-neutral-400 font-semibold">Progresso</span>
              <p className="text-sm font-black text-white">
                {lessons.filter(l => l.isCompleted).length} de {lessons.length} Concluídas
              </p>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-neutral-800">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                activeCategory === cat
                  ? 'bg-amber-500 text-neutral-950 shadow-md'
                  : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-neutral-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Academy Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        
        {/* Left Lesson List (4 cols) */}
        <div className="lg:col-span-4 space-y-2.5">
          {filteredLessons.map((lesson, idx) => {
            const isSelected = selectedLesson?.id === lesson.id;
            return (
              <button
                key={lesson.id}
                onClick={() => handleLessonSelect(lesson)}
                className={`w-full flex items-start gap-3.5 rounded-xl p-4 text-left transition-all ${
                  isSelected
                    ? 'bg-amber-500/15 border-2 border-amber-500/60 shadow-lg'
                    : 'bg-neutral-900/80 border border-neutral-800 hover:bg-neutral-800/60 hover:border-neutral-700'
                }`}
              >
                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  lesson.isCompleted
                    ? 'bg-emerald-500 text-neutral-950'
                    : isSelected
                    ? 'bg-amber-500 text-neutral-950 font-black'
                    : 'bg-neutral-800 text-neutral-400'
                }`}>
                  {lesson.isCompleted ? <Check className="h-4 w-4 stroke-[3]" /> : <span>{idx + 1}</span>}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
                      {lesson.category}
                    </span>
                    <span className="text-[10px] font-bold text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded">
                      +{lesson.xpReward} XP
                    </span>
                  </div>

                  <h3 className={`text-xs font-bold line-clamp-2 mt-0.5 ${isSelected ? 'text-amber-400' : 'text-white'}`}>
                    {lesson.title}
                  </h3>

                  <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-1">
                    <span>{lesson.durationMinutes} min</span>
                    <span>•</span>
                    <span>{lesson.difficulty}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Lesson Detail & Practical Exercise Area (8 cols) */}
        {selectedLesson && (
          <div className="lg:col-span-8 space-y-5">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-6 shadow-xl space-y-6">
              
              {/* Lesson Title & Header Details */}
              <div className="border-b border-neutral-800 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/30">
                      {selectedLesson.category}
                    </span>
                    <span className="text-xs text-neutral-400">
                      Nível: <strong className="text-neutral-200">{selectedLesson.difficulty}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-400 border border-amber-500/20">
                    <Award className="h-3.5 w-3.5" />
                    <span>+{selectedLesson.xpReward} XP ao Concluir</span>
                  </div>
                </div>

                <h2 className="text-xl font-black text-white sm:text-2xl">
                  {selectedLesson.title}
                </h2>
                <p className="text-sm text-neutral-300 mt-1">
                  {selectedLesson.description}
                </p>
              </div>

              {/* Theory Body */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  Teoria & Estrutura
                </h3>
                <div className="rounded-xl bg-neutral-950 p-4 border border-neutral-800/80 text-sm text-neutral-200 leading-relaxed whitespace-pre-line font-sans">
                  {selectedLesson.theory}
                </div>
              </div>

              {/* Example Lyrics */}
              {selectedLesson.exampleLyrics && selectedLesson.exampleLyrics.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-amber-500" />
                    Exemplo Prático de Aplicação
                  </h3>
                  <div className="rounded-xl bg-neutral-950 p-4 border border-neutral-800/80 space-y-1.5 font-mono text-xs sm:text-sm">
                    {selectedLesson.exampleLyrics.map((verse, i) => (
                      <div key={i} className="text-neutral-200 flex items-center gap-2">
                        <span className="text-neutral-600 select-none">{i + 1}</span>
                        <span>{verse}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pro Tips */}
              {selectedLesson.tips && selectedLesson.tips.length > 0 && (
                <div className="space-y-2.5 rounded-xl bg-amber-950/20 p-4 border border-amber-500/30">
                  <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Lightbulb className="h-4 w-4" />
                    Dicas de Ouro dos MCs
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
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-400" />
                      Exercício Prático
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {selectedLesson.exercisePrompt}
                    </p>
                  </div>
                </div>

                {/* Exercise required words or keywords if any */}
                {selectedLesson.exerciseWords && selectedLesson.exerciseWords.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-medium text-neutral-400">Palavras sugeridas:</span>
                    {selectedLesson.exerciseWords.map((w, idx) => (
                      <span
                        key={idx}
                        className="rounded-md bg-neutral-800 px-2 py-0.5 text-xs font-semibold text-amber-300"
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
                  placeholder="Escreva sua quadra / versos aplicando o que aprendeu na lição..."
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 p-3.5 text-sm text-neutral-100 placeholder-neutral-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans"
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    onClick={() => onSendToStudio(userExerciseText)}
                    className="flex items-center gap-1.5 text-xs font-bold text-neutral-400 hover:text-amber-400 transition-colors"
                  >
                    <span>Levar para o Studio com Beat</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>

                  <button
                    id="submit-lesson-exercise-btn"
                    disabled={isSubmitting || userExerciseText.trim().length < 10}
                    onClick={handleSubmitExercise}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-xs font-bold text-neutral-950 shadow-lg shadow-amber-500/20 hover:brightness-110 disabled:opacity-50 transition-all"
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
                        <span>Enviar Resposta & Concluir</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
