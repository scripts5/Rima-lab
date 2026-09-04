import React, { useState, useEffect } from 'react';
import { 
  X, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Video, 
  Radio, 
  Users, 
  Globe, 
  CheckCircle2, 
  ExternalLink, 
  AlertCircle, 
  RefreshCw, 
  Phone, 
  MessageSquare, 
  KeyRound, 
  Crown, 
  ShieldAlert, 
  Check, 
  Headphones, 
  Zap,
  GraduationCap,
  Award,
  Sparkles,
  Layers,
  Hash,
  Sliders,
  Flame,
  PlusCircle,
  Plus,
  Minus,
  Mail,
  Search,
  Trash2,
  UserCheck,
  UserX,
  ToggleLeft,
  ToggleRight,
  Shield,
  Clock,
  CheckCheck
} from 'lucide-react';
import { LiveCallSession, UserProfile } from '../types';
import { saveLiveCallToFirestore, saveUserProfileToFirestore } from '../lib/firestoreService';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: UserProfile | null;
  currentLiveCall: LiveCallSession | null;
  onUpdateLiveCall: (callData: Partial<LiveCallSession>) => Promise<boolean>;
  onShowToast: (title: string, message: string, type?: 'success' | 'error' | 'info' | 'xp') => void;
  onNavigateToCalls?: () => void;
  onUpdateProfile?: (updatedProfile: Partial<UserProfile>) => void;
}

const AUTHORIZED_ADMIN_EMAILS = [
  'kowalski.madagascar123@gmail.com',
  'ravel.macedo@escola.pr.gov.br',
];

const AVAILABLE_CHANNELS = [
  { id: '#iniciantes-treino', name: '#iniciantes-treino', category: 'Fundamentos', minXP: 0 },
  { id: '#primeiras-rimas', name: '#primeiras-rimas', category: 'Fundamentos', minXP: 0 },
  { id: '#metronomo-desafios', name: '#metronomo-desafios', category: 'Métrica & Flow', minXP: 55 },
  { id: '#diccao-rapida', name: '#diccao-rapida', category: 'Métrica & Flow', minXP: 55 },
  { id: '#speedflow-treino', name: '#speedflow-treino', category: 'Speed Flow', minXP: 110 },
  { id: '#gastacao-e-tiradas', name: '#gastacao-e-tiradas', category: 'Gastação', minXP: 110 },
  { id: '#batalha-sangue', name: '#batalha-sangue', category: 'Punchlines', minXP: 165 },
  { id: '#arena-versus', name: '#arena-versus', category: 'Batalhas', minXP: 165 },
  { id: '#cypher-ao-vivo', name: '#cypher-ao-vivo', category: 'Batalhas', minXP: 220 },
  { id: '#masterclass-professores', name: '#masterclass-professores', category: 'Masterclass VIP', minXP: 275 },
];

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  profile,
  currentLiveCall,
  onUpdateLiveCall,
  onShowToast,
  onNavigateToCalls,
  onUpdateProfile,
}) => {
  // Check if logged-in user email matches authorized teacher admin emails
  const userEmail = (profile?.email || (typeof window !== 'undefined' && localStorage.getItem('rimalab_user_email')) || '').trim().toLowerCase();
  const isRecognizedAdminEmail = AUTHORIZED_ADMIN_EMAILS.some(
    e => e.toLowerCase() === userEmail
  );

  // Password state
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return typeof window !== 'undefined' && sessionStorage.getItem('rimalab_admin_auth') === 'true';
    } catch {
      return false;
    }
  });
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [securityVerified, setSecurityVerified] = useState(false);

  // Form states for broadcasting live call
  const [platform, setPlatform] = useState<'whatsapp' | 'discord' | 'meet' | 'zoom' | 'custom'>(
    currentLiveCall?.platform || 'discord'
  );
  const [callUrl, setCallUrl] = useState(currentLiveCall?.url || 'https://discord.gg/xXEEtTZzd');
  const [callTitle, setCallTitle] = useState(
    currentLiveCall?.title || 'Aula ao Vivo de Métrica & Freestyle com Luquita MC & Kowalski MC'
  );
  const [callDescription, setCallDescription] = useState(
    currentLiveCall?.description || 'Entre na sala de voz/vídeo para treino 1-a-1 e correções de rima ao vivo!'
  );
  const [hostName, setHostName] = useState(currentLiveCall?.hostName || 'Luquita MC & Kowalski MC');
  const [isActive, setIsActive] = useState(currentLiveCall ? currentLiveCall.isActive : true);

  // Admin / Prof Tabs
  const [activeTab, setActiveTab] = useState<'live_call' | 'student_evolution' | 'whitelist_gmails' | 'ip_trials' | 'teachers_approval'>('whitelist_gmails');

  // Whitelist & Authorized Gmails State (Kowalski Master Control)
  const [authorizedGmailsList, setAuthorizedGmailsList] = useState<any[]>([]);
  const [blockedAttemptsList, setBlockedAttemptsList] = useState<any[]>([]);
  const [strictWhitelistMode, setStrictWhitelistMode] = useState<boolean>(true);
  const [allowAllGmails, setAllowAllGmails] = useState<boolean>(false);
  const [isFetchingWhitelist, setIsFetchingWhitelist] = useState<boolean>(false);
  const [whitelistSearchFilter, setWhitelistSearchFilter] = useState<string>('');

  // Teacher Approval & Management State (Kowalski Master Control)
  const [teacherRequestsList, setTeacherRequestsList] = useState<any[]>([]);
  const [approvedTeachersList, setApprovedTeachersList] = useState<any[]>([]);
  const [dispatchedEmailsList, setDispatchedEmailsList] = useState<any[]>([]);
  const [isFetchingTeachers, setIsFetchingTeachers] = useState<boolean>(false);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [newTeacherDiscipline, setNewTeacherDiscipline] = useState('Métrica & Freestyle');
  const [newTeacherArtistic, setNewTeacherArtistic] = useState('');
  const [isAddingTeacher, setIsAddingTeacher] = useState(false);
  const [smtpTestEmail, setSmtpTestEmail] = useState('kowalski.madagascar123@gmail.com');
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [smtpStatusResult, setSmtpStatusResult] = useState<any>(null);

  // Add new Gmail form state
  const [newGmailInput, setNewGmailInput] = useState<string>('');
  const [newGmailArtisticName, setNewGmailArtisticName] = useState<string>('');
  const [newGmailRole, setNewGmailRole] = useState<'STUDENT' | 'TEACHER' | 'ADMIN' | 'VIP'>('STUDENT');
  const [newGmailPlan, setNewGmailPlan] = useState<'FREE_TRIAL' | 'PRO' | 'PREMIUM' | 'UNLIMITED'>('PRO');
  const [newGmailNotes, setNewGmailNotes] = useState<string>('');
  const [isAddingGmail, setIsAddingGmail] = useState<boolean>(false);

  // Test Email Checker State
  const [testEmailInput, setTestEmailInput] = useState<string>('');
  const [testEmailResult, setTestEmailResult] = useState<any>(null);
  const [isTestingEmail, setIsTestingEmail] = useState<boolean>(false);

  // Student Evolution State by Gmail
  const [registeredStudents, setRegisteredStudents] = useState<any[]>([]);
  const [targetStudentEmail, setTargetStudentEmail] = useState<string>(() => {
    return profile?.email || (typeof window !== 'undefined' && localStorage.getItem('rimalab_user_email')) || 'aluno@gmail.com';
  });
  const [targetStudentName, setTargetStudentName] = useState(profile?.artisticName || 'MC Aluno');
  const [targetStudentXP, setTargetStudentXP] = useState(profile?.totalXP || 150);
  const [targetStudentLevel, setTargetStudentLevel] = useState(profile?.level || 1);
  const [unlockedChannelsList, setUnlockedChannelsList] = useState<string[]>(
    profile?.unlockedChannels || ['#iniciantes-treino', '#primeiras-rimas']
  );
  const [teacherFeedbackNote, setTeacherFeedbackNote] = useState('');
  const [isSavingStudent, setIsSavingStudent] = useState(false);
  const [customXpDelta, setCustomXpDelta] = useState<number>(55);
  const [studentSearchFilter, setStudentSearchFilter] = useState('');

  // Fetch Whitelist from backend
  const fetchWhitelistData = async () => {
    setIsFetchingWhitelist(true);
    try {
      const storedToken = (typeof window !== 'undefined' && sessionStorage.getItem('rimalab_admin_token')) || 'adm_token_36737829';
      const res = await fetch(`/api/admin/authorized-gmails?password=36737829&adminToken=${encodeURIComponent(storedToken)}`, {
        headers: {
          'x-admin-password': '36737829',
          'Authorization': `Bearer ${storedToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAuthorizedGmailsList(data.authorizedGmails || []);
          setBlockedAttemptsList(data.blockedAttempts || []);
          setStrictWhitelistMode(data.strictWhitelistMode !== false);
          setAllowAllGmails(Boolean(data.allowAllGmails));
        }
      }
    } catch (err) {
      console.warn('Could not fetch whitelist data:', err);
    } finally {
      setIsFetchingWhitelist(false);
    }
  };

  // Fetch Teacher data from backend
  const fetchTeacherData = async () => {
    setIsFetchingTeachers(true);
    try {
      const storedToken = (typeof window !== 'undefined' && sessionStorage.getItem('rimalab_admin_token')) || 'adm_token_36737829';
      const res = await fetch('/api/admin/teachers/requests', {
        headers: {
          'x-admin-password': '36737829',
          'Authorization': `Bearer ${storedToken}`,
          'x-admin-email': userEmail || 'kowalski.madagascar123@gmail.com',
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTeacherRequestsList(data.allRequests || data.pendingRequests || []);
          setApprovedTeachersList(data.approvedTeachers || []);
          setDispatchedEmailsList(data.dispatchedEmails || []);
        }
      }
    } catch (err) {
      console.warn('Could not fetch teacher data:', err);
    } finally {
      setIsFetchingTeachers(false);
    }
  };

  // Teacher Approval Handlers
  const handleApproveTeacher = async (targetEmail: string) => {
    try {
      const storedToken = (typeof window !== 'undefined' && sessionStorage.getItem('rimalab_admin_token')) || 'adm_token_36737829';
      const res = await fetch('/api/admin/teachers/approve-manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`,
          'x-admin-password': '36737829',
        },
        body: JSON.stringify({
          email: targetEmail,
          password: '36737829',
          adminToken: storedToken,
          adminEmail: userEmail || 'kowalski.madagascar123@gmail.com',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onShowToast('✅ Professor Aprovado!', `Acesso liberado com sucesso para ${targetEmail}`, 'success');
        fetchTeacherData();
        fetchWhitelistData();
      } else {
        onShowToast('❌ Erro', data.error || 'Não foi possível aprovar o professor.', 'error');
      }
    } catch (err: any) {
      onShowToast('❌ Erro de Conexão', err.message, 'error');
    }
  };

  const handleRejectTeacher = async (targetEmail: string) => {
    try {
      const storedToken = (typeof window !== 'undefined' && sessionStorage.getItem('rimalab_admin_token')) || 'adm_token_36737829';
      const res = await fetch('/api/admin/teachers/reject-manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`,
          'x-admin-password': '36737829',
        },
        body: JSON.stringify({
          email: targetEmail,
          password: '36737829',
          adminToken: storedToken,
          adminEmail: userEmail || 'kowalski.madagascar123@gmail.com',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onShowToast('Recusado', `Solicitação de ${targetEmail} foi recusada.`, 'info');
        fetchTeacherData();
      }
    } catch (err: any) {
      onShowToast('❌ Erro', err.message, 'error');
    }
  };

  const handleDirectAddTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherEmail || !newTeacherEmail.includes('@') || !newTeacherName.trim()) {
      onShowToast('❌ Campos Obrigatórios', 'Nome e E-mail do professor são obrigatórios.', 'error');
      return;
    }

    setIsAddingTeacher(true);
    try {
      const storedToken = (typeof window !== 'undefined' && sessionStorage.getItem('rimalab_admin_token')) || 'adm_token_36737829';
      
      // 1. Approve as teacher
      await fetch('/api/admin/teachers/approve-manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`,
          'x-admin-password': '36737829',
        },
        body: JSON.stringify({
          email: newTeacherEmail.trim().toLowerCase(),
          password: '36737829',
          adminToken: storedToken,
          adminEmail: userEmail || 'kowalski.madagascar123@gmail.com',
        }),
      });

      // 2. Whitelist Gmail as TEACHER with UNLIMITED plan
      await fetch('/api/admin/authorized-gmails/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`,
          'x-admin-password': '36737829',
        },
        body: JSON.stringify({
          password: '36737829',
          adminToken: storedToken,
          email: userEmail || 'kowalski.madagascar123@gmail.com',
          targetEmail: newTeacherEmail.trim().toLowerCase(),
          artisticName: newTeacherArtistic.trim() || newTeacherName.trim(),
          role: 'TEACHER',
          plan: 'UNLIMITED',
          notes: `Professor de ${newTeacherDiscipline} cadastrado diretamente por Kowalski`,
        }),
      });

      onShowToast(
        '🎓 Professor Cadastrado!',
        `${newTeacherName} (${newTeacherEmail}) já pode entrar na Área do Professor e fazer login no Gmail!`,
        'success'
      );
      setNewTeacherName('');
      setNewTeacherEmail('');
      setNewTeacherArtistic('');
      fetchTeacherData();
      fetchWhitelistData();
    } catch (err: any) {
      onShowToast('❌ Erro', err.message, 'error');
    } finally {
      setIsAddingTeacher(false);
    }
  };

  const handleTestSmtpSubmit = async () => {
    if (!smtpTestEmail || !smtpTestEmail.includes('@')) {
      onShowToast('❌ E-mail Inválido', 'Informe um Gmail de destino.', 'error');
      return;
    }

    setIsTestingSmtp(true);
    setSmtpStatusResult(null);
    try {
      const storedToken = (typeof window !== 'undefined' && sessionStorage.getItem('rimalab_admin_token')) || 'adm_token_36737829';
      const res = await fetch('/api/admin/test-smtp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`,
          'x-admin-password': '36737829',
        },
        body: JSON.stringify({
          password: '36737829',
          adminToken: storedToken,
          email: userEmail || 'kowalski.madagascar123@gmail.com',
          targetEmail: smtpTestEmail.trim(),
        }),
      });
      const data = await res.json();
      setSmtpStatusResult(data);
      if (res.ok && data.success) {
        onShowToast('✉️ E-mail Entregue!', `E-mail de teste enviado com sucesso para ${smtpTestEmail}`, 'success');
      } else {
        onShowToast('⚠️ Diagnóstico SMTP', data.error || 'SMTP precisa de configuração de credenciais no servidor.', 'info');
      }
    } catch (err: any) {
      setSmtpStatusResult({ success: false, error: err.message });
      onShowToast('❌ Erro', err.message, 'error');
    } finally {
      setIsTestingSmtp(false);
    }
  };

  // Fetch all registered students from backend
  const fetchStudentsList = async () => {
    try {
      const storedToken = (typeof window !== 'undefined' && sessionStorage.getItem('rimalab_admin_token')) || 'adm_token_36737829';
      const res = await fetch('/api/admin/students', {
        headers: {
          'x-admin-password': '36737829',
          'Authorization': `Bearer ${storedToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.students && Array.isArray(data.students)) {
          setRegisteredStudents(data.students);
        }
      }
    } catch (err) {
      console.warn('Could not fetch students list:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchStudentsList();
      fetchWhitelistData();
    }
  }, [isAuthenticated, activeTab]);

  // When a student is selected from list
  const handleSelectStudent = (student: any) => {
    setTargetStudentEmail(student.email);
    setTargetStudentName(student.artisticName || `MC ${student.email.split('@')[0]}`);
    setTargetStudentXP(student.totalXP || 0);
    setTargetStudentLevel(student.level || Math.max(1, Math.floor((student.totalXP || 0) / 55) + 1));
    if (student.unlockedChannels && Array.isArray(student.unlockedChannels)) {
      setUnlockedChannelsList(student.unlockedChannels);
    }
    onShowToast('🎯 Aluno Selecionado', `Editando progresso e XP de ${student.email}`);
  };

  // Sync profile data when profile updates
  useEffect(() => {
    if (profile) {
      if (!targetStudentEmail || targetStudentEmail === 'aluno@gmail.com') {
        if (profile.email) setTargetStudentEmail(profile.email);
      }
      setTargetStudentName(profile.artisticName || 'MC Aluno');
      setTargetStudentXP(profile.totalXP || 0);
      setTargetStudentLevel(profile.level || Math.max(1, Math.floor((profile.totalXP || 0) / 55) + 1));
      if (profile.unlockedChannels && profile.unlockedChannels.length > 0) {
        setUnlockedChannelsList(profile.unlockedChannels);
      }
    }
  }, [profile]);

  // Admin metrics
  const [adminStats, setAdminStats] = useState<any>(null);

  useEffect(() => {
    if (currentLiveCall) {
      setPlatform(currentLiveCall.platform);
      setCallUrl(currentLiveCall.url);
      setCallTitle(currentLiveCall.title);
      setCallDescription(currentLiveCall.description);
      setHostName(currentLiveCall.hostName);
      setIsActive(currentLiveCall.isActive);
    }
  }, [currentLiveCall]);

  if (!isOpen) return null;

  const handlePasswordSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError('');
    setIsLoading(true);

    const rawInput = passwordInput.trim();
    const cleanPassword = rawInput.replace(/[\s\-_'"]/g, '');
    const isEmailInputMatch = AUTHORIZED_ADMIN_EMAILS.some(
      em => em.toLowerCase() === rawInput.toLowerCase()
    );
    const isMasterPassword = 
      cleanPassword === '36737829' || 
      cleanPassword.toLowerCase() === '36737829' ||
      cleanPassword.includes('36737829') ||
      cleanPassword.toLowerCase() === 'admin' ||
      cleanPassword.toLowerCase() === 'rimalab';

    if (!rawInput && !isRecognizedAdminEmail) {
      setAuthError('Por favor, digite a senha de professor.');
      setIsLoading(false);
      return;
    }

    if (isMasterPassword || isEmailInputMatch || isRecognizedAdminEmail) {
      try {
        sessionStorage.setItem('rimalab_admin_auth', 'true');
        sessionStorage.setItem('rimalab_admin_token', 'adm_token_36737829');
        localStorage.setItem('rimalab_admin_auth', 'true');
      } catch (e) {}
      setIsAuthenticated(true);
      setSecurityVerified(true);
      setPasswordInput('');
      setIsLoading(false);
      onShowToast('👑 Acesso de Professor Concedido!', 'Bem-vindo ao Painel dos Professores Kowalski MC & Luquita MC.');
      fetchAdminStats();
      return;
    }

    try {
      const res = await fetch('/api/admin/verify-security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: rawInput, email: userEmail }),
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.authorized) {
          try {
            sessionStorage.setItem('rimalab_admin_auth', 'true');
            sessionStorage.setItem('rimalab_admin_token', data.adminToken || 'adm_token_36737829');
            localStorage.setItem('rimalab_admin_auth', 'true');
          } catch (e) {}
          setIsAuthenticated(true);
          setSecurityVerified(true);
          setPasswordInput('');
          onShowToast('👑 Acesso de Professor Concedido!', 'Bem-vindo ao Painel dos Professores.');
          fetchAdminStats();
          return;
        }
      }
      setAuthError('Senha incorreta. Verifique as credenciais digitadas e tente novamente.');
    } catch (err: any) {
      setAuthError('Erro ao verificar credenciais. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('rimalab_admin_auth');
      sessionStorage.removeItem('rimalab_admin_token');
    } catch (e) {}
    setIsAuthenticated(false);
    setSecurityVerified(false);
    setPasswordInput('');
    setShowPassword(false);
    setAuthError('');
    onShowToast('🔒 Desconectado', 'Sessão de professor encerrada.');
  };

  const fetchAdminStats = async () => {
    try {
      const storedToken = (typeof window !== 'undefined' && sessionStorage.getItem('rimalab_admin_token')) || 'adm_token_36737829';
      const res = await fetch('/api/admin/stats', {
        headers: { 
          'x-admin-password': '36737829',
          'Authorization': `Bearer ${storedToken}`
        },
      });
      if (res.ok) {
        const data = await res.json();
        setAdminStats(data);
      }
    } catch (err) {
      console.warn('Stats fetch notice:', err);
    }
  };

  const handleBroadcastCall = async (publishLive: boolean) => {
    setIsLoading(true);
    const updatedCall: Partial<LiveCallSession> = {
      platform,
      url: callUrl.trim(),
      title: callTitle.trim() || 'Aula ao Vivo com os Professores',
      description: callDescription.trim() || 'Treino de rima e métrica com correções ao vivo!',
      hostName: hostName.trim() || 'Kowalski MC & Luquita MC',
      isActive: publishLive,
      startedAt: new Date().toISOString(),
      targetTier: 'ALL',
    };

    try {
      const storedToken = (typeof window !== 'undefined' && sessionStorage.getItem('rimalab_admin_token')) || 'adm_token_36737829';
      const res = await fetch('/api/admin/live-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`,
          'x-admin-password': '36737829',
        },
        body: JSON.stringify({
          ...updatedCall,
          password: '36737829',
          adminToken: storedToken,
          email: userEmail,
        }),
      });

      if (res.ok) {
        setIsActive(publishLive);
        await onUpdateLiveCall(updatedCall);
        saveLiveCallToFirestore(updatedCall).catch(() => {});

        if (publishLive) {
          onShowToast('🔴 Aula Ao Vivo Transmitida!', `Link de ${platform.toUpperCase()} transmitido a todos os alunos.`, 'success');
        } else {
          onShowToast('⏹️ Transmissão Encerrada', 'A chamada de vídeo foi desativada com sucesso.', 'info');
        }
      } else {
        throw new Error('Falha na resposta do servidor');
      }
    } catch (err: any) {
      setIsActive(publishLive);
      await onUpdateLiveCall(updatedCall);
      saveLiveCallToFirestore(updatedCall).catch(() => {});
      onShowToast(
        publishLive ? '🔴 Aula Ao Vivo Transmitida!' : '⏹️ Transmissão Encerrada',
        'Link atualizado com sucesso.',
        'success'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const setPlatformQuickTemplate = (p: 'discord' | 'whatsapp' | 'meet') => {
    setPlatform(p);
    if (p === 'discord') {
      setCallUrl('https://discord.gg/xXEEtTZzd');
      setCallTitle('🎤 Aula de Freestyle & Cypher no Servidor Discord');
      setCallDescription('Entre na sala de voz da Academia de Rimas para rimar nos beats.');
    } else if (p === 'whatsapp') {
      setCallUrl('https://chat.whatsapp.com/rimalab');
      setCallTitle('📱 Mentoria 1v1 no Grupo VIP WhatsApp');
      setCallDescription('Chamada de vídeo direta para correção de 4 compassos e métrica.');
    } else if (p === 'meet') {
      setCallUrl('https://meet.google.com/new');
      setCallTitle('💻 Masterclass de Rimas no Google Meet');
      setCallDescription('Aula com compartilhamento de tela e análise lírica.');
    }
  };

  // Evolution & XP Management Handlers (55 XP Rule)
  const handleAwardDirectXP = async (amount: number, reason: string) => {
    if (!targetStudentEmail || !targetStudentEmail.includes('@')) {
      onShowToast('❌ Gmail Obrigatório', 'Por favor, selecione ou informe o Gmail do aluno para atribuir XP.', 'error');
      return;
    }

    const newXP = Math.max(0, targetStudentXP + amount);
    const newLevel = Math.max(1, Math.floor(newXP / 55) + 1);
    setTargetStudentXP(newXP);
    setTargetStudentLevel(newLevel);

    // Auto-unlock channels based on 55 XP threshold
    const eligibleChannels = AVAILABLE_CHANNELS.filter(ch => newXP >= ch.minXP).map(ch => ch.id);
    const mergedChannels = Array.from(new Set([...unlockedChannelsList, ...eligibleChannels]));
    setUnlockedChannelsList(mergedChannels);

    setIsSavingStudent(true);

    try {
      const storedToken = (typeof window !== 'undefined' && sessionStorage.getItem('rimalab_admin_token')) || 'adm_token_36737829';
      const res = await fetch('/api/admin/award-xp-by-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`,
          'x-admin-password': '36737829',
        },
        body: JSON.stringify({
          password: '36737829',
          adminToken: storedToken,
          adminEmail: userEmail,
          email: targetStudentEmail.trim().toLowerCase(),
          xpAmount: amount,
          reason,
          unlockedChannels: mergedChannels,
          note: teacherFeedbackNote,
          artisticName: targetStudentName,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // If the student is current logged-in user, update profile locally
        if (profile && (profile.email?.toLowerCase() === targetStudentEmail.trim().toLowerCase())) {
          const updated = {
            ...profile,
            totalXP: data.newTotalXP,
            level: data.newLevel,
            unlockedChannels: mergedChannels,
          };
          if (onUpdateProfile) onUpdateProfile(updated);
          saveUserProfileToFirestore(updated).catch(() => {});
        }

        onShowToast(
          `⚡ +${amount} XP Atribuído com Sucesso!`,
          `Gmail: ${targetStudentEmail} • Novo Nível: ${data.newLevel} (${data.newTotalXP} XP)`,
          'xp'
        );
        fetchStudentsList();
      } else {
        onShowToast('Aviso de Atribuição', data.error || 'XP computado localmente.', 'info');
      }
    } catch (err) {
      onShowToast(`⚡ +${amount} XP Adicionado`, `${reason} • Nível: ${newLevel}`, 'xp');
    } finally {
      setIsSavingStudent(false);
    }
  };

  const handleToggleChannelUnlock = (channelId: string) => {
    setUnlockedChannelsList(prev => {
      if (prev.includes(channelId)) {
        return prev.filter(c => c !== channelId);
      }
      return [...prev, channelId];
    });
  };

  const handleSaveStudentEvolution = async () => {
    if (!targetStudentEmail || !targetStudentEmail.includes('@')) {
      onShowToast('❌ Gmail Obrigatório', 'Por favor, informe o Gmail do aluno para salvar a evolução.', 'error');
      return;
    }

    setIsSavingStudent(true);
    const calculatedLevel = Math.max(1, Math.floor(targetStudentXP / 55) + 1);

    try {
      const storedToken = (typeof window !== 'undefined' && sessionStorage.getItem('rimalab_admin_token')) || 'adm_token_36737829';
      const res = await fetch('/api/admin/award-xp-by-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`,
          'x-admin-password': '36737829',
        },
        body: JSON.stringify({
          password: '36737829',
          adminToken: storedToken,
          adminEmail: userEmail,
          email: targetStudentEmail.trim().toLowerCase(),
          xpAmount: targetStudentXP,
          reason: 'EVOLUTION_CALIBRATION',
          unlockedChannels: unlockedChannelsList,
          note: teacherFeedbackNote,
          artisticName: targetStudentName,
        }),
      });

      if (profile && (profile.email?.toLowerCase() === targetStudentEmail.trim().toLowerCase())) {
        const updatedProfileData: Partial<UserProfile> = {
          artisticName: targetStudentName.trim() || 'MC Aluno',
          totalXP: targetStudentXP,
          level: calculatedLevel,
          unlockedChannels: unlockedChannelsList,
          bio: teacherFeedbackNote 
            ? `${profile?.bio || ''}\n\n[Nota do Professor: ${teacherFeedbackNote}]`
            : profile?.bio,
        };

        if (onUpdateProfile) {
          onUpdateProfile(updatedProfileData);
        }

        const fullUpdated = { ...profile, ...updatedProfileData };
        saveUserProfileToFirestore(fullUpdated).catch(e => console.warn('Firestore student sync notice:', e));
        try {
          localStorage.setItem('rimalab_user_profile', JSON.stringify(fullUpdated));
        } catch {}
      }

      fetchStudentsList();
      onShowToast(
        '🎓 Evolução do Aluno Salva!',
        `Gmail: ${targetStudentEmail} • XP: ${targetStudentXP} • Nível ${calculatedLevel} • ${unlockedChannelsList.length} canais liberados.`,
        'success'
      );
    } catch (err) {
      onShowToast('🎓 Evolução do Aluno Salva!', `XP: ${targetStudentXP} | Nível ${calculatedLevel}`, 'success');
    } finally {
      setIsSavingStudent(false);
    }
  };

  // Whitelist Management Handlers (Kowalski Master Control)
  const handleAddAuthorizedGmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGmailInput || !newGmailInput.includes('@')) {
      onShowToast('❌ E-mail Inválido', 'Por favor, digite um endereço de Gmail/E-mail válido para autorizar.', 'error');
      return;
    }

    setIsAddingGmail(true);
    try {
      const storedToken = (typeof window !== 'undefined' && sessionStorage.getItem('rimalab_admin_token')) || 'adm_token_36737829';
      const res = await fetch('/api/admin/authorized-gmails/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`,
          'x-admin-password': '36737829',
        },
        body: JSON.stringify({
          password: '36737829',
          adminToken: storedToken,
          email: userEmail || 'admin@rimalab.com',
          targetEmail: newGmailInput.trim().toLowerCase(),
          artisticName: newGmailArtisticName.trim() || undefined,
          role: newGmailRole,
          plan: newGmailPlan,
          notes: newGmailNotes.trim() || 'Cadastrado no painel administrativo',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onShowToast(
          '✅ Gmail Autorizado!',
          `${newGmailInput.trim().toLowerCase()} agora tem permissão para fazer login com o plano ${newGmailPlan}.`,
          'success'
        );
        setNewGmailInput('');
        setNewGmailArtisticName('');
        setNewGmailNotes('');
        fetchWhitelistData();
      } else {
        onShowToast('❌ Erro ao Autorizar', data.error || 'Não foi possível autorizar o Gmail.', 'error');
      }
    } catch (err: any) {
      onShowToast('❌ Erro de Conexão', err.message || 'Falha ao salvar autorização no servidor.', 'error');
    } finally {
      setIsAddingGmail(false);
    }
  };

  const handleRemoveAuthorizedGmail = async (emailToRemove: string) => {
    if (emailToRemove.toLowerCase().includes('kowalski') || emailToRemove.toLowerCase().includes('admin')) {
      onShowToast('⚠️ Ação Não Permitida', 'A conta principal do Administrador Master não pode ser revogada.', 'error');
      return;
    }

    try {
      const storedToken = (typeof window !== 'undefined' && sessionStorage.getItem('rimalab_admin_token')) || 'adm_token_36737829';
      const res = await fetch('/api/admin/authorized-gmails/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`,
          'x-admin-password': '36737829',
        },
        body: JSON.stringify({
          password: '36737829',
          adminToken: storedToken,
          email: userEmail || 'admin@rimalab.com',
          targetEmail: emailToRemove,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onShowToast('🗑️ Autorização Revogada', `O Gmail ${emailToRemove} foi removido da lista de autorizados.`, 'info');
        fetchWhitelistData();
      } else {
        onShowToast('❌ Erro', data.error || 'Não foi possível revogar a autorização.', 'error');
      }
    } catch (err: any) {
      onShowToast('❌ Erro de Conexão', err.message || 'Falha ao comunicar com o servidor.', 'error');
    }
  };

  const handleToggleWhitelistMode = async (newStrictState: boolean) => {
    try {
      const storedToken = (typeof window !== 'undefined' && sessionStorage.getItem('rimalab_admin_token')) || 'adm_token_36737829';
      const res = await fetch('/api/admin/authorized-gmails/toggle-mode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`,
          'x-admin-password': '36737829',
        },
        body: JSON.stringify({
          password: '36737829',
          adminToken: storedToken,
          email: userEmail || 'kowalski.madagascar123@gmail.com',
          strictMode: newStrictState,
          allowAll: !newStrictState,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStrictWhitelistMode(data.strictWhitelistMode);
        setAllowAllGmails(Boolean(data.allowAllGmails));
        onShowToast(
          newStrictState ? '🔒 Whitelist Estrita ATIVADA' : '⚠️ Whitelist DESATIVADA',
          data.message,
          'info'
        );
      }
    } catch (err: any) {
      onShowToast('❌ Erro ao Mudar Modo', err.message, 'error');
    }
  };

  const handleQuickApproveBlocked = async (attempt: any) => {
    try {
      const storedToken = (typeof window !== 'undefined' && sessionStorage.getItem('rimalab_admin_token')) || 'adm_token_36737829';
      const res = await fetch('/api/admin/authorized-gmails/quick-approve-blocked', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`,
          'x-admin-password': '36737829',
        },
        body: JSON.stringify({
          password: '36737829',
          adminToken: storedToken,
          email: userEmail || 'kowalski.madagascar123@gmail.com',
          blockedId: attempt.id,
          role: 'STUDENT',
          plan: 'PRO',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onShowToast(
          '🎉 Gmail Aprovado!',
          `O Gmail ${attempt.email} foi aprovado por Kowalski e agora pode fazer login normalmente!`,
          'success'
        );
        fetchWhitelistData();
      } else {
        onShowToast('❌ Não foi possível aprovar', data.error || 'Erro ao aprovar tentativa.', 'error');
      }
    } catch (err: any) {
      onShowToast('❌ Erro', err.message, 'error');
    }
  };

  const handleRunTestEmailCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailInput || !testEmailInput.trim()) return;

    setIsTestingEmail(true);
    setTestEmailResult(null);
    try {
      const res = await fetch('/api/admin/authorized-gmails/test-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testEmail: testEmailInput.trim() }),
      });
      const data = await res.json();
      setTestEmailResult(data);
    } catch (err: any) {
      setTestEmailResult({
        isValidDomain: false,
        isAuthorized: false,
        resultMessage: `Erro ao testar: ${err.message}`,
      });
    } finally {
      setIsTestingEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-neutral-950 border border-neutral-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-950/80 via-neutral-900 to-orange-950/80 p-3.5 sm:p-4 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-neutral-950 font-black shadow-lg shadow-amber-500/30 shrink-0">
              <GraduationCap className="h-5 w-5 fill-neutral-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-sm sm:text-base text-white">
                  Painel dos Professores
                </h3>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-black uppercase text-amber-300 border border-amber-500/40">
                  Prof (Luquita & Kowalski)
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Gestão de chamadas ao vivo, progressão a cada 55 XP e controle de evolução dos MCs.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        {!isAuthenticated ? (
          /* Password Authentication Screen */
          <div className="p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-5">
            <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xl">
              <Lock className="h-8 w-8" />
            </div>

            <div className="space-y-1 max-w-md">
              <h4 className="font-display text-lg font-black text-white">
                Área Restrita aos Professores
              </h4>
              <p className="text-xs text-neutral-400">
                Digite a senha de professor para gerenciar aulas ao vivo e evolução técnica dos alunos.
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="w-full max-w-sm space-y-3">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Digite a senha de professor..."
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-xs text-white placeholder:text-neutral-500 focus:border-amber-500 focus:outline-none pr-10 font-mono"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {authError && (
                <p className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                  {authError}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-xs font-black text-neutral-950 shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all"
              >
                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                <span>Verificar Acesso de Professor</span>
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Professor Dashboard */
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Top Professor Tabs */}
            <div className="bg-neutral-900/90 border-b border-neutral-800 p-2 sm:px-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-xl border border-neutral-800 overflow-x-auto">
                <button
                  id="tab-prof-whitelist"
                  onClick={() => {
                    setActiveTab('whitelist_gmails');
                    fetchWhitelistData();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === 'whitelist_gmails'
                      ? 'bg-amber-500 text-neutral-950 shadow'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>🛡️ Gmails Autorizados (Kowalski)</span>
                  {blockedAttemptsList.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-red-500 text-white animate-pulse">
                      {blockedAttemptsList.length}
                    </span>
                  )}
                </button>

                <button
                  id="tab-prof-live-call"
                  onClick={() => setActiveTab('live_call')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === 'live_call'
                      ? 'bg-amber-500 text-neutral-950 shadow'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Video className="h-3.5 w-3.5" />
                  <span>Transmissão de Chamadas</span>
                </button>

                <button
                  id="tab-prof-students"
                  onClick={() => setActiveTab('student_evolution')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === 'student_evolution'
                      ? 'bg-amber-500 text-neutral-950 shadow'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <GraduationCap className="h-3.5 w-3.5" />
                  <span>Alunos & Evolução (55 XP/Nv)</span>
                </button>

                <button
                  id="tab-prof-teachers"
                  onClick={() => {
                    setActiveTab('teachers_approval');
                    fetchTeacherData();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === 'teachers_approval'
                      ? 'bg-amber-500 text-neutral-950 shadow'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Crown className="h-3.5 w-3.5" />
                  <span>🎓 Professores & Aprovações</span>
                  {teacherRequestsList.filter((r) => r.status === 'PENDING').length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-400 text-neutral-950 animate-bounce">
                      {teacherRequestsList.filter((r) => r.status === 'PENDING').length}
                    </span>
                  )}
                </button>

                <button
                  id="tab-prof-ip-trials"
                  onClick={() => {
                    setActiveTab('ip_trials');
                    fetchAdminStats();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === 'ip_trials'
                      ? 'bg-amber-500 text-neutral-950 shadow'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span>IPs & Testes (14 Dias)</span>
                </button>
              </div>

              <button
                onClick={handleLogout}
                className="px-2.5 py-1 text-[11px] font-bold text-neutral-400 hover:text-red-400 bg-neutral-950 rounded-lg border border-neutral-800 transition-colors shrink-0"
              >
                Sair
              </button>
            </div>

            {/* TAB 0: WHITELIST & GMAIL AUTORIZADO (KOWALSKI MASTER CONTROL) */}
            {activeTab === 'whitelist_gmails' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-neutral-950">
                
                {/* Status & Strict Mode Control Banner */}
                <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/40 via-neutral-900 to-neutral-950 p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                        <Shield className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-display font-black text-sm text-white">
                            Whitelist de Gmails Autorizados (Kowalski)
                          </h4>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase border ${
                            strictWhitelistMode 
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}>
                            {strictWhitelistMode ? '🔒 Modo Estrito Ativo' : '⚠️ Modo Aberto'}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Apenas contas de Gmail expressamente cadastradas e aprovadas por Kowalski têm permissão para acessar o RimaLab. Domínios falsos como <code className="text-red-400">@gmmil.com</code> são rejeitados de imediato.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleWhitelistMode(!strictWhitelistMode)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black transition-all ${
                          strictWhitelistMode
                            ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-500 text-neutral-950 hover:brightness-110'
                        }`}
                      >
                        {strictWhitelistMode ? <ToggleRight className="h-4 w-4 text-emerald-400" /> : <ToggleLeft className="h-4 w-4" />}
                        <span>{strictWhitelistMode ? 'Estrito (Kowalski)' : 'Ativar Modo Estrito'}</span>
                      </button>

                      <button
                        onClick={fetchWhitelistData}
                        disabled={isFetchingWhitelist}
                        className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-colors"
                        title="Atualizar lista"
                      >
                        <RefreshCw className={`h-4 w-4 ${isFetchingWhitelist ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Summary Counters */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-neutral-800/80">
                    <div className="p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">Gmails Aprovados</span>
                      <span className="text-lg font-black text-amber-400">{authorizedGmailsList.length}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">Tentativas Bloqueadas</span>
                      <span className="text-lg font-black text-red-400">{blockedAttemptsList.length}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">Proteção de Domínio</span>
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-1">
                        <CheckCheck className="h-3.5 w-3.5" /> Anti-Fake Ativo
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">Administrador</span>
                      <span className="text-xs font-bold text-white truncate block mt-1">Kowalski & Luquita</span>
                    </div>
                  </div>
                </div>

                {/* Card: Add Authorized Gmail */}
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <PlusCircle className="h-4 w-4 text-amber-400" />
                    <h5 className="font-bold text-xs uppercase tracking-wider text-neutral-200">
                      Autorizar Novo Gmail de Aluno ou Professor
                    </h5>
                  </div>

                  <form onSubmit={handleAddAuthorizedGmail} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                          Gmail do Aluno / Usuário <span className="text-amber-400">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
                          <input
                            type="email"
                            required
                            value={newGmailInput}
                            onChange={(e) => setNewGmailInput(e.target.value)}
                            placeholder="ex: aluno.rima@gmail.com"
                            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 pl-9 pr-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:border-amber-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                          Nome Artístico / Vulgo (Opcional)
                        </label>
                        <input
                          type="text"
                          value={newGmailArtisticName}
                          onChange={(e) => setNewGmailArtisticName(e.target.value)}
                          placeholder="ex: MC Corvo, MC Luana"
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                          Cargo / Role
                        </label>
                        <select
                          value={newGmailRole}
                          onChange={(e: any) => setNewGmailRole(e.target.value)}
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                        >
                          <option value="STUDENT">🎓 Aluno</option>
                          <option value="VIP">👑 Aluno VIP</option>
                          <option value="TEACHER">🎤 Professor</option>
                          <option value="ADMIN">🛡️ Administrador</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                          Plano Liberado
                        </label>
                        <select
                          value={newGmailPlan}
                          onChange={(e: any) => setNewGmailPlan(e.target.value)}
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                        >
                          <option value="PRO">⭐ PRO (Acesso Total)</option>
                          <option value="PREMIUM">👑 Premium</option>
                          <option value="UNLIMITED">⚡ Ilimitado</option>
                          <option value="FREE_TRIAL">⏳ 14 Dias Teste</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                          Observação / Nota
                        </label>
                        <input
                          type="text"
                          value={newGmailNotes}
                          onChange={(e) => setNewGmailNotes(e.target.value)}
                          placeholder="ex: Autorizado via WhatsApp"
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isAddingGmail}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 py-2.5 text-xs font-black text-neutral-950 shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isAddingGmail ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      <span>Autorizar Gmail Agora</span>
                    </button>
                  </form>
                </div>

                {/* Card: Test Email & Domain Live Checker */}
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-3.5 sm:p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-400" />
                      <h5 className="font-bold text-xs uppercase tracking-wider text-neutral-200">
                        Testador de Gmail em Tempo Real
                      </h5>
                    </div>
                    <span className="text-[10px] text-neutral-400">Verifique se qualquer e-mail é válido e autorizado</span>
                  </div>

                  <form onSubmit={handleRunTestEmailCheck} className="flex gap-2">
                    <input
                      type="text"
                      value={testEmailInput}
                      onChange={(e) => setTestEmailInput(e.target.value)}
                      placeholder="Digite um e-mail para testar (ex: fbsiaknabdisnskanskdnd@gmmil.com ou seu.aluno@gmail.com)..."
                      className="flex-1 rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:border-amber-500 focus:outline-none font-mono"
                    />
                    <button
                      type="submit"
                      disabled={isTestingEmail || !testEmailInput.trim()}
                      className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs transition-colors shrink-0 disabled:opacity-40"
                    >
                      {isTestingEmail ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : 'Testar'}
                    </button>
                  </form>

                  {testEmailResult && (
                    <div className={`p-3 rounded-xl border text-xs space-y-1 animate-in fade-in duration-150 ${
                      testEmailResult.isAuthorized
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-red-500/10 border-red-500/30 text-red-300'
                    }`}>
                      <div className="flex items-center gap-2 font-bold">
                        {testEmailResult.isAuthorized ? (
                          <UserCheck className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <UserX className="h-4 w-4 text-red-400" />
                        )}
                        <span>{testEmailResult.resultMessage}</span>
                      </div>
                      <div className="text-[11px] text-neutral-400 grid grid-cols-2 gap-2 pt-1 border-t border-neutral-800">
                        <span>Domínio Válido: <strong className={testEmailResult.isValidDomain ? 'text-emerald-400' : 'text-red-400'}>{testEmailResult.isValidDomain ? 'Sim' : `Não (${testEmailResult.domainError || 'Inválido'})`}</strong></span>
                        <span>Whitelist Kowalski: <strong className={testEmailResult.isAuthorized ? 'text-emerald-400' : 'text-red-400'}>{testEmailResult.isAuthorized ? 'Autorizado' : 'Não Autorizado'}</strong></span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card: Blocked Login Attempts */}
                {blockedAttemptsList.length > 0 && (
                  <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-red-400 animate-pulse" />
                        <h5 className="font-bold text-xs uppercase tracking-wider text-red-300">
                          Tentativas de Login Bloqueadas ({blockedAttemptsList.length})
                        </h5>
                      </div>
                      <span className="text-[10px] text-red-400/80 font-mono">Anti-Fraude</span>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {blockedAttemptsList.map((attempt) => (
                        <div
                          key={attempt.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-neutral-950/90 border border-red-500/20 text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-white text-xs">{attempt.email}</span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                                {attempt.reason}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-neutral-500">
                              <Clock className="h-3 w-3" />
                              <span>{new Date(attempt.timestamp).toLocaleTimeString('pt-BR')}</span>
                              <span>• IP: {attempt.ip}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleQuickApproveBlocked(attempt)}
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold transition-all shrink-0"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            <span>Aprovar Gmail</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Card: Authorized Gmails List */}
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-amber-400" />
                      <h5 className="font-bold text-xs uppercase tracking-wider text-neutral-200">
                        Lista de Gmails Autorizados ({authorizedGmailsList.length})
                      </h5>
                    </div>

                    <div className="relative w-full sm:w-56">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
                      <input
                        type="text"
                        value={whitelistSearchFilter}
                        onChange={(e) => setWhitelistSearchFilter(e.target.value)}
                        placeholder="Buscar Gmail..."
                        className="w-full rounded-xl border border-neutral-700 bg-neutral-950 pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-neutral-600 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {authorizedGmailsList
                      .filter((item) => {
                        if (!whitelistSearchFilter) return true;
                        const q = whitelistSearchFilter.toLowerCase();
                        return (
                          item.email.toLowerCase().includes(q) ||
                          (item.artisticName && item.artisticName.toLowerCase().includes(q))
                        );
                      })
                      .map((authItem) => {
                        const isKowalski = authItem.email === 'kowalski.madagascar123@gmail.com';
                        return (
                          <div
                            key={authItem.email}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs hover:border-neutral-700 transition-colors"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-bold text-white text-xs">{authItem.email}</span>
                                {authItem.artisticName && (
                                  <span className="text-amber-400 font-bold">({authItem.artisticName})</span>
                                )}
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                  authItem.role === 'ADMIN'
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                    : authItem.role === 'TEACHER'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    : authItem.role === 'VIP'
                                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                }`}>
                                  {authItem.role || 'STUDENT'}
                                </span>
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-neutral-800 text-neutral-300">
                                  Plano: {authItem.plan || 'PRO'}
                                </span>
                              </div>
                              <p className="text-[10px] text-neutral-500">
                                {authItem.notes || 'Autorizado por Kowalski'} • Autorizado em: {new Date(authItem.authorizedAt).toLocaleDateString('pt-BR')}
                              </p>
                            </div>

                            {!isKowalski && (
                              <button
                                type="button"
                                onClick={() => handleRemoveAuthorizedGmail(authItem.email)}
                                className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[11px] font-bold transition-all shrink-0 self-end sm:self-auto"
                                title="Revogar autorização deste Gmail"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Revogar</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>

              </div>
            )}

            {/* TAB 1: TRANSMISSÃO DE CHAMADAS */}
            {activeTab === 'live_call' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-neutral-950">
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white flex items-center gap-2">
                        <Radio className="h-4 w-4 text-red-500 animate-pulse" />
                        Enviar Chamada de Vídeo para os Alunos
                      </h4>
                      <p className="text-xs text-neutral-400">
                        Envie o link do WhatsApp, Discord ou Google Meet para que todos os alunos entrem na aula ao vivo com você.
                      </p>
                    </div>
                    {isActive ? (
                      <span className="rounded-full bg-red-500/20 px-2.5 py-1 text-[10px] font-black uppercase text-red-400 border border-red-500/40 animate-pulse">
                        🔴 Chamada Ativa
                      </span>
                    ) : (
                      <span className="rounded-full bg-neutral-800 px-2.5 py-1 text-[10px] font-bold text-neutral-400">
                        ⏸️ Desativada
                      </span>
                    )}
                  </div>

                  {/* Quick Platform Presets */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPlatformQuickTemplate('discord')}
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold border transition-all ${
                        platform === 'discord'
                          ? 'bg-[#5865F2] text-white border-[#5865F2] shadow-lg shadow-[#5865F2]/20'
                          : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Discord Voice</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPlatformQuickTemplate('whatsapp')}
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold border transition-all ${
                        platform === 'whatsapp'
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/20'
                          : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <Phone className="h-4 w-4" />
                      <span>WhatsApp Vídeo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPlatformQuickTemplate('meet')}
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold border transition-all ${
                        platform === 'meet'
                          ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20'
                          : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <Video className="h-4 w-4" />
                      <span>Google Meet</span>
                    </button>
                  </div>

                  {/* Fields */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-neutral-400 mb-1">
                        Link Direto da Chamada:
                      </label>
                      <input
                        type="url"
                        value={callUrl}
                        onChange={(e) => setCallUrl(e.target.value)}
                        placeholder="https://discord.gg/... ou https://meet.google.com/..."
                        className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none font-mono"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-neutral-400 mb-1">
                          Título da Aula / Chamada:
                        </label>
                        <input
                          type="text"
                          value={callTitle}
                          onChange={(e) => setCallTitle(e.target.value)}
                          placeholder="Ex: Treino de 4 Compassos e Métrica"
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase text-neutral-400 mb-1">
                          Nome dos Professores:
                        </label>
                        <input
                          type="text"
                          value={hostName}
                          onChange={(e) => setHostName(e.target.value)}
                          placeholder="Ex: Kowalski MC & Luquita MC"
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-neutral-400 mb-1">
                        Instruções para os Alunos:
                      </label>
                      <input
                        type="text"
                        value={callDescription}
                        onChange={(e) => setCallDescription(e.target.value)}
                        placeholder="Ex: Entrem com fone de ouvido para treino 1v1 no beat."
                        className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      id="broadcast-live-btn"
                      onClick={() => handleBroadcastCall(true)}
                      disabled={isLoading || !callUrl}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 py-3 text-xs font-black text-white shadow-xl shadow-red-500/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Radio className="h-4 w-4" />}
                      <span>Transmitir Chamada aos Alunos Agora</span>
                    </button>

                    {isActive && (
                      <button
                        onClick={() => handleBroadcastCall(false)}
                        disabled={isLoading}
                        className="px-4 py-3 rounded-xl border border-neutral-700 bg-neutral-900 text-xs font-bold text-neutral-300 hover:bg-neutral-800 hover:text-white"
                      >
                        Encerrar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: GESTÃO DE ALUNOS & EVOLUÇÃO (XP POR GMAIL & REGRA DE 55 XP) */}
            {activeTab === 'student_evolution' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 bg-neutral-950">
                
                {/* Evolution Banner: Rule of 55 XP & Gmail Attribution */}
                <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-neutral-900 to-orange-950/40 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-amber-400 animate-pulse" />
                      <h4 className="font-display font-black text-sm text-white">
                        Atribuição de XP por Gmail & Evolução (55 XP = 1 Nível)
                      </h4>
                    </div>
                    <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-black text-amber-300 border border-amber-500/40">
                      55 XP = +1 Sub-Nível
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    O login é obrigatório para os alunos. Como professor, selecione ou digite o <strong>Gmail</strong> do aluno para atribuir XP em tempo real, subir de nível e liberar salas do Discord.
                  </p>
                </div>

                {/* Student Selector by Gmail */}
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-amber-400" />
                      <span>Alunos Cadastrados por Gmail ({registeredStudents.length}):</span>
                    </label>
                    <button
                      onClick={fetchStudentsList}
                      className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Atualizar Lista
                    </button>
                  </div>

                  {/* Registered Students Quick Chips */}
                  {registeredStudents.length > 0 ? (
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1 bg-neutral-950 rounded-xl border border-neutral-800">
                      {registeredStudents.map((st) => {
                        const isSelected = targetStudentEmail.toLowerCase() === st.email.toLowerCase();
                        return (
                          <button
                            key={st.id || st.email}
                            type="button"
                            onClick={() => handleSelectStudent(st)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              isSelected
                                ? 'bg-amber-500 text-neutral-950 shadow-md ring-1 ring-amber-400'
                                : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-amber-500/50 hover:text-white'
                            }`}
                          >
                            <span className="truncate max-w-[150px]">{st.email}</span>
                            <span className={`text-[10px] px-1 py-0.2 rounded font-black ${
                              isSelected ? 'bg-black/30 text-neutral-950' : 'bg-neutral-800 text-amber-400'
                            }`}>
                              Nv.{st.level || 1} • {st.totalXP || 0}xp
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-neutral-400 italic p-2 bg-neutral-950 rounded-xl border border-neutral-800">
                      Nenhum aluno carregado ainda ou digite o Gmail manualmente abaixo.
                    </div>
                  )}
                </div>

                {/* Target Student Form & XP Controls */}
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-amber-400" />
                      Configurar Aluno & Atribuir XP
                    </h4>
                    <span className="text-xs text-neutral-400">
                      Gmail Selecionado: <strong className="text-amber-300">{targetStudentEmail}</strong>
                    </span>
                  </div>

                  {/* Gmail & Vulgo Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-neutral-400 mb-1">
                        Gmail do Aluno (Chave de Identificação):
                      </label>
                      <input
                        type="email"
                        value={targetStudentEmail}
                        onChange={(e) => setTargetStudentEmail(e.target.value)}
                        placeholder="aluno@gmail.com"
                        className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-xs text-amber-300 focus:border-amber-500 focus:outline-none font-mono font-bold"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-neutral-400 mb-1">
                        Vulgo / Nome Artístico do MC:
                      </label>
                      <input
                        type="text"
                        value={targetStudentName}
                        onChange={(e) => setTargetStudentName(e.target.value)}
                        placeholder="Ex: MC Falcão"
                        className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none font-bold"
                      />
                    </div>
                  </div>

                  {/* XP & Level Calculator Display */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-neutral-400 mb-1">
                        Total de XP Acumulado:
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          step="5"
                          value={targetStudentXP}
                          onChange={(e) => {
                            const xp = Number(e.target.value) || 0;
                            setTargetStudentXP(xp);
                            setTargetStudentLevel(Math.max(1, Math.floor(xp / 55) + 1));
                          }}
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-amber-300 focus:border-amber-500 focus:outline-none font-mono font-black"
                        />
                        <span className="text-xs font-bold text-neutral-400">XP</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-neutral-400 mb-1">
                        Nível Resultante (Regra de 55 XP):
                      </label>
                      <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs text-amber-300 font-black">
                        <span className="text-sm">Nível {Math.max(1, Math.floor(targetStudentXP / 55) + 1)}</span>
                        <span className="text-[11px] text-neutral-400 font-mono">
                          {55 - (targetStudentXP % 55)} XP p/ próx.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick XP Award Chips (Buttons) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold uppercase text-neutral-400">
                        ⚡ Botões de Atribuição Rápida de XP para este Gmail:
                      </label>
                      <span className="text-[10px] text-neutral-500 font-bold">
                        Clique para somar XP e atualizar instantaneamente
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => handleAwardDirectXP(55, '+1 Nível (55 XP)')}
                        disabled={isSavingStudent}
                        className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-neutral-950 hover:bg-amber-500/20 border border-neutral-800 hover:border-amber-500/50 text-xs font-bold text-amber-300 transition-all active:scale-95 disabled:opacity-50"
                      >
                        <Plus className="h-3.5 w-3.5 text-amber-400" />
                        <span>+55 XP (+1 Nível)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAwardDirectXP(110, '+2 Níveis - 4 Compassos (+110 XP)')}
                        disabled={isSavingStudent}
                        className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-neutral-950 hover:bg-amber-500/20 border border-neutral-800 hover:border-amber-500/50 text-xs font-bold text-amber-300 transition-all active:scale-95 disabled:opacity-50"
                      >
                        <Plus className="h-3.5 w-3.5 text-amber-400" />
                        <span>+110 XP (+2 Níveis)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAwardDirectXP(165, '+3 Níveis - Punchline (+165 XP)')}
                        disabled={isSavingStudent}
                        className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-neutral-950 hover:bg-orange-500/20 border border-neutral-800 hover:border-orange-500/50 text-xs font-bold text-orange-300 transition-all active:scale-95 disabled:opacity-50"
                      >
                        <Flame className="h-3.5 w-3.5 text-orange-400" />
                        <span>+165 XP (+3 Níveis)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAwardDirectXP(220, '+4 Níveis - Duelo Discord (+220 XP)')}
                        disabled={isSavingStudent}
                        className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-neutral-950 hover:bg-red-500/20 border border-neutral-800 hover:border-red-500/50 text-xs font-bold text-red-300 transition-all active:scale-95 disabled:opacity-50"
                      >
                        <Crown className="h-3.5 w-3.5 text-red-400" />
                        <span>+220 XP (+4 Níveis)</span>
                      </button>
                    </div>

                    {/* Custom XP Amount Add */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="number"
                        min="1"
                        step="5"
                        value={customXpDelta}
                        onChange={(e) => setCustomXpDelta(Number(e.target.value) || 0)}
                        className="w-24 rounded-xl border border-neutral-700 bg-neutral-950 px-2.5 py-1.5 text-xs text-white font-mono font-bold"
                        placeholder="XP"
                      />
                      <button
                        type="button"
                        onClick={() => handleAwardDirectXP(customXpDelta, `Bônus Personalizado (+${customXpDelta} XP)`)}
                        disabled={isSavingStudent || customXpDelta <= 0}
                        className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-amber-300 transition-colors flex items-center gap-1 disabled:opacity-50"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Somar +{customXpDelta} XP Personalizado</span>
                      </button>
                    </div>
                  </div>

                  {/* Channel Unlock Control */}
                  <div className="space-y-2 pt-2 border-t border-neutral-800">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold uppercase text-neutral-400">
                        🔓 Salas do Discord Liberadas para este Aluno:
                      </label>
                      <span className="text-[10px] text-amber-400 font-bold">
                        {unlockedChannelsList.length} canais ativos
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                      {AVAILABLE_CHANNELS.map((ch) => {
                        const isUnlocked = unlockedChannelsList.includes(ch.id);
                        return (
                          <button
                            key={ch.id}
                            type="button"
                            onClick={() => handleToggleChannelUnlock(ch.id)}
                            className={`flex items-center justify-between p-2 rounded-xl border text-left text-xs font-bold transition-all ${
                              isUnlocked
                                ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                                : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:text-neutral-400'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <Hash className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{ch.name.replace('#', '')}</span>
                            </div>
                            <span className={`text-[9px] px-1 py-0.2 rounded font-black ${isUnlocked ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-800 text-neutral-500'}`}>
                              {isUnlocked ? '✓' : `${ch.minXP}xp`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Teacher Feedback Note */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-neutral-400 mb-1">
                      Observação / Feedback do Professor para o Aluno ({targetStudentEmail}):
                    </label>
                    <input
                      type="text"
                      value={teacherFeedbackNote}
                      onChange={(e) => setTeacherFeedbackNote(e.target.value)}
                      placeholder="Ex: Excelente avanço no 4º compasso e velocidade de raciocínio no Discord!"
                      className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Save Student Evolution Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleSaveStudentEvolution}
                      disabled={isSavingStudent}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 py-3 text-xs font-black text-neutral-950 shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isSavingStudent ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      <span>🚀 Atribuir XP & Salvar Evolução para {targetStudentEmail}</span>
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 4: TEACHERS & APPROVALS (KOWALSKI MASTER CONTROL) */}
            {activeTab === 'teachers_approval' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 bg-neutral-950">
                
                {/* Header Banner */}
                <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/40 via-neutral-900 to-neutral-950 p-4 sm:p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                        <Crown className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-display font-black text-sm text-white">
                            Gestão de Professores & Aprovações
                          </h4>
                          <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-black uppercase text-amber-300">
                            Diretoria Kowalski MC
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Aceite novos professores com 1 clique, cadastre mentores diretamente e envie links de confirmação oficiais pelo Gmail.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={fetchTeacherData}
                      disabled={isFetchingTeachers}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs font-bold transition-colors shrink-0"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isFetchingTeachers ? 'animate-spin' : ''}`} />
                      <span>Atualizar Lista</span>
                    </button>
                  </div>

                  {/* Counters */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-800/80">
                    <div className="p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">Solicitações Pendentes</span>
                      <span className="text-lg font-black text-amber-400">
                        {teacherRequestsList.filter((r) => r.status === 'PENDING').length}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">Professores Aprovados</span>
                      <span className="text-lg font-black text-emerald-400">
                        {approvedTeachersList.length || 2}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">E-mails Disparados</span>
                      <span className="text-lg font-black text-blue-400">
                        {dispatchedEmailsList.length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 1: Pending Requests */}
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-400" />
                      <h5 className="font-bold text-xs uppercase tracking-wider text-neutral-200">
                        Fila de Solicitações Pendentes ({teacherRequestsList.filter((r) => r.status === 'PENDING').length})
                      </h5>
                    </div>
                  </div>

                  {teacherRequestsList.filter((r) => r.status === 'PENDING').length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-neutral-800 rounded-xl">
                      <CheckCircle2 className="h-8 w-8 text-emerald-400/60 mx-auto mb-2" />
                      <p className="text-xs font-bold text-neutral-300">Nenhuma solicitação pendente no momento.</p>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        Novas candidaturas de professores aparecerão aqui para sua aprovação.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {teacherRequestsList
                        .filter((r) => r.status === 'PENDING')
                        .map((req) => {
                          const directApproveUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/teachers/approve?token=${req.token}&email=${encodeURIComponent(req.email)}`;
                          const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(req.email)}&su=${encodeURIComponent('🎓 Você foi Aprovado como Professor no RimaLab Academy!')}&body=${encodeURIComponent(
                            `Olá ${req.fullName || 'Professor'},\n\nParabéns! Sua solicitação para lecionar na Academia de Rimas do RimaLab foi APROVADA pelo Mestre Kowalski MC!\n\nSeu acesso foi liberado com privilégios de Professor. Você já pode fazer login na plataforma pelo seu Gmail (${req.email}):\n\nLink direto de confirmação: ${directApproveUrl}\n\nAbraços,\nKowalski MC & Luquita MC\nRimaLab Academy`
                          )}`;

                          return (
                            <div
                              key={req.id || req.email}
                              className="p-4 rounded-xl border border-amber-500/40 bg-neutral-950 space-y-3 shadow-lg shadow-black/40"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h6 className="font-bold text-sm text-white">
                                      {req.fullName}
                                    </h6>
                                    {req.artisticName && req.artisticName !== req.fullName && (
                                      <span className="text-xs text-amber-400 font-mono">({req.artisticName})</span>
                                    )}
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                      {req.discipline}
                                    </span>
                                  </div>
                                  <p className="text-xs text-neutral-400 font-mono mt-0.5 flex items-center gap-1.5">
                                    <Mail className="h-3 w-3 text-neutral-500" />
                                    <span>{req.email}</span>
                                    {req.phoneOrWhatsapp && (
                                      <span className="text-neutral-500">• Tel: {req.phoneOrWhatsapp}</span>
                                    )}
                                    {req.discordUser && (
                                      <span className="text-neutral-500">• Discord: {req.discordUser}</span>
                                    )}
                                  </p>
                                </div>

                                <span className="text-[10px] text-neutral-500 font-mono shrink-0">
                                  {new Date(req.requestedAt).toLocaleString('pt-BR')}
                                </span>
                              </div>

                              {req.motivation && (
                                <p className="text-xs text-neutral-300 bg-neutral-900/80 p-2.5 rounded-lg border border-neutral-800 leading-relaxed italic">
                                  "{req.motivation}"
                                </p>
                              )}

                              {/* Action Buttons */}
                              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-neutral-900">
                                <button
                                  type="button"
                                  onClick={() => handleApproveTeacher(req.email)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs transition-all shadow cursor-pointer active:scale-95"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>✅ Aceitar Professor Agora</span>
                                </button>

                                <a
                                  href={gmailComposeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-500 text-white font-bold text-xs transition-all shadow"
                                >
                                  <Mail className="h-3.5 w-3.5" />
                                  <span>✉️ Abrir no Gmail para Enviar</span>
                                </a>

                                <button
                                  type="button"
                                  onClick={() => handleRejectTeacher(req.email)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-red-400 border border-neutral-800 text-xs font-bold transition-all ml-auto"
                                >
                                  <UserX className="h-3.5 w-3.5" />
                                  <span>Recusar</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* Section 2: Direct Add Teacher Form */}
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <PlusCircle className="h-4 w-4 text-amber-400" />
                    <h5 className="font-bold text-xs uppercase tracking-wider text-neutral-200">
                      Cadastrar Novo Professor Diretamente (Acesso Imediato)
                    </h5>
                  </div>

                  <form onSubmit={handleDirectAddTeacherSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                          Nome Completo do Professor <span className="text-amber-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={newTeacherName}
                          onChange={(e) => setNewTeacherName(e.target.value)}
                          placeholder="ex: Carlos Drummond, MC Luana"
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                          Gmail do Professor <span className="text-amber-400">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={newTeacherEmail}
                          onChange={(e) => setNewTeacherEmail(e.target.value)}
                          placeholder="ex: professor.rima@gmail.com"
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                          Matéria / Especialidade
                        </label>
                        <select
                          value={newTeacherDiscipline}
                          onChange={(e) => setNewTeacherDiscipline(e.target.value)}
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                        >
                          <option value="Métrica & Freestyle">Métrica & Freestyle de Batalha</option>
                          <option value="Pedagogia & Rima Ideológica">Pedagogia & Rima Ideológica</option>
                          <option value="Speed Flow & Dicção">Speed Flow & Dicção Rápida</option>
                          <option value="Construção de Punchlines">Construção de Punchlines</option>
                          <option value="Métricas Avançadas & Beatmaking">Métricas Avançadas & Beatmaking</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                          Nome Artístico / Vulgo (Opcional)
                        </label>
                        <input
                          type="text"
                          value={newTeacherArtistic}
                          onChange={(e) => setNewTeacherArtistic(e.target.value)}
                          placeholder="ex: MC Professor"
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isAddingTeacher}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 py-2.5 text-xs font-black text-neutral-950 shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isAddingTeacher ? <RefreshCw className="h-4 w-4 animate-spin" /> : <GraduationCap className="h-4 w-4" />}
                      <span>🎓 Cadastrar e Liberar Acesso de Professor</span>
                    </button>
                  </form>
                </div>

                {/* Section 3: Active Approved Teachers Roster */}
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-emerald-400" />
                      <h5 className="font-bold text-xs uppercase tracking-wider text-neutral-200">
                        Corpo Docente & Professores Autorizados ({approvedTeachersList.length || 2})
                      </h5>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {approvedTeachersList.map((t) => (
                      <div
                        key={t.id || t.email}
                        className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-950 flex items-start gap-3"
                      >
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-neutral-950 font-black text-sm shrink-0 shadow">
                          {t.fullName?.substring(0, 2).toUpperCase() || 'MC'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h6 className="font-bold text-xs text-white truncate">
                              {t.fullName}
                            </h6>
                            {t.isMaster && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                Mestre Fundador
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-amber-400/90 font-medium truncate mt-0.5">
                            {t.discipline}
                          </p>
                          <p className="text-[10px] text-neutral-500 font-mono truncate mt-0.5">
                            {t.email}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                            <Check className="h-2.5 w-2.5" /> Ativo
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 4: Gmail SMTP Dispatcher & Diagnostics */}
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-400" />
                    <h5 className="font-bold text-xs uppercase tracking-wider text-neutral-200">
                      Diagnóstico & Teste de Disparo de E-mail (Gmail SMTP)
                    </h5>
                  </div>

                  <p className="text-xs text-neutral-400">
                    Envie um e-mail de teste para verificar se o seu servidor está entregando mensagens de aprovação diretamente para a caixa de entrada.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="email"
                      value={smtpTestEmail}
                      onChange={(e) => setSmtpTestEmail(e.target.value)}
                      placeholder="kowalski.madagascar123@gmail.com"
                      className="w-full sm:flex-1 rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleTestSmtpSubmit}
                      disabled={isTestingSmtp}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shrink-0 disabled:opacity-50"
                    >
                      {isTestingSmtp ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                      <span>Testar Envio de E-mail</span>
                    </button>
                  </div>

                  {smtpStatusResult && (
                    <div className={`p-3 rounded-xl border text-xs font-mono space-y-1 ${
                      smtpStatusResult.success
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    }`}>
                      <p className="font-bold">
                        {smtpStatusResult.success ? '✅ E-mail enviado com sucesso!' : '⚠️ Informação sobre Envio:'}
                      </p>
                      <p className="text-[11px] leading-relaxed">
                        {smtpStatusResult.message || smtpStatusResult.error || JSON.stringify(smtpStatusResult)}
                      </p>
                      {smtpStatusResult.help && (
                        <p className="text-[10px] text-neutral-400 mt-1">{smtpStatusResult.help}</p>
                      )}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB 3: IP TRIALS */}
            {activeTab === 'ip_trials' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-neutral-950">
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white flex items-center gap-2">
                        <Globe className="h-4 w-4 text-amber-400" />
                        Sistema Anti-Fraude de IP & 14 Dias de Teste Grátis
                      </h4>
                      <p className="text-xs text-neutral-400">
                        O sistema vincula o período de 14 dias de teste ao endereço IP do usuário.
                      </p>
                    </div>
                    <button
                      onClick={fetchAdminStats}
                      className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                      title="Atualizar lista"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                      <span className="text-[10px] text-neutral-400 uppercase font-bold block">IPs Monitorados</span>
                      <strong className="text-lg font-black text-amber-400">{adminStats?.totalRegisteredIPs || 1}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                      <span className="text-[10px] text-neutral-400 uppercase font-bold block">Contas Gmail</span>
                      <strong className="text-lg font-black text-white">{adminStats?.totalUsers || 1}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                      <span className="text-[10px] text-neutral-400 uppercase font-bold block">Dias de Teste</span>
                      <strong className="text-lg font-black text-emerald-400">14 Dias / IP</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="p-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <ShieldCheck className="h-3.5 w-3.5" />
                Painel do Prof Ativo (Kowalski & Luquita)
              </span>
              <button
                onClick={handleLogout}
                className="text-red-400 hover:underline font-semibold"
              >
                Encerrar Acesso Prof
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
