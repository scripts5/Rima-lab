import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Sliders,
  Send,
  RefreshCw,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Palette,
  MessageSquare,
  Zap,
  RotateCcw,
  Check,
  Flame,
  Volume2,
  Megaphone,
  Type,
  Layout,
  Crown,
  Code2,
  FileCode,
  Bell,
  Copy,
  Terminal,
  Save,
  Globe,
  Mail,
  LogOut,
  AlertCircle
} from 'lucide-react';
import { useSiteCustomization, GRADIENT_MAP, SiteCustomization } from '../context/SiteCustomizationContext';

interface KowalskiStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (title: string, message: string, type?: 'success' | 'error' | 'info' | 'xp') => void;
  userEmail?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'kowalski';
  text: string;
  timestamp: string;
  appliedChanges?: Partial<SiteCustomization>;
}

const AUTHORIZED_ADMIN_EMAILS = [
  'admin@rimalab.com',
  'kowalski@rimalab.com',
  'ravel.macedo@escola.pr.gov.br',
];

const CSS_PRESETS = [
  {
    name: '🟣 Neon Cyberpunk Glow',
    description: 'Bordas roxas com sombra neon futurista nos cards e botões',
    code: `/* 🟣 Neon Cyberpunk Glow */
.rounded-2xl, .rounded-3xl, button {
  box-shadow: 0 0 16px rgba(168, 85, 247, 0.35) !important;
  border-color: rgba(168, 85, 247, 0.45) !important;
}`,
  },
  {
    name: '👑 Ouro Master VIP',
    description: 'Realce dourado brilhante nos textos e ícones principais',
    code: `/* 👑 Ouro Master VIP */
.text-amber-400, .bg-amber-500 {
  filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.7)) !important;
}`,
  },
  {
    name: '🩸 Sangue Total Arena',
    description: 'Bordas e detalhes avermelhados no estilo Batalha de Sangue',
    code: `/* 🩸 Sangue Total Arena */
.border-neutral-800, .border-neutral-700 {
  border-color: rgba(239, 68, 68, 0.4) !important;
}`,
  },
  {
    name: '🟢 Terminal Hacker Matrix',
    description: 'Efeito leve de brilho esmeralda hacker em títulos e textos',
    code: `/* 🟢 Terminal Hacker Matrix */
h1, h2, h3, strong {
  text-shadow: 0 0 8px rgba(34, 197, 94, 0.5) !important;
}`,
  },
  {
    name: '⚡ Botões Turbo Zoom',
    description: 'Efeito dinâmico de escala suave nos botões ao passar o mouse',
    code: `/* ⚡ Botões Turbo Zoom */
button:hover {
  transform: scale(1.03) !important;
  transition: all 0.15s ease-in-out !important;
}`,
  },
];

export const KowalskiStudioModal: React.FC<KowalskiStudioModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
  userEmail = '',
}) => {
  const { customization, updateCustomization, resetCustomization, isCustomized } = useSiteCustomization();

  // Authentication State
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
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  // Studio Mode: 'chat' (Kowalski Studio IA) vs 'manual' (Editor Manual)
  const [activeMode, setActiveMode] = useState<'chat' | 'manual'>('chat');
  // Sub-tabs in Manual Mode
  const [manualSubTab, setManualSubTab] = useState<'visual' | 'banners' | 'css' | 'smtp' | 'json'>('visual');

  // Manual Editor State (Cloned from context for draft editing)
  const [draftTitle, setDraftTitle] = useState(customization.heroTitle);
  const [draftHighlight, setDraftHighlight] = useState(customization.heroHighlightWord);
  const [draftSubtitle, setDraftSubtitle] = useState(customization.heroSubtitle);
  const [draftGradient, setDraftGradient] = useState(customization.heroGradient);
  const [draftCta, setDraftCta] = useState(customization.ctaButtonText);
  const [draftBannerEnabled, setDraftBannerEnabled] = useState(customization.announcementBanner.enabled);
  const [draftBannerText, setDraftBannerText] = useState(customization.announcementBanner.text);
  const [draftBannerBadge, setDraftBannerBadge] = useState(customization.announcementBanner.badge);
  const [draftBannerStyle, setDraftBannerStyle] = useState(customization.announcementBanner.style);
  const [draftBrandName, setDraftBrandName] = useState(customization.brandName);
  const [draftBrandSub, setDraftBrandSub] = useState(customization.brandSub || 'Por Kowalski MC & Luquita MC');
  const [draftTicker, setDraftTicker] = useState(customization.topTickerText);
  const [draftFooterMessage, setDraftFooterMessage] = useState(customization.footerMessage || 'RimaLab Academy • Transformando MCs em Máquinas de Freestyle com IA');
  
  // Custom CSS & Global Alert
  const [draftCustomCss, setDraftCustomCss] = useState(customization.customCss || '');
  const [draftAlertEnabled, setDraftAlertEnabled] = useState(customization.globalAlert?.enabled || false);
  const [draftAlertTitle, setDraftAlertTitle] = useState(customization.globalAlert?.title || '🏆 Batalha Semanal RimaLab');
  const [draftAlertMessage, setDraftAlertMessage] = useState(customization.globalAlert?.message || 'Participe do torneio de freestyle no Discord e dispute o pódio!');
  const [draftAlertType, setDraftAlertType] = useState<'info' | 'warning' | 'hype' | 'event'>(customization.globalAlert?.type || 'hype');
  const [draftAlertBtn, setDraftAlertBtn] = useState(customization.globalAlert?.buttonText || 'Ver Detalhes');
  const [draftRawJson, setDraftRawJson] = useState('');
  const [isSavingGlobal, setIsSavingGlobal] = useState(false);

  // SMTP Testing State
  const [smtpTestRecipient, setSmtpTestRecipient] = useState('kowalski.madagascar123@gmail.com');
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [smtpResult, setSmtpResult] = useState<any>(null);

  // Sync draft whenever context customization changes
  useEffect(() => {
    setDraftTitle(customization.heroTitle);
    setDraftHighlight(customization.heroHighlightWord);
    setDraftSubtitle(customization.heroSubtitle);
    setDraftGradient(customization.heroGradient);
    setDraftCta(customization.ctaButtonText);
    setDraftBannerEnabled(customization.announcementBanner.enabled);
    setDraftBannerText(customization.announcementBanner.text);
    setDraftBannerBadge(customization.announcementBanner.badge);
    setDraftBannerStyle(customization.announcementBanner.style);
    setDraftBrandName(customization.brandName);
    setDraftBrandSub(customization.brandSub || 'Por Kowalski MC & Luquita MC');
    setDraftTicker(customization.topTickerText);
    setDraftFooterMessage(customization.footerMessage || 'RimaLab Academy • Transformando MCs em Máquinas de Freestyle com IA');
    setDraftCustomCss(customization.customCss || '');
    setDraftAlertEnabled(customization.globalAlert?.enabled || false);
    setDraftAlertTitle(customization.globalAlert?.title || '🏆 Batalha Semanal RimaLab');
    setDraftAlertMessage(customization.globalAlert?.message || 'Participe do torneio de freestyle no Discord!');
    setDraftAlertType(customization.globalAlert?.type || 'hype');
    setDraftAlertBtn(customization.globalAlert?.buttonText || 'Ver Detalhes');
    setDraftRawJson(JSON.stringify(customization, null, 2));
  }, [customization]);

  // AI Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'kowalski',
      text: 'Salve, mestre! Eu sou o Kowalski Studio AI. O que você quer mudar no site hoje para todos os usuários?\n\nVocê pode me pedir em linguagem natural (ex: "Coloque degradê neon roxo", "Mude o título para Arena Suprema dos MCs", "Adicione um banner avisando da aula ao vivo") ou usar a aba MANUAL para editar código CSS ao vivo, textos e banners. Tudo atualiza em tempo real e fica salvo mesmo após recarregar!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (activeMode === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeMode]);

  // Check recognized admin email
  const isRecognizedEmail = AUTHORIZED_ADMIN_EMAILS.some(
    (em) => em.toLowerCase() === (userEmail || '').trim().toLowerCase()
  );

  useEffect(() => {
    if (isRecognizedEmail && !isAuthenticated) {
      setIsAuthenticated(true);
      try {
        sessionStorage.setItem('rimalab_admin_auth', 'true');
        sessionStorage.setItem('rimalab_admin_token', 'adm_token_36737829');
        sessionStorage.setItem('rimalab_admin_pwd', '36737829');
      } catch {}
    }
  }, [isRecognizedEmail, isAuthenticated]);

  if (!isOpen) return null;

  const handlePasswordSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError('');
    setIsLoadingAuth(true);

    const raw = passwordInput.trim().replace(/[\s\-_'"]/g, '');
    const isMaster = raw === '36737829';

    setTimeout(() => {
      if (isMaster || isRecognizedEmail) {
        setIsAuthenticated(true);
        try {
          sessionStorage.setItem('rimalab_admin_auth', 'true');
          sessionStorage.setItem('rimalab_admin_token', 'adm_token_36737829');
          sessionStorage.setItem('rimalab_admin_pwd', '36737829');
        } catch {}
        setPasswordInput('');
        onShowToast('🚀 Kowalski Studio Liberado!', 'Acesso de modificação ilimitada concedido.');
      } else {
        setAuthError('Senha incorreta. Digite a senha mestre de administrador (36737829).');
      }
      setIsLoadingAuth(false);
    }, 300);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem('rimalab_admin_auth');
      sessionStorage.removeItem('rimalab_admin_token');
      sessionStorage.removeItem('rimalab_admin_pwd');
    } catch {}
    onShowToast('🔒 Bloqueado', 'Painel bloqueado com segurança.');
  };

  // Test SMTP Function
  const handleTestSmtp = async () => {
    setSmtpTesting(true);
    setSmtpResult(null);
    try {
      const res = await fetch('/api/admin/test-smtp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': '36737829',
          'x-admin-token': 'adm_token_36737829',
        },
        body: JSON.stringify({
          recipient: smtpTestRecipient.trim() || 'kowalski.madagascar123@gmail.com',
          password: '36737829',
        }),
      });

      const data = await res.json();
      setSmtpResult(data);
      if (data.success) {
        onShowToast('📧 E-mail Enviado!', `Disparado com sucesso para ${smtpTestRecipient}`, 'success');
      } else {
        onShowToast('⚠️ Verificação SMTP', data.message || 'Verifique as variáveis de ambiente SMTP_USER e SMTP_PASS', 'error');
      }
    } catch (e: any) {
      setSmtpResult({ success: false, error: e.message });
      onShowToast('Erro de Conexão', 'Não foi possível conectar ao endpoint de teste SMTP.', 'error');
    } finally {
      setSmtpTesting(false);
    }
  };

  // AI Prompt Processor
  const handleSendPrompt = async (promptText?: string) => {
    const query = (promptText || chatInput).trim();
    if (!query || isProcessingAI) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsProcessingAI(true);

    try {
      const res = await fetch('/api/admin/kowalski-studio/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          currentCustomization: customization,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.updates) {
          await updateCustomization(data.updates, 'Kowalski Studio AI');
          const aiMsg: ChatMessage = {
            id: `ai-${Date.now()}`,
            sender: 'kowalski',
            text: data.reply || 'Pronto! Apliquei as alterações solicitadas no site em tempo real para todos os usuários.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            appliedChanges: data.updates,
          };
          setChatMessages((prev) => [...prev, aiMsg]);
          onShowToast('✨ Site Atualizado para Todos!', 'Modificações salvas globalmente.');
          setIsProcessingAI(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Falling back to local Kowalski Studio NLP parser:', e);
    }

    // Local Smart NLP Parser (Instant Fallback)
    setTimeout(async () => {
      const lower = query.toLowerCase();
      const updates: Partial<SiteCustomization> = {};
      const changesSummary: string[] = [];

      if (lower.includes('roxo') || lower.includes('neon') || lower.includes('cyber') || lower.includes('pink')) {
        updates.heroGradient = 'purple-pink-red';
        changesSummary.push('Degradê Roxo Neon Cyberpunk');
      } else if (lower.includes('verde') || lower.includes('esmeralda') || lower.includes('menta') || lower.includes('ciano')) {
        updates.heroGradient = 'emerald-teal-cyan';
        changesSummary.push('Degradê Esmeralda & Ciano');
      } else if (lower.includes('azul') || lower.includes('índigo') || lower.includes('indigo')) {
        updates.heroGradient = 'blue-indigo-purple';
        changesSummary.push('Degradê Azul Elétrico');
      } else if (lower.includes('sangue') || lower.includes('ouro') || lower.includes('dourado') || lower.includes('amarelo')) {
        updates.heroGradient = 'red-gold-yellow';
        changesSummary.push('Degradê Vermelho Sangue & Dourado');
      } else if (lower.includes('fogo') || lower.includes('laranja') || lower.includes('âmbar') || lower.includes('ambar')) {
        updates.heroGradient = 'amber-orange-red';
        changesSummary.push('Degradê Âmbar Fogo');
      }

      if (lower.includes('banner') || lower.includes('aviso') || lower.includes('recado')) {
        let bannerText = query.replace(/(adicione|coloque|bote|crie|ativar|mude o)\s+(um\s+)?(banner|aviso|recado)\s+(dizendo|que|de|:)?/i, '').trim();
        if (bannerText.length < 5) bannerText = '🎤 Atenção MCs: Nova Mentoria e Roda de Rima aberta no Discord!';
        updates.announcementBanner = {
          enabled: true,
          text: bannerText,
          badge: 'AVISO OFICIAL',
          style: lower.includes('sangue') || lower.includes('vermelho') ? 'red' : 'amber',
        };
        changesSummary.push(`Banner: "${bannerText.substring(0, 40)}..."`);
      }

      if (lower.includes('título') || lower.includes('titulo') || lower.includes('headline')) {
        const titleMatch = query.match(/(?:para|com o título|como)\s+["'“]?([^"'”]+)["'”]?/i);
        const newTitle = titleMatch ? titleMatch[1].trim() : query.replace(/.*(título|titulo|headline)\s*(?:para|é|como|:)?/i, '').trim();
        if (newTitle && newTitle.length > 3) {
          updates.heroTitle = newTitle;
          changesSummary.push(`Título: "${newTitle}"`);
        }
      }

      if (lower.includes('botão') || lower.includes('botao') || lower.includes('cta')) {
        const btnMatch = query.match(/(?:para|como|com o texto)\s+["'“]?([^"'”]+)["'”]?/i);
        const newBtn = btnMatch ? btnMatch[1].trim() : query.replace(/.*(botão|botao|cta)\s*(?:para|é|como|:)?/i, '').trim();
        if (newBtn && newBtn.length > 2) {
          updates.ctaButtonText = newBtn;
          changesSummary.push(`Botão CTA: "${newBtn}"`);
        }
      }

      if (lower.includes('reset') || lower.includes('restaurar') || lower.includes('padrão') || lower.includes('padrao')) {
        await resetCustomization();
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'kowalski',
          text: '🔄 Todas as personalizações foram restauradas para o padrão global de fábrica!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setChatMessages((prev) => [...prev, aiMsg]);
        onShowToast('🔄 Padrões Restaurados', 'O site voltou ao layout original.');
        setIsProcessingAI(false);
        return;
      }

      if (Object.keys(updates).length === 0) {
        updates.heroTitle = query.length > 8 ? query : customization.heroTitle;
        changesSummary.push('Atualização visual realizada');
      }

      await updateCustomization(updates, 'Kowalski Studio AI');

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'kowalski',
        text: `🚀 Feito com sucesso! Apliquei as modificações em tempo real para todos os usuários:\n\n• ${changesSummary.join('\n• ')}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        appliedChanges: updates,
      };

      setChatMessages((prev) => [...prev, aiMsg]);
      onShowToast('✨ Site Atualizado!', 'Modificações aplicadas ao vivo para todos.');
      setIsProcessingAI(false);
    }, 400);
  };

  // Manual Form Submit
  const handleSaveManualCustomization = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingGlobal(true);

    const updates: Partial<SiteCustomization> = {
      heroTitle: draftTitle,
      heroHighlightWord: draftHighlight,
      heroSubtitle: draftSubtitle,
      heroGradient: draftGradient as any,
      ctaButtonText: draftCta,
      announcementBanner: {
        enabled: draftBannerEnabled,
        text: draftBannerText,
        badge: draftBannerBadge,
        style: draftBannerStyle as any,
      },
      brandName: draftBrandName,
      brandSub: draftBrandSub,
      topTickerText: draftTicker,
      footerMessage: draftFooterMessage,
      customCss: draftCustomCss,
      globalAlert: {
        enabled: draftAlertEnabled,
        title: draftAlertTitle,
        message: draftAlertMessage,
        type: draftAlertType,
        buttonText: draftAlertBtn,
      },
    };

    await updateCustomization(updates, userEmail || 'Admin');
    setIsSavingGlobal(false);
    onShowToast('🚀 Site Salvo para Todos!', 'As alterações manuais já estão ativas para todos os visitantes.');
  };

  // Apply Raw JSON
  const handleApplyRawJson = async () => {
    try {
      const parsed = JSON.parse(draftRawJson);
      setIsSavingGlobal(true);
      await updateCustomization(parsed, userEmail || 'Admin JSON');
      setIsSavingGlobal(false);
      onShowToast('✅ JSON Aplicado!', 'Configuração do site atualizada com sucesso.');
    } catch (e: any) {
      onShowToast('Erro no JSON', 'Verifique a sintaxe do JSON antes de aplicar.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-neutral-950 border border-neutral-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-amber-950/90 via-neutral-900 to-orange-950/90 p-3.5 sm:p-4 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-neutral-950 font-black shadow-lg shadow-amber-500/30 shrink-0">
              <Sparkles className="h-5 w-5 fill-neutral-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-sm sm:text-base text-white">
                  Kowalski Studio & Editor Global
                </h3>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-black uppercase text-amber-300 border border-amber-500/40">
                  Ao Vivo para Todos
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Altere todo o site por Chat IA ou Manualmente (Textos, Banners, Degradês e Injetor CSS).
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

        {/* Content Body */}
        {!isAuthenticated ? (
          /* Password Protection Gate */
          <div className="p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-5">
            <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xl">
              <Lock className="h-8 w-8" />
            </div>

            <div className="space-y-1 max-w-md">
              <h4 className="font-display text-lg font-black text-white">
                Área Restrita: Kowalski Studio
              </h4>
              <p className="text-xs text-neutral-400">
                Digite a senha mestre de administrador/professor para desbloquear o controle do site inteiro.
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="w-full max-w-sm space-y-3">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Digite a senha mestre..."
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
                disabled={isLoadingAuth}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-xs font-black text-neutral-950 shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all"
              >
                {isLoadingAuth ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                <span>Desbloquear Kowalski Studio</span>
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Studio Interface */
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Mode Switcher Navigation (Chat IA vs Editor Manual) */}
            <div className="bg-neutral-900/90 border-b border-neutral-800 p-2 sm:px-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
                <button
                  id="tab-kowalski-chat"
                  onClick={() => setActiveMode('chat')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeMode === 'chat'
                      ? 'bg-amber-500 text-neutral-950 shadow font-black'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Chat IA (Kowalski Studio)</span>
                </button>

                <button
                  id="tab-kowalski-manual"
                  onClick={() => setActiveMode('manual')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeMode === 'manual'
                      ? 'bg-amber-500 text-neutral-950 shadow font-black'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Sliders className="h-3.5 w-3.5" />
                  <span>Manual & Código CSS</span>
                </button>
              </div>

              {/* Status & Quick Action */}
              <div className="flex items-center gap-2">
                {isCustomized && (
                  <button
                    onClick={async () => {
                      await resetCustomization();
                      onShowToast('🔄 Padrões Restaurados', 'O site voltou ao visual padrão global.');
                    }}
                    title="Restaurar layout padrão original para todos"
                    className="flex items-center gap-1 text-[11px] font-bold text-neutral-400 hover:text-red-400 bg-neutral-950 px-2.5 py-1.5 rounded-lg border border-neutral-800 hover:border-red-500/30 transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span className="hidden sm:inline">Restaurar Padrão</span>
                  </button>
                )}
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Sincronizado p/ Todos
                </span>
                <button
                  onClick={handleLogout}
                  title="Bloquear Painel"
                  className="flex items-center gap-1 text-[11px] font-bold text-neutral-400 hover:text-amber-400 bg-neutral-950 px-2.5 py-1.5 rounded-lg border border-neutral-800 hover:border-amber-500/40 transition-colors"
                >
                  <LogOut className="h-3 w-3" />
                  <span className="hidden sm:inline">Bloquear</span>
                </button>
              </div>
            </div>

            {/* MODE 1: CHAT COM KOWALSKI STUDIO (IA) */}
            {activeMode === 'chat' && (
              <div className="flex-1 flex flex-col overflow-hidden bg-neutral-950">
                
                {/* Chat Stream */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
                  
                  {/* Quick Preset Prompt Chips */}
                  <div className="space-y-1.5 bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800/80">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                      <Zap className="h-3 w-3" /> Ideias Rápidas de Alteração Global:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        '🔥 Mudar degradê para Fogo e Sangue',
                        '⚡ Degradê Cyberpunk Roxo Neon',
                        '📢 Adicionar banner de aula hoje às 20h',
                        '💎 Mudar botão para "Quero Rimá Agora"',
                        '🎤 Trocar título para "Arena Suprema de Batalhas"',
                        '🌿 Degradê Esmeralda Cyber',
                        '✨ Adicionar efeito glow neon nos botões',
                        '🔄 Restaurar padrão de fábrica',
                      ].map((promptIdea, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendPrompt(promptIdea)}
                          disabled={isProcessingAI}
                          className="text-[11px] font-medium bg-neutral-950 hover:bg-amber-500/15 hover:border-amber-500/50 hover:text-amber-300 text-neutral-300 border border-neutral-800 px-2.5 py-1 rounded-lg transition-all text-left"
                        >
                          {promptIdea}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Messages */}
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[10px] font-bold text-neutral-400">
                          {msg.sender === 'user' ? 'Você (Admin)' : '⚡ Kowalski Studio (IA)'}
                        </span>
                        <span className="text-[9px] text-neutral-600 font-mono">{msg.timestamp}</span>
                      </div>

                      <div
                        className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-amber-500 text-neutral-950 font-semibold rounded-tr-none'
                            : 'bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-tl-none shadow-lg whitespace-pre-line'
                        }`}
                      >
                        {msg.text}

                        {msg.appliedChanges && (
                          <div className="mt-2 pt-2 border-t border-neutral-800/80 text-[10px] text-amber-300 space-y-1">
                            <span className="font-bold flex items-center gap-1 text-amber-400">
                              <Check className="h-3 w-3" /> Alteração Sincronizada no Servidor para Todos
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {isProcessingAI && (
                    <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20 max-w-sm">
                      <RefreshCw className="h-4 w-4 animate-spin text-amber-400" />
                      <span>Kowalski Studio aplicando modificações no servidor...</span>
                    </div>
                  )}

                  <div ref={chatBottomRef} />
                </div>

                {/* Prompt Input Box */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendPrompt();
                  }}
                  className="p-2 sm:p-3 bg-neutral-900 border-t border-neutral-800 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Descreva o que quer mudar no site (ex: Mude o título para..., coloque degradê neon...)"
                    className="flex-1 rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-500 focus:border-amber-500 focus:outline-none"
                    disabled={isProcessingAI}
                  />
                  <button
                    type="submit"
                    disabled={isProcessingAI || !chatInput.trim()}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-xs font-black text-neutral-950 shadow-md shadow-amber-500/20 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all shrink-0"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Mudar no Site</span>
                  </button>
                </form>
              </div>
            )}

            {/* MODE 2: EDITOR MANUAL VISUAL & INJETOR DE CÓDIGO CSS */}
            {activeMode === 'manual' && (
              <div className="flex-1 flex flex-col overflow-hidden bg-neutral-950">
                
                {/* Sub-Tabs: Visual, Banners, CSS Injetor, JSON */}
                <div className="bg-neutral-900/50 border-b border-neutral-800 px-4 py-2 flex items-center gap-1 overflow-x-auto">
                  <button
                    onClick={() => setManualSubTab('visual')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                      manualSubTab === 'visual'
                        ? 'bg-neutral-800 text-amber-400 border border-amber-500/30'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Palette className="h-3.5 w-3.5" />
                    <span>Visual & Textos</span>
                  </button>

                  <button
                    onClick={() => setManualSubTab('banners')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                      manualSubTab === 'banners'
                        ? 'bg-neutral-800 text-amber-400 border border-amber-500/30'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Megaphone className="h-3.5 w-3.5" />
                    <span>Avisos & Banners</span>
                  </button>

                  <button
                    onClick={() => setManualSubTab('css')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                      manualSubTab === 'css'
                        ? 'bg-neutral-800 text-amber-400 border border-amber-500/30'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Code2 className="h-3.5 w-3.5" />
                    <span>Injetor de Código CSS ao Vivo</span>
                  </button>

                  <button
                    onClick={() => setManualSubTab('smtp')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                      manualSubTab === 'smtp'
                        ? 'bg-neutral-800 text-amber-400 border border-amber-500/30'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Mail className="h-3.5 w-3.5" />
                    <span>Diagnóstico SMTP / E-mails</span>
                  </button>

                  <button
                    onClick={() => setManualSubTab('json')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                      manualSubTab === 'json'
                        ? 'bg-neutral-800 text-amber-400 border border-amber-500/30'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <FileCode className="h-3.5 w-3.5" />
                    <span>Configuração JSON Raw</span>
                  </button>
                </div>

                {/* Sub-Tab 1: Visual & Textos */}
                {manualSubTab === 'visual' && (
                  <form
                    onSubmit={handleSaveManualCustomization}
                    className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4"
                  >
                    {/* Live Preview Box */}
                    <div className="rounded-2xl border border-amber-500/40 bg-neutral-900/90 p-4 space-y-2 shadow-inner">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5" /> Prévia ao Vivo do Hero Banner:
                      </span>
                      
                      <div className="text-center space-y-2 py-3 bg-neutral-950/80 rounded-xl p-4 border border-neutral-800">
                        <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                          {draftTitle.includes(draftHighlight) ? (
                            <>
                              {draftTitle.split(draftHighlight)[0]}
                              <span className={`text-transparent bg-clip-text bg-gradient-to-r ${GRADIENT_MAP[draftGradient]?.classNames || 'from-amber-400 via-orange-500 to-red-500'}`}>
                                {draftHighlight}
                              </span>
                              {draftTitle.split(draftHighlight)[1]}
                            </>
                          ) : (
                            <span className={`text-transparent bg-clip-text bg-gradient-to-r ${GRADIENT_MAP[draftGradient]?.classNames || 'from-amber-400 via-orange-500 to-red-500'}`}>
                              {draftTitle}
                            </span>
                          )}
                        </h2>
                        <p className="text-xs text-neutral-400 max-w-lg mx-auto line-clamp-2">
                          {draftSubtitle}
                        </p>
                        <div className="pt-1">
                          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-xs font-black text-neutral-950 shadow">
                            {draftCta}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Título e Palavra Destaque */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2 space-y-1">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                          Título Principal da Página:
                        </label>
                        <input
                          type="text"
                          value={draftTitle}
                          onChange={(e) => setDraftTitle(e.target.value)}
                          placeholder="Ex: Domine o Freestyle & as Batalhas de Rima"
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3.5 py-2 text-xs text-white focus:border-amber-500 focus:outline-none font-semibold"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                          Palavra com Degradê:
                        </label>
                        <input
                          type="text"
                          value={draftHighlight}
                          onChange={(e) => setDraftHighlight(e.target.value)}
                          placeholder="Ex: Freestyle"
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3.5 py-2 text-xs text-amber-300 focus:border-amber-500 focus:outline-none font-bold"
                        />
                      </div>
                    </div>

                    {/* Paleta de Degradê */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                        🎨 Estilo do Degradê dos Títulos:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {Object.entries(GRADIENT_MAP).map(([key, config]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setDraftGradient(key as any)}
                            className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                              draftGradient === key
                                ? 'bg-neutral-900 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                                : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                            }`}
                          >
                            <div className={`h-4 w-4 rounded-lg shrink-0 ${config.preview}`} />
                            <span className="text-[11px] font-bold text-white truncate">
                              {config.label.split('(')[0]}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Subtítulo & Texto do Botão */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2 space-y-1">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                          Subtítulo / Descrição Inicial:
                        </label>
                        <textarea
                          value={draftSubtitle}
                          onChange={(e) => setDraftSubtitle(e.target.value)}
                          rows={2}
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-900 p-2 text-xs text-white focus:border-amber-500 focus:outline-none resize-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                          Texto do Botão Principal:
                        </label>
                        <input
                          type="text"
                          value={draftCta}
                          onChange={(e) => setDraftCta(e.target.value)}
                          placeholder="Ex: Entrar no Estúdio"
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3.5 py-2 text-xs text-white focus:border-amber-500 focus:outline-none font-bold"
                        />
                      </div>
                    </div>

                    {/* Nome da Marca & Letreiro Ticker */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                          Nome da Marca / Logo (Header):
                        </label>
                        <input
                          type="text"
                          value={draftBrandName}
                          onChange={(e) => setDraftBrandName(e.target.value)}
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3.5 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                          Subtítulo da Marca (Header):
                        </label>
                        <input
                          type="text"
                          value={draftBrandSub}
                          onChange={(e) => setDraftBrandSub(e.target.value)}
                          placeholder="Ex: Por Kowalski MC & Luquita MC"
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3.5 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Letreiro Marquee & Rodapé */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                          Texto do Letreiro Marquee (Topo):
                        </label>
                        <input
                          type="text"
                          value={draftTicker}
                          onChange={(e) => setDraftTicker(e.target.value)}
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3.5 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                          Mensagem do Rodapé (Footer):
                        </label>
                        <input
                          type="text"
                          value={draftFooterMessage}
                          onChange={(e) => setDraftFooterMessage(e.target.value)}
                          placeholder="Ex: RimaLab Academy • Transformando MCs..."
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3.5 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Submit Bar */}
                    <div className="pt-3 sticky bottom-0 bg-neutral-950 pb-2 flex items-center gap-3">
                      <button
                        type="submit"
                        disabled={isSavingGlobal}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 py-3 text-xs font-black text-neutral-950 shadow-xl shadow-amber-500/25 hover:brightness-110 active:scale-95 transition-all"
                      >
                        {isSavingGlobal ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        <span>🚀 Salvar e Publicar para Todos os Usuários</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* Sub-Tab 2: Avisos & Banners */}
                {manualSubTab === 'banners' && (
                  <form
                    onSubmit={handleSaveManualCustomization}
                    className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4"
                  >
                    {/* Banner 1: Top Bar Banner */}
                    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Megaphone className="h-4 w-4 text-amber-400" />
                          <span className="text-xs font-bold text-white">Banner Superior de Avisos (Topo Geral)</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={draftBannerEnabled}
                            onChange={(e) => setDraftBannerEnabled(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                          <span className="ml-2 text-[11px] font-bold text-neutral-300">
                            {draftBannerEnabled ? 'Ativo' : 'Desativado'}
                          </span>
                        </label>
                      </div>

                      {draftBannerEnabled && (
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 animate-in fade-in duration-150">
                          <div className="sm:col-span-3 space-y-1">
                            <label className="text-[10px] text-neutral-400 block font-bold">Mensagem do Banner:</label>
                            <input
                              type="text"
                              value={draftBannerText}
                              onChange={(e) => setDraftBannerText(e.target.value)}
                              placeholder="Texto do aviso..."
                              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-neutral-400 block font-bold">Selo/Tag:</label>
                            <input
                              type="text"
                              value={draftBannerBadge}
                              onChange={(e) => setDraftBannerBadge(e.target.value)}
                              placeholder="Ex: NOVIDADE"
                              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-amber-300 font-bold focus:border-amber-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Banner 2: Alerta Global de Destaque / Evento */}
                    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4 text-orange-400" />
                          <span className="text-xs font-bold text-white">Alerta de Evento / Torneio no Site</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={draftAlertEnabled}
                            onChange={(e) => setDraftAlertEnabled(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                          <span className="ml-2 text-[11px] font-bold text-neutral-300">
                            {draftAlertEnabled ? 'Ativo' : 'Desativado'}
                          </span>
                        </label>
                      </div>

                      {draftAlertEnabled && (
                        <div className="space-y-3 pt-1 animate-in fade-in duration-150">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[10px] text-neutral-400 block font-bold">Título do Alerta:</label>
                              <input
                                type="text"
                                value={draftAlertTitle}
                                onChange={(e) => setDraftAlertTitle(e.target.value)}
                                className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none font-bold"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-neutral-400 block font-bold">Tipo de Destaque:</label>
                              <select
                                value={draftAlertType}
                                onChange={(e) => setDraftAlertType(e.target.value as any)}
                                className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-amber-300 focus:border-amber-500 focus:outline-none font-bold"
                              >
                                <option value="hype">🔥 Hype / Torneio</option>
                                <option value="warning">⚠️ Urgente / Aviso</option>
                                <option value="info">ℹ️ Informação / Novidade</option>
                                <option value="event">🎙️ Evento / Roda de Rima</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-neutral-400 block font-bold">Mensagem Explicativa:</label>
                            <input
                              type="text"
                              value={draftAlertMessage}
                              onChange={(e) => setDraftAlertMessage(e.target.value)}
                              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-neutral-200 focus:border-amber-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Submit Bar */}
                    <div className="pt-3 sticky bottom-0 bg-neutral-950 pb-2 flex items-center gap-3">
                      <button
                        type="submit"
                        disabled={isSavingGlobal}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 py-3 text-xs font-black text-neutral-950 shadow-xl shadow-amber-500/25 hover:brightness-110 active:scale-95 transition-all"
                      >
                        {isSavingGlobal ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        <span>🚀 Salvar e Publicar Banners para Todos</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* Sub-Tab 3: Injetor de Código CSS ao Vivo */}
                {manualSubTab === 'css' && (
                  <form
                    onSubmit={handleSaveManualCustomization}
                    className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4"
                  >
                    <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl space-y-2">
                      <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                        <Terminal className="h-3.5 w-3.5" />
                        Injeção Direta de CSS no DOM do Site Inteiro:
                      </span>
                      <p className="text-[11px] text-neutral-300">
                        O código CSS abaixo é injetado diretamente na tag <code className="text-amber-400 bg-black/40 px-1 py-0.5 rounded font-mono">&lt;head&gt;</code> do site em tempo real e salvo no servidor para todos os usuários.
                      </p>
                    </div>

                    {/* Presets */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
                        ⚡ Presets Rápidos de Estilos (Clique para aplicar):
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {CSS_PRESETS.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setDraftCustomCss((prev) => `${prev ? prev + '\n\n' : ''}${preset.code}`);
                              onShowToast('Código Inserido', `${preset.name} adicionado ao editor.`);
                            }}
                            className="p-2.5 rounded-xl border border-neutral-800 bg-neutral-900/80 hover:border-amber-500/40 text-left transition-all"
                          >
                            <span className="text-xs font-bold text-white block">{preset.name}</span>
                            <span className="text-[10px] text-neutral-400 block">{preset.description}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* CSS Textarea */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                          Código CSS Personalizado:
                        </label>
                        {draftCustomCss && (
                          <button
                            type="button"
                            onClick={() => setDraftCustomCss('')}
                            className="text-[10px] text-red-400 hover:underline"
                          >
                            Limpar CSS
                          </button>
                        )}
                      </div>

                      <textarea
                        value={draftCustomCss}
                        onChange={(e) => setDraftCustomCss(e.target.value)}
                        rows={8}
                        placeholder={`/* Exemplo de CSS Customizado */\nbutton {\n  transition: all 0.2s ease;\n}\n\n.bg-neutral-950 {\n  background-color: #080808 !important;\n}`}
                        className="w-full rounded-xl border border-neutral-700 bg-neutral-950 p-3 text-xs text-amber-200 font-mono focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    {/* Submit Bar */}
                    <div className="pt-3 sticky bottom-0 bg-neutral-950 pb-2 flex items-center gap-3">
                      <button
                        type="submit"
                        disabled={isSavingGlobal}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 py-3 text-xs font-black text-neutral-950 shadow-xl shadow-amber-500/25 hover:brightness-110 active:scale-95 transition-all"
                      >
                        {isSavingGlobal ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        <span>🚀 Salvar e Injetar CSS para Todos os Usuários</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* Sub-Tab 4: Diagnóstico SMTP / E-mails */}
                {manualSubTab === 'smtp' && (
                  <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                    <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-amber-400" />
                        <h4 className="text-sm font-bold text-white">Serviço de Envio de E-mails (SMTP)</h4>
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed">
                        Este módulo gerencia o envio de notificações em tempo real para o e-mail do Administrador Master quando professores solicitam aprovação de acesso ou quando alertas de sistema são disparados.
                      </p>
                    </div>

                    {/* Environment status banner */}
                    <div className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
                        Status das Variáveis de Ambiente:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                          <span className="font-mono text-neutral-300">SMTP_USER</span>
                          <span className="font-mono text-amber-400 text-[11px]">Configurado no Servidor</span>
                        </div>
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                          <span className="font-mono text-neutral-300">Destinatário Admin</span>
                          <span className="font-mono text-emerald-400 text-[11px]">E-mail do Administrador Master</span>
                        </div>
                      </div>
                    </div>

                    {/* Test Email Trigger Card */}
                    <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900/60 space-y-3">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
                        Disparar E-mail de Teste do Servidor:
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="email"
                          value={smtpTestRecipient}
                          onChange={(e) => setSmtpTestRecipient(e.target.value)}
                          placeholder="seu.email@exemplo.com"
                          className="flex-1 rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-500 focus:border-amber-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleTestSmtp}
                          disabled={smtpTesting}
                          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-xs font-black text-neutral-950 shadow-lg hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all shrink-0"
                        >
                          {smtpTesting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          <span>{smtpTesting ? 'Testando Conexão...' : 'Enviar E-mail de Teste'}</span>
                        </button>
                      </div>

                      {/* Result Box */}
                      {smtpResult && (
                        <div
                          className={`p-3.5 rounded-xl border text-xs space-y-1.5 animate-in fade-in duration-150 ${
                            smtpResult.success
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 font-bold">
                            {smtpResult.success ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
                            )}
                            <span>{smtpResult.success ? 'E-mail Disparado com Sucesso!' : 'Diagnóstico de Configuração'}</span>
                          </div>
                          <p className="text-[11px] leading-relaxed opacity-90">
                            {smtpResult.message || (smtpResult.success ? `Mensagem entregue para ${smtpResult.recipient}` : smtpResult.error)}
                          </p>
                          {smtpResult.previewUrl && (
                            <a
                              href={smtpResult.previewUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-amber-400 underline block pt-1"
                            >
                              🔗 Ver Preview do E-mail gerado
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Sub-Tab 5: JSON Raw Config */}
                {manualSubTab === 'json' && (
                  <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                    <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl space-y-1">
                      <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                        Editor de Configuração Bruta (JSON):
                      </span>
                      <p className="text-[11px] text-neutral-300">
                        Copie ou cole a estrutura completa de configuração do site para backup ou transferências rápidas.
                      </p>
                    </div>

                    <textarea
                      value={draftRawJson}
                      onChange={(e) => setDraftRawJson(e.target.value)}
                      rows={12}
                      className="w-full rounded-xl border border-neutral-700 bg-neutral-950 p-3 text-xs text-emerald-300 font-mono focus:border-amber-500 focus:outline-none"
                    />

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleApplyRawJson}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-xs font-black text-neutral-950 shadow-lg hover:brightness-110 active:scale-95 transition-all"
                      >
                        <Check className="h-4 w-4" />
                        <span>Aplicar JSON Diretamente</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(draftRawJson);
                          onShowToast('Copiado!', 'JSON copiado para a área de transferência.');
                        }}
                        className="px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-700 text-xs font-bold text-neutral-200 hover:text-white flex items-center gap-1.5"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copiar</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
