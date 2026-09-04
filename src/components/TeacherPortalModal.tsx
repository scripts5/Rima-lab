import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Mail, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  X, 
  Send, 
  Sparkles, 
  ShieldCheck, 
  User, 
  BookOpen, 
  Video, 
  Plus, 
  Radio, 
  Award, 
  RefreshCw, 
  Check, 
  XCircle, 
  ExternalLink,
  ChevronRight,
  Users,
  MessageSquare,
  Flame,
  KeyRound,
  FileText,
  HelpCircle
} from 'lucide-react';
import { UserProfile, LiveCallSession, TeacherAccessRequest, TeacherProfile } from '../types';

interface TeacherPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  onShowToast: (title: string, message: string, type?: 'info' | 'xp' | 'ach') => void;
  currentLiveCall?: LiveCallSession | null;
  onUpdateLiveCall?: (callData: Partial<LiveCallSession>) => Promise<boolean>;
}

export const TeacherPortalModal: React.FC<TeacherPortalModalProps> = ({
  isOpen,
  onClose,
  profile,
  onShowToast,
  currentLiveCall,
  onUpdateLiveCall,
}) => {
  // Authentication & Request States
  const [loggedTeacher, setLoggedTeacher] = useState<TeacherProfile | null>(() => {
    try {
      const saved = sessionStorage.getItem('rimalab_teacher_auth');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activePortalTab, setActivePortalTab] = useState<'auth' | 'request' | 'pending' | 'dashboard'>(() => {
    try {
      const saved = sessionStorage.getItem('rimalab_teacher_auth');
      return saved ? 'dashboard' : 'auth';
    } catch {
      return 'auth';
    }
  });

  // Auth / Login Form States
  const [loginEmail, setLoginEmail] = useState<string>(profile?.email || '');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');

  // Request Form States
  const [reqFullName, setReqFullName] = useState<string>('');
  const [reqEmail, setReqEmail] = useState<string>(profile?.email || '');
  const [reqArtisticName, setReqArtisticName] = useState<string>(profile?.artisticName || '');
  const [reqDiscipline, setReqDiscipline] = useState<string>('Métrica & Freestyle de Batalha');
  const [reqPhone, setReqPhone] = useState<string>('');
  const [reqDiscord, setReqDiscord] = useState<string>('');
  const [reqMotivation, setReqMotivation] = useState<string>('');
  const [isSubmittingReq, setIsSubmittingReq] = useState<boolean>(false);
  const [activePendingRequest, setActivePendingRequest] = useState<TeacherAccessRequest | null>(null);

  // Dashboard Sub-Tabs
  const [dashTab, setDashTab] = useState<'students' | 'live' | 'requests' | 'ai_tools'>('students');

  // Dashboard Data
  const [students, setStudents] = useState<any[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState<boolean>(false);
  const [teacherRequests, setTeacherRequests] = useState<TeacherAccessRequest[]>([]);
  const [dispatchedEmails, setDispatchedEmails] = useState<any[]>([]);
  const [approvedTeachersList, setApprovedTeachersList] = useState<TeacherProfile[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState<boolean>(false);

  // Student Award XP Drawer State
  const [awardEmail, setAwardEmail] = useState<string>('');
  const [awardXp, setAwardXp] = useState<number>(100);
  const [awardReason, setAwardReason] = useState<string>('Métrica & Desafio de Rima');
  const [awardNote, setAwardNote] = useState<string>('');
  const [isSubmittingAward, setIsSubmittingAward] = useState<boolean>(false);

  // Live Call Editor State
  const [liveUrl, setLiveUrl] = useState<string>(currentLiveCall?.url || 'https://discord.gg/xXEEtTZzd');
  const [liveTitle, setLiveTitle] = useState<string>(currentLiveCall?.title || 'Mentoria ao Vivo de Freestyle & Métrica');
  const [liveHost, setLiveHost] = useState<string>(loggedTeacher?.fullName || 'Kowalski MC & Professores');
  const [livePlatform, setLivePlatform] = useState<'discord' | 'meet' | 'whatsapp' | 'zoom' | 'custom'>(currentLiveCall?.platform || 'discord');
  const [isBroadcastingLive, setIsBroadcastingLive] = useState<boolean>(!!currentLiveCall?.isActive);

  // AI Workshop Generator State
  const [workshopTopic, setWorkshopTopic] = useState<string>('Speed Flow & Respiração no Compasso 4/4');
  const [workshopAudience, setWorkshopAudience] = useState<string>('Iniciantes e Intermediários');
  const [generatedLessonPlan, setGeneratedLessonPlan] = useState<string>('');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);

  // Check saved pending request on mount
  useEffect(() => {
    const savedPendingEmail = localStorage.getItem('rimalab_pending_teacher_email');
    if (savedPendingEmail && !loggedTeacher) {
      checkTeacherStatus(savedPendingEmail);
    }
  }, [isOpen]);

  // Polling for pending request approval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isOpen && activePortalTab === 'pending' && (activePendingRequest?.email || reqEmail)) {
      const emailToCheck = activePendingRequest?.email || reqEmail;
      interval = setInterval(() => {
        checkTeacherStatus(emailToCheck, true);
      }, 3500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, activePortalTab, activePendingRequest, reqEmail]);

  // Fetch Dashboard Data when logged in
  useEffect(() => {
    if (isOpen && loggedTeacher && activePortalTab === 'dashboard') {
      fetchStudents();
      fetchTeacherRequests();
    }
  }, [isOpen, loggedTeacher, activePortalTab]);

  // Safe fetch helper that handles text/HTML responses without JSON parse crash
  const safeJsonFetch = async (url: string, options?: RequestInit) => {
    try {
      const res = await fetch(url, options);
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        return { ok: res.ok, data };
      } catch {
        return { ok: false, data: { error: 'O servidor respondeu com formato inválido.' } };
      }
    } catch (err: any) {
      return { ok: false, data: { error: err.message || 'Falha na conexão com o servidor.' } };
    }
  };

  const checkTeacherStatus = async (email: string, silent = false) => {
    try {
      const { data } = await safeJsonFetch(`/api/teachers/status?email=${encodeURIComponent(email)}`);

      if (data?.status === 'APPROVED' && data.teacher) {
        setLoggedTeacher(data.teacher);
        sessionStorage.setItem('rimalab_teacher_auth', JSON.stringify(data.teacher));
        localStorage.removeItem('rimalab_pending_teacher_email');
        setActivePortalTab('dashboard');
        onShowToast('🎉 Acesso Liberado!', `Acesso de professor autorizado! Bem-vindo(a), ${data.teacher.fullName}.`, 'ach');
      } else if (data?.status === 'PENDING' && data.request) {
        setActivePendingRequest(data.request);
        setActivePortalTab('pending');
      } else if (data?.status === 'REJECTED') {
        if (!silent) {
          setLoginError('Sua solicitação de professor foi recusada pela administração.');
          setActivePortalTab('auth');
        }
      }
    } catch (e) {
      console.warn('Check teacher status error:', e);
    }
  };

  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const cleanPwd = loginPassword.trim();
    const cleanEmail = loginEmail.trim().toLowerCase();

    // Fast bypass for master teacher password
    if (cleanPwd === '36737829' || cleanPwd === 'adm_token_36737829' || cleanPwd.toLowerCase() === 'admin') {
      const masterProf: TeacherProfile = {
        id: 'teacher_master_kowalski',
        email: cleanEmail || 'kowalski.master@rimalab.com',
        fullName: 'Kowalski MC (Mestre)',
        artisticName: 'Kowalski MC (Mestre)',
        discipline: 'Métrica & Freestyle de Batalha',
        isMaster: true,
        authorizedAt: new Date().toISOString(),
      };
      setLoggedTeacher(masterProf);
      sessionStorage.setItem('rimalab_teacher_auth', JSON.stringify(masterProf));
      setActivePortalTab('dashboard');
      onShowToast('👑 Acesso Mestre', 'Bem-vindo, Mestre Kowalski MC! Acesso total concedido.', 'ach');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setLoginError('Informe um e-mail válido.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const { data } = await safeJsonFetch('/api/teachers/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPwd }),
      });

      if (data?.status === 'APPROVED' && data.teacher) {
        setLoggedTeacher(data.teacher);
        sessionStorage.setItem('rimalab_teacher_auth', JSON.stringify(data.teacher));
        setActivePortalTab('dashboard');
        onShowToast('👨‍🏫 Login de Professor Realizado', data.message || 'Bem-vindo à Área do Professor!', 'info');
      } else if (data?.status === 'PENDING') {
        localStorage.setItem('rimalab_pending_teacher_email', cleanEmail);
        setActivePendingRequest(data.request || { email: cleanEmail, fullName: 'Professor', discipline: 'Freestyle', requestedAt: new Date().toISOString(), status: 'PENDING' } as any);
        setActivePortalTab('pending');
        onShowToast('📬 Aguardando Autorização', 'Sua solicitação está na fila de aprovação da Diretoria.', 'info');
      } else {
        setLoginError(data?.message || data?.error || 'Não foi possível entrar. Verifique os dados ou envie uma solicitação.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Erro ao conectar com o servidor.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!reqFullName.trim() || !reqEmail.trim() || !reqEmail.includes('@')) {
      setLoginError('Nome completo e e-mail são obrigatórios.');
      return;
    }

    setIsSubmittingReq(true);
    const cleanEmail = reqEmail.trim().toLowerCase();
    const cleanName = reqFullName.trim();

    // Optimistically save pending state locally
    const initialPendingReq: TeacherAccessRequest = {
      id: `req_${Date.now()}`,
      email: cleanEmail,
      fullName: cleanName,
      artisticName: reqArtisticName.trim() || cleanName,
      discipline: reqDiscipline,
      phoneOrWhatsapp: reqPhone.trim(),
      discordUser: reqDiscord.trim(),
      motivation: reqMotivation.trim(),
      status: 'PENDING',
      requestedAt: new Date().toISOString(),
      token: `token_${Date.now()}`,
      rejectToken: `rej_${Date.now()}`,
    };

    localStorage.setItem('rimalab_pending_teacher_email', cleanEmail);
    setActivePendingRequest(initialPendingReq);

    try {
      const { data } = await safeJsonFetch('/api/teachers/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: cleanName,
          email: cleanEmail,
          artisticName: reqArtisticName.trim() || cleanName,
          discipline: reqDiscipline,
          phoneOrWhatsapp: reqPhone.trim(),
          discordUser: reqDiscord.trim(),
          motivation: reqMotivation.trim(),
        }),
      });

      if (data?.status === 'APPROVED' && data.teacher) {
        setLoggedTeacher(data.teacher);
        sessionStorage.setItem('rimalab_teacher_auth', JSON.stringify(data.teacher));
        setActivePortalTab('dashboard');
        onShowToast('🎉 Acesso Liberado!', 'Você já possui autorização ativa como Professor!', 'ach');
      } else {
        if (data?.request) {
          setActivePendingRequest(data.request);
        }
        setActivePortalTab('pending');
        onShowToast('📬 Solicitação Enviada!', 'Sua solicitação foi enviada para a Diretoria do RimaLab com sucesso!', 'info');
      }
    } catch (err: any) {
      // Even if network blips, keep local pending screen active
      setActivePortalTab('pending');
      onShowToast('📬 Solicitação Registrada!', 'Sua solicitação foi gravada e aguarda liberação.', 'info');
    } finally {
      setIsSubmittingReq(false);
    }
  };

  const fetchStudents = async () => {
    setIsLoadingStudents(true);
    try {
      const { data } = await safeJsonFetch('/api/admin/students', {
        headers: {
          'x-admin-password': 'adm_token_36737829',
          'x-admin-email': loggedTeacher?.email || 'admin@rimalab.com',
        },
      });
      if (data?.students) {
        setStudents(data.students || []);
      }
    } catch (e) {
      console.warn('Fetch students fallback', e);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const fetchTeacherRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const { data } = await safeJsonFetch('/api/admin/teachers/requests', {
        headers: {
          'x-admin-password': 'adm_token_36737829',
          'x-admin-email': loggedTeacher?.email || 'admin@rimalab.com',
        },
      });
      if (data?.allRequests) {
        setTeacherRequests(data.allRequests || []);
        setDispatchedEmails(data.dispatchedEmails || []);
        setApprovedTeachersList(data.approvedTeachers || []);
      }
    } catch (e) {
      console.warn('Fetch teacher requests fallback', e);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const handleApproveTeacherManual = async (targetEmail: string) => {
    try {
      const { data } = await safeJsonFetch('/api/admin/teachers/approve-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          password: 'adm_token_36737829',
          adminEmail: loggedTeacher?.email || 'admin@rimalab.com',
        }),
      });
      if (data?.success) {
        onShowToast('✅ Professor Aprovado!', `Acesso liberado com sucesso para ${targetEmail}`, 'ach');
        fetchTeacherRequests();
      }
    } catch (e) {
      onShowToast('Erro', 'Falha ao aprovar professor.', 'info');
    }
  };

  const handleRejectTeacherManual = async (targetEmail: string) => {
    try {
      const { data } = await safeJsonFetch('/api/admin/teachers/reject-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          password: 'adm_token_36737829',
          adminEmail: loggedTeacher?.email || 'admin@rimalab.com',
        }),
      });
      if (data?.success) {
        onShowToast('Recusado', `Solicitação de ${targetEmail} foi recusada.`, 'info');
        fetchTeacherRequests();
      }
    } catch (e) {
      onShowToast('Erro', 'Falha ao processar recusa.', 'info');
    }
  };

  const handleAwardXpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!awardEmail || !awardEmail.includes('@')) {
      onShowToast('Atenção', 'Informe um e-mail válido de aluno.', 'info');
      return;
    }

    setIsSubmittingAward(true);
    try {
      const { data } = await safeJsonFetch('/api/admin/award-xp-by-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: awardEmail.trim(),
          xpAmount: Number(awardXp) || 100,
          reason: 'TEACHER_AWARD_GMAIL',
          note: awardNote.trim() || `XP concedido pelo Professor ${loggedTeacher?.fullName || 'RimaLab'}`,
          password: 'adm_token_36737829',
          adminEmail: loggedTeacher?.email || 'admin@rimalab.com',
        }),
      });

      if (data?.success) {
        onShowToast('⚡ XP Concedido!', `+${awardXp} XP atribuído para ${awardEmail}!`, 'xp');
        setAwardNote('');
        fetchStudents();
      } else {
        onShowToast('Erro', data?.error || 'Não foi possível atribuir XP.', 'info');
      }
    } catch (err: any) {
      onShowToast('Erro', err.message || 'Erro ao comunicar com o servidor.', 'info');
    } finally {
      setIsSubmittingAward(false);
    }
  };

  const handleUpdateLiveCallSubmit = async () => {
    if (!onUpdateLiveCall) return;
    try {
      await onUpdateLiveCall({
        url: liveUrl,
        title: liveTitle,
        hostName: liveHost,
        platform: livePlatform,
        isActive: isBroadcastingLive,
      });

      await safeJsonFetch('/api/admin/live-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: liveUrl,
          title: liveTitle,
          hostName: liveHost,
          platform: livePlatform,
          isActive: isBroadcastingLive,
          password: 'adm_token_36737829',
          adminEmail: loggedTeacher?.email || 'admin@rimalab.com',
        }),
      });

      onShowToast('📡 Live Atualizada!', isBroadcastingLive ? 'Transmissão ao vivo iniciada para todos os alunos!' : 'Transmissão encerrada.', 'info');
    } catch (e) {
      onShowToast('Erro', 'Falha ao atualizar transmissão.', 'info');
    }
  };

  const handleGenerateLessonPlan = async () => {
    setIsGeneratingPlan(true);
    try {
      const res = await fetch('/api/voice-coach/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Como Professor Mestre de Rap da RimaLab Academy, crie um plano de aula dinâmico de 30 minutos sobre "${workshopTopic}" para público "${workshopAudience}". Inclua: 1. Aquecimento de Dicção (5 min), 2. Treino de Métrica 4x4 (10 min), 3. Exercício Prático com Beats e Punchlines (15 min).`,
          topic: workshopTopic,
          userStyle: 'Boom Bap & Freestyle',
          artisticName: loggedTeacher?.fullName || 'Professor',
        }),
      });
      const data = await res.json();
      setGeneratedLessonPlan(data.reply || 'Plano de treino gerado com sucesso!');
    } catch (e) {
      setGeneratedLessonPlan('Mantenha o foco nos 4 compassos: 1. Respiração, 2. Preparação do verso, 3. Rima intermediária, 4. Punchline no tempo da caixa!');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleTeacherLogout = () => {
    setLoggedTeacher(null);
    sessionStorage.removeItem('rimalab_teacher_auth');
    localStorage.removeItem('rimalab_pending_teacher_email');
    setActivePortalTab('auth');
    onShowToast('Logout', 'Você saiu da Área do Professor.', 'info');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-amber-500/40 bg-neutral-950 text-neutral-100 shadow-2xl shadow-amber-500/10 flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900/90 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-neutral-950 shadow-md">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-base sm:text-lg font-black tracking-tight text-white">
                  Portal & Área dos Professores
                </h2>
                {loggedTeacher ? (
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-black text-emerald-400">
                    {loggedTeacher.isMaster ? '👑 Mestre Kowalski' : '👨‍🏫 Professor Ativo'}
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-black text-amber-400">
                    Acesso Kowalski MC
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400">
                {loggedTeacher 
                  ? `Logado como: ${loggedTeacher.fullName}` 
                  : 'Autorização e gerenciamento pedagógico de professores'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {loggedTeacher && (
              <button
                onClick={handleTeacherLogout}
                className="hidden sm:inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-red-400 px-2 py-1 rounded border border-neutral-800 hover:border-red-500/40 transition-colors"
                title="Desconectar do painel de professor"
              >
                Sair
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* ========================================================================= */}
          {/* VIEW 1: AUTH & LOGIN / REQUEST TABS (WHEN NOT LOGGED IN AS TEACHER)       */}
          {/* ========================================================================= */}
          {activePortalTab !== 'dashboard' && activePortalTab !== 'pending' && (
            <div className="max-w-2xl mx-auto space-y-6">
              
              {/* Notification Banner */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3 text-xs text-amber-200">
                <Mail className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-amber-300">
                    Sistema de Liberação de Professores do RimaLab
                  </p>
                  <p className="text-neutral-300">
                    Para lecionar na Academia de Rimas, novas contas de professores devem ser autorizadas pela Diretoria. 
                    Ao solicitar acesso, um e-mail de liberação com 1 clique é enviado automaticamente para a coordenação.
                  </p>
                </div>
              </div>

              {/* Subtabs Selector */}
              <div className="flex rounded-xl bg-neutral-900 p-1 border border-neutral-800">
                <button
                  onClick={() => setActivePortalTab('auth')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    activePortalTab === 'auth'
                      ? 'bg-amber-500 text-neutral-950 font-black shadow'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>🔑 Fazer Login de Professor</span>
                </button>
                <button
                  onClick={() => setActivePortalTab('request')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    activePortalTab === 'request'
                      ? 'bg-amber-500 text-neutral-950 font-black shadow'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>📝 Solicitar Acesso de Professor</span>
                </button>
              </div>

              {loginError && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* SUBTAB 1: DIRECT LOGIN */}
              {activePortalTab === 'auth' && (
                <form onSubmit={handleTeacherLogin} className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                      E-mail do Professor
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="ex: seu.email@gmail.com"
                        className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2 pl-9 pr-3 text-sm text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                      Senha ou Chave de Acesso <span className="text-neutral-500 font-normal">(ou senha mestre 36737829)</span>
                    </label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 py-3 text-sm font-black text-neutral-950 shadow-lg shadow-amber-500/20 hover:scale-[1.01] active:scale-95 transition-transform disabled:opacity-50"
                  >
                    {isLoggingIn ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <span>Entrar na Área do Professor</span>
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  <div className="pt-2 text-center text-xs text-neutral-500 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginPassword('36737829');
                        if (!loginEmail) setLoginEmail('mestre@rimalab.com');
                      }}
                      className="text-amber-400 hover:underline font-bold"
                    >
                      👑 Acesso Mestre (Kowalski MC)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePortalTab('request')}
                      className="text-neutral-400 hover:text-white"
                    >
                      Não possui autorização? Solicitar aqui
                    </button>
                  </div>
                </form>
              )}

              {/* SUBTAB 2: REQUEST ACCESS FORM */}
              {activePortalTab === 'request' && (
                <form onSubmit={handleRequestAccess} className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                        Nome Completo <span className="text-amber-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={reqFullName}
                        onChange={(e) => setReqFullName(e.target.value)}
                        placeholder="ex: João Silva"
                        className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                        E-mail de Contato <span className="text-amber-400">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={reqEmail}
                        onChange={(e) => setReqEmail(e.target.value)}
                        placeholder="seu.email@gmail.com"
                        className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                        Nome Artístico / Vulgo de MC
                      </label>
                      <input
                        type="text"
                        value={reqArtisticName}
                        onChange={(e) => setReqArtisticName(e.target.value)}
                        placeholder="ex: MC Professor / Vulgo"
                        className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                        Especialidade / Matéria Principal
                      </label>
                      <select
                        value={reqDiscipline}
                        onChange={(e) => setReqDiscipline(e.target.value)}
                        className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                      >
                        <option value="Métrica & Freestyle de Batalha">Métrica & Freestyle de Batalha</option>
                        <option value="Speed Flow & Dicção Rápida">Speed Flow & Dicção Rápida</option>
                        <option value="Punchlines & Batalha de Sangue">Punchlines & Batalha de Sangue</option>
                        <option value="Rima Ideológica & Conhecimento">Rima Ideológica & Conhecimento</option>
                        <option value="Gastação & Humor de Rima">Gastação & Humor de Rima</option>
                        <option value="Literatura, Métricas & Português">Literatura, Métricas & Português</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                        WhatsApp / Celular
                      </label>
                      <input
                        type="text"
                        value={reqPhone}
                        onChange={(e) => setReqPhone(e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                        Usuário Discord
                      </label>
                      <input
                        type="text"
                        value={reqDiscord}
                        onChange={(e) => setReqDiscord(e.target.value)}
                        placeholder="usuario#1234"
                        className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                      Breve Experiência / Motivação para Lecionar
                    </label>
                    <textarea
                      rows={2}
                      value={reqMotivation}
                      onChange={(e) => setReqMotivation(e.target.value)}
                      placeholder="Conte um pouco sobre suas participações em batalhas ou interesse pedagógico..."
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingReq}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 py-3 text-sm font-black text-neutral-950 shadow-lg shadow-amber-500/20 hover:scale-[1.01] active:scale-95 transition-transform disabled:opacity-50"
                  >
                    {isSubmittingReq ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Enviar Solicitação para a Diretoria</span>
                      </>
                    )}
                  </button>
                </form>
              )}

            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 2: LIVE WAITING SCREEN (PENDING APPROVAL)                            */}
          {/* ========================================================================= */}
          {activePortalTab === 'pending' && (
            <div className="max-w-xl mx-auto text-center space-y-6 py-6 animate-in fade-in">
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/20 border-2 border-amber-500/40">
                <Clock className="h-10 w-10 text-amber-400 animate-pulse" />
                <span className="absolute inset-0 rounded-full border-2 border-amber-500 animate-ping opacity-25" />
              </div>

              <div className="space-y-2">
                <span className="inline-block rounded-full bg-amber-500/20 px-3 py-1 text-xs font-black text-amber-300 border border-amber-500/30">
                  STATUS: AGUARDANDO AUTORIZAÇÃO
                </span>
                <h3 className="text-xl font-black text-white">
                  Solicitação Enviada com Sucesso!
                </h3>
                <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
                  Sua solicitação de professor para <span className="text-white font-medium">{activePendingRequest?.email || reqEmail}</span> foi registrada na fila de aprovação da Diretoria do RimaLab.
                </p>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-900/80 p-4 text-left text-xs space-y-2">
                <div className="flex justify-between border-b border-neutral-800 pb-2">
                  <span className="text-neutral-400">Candidato:</span>
                  <span className="font-bold text-white">{activePendingRequest?.fullName || reqFullName}</span>
                </div>
                <div className="flex justify-between border-b border-neutral-800 pb-2">
                  <span className="text-neutral-400">E-mail:</span>
                  <span className="font-mono text-amber-400">{activePendingRequest?.email || reqEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Matéria:</span>
                  <span className="text-neutral-300">{activePendingRequest?.discipline || reqDiscipline}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => checkTeacherStatus(activePendingRequest?.email || reqEmail)}
                  className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-black text-neutral-950 hover:bg-amber-400 transition-colors shadow"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Verificar Aprovação Agora</span>
                </button>

                {/* Instant Test Approval Link */}
                {activePendingRequest?.token && (
                  <a
                    href={`/api/teachers/approve?token=${encodeURIComponent(activePendingRequest.token)}&email=${encodeURIComponent(activePendingRequest.email)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-xs font-bold text-neutral-300 hover:text-amber-300 hover:border-amber-500 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-amber-400" />
                    <span>Liberar Acesso Diretamente</span>
                  </a>
                )}
              </div>

              <button
                onClick={() => setActivePortalTab('auth')}
                className="text-xs text-neutral-500 hover:text-neutral-300 underline"
              >
                Voltar ou tentar outro e-mail
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 3: FULL PROFESSOR DASHBOARD (WHEN LOGGED IN / APPROVED)               */}
          {/* ========================================================================= */}
          {activePortalTab === 'dashboard' && loggedTeacher && (
            <div className="space-y-6">

              {/* Dashboard Sub-navigation */}
              <div className="flex flex-wrap items-center gap-1.5 border-b border-neutral-800 pb-3">
                <button
                  onClick={() => setDashTab('students')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    dashTab === 'students'
                      ? 'bg-amber-500 text-neutral-950 font-black shadow'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>Alunos & Atribuir XP</span>
                </button>

                <button
                  onClick={() => setDashTab('live')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    dashTab === 'live'
                      ? 'bg-amber-500 text-neutral-950 font-black shadow'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  <Video className="h-3.5 w-3.5" />
                  <span>Transmissão Live Call</span>
                  {currentLiveCall?.isActive && (
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                </button>

                <button
                  onClick={() => setDashTab('requests')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    dashTab === 'requests'
                      ? 'bg-amber-500 text-neutral-950 font-black shadow'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Fila de Professores (Kowalski)</span>
                  {teacherRequests.filter(r => r.status === 'PENDING').length > 0 && (
                    <span className="rounded-full bg-red-500 text-white px-1.5 py-0.2 text-[9px] font-black">
                      {teacherRequests.filter(r => r.status === 'PENDING').length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setDashTab('ai_tools')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    dashTab === 'ai_tools'
                      ? 'bg-amber-500 text-neutral-950 font-black shadow'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Assistente Pedagógico IA</span>
                </button>
              </div>

              {/* DASH TAB 1: STUDENTS & XP BY GMAIL */}
              {dashTab === 'students' && (
                <div className="space-y-6">
                  
                  {/* Award XP Form */}
                  <form onSubmit={handleAwardXpSubmit} className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-amber-400" />
                        <h4 className="font-bold text-sm text-white">Atribuir XP Pedagógico a um Aluno</h4>
                      </div>
                      <span className="text-[11px] text-amber-300 font-mono">55 XP = 1 Nível de Evolução</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-400 mb-1">E-mail do Aluno (Gmail)</label>
                        <input
                          type="email"
                          required
                          value={awardEmail}
                          onChange={(e) => setAwardEmail(e.target.value)}
                          placeholder="aluno@gmail.com"
                          className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-neutral-400 mb-1">Quantidade de XP</label>
                        <input
                          type="number"
                          min="10"
                          max="5000"
                          step="10"
                          value={awardXp}
                          onChange={(e) => setAwardXp(Number(e.target.value))}
                          className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-neutral-400 mb-1">Motivo / Exercício</label>
                        <input
                          type="text"
                          value={awardReason}
                          onChange={(e) => setAwardReason(e.target.value)}
                          placeholder="ex: Treino de Speed Flow no Beat"
                          className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={awardNote}
                        onChange={(e) => setAwardNote(e.target.value)}
                        placeholder="Feedback do Professor para o aluno (opcional)..."
                        className="flex-1 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={isSubmittingAward}
                        className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-black text-neutral-950 hover:bg-amber-400 transition-colors shrink-0"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Conceder XP</span>
                      </button>
                    </div>
                  </form>

                  {/* Registered Students Table */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-neutral-200">
                        Alunos Cadastrados ({students.length})
                      </h4>
                      <button
                        onClick={fetchStudents}
                        className="text-xs text-neutral-400 hover:text-white flex items-center gap-1"
                      >
                        <RefreshCw className={`h-3 w-3 ${isLoadingStudents ? 'animate-spin' : ''}`} />
                        <span>Atualizar</span>
                      </button>
                    </div>

                    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="border-b border-neutral-800 bg-neutral-950/80 text-[11px] text-neutral-400 font-mono">
                            <tr>
                              <th className="px-4 py-3">Aluno / Vulgo</th>
                              <th className="px-4 py-3">E-mail</th>
                              <th className="px-4 py-3">Nível</th>
                              <th className="px-4 py-3">XP Total</th>
                              <th className="px-4 py-3">Estilo</th>
                              <th className="px-4 py-3 text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-800/60">
                            {students.map((st) => (
                              <tr key={st.id} className="hover:bg-neutral-800/40 transition-colors">
                                <td className="px-4 py-3 font-bold text-white flex items-center gap-2">
                                  <span>{st.artisticName}</span>
                                  {st.role === 'ADMIN' && (
                                    <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded font-black">PROF</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 font-mono text-neutral-400">{st.email}</td>
                                <td className="px-4 py-3">
                                  <span className="rounded bg-neutral-800 px-2 py-0.5 font-black text-amber-400">
                                    Nv. {st.level}
                                  </span>
                                </td>
                                <td className="px-4 py-3 font-mono text-neutral-300">{st.totalXP} XP</td>
                                <td className="px-4 py-3 text-neutral-400">{st.favoriteStyle || 'Boom Bap'}</td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    onClick={() => {
                                      setAwardEmail(st.email);
                                      setAwardXp(150);
                                      onShowToast('Aluno Selecionado', `Preencha o formulário acima para enviar XP para ${st.email}`, 'info');
                                    }}
                                    className="text-[11px] font-bold text-amber-400 hover:underline"
                                  >
                                    + Dar XP
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* DASH TAB 2: LIVE CALL TRANSMISSION */}
              {dashTab === 'live' && (
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-4 max-w-2xl">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Radio className="h-5 w-5 text-red-500 animate-pulse" />
                      <h4 className="font-bold text-sm text-white">Transmissão de Live Call dos Professores</h4>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isBroadcastingLive ? 'bg-red-500 text-white animate-pulse' : 'bg-neutral-800 text-neutral-400'}`}>
                      {isBroadcastingLive ? '🔴 AO VIVO ATIVO' : 'OFFLINE'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1">Título da Mentoria / Call</label>
                    <input
                      type="text"
                      value={liveTitle}
                      onChange={(e) => setLiveTitle(e.target.value)}
                      placeholder="ex: Aula de Métrica e Batalha ao Vivo com Kowalski MC"
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-neutral-300 mb-1">Plataforma</label>
                      <select
                        value={livePlatform}
                        onChange={(e) => setLivePlatform(e.target.value as any)}
                        className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                      >
                        <option value="discord">Discord Voice / Video</option>
                        <option value="meet">Google Meet</option>
                        <option value="whatsapp">WhatsApp Grupo / Call</option>
                        <option value="zoom">Zoom Meeting</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-300 mb-1">Host / Professor Responsável</label>
                      <input
                        type="text"
                        value={liveHost}
                        onChange={(e) => setLiveHost(e.target.value)}
                        placeholder="Kowalski MC & Luquita MC"
                        className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1">Link Direto da Sala de Chamada (URL)</label>
                    <input
                      type="url"
                      value={liveUrl}
                      onChange={(e) => setLiveUrl(e.target.value)}
                      placeholder="https://discord.gg/rimalab ou https://meet.google.com/..."
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <button
                      onClick={() => {
                        setIsBroadcastingLive(!isBroadcastingLive);
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-black transition-all ${
                        isBroadcastingLive
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      <Radio className="h-4 w-4" />
                      <span>{isBroadcastingLive ? 'Encerrar Transmissão' : '🔴 Iniciar Transmissão Ao Vivo'}</span>
                    </button>

                    <button
                      onClick={handleUpdateLiveCallSubmit}
                      className="rounded-xl bg-amber-500 px-5 py-3 text-xs font-black text-neutral-950 hover:bg-amber-400 transition-colors shadow"
                    >
                      Salvar Link & Atualizar
                    </button>
                  </div>
                </div>
              )}

              {/* DASH TAB 3: TEACHER REQUESTS QUEUE (FOR KOWALSKI & MASTER TEACHERS) */}
              {dashTab === 'requests' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white flex items-center gap-2">
                        <span>Fila de Solicitações de Professores</span>
                        <span className="rounded-full bg-amber-500/20 text-amber-300 px-2 py-0.5 text-xs">
                          {teacherRequests.length} total
                        </span>
                      </h4>
                      <p className="text-xs text-neutral-400">
                        Gerencie os professores que solicitaram autorização para lecionar no RimaLab.
                      </p>
                    </div>

                    <button
                      onClick={fetchTeacherRequests}
                      className="text-xs text-neutral-400 hover:text-white flex items-center gap-1"
                    >
                      <RefreshCw className={`h-3 w-3 ${isLoadingRequests ? 'animate-spin' : ''}`} />
                      <span>Recarregar</span>
                    </button>
                  </div>

                  {/* List of Requests */}
                  <div className="space-y-3">
                    {teacherRequests.map((req) => (
                      <div 
                        key={req.id || req.email}
                        className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-4 space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-white">{req.fullName}</span>
                              <span className="text-xs text-amber-400 font-mono font-medium">({req.email})</span>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                req.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                                req.status === 'REJECTED' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                                'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
                              }`}>
                                {req.status === 'APPROVED' ? '✅ APROVADO' : req.status === 'REJECTED' ? '❌ RECUSADO' : '⏳ PENDENTE'}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-400 mt-0.5">
                              Matéria: <strong className="text-neutral-200">{req.discipline}</strong> • Solicitado em: {new Date(req.requestedAt).toLocaleString('pt-BR')}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {req.status !== 'APPROVED' && (
                              <button
                                onClick={() => handleApproveTeacherManual(req.email)}
                                className="flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-bold transition-colors shadow"
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>Permitir Acesso</span>
                              </button>
                            )}

                            {req.status !== 'REJECTED' && (
                              <button
                                onClick={() => handleRejectTeacherManual(req.email)}
                                className="flex items-center gap-1 rounded-lg bg-neutral-800 hover:bg-red-950 hover:text-red-300 text-neutral-300 px-3 py-1.5 text-xs font-bold transition-colors"
                              >
                                <X className="h-3.5 w-3.5" />
                                <span>Recusar</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {req.motivation && (
                          <div className="rounded-lg bg-neutral-950 p-2.5 text-xs text-neutral-300 italic border border-neutral-800/80">
                            "{req.motivation}"
                          </div>
                        )}
                      </div>
                    ))}

                    {teacherRequests.length === 0 && (
                      <div className="text-center py-8 text-xs text-neutral-500">
                        Nenhuma solicitação de professor no momento.
                      </div>
                    )}
                  </div>

                  {/* Dispatched Notification Emails */}
                  <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-neutral-300">
                      <Mail className="h-4 w-4 text-amber-400" />
                      <span>Histórico de E-mails e Notificações de Aprovação</span>
                    </div>

                    <div className="space-y-2">
                      {dispatchedEmails.slice(0, 4).map((mail) => (
                        <div key={mail.id} className="rounded-lg bg-neutral-950 p-2.5 text-xs flex items-center justify-between gap-2 border border-neutral-800">
                          <div>
                            <span className="font-bold text-white">{mail.subject}</span>
                            <p className="text-[11px] text-neutral-400 mt-0.5">{mail.previewSnippet} • {new Date(mail.sentAt).toLocaleTimeString('pt-BR')}</p>
                          </div>
                          <a
                            href={mail.approveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded bg-amber-500/20 text-amber-300 px-2.5 py-1 text-[11px] font-bold hover:bg-amber-500 hover:text-neutral-950 transition-colors shrink-0"
                          >
                            Abrir Link de Aprovação ➔
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* DASH TAB 4: AI PEDAGOGICAL ASSISTANT */}
              {dashTab === 'ai_tools' && (
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-4 max-w-2xl">
                  <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
                    <Sparkles className="h-5 w-5 text-amber-400" />
                    <div>
                      <h4 className="font-bold text-sm text-white">Gerador de Roteiro de Aula & Exercícios de Freestyle</h4>
                      <p className="text-xs text-neutral-400">IA especializada em metodologia pedagógica de rap nacional</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-neutral-300 mb-1">Tema da Aula</label>
                      <input
                        type="text"
                        value={workshopTopic}
                        onChange={(e) => setWorkshopTopic(e.target.value)}
                        className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-300 mb-1">Nível dos Alunos</label>
                      <input
                        type="text"
                        value={workshopAudience}
                        onChange={(e) => setWorkshopAudience(e.target.value)}
                        className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleGenerateLessonPlan}
                    disabled={isGeneratingPlan}
                    className="flex items-center justify-center gap-2 w-full rounded-xl bg-amber-500 py-2.5 text-xs font-black text-neutral-950 hover:bg-amber-400 transition-colors disabled:opacity-50"
                  >
                    {isGeneratingPlan ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    <span>Gerar Plano de Aula Completo com IA</span>
                  </button>

                  {generatedLessonPlan && (
                    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 text-xs text-neutral-200 whitespace-pre-wrap leading-relaxed">
                      {generatedLessonPlan}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
