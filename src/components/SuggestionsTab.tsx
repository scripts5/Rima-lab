import React, { useState, useEffect } from 'react';
import { 
  Lightbulb, 
  Plus, 
  ThumbsUp, 
  MessageSquare, 
  Tag, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Search, 
  Crown, 
  Flame, 
  Zap, 
  Send,
  Radio,
  Sliders,
  Music,
  Check
} from 'lucide-react';
import { CommunitySuggestion, UserProfile } from '../types';

interface SuggestionsTabProps {
  profile: UserProfile | null;
  onNavigateToStudio?: () => void;
}

const INITIAL_SUGGESTIONS: CommunitySuggestion[] = [
  {
    id: 'sug_1',
    authorName: 'MC Menor da Leste',
    authorAge: 16,
    category: 'vertente_rima',
    title: 'Modo de Treino Especial: Gastação Cômica & Tiradas 🟢',
    description: 'Adicionar temas focados puramente em humor, respostas irônicas e tiradas de deboche inteligente para batalhas tradicionais de gastação.',
    upvotes: 48,
    tags: ['#gastacao', '#humor', '#batalhadagastacao', '#tiradas'],
    status: 'IMPLEMENTADO',
    createdAt: '2026-08-20T14:30:00Z',
    teacherComment: 'Luquita MC: Já adicionamos no estúdio! Agora você pode selecionar Gastação 🟢 no Hub de Treino para calibrar os temas e o Jurado IA.',
  },
  {
    id: 'sug_2',
    authorName: 'Kowalski MC & Luquita MC',
    authorAge: 24,
    category: 'beats',
    title: 'Novos Beats no estilo Detroit & Michigan Bounce 🎹',
    description: 'Bateria sincopada com piano seco e grave 808 rápido (98-100 BPM) para treinar punchline contínua e encaixe fora do tempo clássico de Detroit.',
    upvotes: 62,
    tags: ['#detroit', '#michiganflow', '#punchline', '#808'],
    status: 'IMPLEMENTADO',
    createdAt: '2026-08-22T10:15:00Z',
    teacherComment: 'Kowalski MC: Beats de Detroit integrados no sintetizador do RimaLab! Treinem muito a respiração e o timing.',
  },
  {
    id: 'sug_3',
    authorName: 'MC Visão Crítica',
    authorAge: 20,
    category: 'vertente_rima',
    title: 'Filtro de Rima Ideológica & Conhecimento Profundo ⚪️',
    description: 'Temas voltados para filosofia de rua, metáforas sociais, política, história e expansão de vocabulário sem agressividade gratuita.',
    upvotes: 39,
    tags: ['#ideologica', '#conhecimento', '#filosofia', '#cultura'],
    status: 'IMPLEMENTADO',
    createdAt: '2026-08-21T18:00:00Z',
    teacherComment: 'Luquita MC: Disponível na seleção do Hub! O Jurado IA agora avalia a profundidade dos argumentos na rima ideológica.',
  },
  {
    id: 'sug_4',
    authorName: 'MC Flecha Rápida',
    authorAge: 17,
    category: 'recurso_site',
    title: 'Medidor Visual de Contagem de Versos & Entrada da Punchline 📐',
    description: 'Uma barra visual de 4 tempos (Verso 1 ➔ Verso 2 ➔ Verso 3 ➔ PUNCHLINE!) para não perder o tempo da rima final nem atropelar a entrada.',
    upvotes: 55,
    tags: ['#contagemdeversos', '#punchline', '#tempo', '#compasso'],
    status: 'IMPLEMENTADO',
    createdAt: '2026-08-23T09:20:00Z',
    teacherComment: 'Kowalski MC: Função crucial para quem quer vencer batalha de 1x1 ou 2x2. Adicionado no Studio!',
  },
  {
    id: 'sug_5',
    authorName: 'MC Dobra Certa',
    authorAge: 19,
    category: 'melhoria_ia',
    title: 'Treino de Speedflow com Velocímetro de Sílabas por Segundo ⚡',
    description: 'Detectar quando o MC faz rima rápida dobrada (acima de 6 sílabas por segundo) e dar feedback específico sobre a clareza da dicção.',
    upvotes: 43,
    tags: ['#speedflow', '#diccao', '#respiracao', '#velocidade'],
    status: 'IMPLEMENTADO',
    createdAt: '2026-08-19T11:00:00Z',
    teacherComment: 'Luquita MC: O módulo de Speedflow já mede as sílabas e ativa o badge de fogo no estúdio.',
  },
  {
    id: 'sug_6',
    authorName: 'MC Garoto Prodígio',
    authorAge: 15,
    category: 'aulas_professores',
    title: 'Sessões de Racha de Rima 2x2 ao Vivo nas Calls de Sábado 📹',
    description: 'Formar duplas entre os alunos assinantes para batalhar 2x2 no Discord/Meet com avaliação em tempo real dos professores.',
    upvotes: 71,
    tags: ['#calls', '#aulas', '#duplas', '#batalha2x2'],
    status: 'APROVADO_PROFESSORES',
    createdAt: '2026-08-24T12:00:00Z',
    teacherComment: 'Kowalski MC: Aprovadíssimo! Vamos organizar o primeiro racha 2x2 na call deste fim de semana.',
  },
  {
    id: 'sug_7',
    authorName: 'MC BoomBap 90',
    authorAge: 22,
    category: 'beats',
    title: 'Mais Samples Clássicos de Boom Bap com Scratch de Vinil 🎙️',
    description: 'Adicionar mais baterias com chiado de fita, cortes de trompete e caixas gordas dos anos 90 estilo Wu-Tang e Racionais.',
    upvotes: 34,
    tags: ['#boombap', '#goldenage', '#scratch', '#vinil'],
    status: 'EM_DESENVOLVIMENTO',
    createdAt: '2026-08-24T14:10:00Z',
    teacherComment: 'Luquita MC: Estamos gerando novos presets clássicos para a biblioteca.',
  }
];

export const SuggestionsTab: React.FC<SuggestionsTabProps> = ({ profile, onNavigateToStudio }) => {
  const [suggestions, setSuggestions] = useState<CommunitySuggestion[]>(() => {
    try {
      const saved = localStorage.getItem('rimalab_community_suggestions');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_SUGGESTIONS;
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [userUpvotes, setUserUpvotes] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('rimalab_user_upvotes');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CommunitySuggestion['category']>('vertente_rima');
  const [description, setDescription] = useState('');
  const [authorName, setAuthorName] = useState(profile?.artisticName || 'MC Anônimo');
  const [authorAge, setAuthorAge] = useState<string>(profile?.age ? String(profile.age) : '18');
  const [tagInput, setTagInput] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Save to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('rimalab_community_suggestions', JSON.stringify(suggestions));
    } catch (e) {
      console.warn('LocalStorage save error', e);
    }
  }, [suggestions]);

  useEffect(() => {
    try {
      localStorage.setItem('rimalab_user_upvotes', JSON.stringify(userUpvotes));
    } catch (e) {
      console.warn('LocalStorage save error', e);
    }
  }, [userUpvotes]);

  const handleUpvote = (id: string) => {
    const hasVoted = !!userUpvotes[id];
    setUserUpvotes(prev => ({ ...prev, [id]: !hasVoted }));

    setSuggestions(prev =>
      prev.map(s => {
        if (s.id === id) {
          return {
            ...s,
            upvotes: hasVoted ? s.upvotes - 1 : s.upvotes + 1,
          };
        }
        return s;
      })
    );
  };

  const handleCreateSuggestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const rawTags = tagInput
      .split(',')
      .map(t => t.trim().replace(/^#?/, '#'))
      .filter(t => t.length > 1);

    if (rawTags.length === 0) {
      rawTags.push(`#${category}`);
    }

    const newSuggestion: CommunitySuggestion = {
      id: `sug_${Date.now()}`,
      authorName: authorName.trim() || profile?.artisticName || 'MC Convidado',
      authorAge: authorAge ? Number(authorAge) || authorAge : undefined,
      category,
      title: title.trim(),
      description: description.trim(),
      upvotes: 1,
      tags: rawTags,
      status: 'ANALISANDO',
      createdAt: new Date().toISOString(),
      teacherComment: 'Kowalski MC & Luquita MC: Recebido! Vamos analisar com a equipe de mentores.',
    };

    setSuggestions([newSuggestion, ...suggestions]);
    setUserUpvotes(prev => ({ ...prev, [newSuggestion.id]: true }));

    // Reset Form
    setTitle('');
    setDescription('');
    setTagInput('');
    setSubmitSuccess(true);
    setTimeout(() => {
      setSubmitSuccess(false);
      setIsFormOpen(false);
    }, 2000);
  };

  const filteredSuggestions = suggestions.filter(s => {
    const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
    const matchesSearch = 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getStatusBadge = (status: CommunitySuggestion['status']) => {
    switch (status) {
      case 'IMPLEMENTADO':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 px-2.5 py-1 text-xs font-black text-emerald-400 border border-emerald-500/40">
            <CheckCircle2 className="h-3 w-3" />
            IMPLEMENTADO NO RIMALAB
          </span>
        );
      case 'APROVADO_PROFESSORES':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/20 px-2.5 py-1 text-xs font-black text-amber-300 border border-amber-500/40">
            <Crown className="h-3 w-3 fill-amber-400" />
            APROVADO POR KOWALSKI & LUQUITA
          </span>
        );
      case 'EM_DESENVOLVIMENTO':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/20 px-2.5 py-1 text-xs font-black text-blue-300 border border-blue-500/40">
            <Zap className="h-3 w-3" />
            EM DESENVOLVIMENTO
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-neutral-800 px-2.5 py-1 text-xs font-bold text-neutral-300 border border-neutral-700">
            <Clock className="h-3 w-3 text-neutral-400" />
            EM ANÁLISE PELA COMUNIDADE
          </span>
        );
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/40 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 h-48 w-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-0.5 text-xs font-black uppercase text-amber-400">
              <Lightbulb className="h-3.5 w-3.5" />
              <span>Espaço Aberto da Comunidade</span>
            </div>
            
            <h1 className="font-display text-2xl sm:text-4xl font-black text-white tracking-tight">
              Mural de <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Sugestões</span> & Novas Ideias
            </h1>
            
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              O RimaLab é construído junto com os MCs! Envie suas ideias de novos beats (Detroit, Trap, Boom Bap), modalidades de treino (Gastação 🟢, Ideológica ⚪️), métricas e recursos. Os professores <span className="font-bold text-amber-300">Luquita MC & Kowalski MC</span> avaliam as ideias mais votadas semanalmente!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              id="open-suggestion-form-btn"
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3 text-xs sm:text-sm font-black text-neutral-950 shadow-xl shadow-amber-500/20 hover:scale-105 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>{isFormOpen ? 'Fechar Formulário' : 'Enviar Minha Sugestão'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Suggestion Form Modal / Box */}
      {isFormOpen && (
        <div className="rounded-2xl border border-amber-500/40 bg-neutral-900/95 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-neutral-950 font-black text-sm">
                💡
              </div>
              <h3 className="font-display text-base font-bold text-white">
                Propor Nova Melhoria ou Recurso
              </h3>
            </div>
            <span className="text-xs text-neutral-400">
              Visível para todos os MCs e Mentores
            </span>
          </div>

          {submitSuccess ? (
            <div className="p-8 text-center space-y-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <Check className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-white">Sugestão Enviada com Sucesso!</h4>
              <p className="text-xs text-neutral-400">Sua ideia já está disponível no mural para votação da comunidade.</p>
            </div>
          ) : (
            <form onSubmit={handleCreateSuggestion} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Seu Vulgo de MC:
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Ex: MC Luquinha, Kowalski..."
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Sua Idade (Opcional):
                  </label>
                  <input
                    type="number"
                    min="8"
                    max="99"
                    value={authorAge}
                    onChange={(e) => setAuthorAge(e.target.value)}
                    placeholder="Ex: 17"
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                  Categoria da Ideia:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'vertente_rima', label: 'Vertente de Rima (Gastação/Ideológica)', icon: '🎤' },
                    { id: 'beats', label: 'Novos Beats (Detroit/Trap/BoomBap)', icon: '🎹' },
                    { id: 'recurso_site', label: 'Ferramentas & Estúdio', icon: '🛠️' },
                    { id: 'aulas_professores', label: 'Aulas com Professores', icon: '📹' },
                    { id: 'melhoria_ia', label: 'Melhorias no Jurado IA', icon: '🤖' },
                  ].map(cat => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setCategory(cat.id as any)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl text-center text-xs font-bold border transition-all ${
                        category === cat.id
                          ? 'bg-amber-500 text-neutral-950 border-amber-500 shadow'
                          : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <span className="text-base mb-1">{cat.icon}</span>
                      <span className="text-[11px] leading-tight">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                  Título Direto da Sugestão:
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Treino de Gastação com tiradas rápidas de 4 compassos"
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                  Explicação & Como Isso Ajuda os MCs:
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva detalhadamente sua sugestão, como ela deve funcionar e de que forma os freestylers vão se beneficiar..."
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                  Tags (separadas por vírgula):
                </label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Ex: #detroit, #punchline, #gastacao, #flow"
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2.5 text-xs font-black text-neutral-950 shadow-lg hover:brightness-110"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Publicar no Mural</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: 'Todas as Sugestões' },
            { id: 'vertente_rima', label: '🎤 Vertentes (Gastação/Ideológica)' },
            { id: 'beats', label: '🎹 Beats (Detroit/Trap/BoomBap)' },
            { id: 'recurso_site', label: '🛠️ Ferramentas & Métricas' },
            { id: 'aulas_professores', label: '📹 Aulas com Professores' },
            { id: 'melhoria_ia', label: '🤖 Jurado IA' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-neutral-950 shadow'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar ideias, tags ou MCs..."
            className="w-full rounded-xl border border-neutral-800 bg-neutral-900/90 pl-9 pr-3.5 py-1.5 text-xs text-white placeholder:text-neutral-500 focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Suggestions List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSuggestions.map((suggestion) => {
          const hasVoted = !!userUpvotes[suggestion.id];

          return (
            <div
              key={suggestion.id}
              className="flex flex-col justify-between rounded-2xl border border-neutral-800/90 bg-neutral-900/80 p-5 shadow-xl hover:border-neutral-700 transition-all space-y-4"
            >
              <div className="space-y-3">
                {/* Top Status & Category Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {getStatusBadge(suggestion.status)}
                  <span className="text-[11px] text-neutral-500 font-mono">
                    {new Date(suggestion.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-display text-base font-bold text-white leading-snug">
                  {suggestion.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {suggestion.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {suggestion.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="rounded-md bg-neutral-950 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-400/90 border border-neutral-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Teacher Comment / Feedback if available */}
                {suggestion.teacherComment && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-amber-300">
                      <Crown className="h-3.5 w-3.5 fill-amber-400" />
                      <span>Resposta dos Mentores (Kowalski & Luquita):</span>
                    </div>
                    <p className="text-neutral-300 text-[11px] leading-relaxed">
                      {suggestion.teacherComment}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer: Author Info & Upvote Action */}
              <div className="flex items-center justify-between pt-3 border-t border-neutral-800/80 text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-800 text-[11px] font-black text-amber-400">
                    {suggestion.authorName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-bold text-neutral-200">{suggestion.authorName}</span>
                    {suggestion.authorAge && (
                      <span className="text-neutral-500 text-[11px] ml-1">({suggestion.authorAge} anos)</span>
                    )}
                  </div>
                </div>

                {/* Upvote Button */}
                <button
                  id={`upvote-btn-${suggestion.id}`}
                  onClick={() => handleUpvote(suggestion.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    hasVoted
                      ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/30 scale-105'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700'
                  }`}
                  title={hasVoted ? 'Você apoiou esta sugestão!' : 'Apoiar esta sugestão (+1 voto)'}
                >
                  <ThumbsUp className={`h-3.5 w-3.5 ${hasVoted ? 'fill-current' : ''}`} />
                  <span>{suggestion.upvotes}</span>
                  <span className="hidden sm:inline">{hasVoted ? 'Apoiado' : 'Apoiar'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredSuggestions.length === 0 && (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-12 text-center space-y-3">
          <Lightbulb className="mx-auto h-8 w-8 text-neutral-600" />
          <h3 className="text-sm font-bold text-neutral-300">Nenhuma sugestão encontrada</h3>
          <p className="text-xs text-neutral-500">Seja o primeiro a enviar uma ideia nesta categoria!</p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-neutral-950 shadow"
          >
            Criar Sugestão
          </button>
        </div>
      )}

    </div>
  );
};
