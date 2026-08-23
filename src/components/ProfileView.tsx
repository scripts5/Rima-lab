import React, { useState } from 'react';
import { 
  User, 
  BarChart2, 
  Flame, 
  Award, 
  Clock, 
  FileText, 
  Settings, 
  Download, 
  Trash2, 
  Check, 
  Mic, 
  Zap,
  Radio,
  Share2
} from 'lucide-react';
import { UserProfile, PracticeSession, XPTransaction } from '../types';

interface ProfileViewProps {
  profile: UserProfile | null;
  onUpdateProfile: (updated: Partial<UserProfile>) => Promise<boolean>;
  practiceSessions: PracticeSession[];
  xpTransactions: XPTransaction[];
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  onUpdateProfile,
  practiceSessions,
  xpTransactions,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [artisticName, setArtisticName] = useState<string>(profile?.artisticName || '');
  const [tagline, setTagline] = useState<string>(profile?.tagline || '');
  const [bio, setBio] = useState<string>(profile?.bio || '');
  const [favoriteStyle, setFavoriteStyle] = useState<string>(profile?.favoriteStyle || 'Boom Bap');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const level = profile?.level || 1;
  const totalXP = profile?.totalXP || 0;
  const currentLevelXP = totalXP % 1000;
  const progressPercent = Math.min(100, Math.round((currentLevelXP / 1000) * 100));

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const ok = await onUpdateProfile({
        artisticName,
        tagline,
        bio,
        favoriteStyle,
      });
      if (ok) {
        setIsEditing(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      const res = await fetch('/api/data/export', { method: 'POST' });
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rimalab_meus_dados_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting data:', err);
    }
  };

  const handleResetData = async () => {
    if (window.confirm('Tem certeza que deseja resetar suas estatísticas de treino conforme a LGPD? Esta ação não pode ser desfeita.')) {
      try {
        await fetch('/api/data/delete', { method: 'POST' });
        window.location.reload();
      } catch (err) {
        console.error('Error resetting data:', err);
      }
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      
      {/* Profile Overview Card */}
      <div className="rounded-2xl border border-neutral-800 bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/30 p-6 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-6">
          
          <div className="flex items-center gap-5">
            <div className="relative">
              <img
                src={profile?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=user_demo_01`}
                alt={profile?.artisticName}
                referrerPolicy="no-referrer"
                className="h-20 w-20 rounded-2xl border-2 border-amber-500/50 bg-neutral-950 object-cover p-1 shadow-lg"
              />
              <div className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-xs font-black text-neutral-950 shadow">
                {level}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white sm:text-2xl">
                  {profile?.artisticName || 'MC RimaLab'}
                </h1>
                <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/30">
                  {profile?.levelDetails?.title || 'Intermediário'}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                {profile?.tagline || 'Freestyler & Mestre da Métrica'}
              </p>
              <p className="text-xs text-neutral-300 max-w-md mt-2 leading-relaxed">
                {profile?.bio || 'Treinando rimas diárias no RimaLab para dominar as batalhas e o improviso.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 px-4 py-2 text-xs font-bold text-neutral-200 border border-neutral-700 transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span>{isEditing ? 'Cancelar Edição' : 'Editar Perfil'}</span>
            </button>
          </div>

        </div>

        {/* Level Progress Bar */}
        <div className="mt-6 pt-5 border-t border-neutral-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-neutral-400">
              Nível {level} ({profile?.levelDetails?.title || 'MC'})
            </span>
            <span className="text-amber-400">
              {currentLevelXP} / 1000 XP para o Nível {level + 1}
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-neutral-950 border border-neutral-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Edit Profile Form Drawer */}
      {isEditing && (
        <div className="rounded-2xl border border-amber-500/40 bg-neutral-900 p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider text-amber-400">
            Atualizar Informações do MC
          </h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1">Nome Artístico / Vulgo:</label>
                <input
                  type="text"
                  value={artisticName}
                  onChange={(e) => setArtisticName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1">Estilo Favorito:</label>
                <select
                  value={favoriteStyle}
                  onChange={(e) => setFavoriteStyle(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="Boom Bap">Boom Bap (90 BPM)</option>
                  <option value="Trap">Trap 808 (140 BPM)</option>
                  <option value="Drill">UK / BR Drill (142 BPM)</option>
                  <option value="Lo-Fi">Lo-Fi Mellow (82 BPM)</option>
                  <option value="Speed Flow">Speed Flow (108 BPM)</option>
                  <option value="Grime">Grime (140 BPM)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-300 block mb-1">Slogan / Tagline:</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-300 block mb-1">Biografia:</label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-amber-500 text-neutral-950 text-xs font-bold hover:brightness-110 disabled:opacity-50"
              >
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4 Core Performance Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 space-y-1">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-bold uppercase tracking-wider">Sessões Gravadas</span>
            <Mic className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-white">
            {profile?.totalSessions || practiceSessions.length || 0}
          </p>
          <span className="text-[11px] text-neutral-500">Práticas de freestyle</span>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 space-y-1">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-bold uppercase tracking-wider">Tempo Praticado</span>
            <Clock className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-white">
            {profile?.totalMinutesPracticed || 18} <span className="text-sm font-semibold text-neutral-400">min</span>
          </p>
          <span className="text-[11px] text-neutral-500">Em beats ao vivo</span>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 space-y-1">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-bold uppercase tracking-wider">Melhor Pontuação</span>
            <Award className="h-4 w-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-white">
            {profile?.bestScore || 92} <span className="text-sm font-semibold text-neutral-400">/ 100</span>
          </p>
          <span className="text-[11px] text-neutral-500">Avaliação da métrica</span>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 space-y-1">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-bold uppercase tracking-wider">Palavras Rimadas</span>
            <Flame className="h-4 w-4 text-orange-500" />
          </div>
          <p className="text-2xl font-black text-white">
            {profile?.totalWordsRhymed || 340}
          </p>
          <span className="text-[11px] text-neutral-500">Vocabulário no flow</span>
        </div>

      </div>

      {/* Practice Sessions History & XP Ledger (2 columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Practice Sessions History (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="h-4 w-4 text-amber-500" />
              Histórico de Sessões Recentes
            </h3>
            <span className="text-xs text-neutral-500 font-semibold">
              {practiceSessions.length} sessões
            </span>
          </div>

          <div className="space-y-3">
            {practiceSessions.length === 0 ? (
              <p className="text-xs text-neutral-500 py-6 text-center">
                Nenhuma gravação recente. Comece sua prática no Studio!
              </p>
            ) : (
              practiceSessions.map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl bg-neutral-950 p-4 border border-neutral-800 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-400">
                        {s.beatStyle} • {s.bpm} BPM
                      </span>
                      <span className="text-xs text-neutral-400">
                        {s.durationSeconds}s
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-emerald-400">
                        +{s.xpEarned} XP
                      </span>
                      <span className="rounded-md bg-neutral-800 px-2 py-0.5 text-xs font-black text-white">
                        Nota: {s.analysis?.overallScore || 85}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-300 font-mono line-clamp-2 leading-relaxed bg-neutral-900/60 p-2 rounded-lg border border-neutral-800/60">
                    "{s.transcript}"
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1">
                    <span>{new Date(s.createdAt).toLocaleString('pt-BR')}</span>
                    {s.analysis?.rhymeQuality && (
                      <span>Rima: {s.analysis.rhymeQuality}% | Flow: {s.analysis.flowScore}%</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* XP Ledger & LGPD Privacy Management (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* XP Ledger */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Extrato de XP
            </h3>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {xpTransactions.length === 0 ? (
                <p className="text-xs text-neutral-500 py-4 text-center">Nenhum registro ainda.</p>
              ) : (
                xpTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-xl bg-neutral-950 p-2.5 border border-neutral-800/80"
                  >
                    <div>
                      <p className="text-xs font-bold text-neutral-200">
                        {tx.description}
                      </p>
                      <span className="text-[10px] text-neutral-500">
                        {new Date(tx.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <span className="text-xs font-black text-amber-400">
                      +{tx.amount} XP
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* LGPD Data Controls */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Settings className="h-4 w-4 text-neutral-400" />
              Privacidade & LGPD
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Você tem total controle sobre seus dados, histórico de gravações e métricas de freestyle.
            </p>

            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={handleExportData}
                className="flex items-center justify-center gap-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 py-2 text-xs font-bold text-neutral-200 border border-neutral-700 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Exportar Meus Dados (JSON)</span>
              </button>

              <button
                onClick={handleResetData}
                className="flex items-center justify-center gap-2 rounded-xl bg-red-950/30 hover:bg-red-950/60 py-2 text-xs font-bold text-red-400 border border-red-900/40 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Resetar Histórico e Estatísticas</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
