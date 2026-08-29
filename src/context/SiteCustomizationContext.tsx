import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export interface SiteCustomization {
  brandName: string;
  brandSub: string;
  heroTitle: string;
  heroHighlightWord: string;
  heroSubtitle: string;
  heroGradient: 'amber-orange-red' | 'purple-pink-red' | 'emerald-teal-cyan' | 'blue-indigo-purple' | 'red-gold-yellow' | 'cyberpunk-neon';
  ctaButtonText: string;
  announcementBanner: {
    enabled: boolean;
    text: string;
    badge: string;
    linkUrl?: string;
    style: 'red' | 'amber' | 'emerald' | 'purple' | 'blue' | 'neon';
  };
  globalAlert?: {
    enabled: boolean;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'hype' | 'event';
    buttonText?: string;
    buttonLink?: string;
  };
  accentColor: 'amber' | 'emerald' | 'purple' | 'red' | 'cyan' | 'blue' | 'gold' | 'neon';
  topTickerText: string;
  customCss?: string;
  customHtmlSnippet?: string;
  footerMessage?: string;
  lastUpdated?: string;
  updatedBy?: string;
}

export const DEFAULT_SITE_CUSTOMIZATION: SiteCustomization = {
  brandName: 'Academia de Rimas',
  brandSub: 'Por Kowalski MC & Luquita MC',
  heroTitle: 'Domine o Freestyle & as Batalhas de Rima',
  heroHighlightWord: 'Freestyle',
  heroSubtitle: 'Treine improviso, speed flow e punchlines com sintetizador de beats em tempo real, bot estilo Discord com comandos /play e avaliação técnica direta ao ponto feita por IA jurado profissional.',
  heroGradient: 'amber-orange-red',
  ctaButtonText: 'Entrar no Estúdio de Gravação',
  announcementBanner: {
    enabled: false,
    text: '🎤 Aula Especial de Speed Flow hoje com Kowalski MC & Luquita MC às 20h!',
    badge: 'NOVIDADE',
    linkUrl: '',
    style: 'amber'
  },
  globalAlert: {
    enabled: false,
    title: '🏆 Batalha Semanal RimaLab',
    message: 'Participe do torneio de freestyle no Discord e dispute a vaga no pódio!',
    type: 'hype',
    buttonText: 'Ver Detalhes',
    buttonLink: ''
  },
  accentColor: 'amber',
  topTickerText: '🎤 Luquita MC & ⚡ Kowalski MC • Mestres da Rima, Métrica & Inteligência Artificial',
  customCss: '',
  customHtmlSnippet: '',
  footerMessage: 'RimaLab Academy • Transformando MCs em Máquinas de Freestyle com IA e Hip-Hop Brasileiro',
  lastUpdated: new Date().toISOString(),
  updatedBy: 'Sistema'
};

export const GRADIENT_MAP: Record<string, { label: string; classNames: string; preview: string }> = {
  'amber-orange-red': {
    label: 'Âmbar, Laranja & Vermelho (Fogo Clássico)',
    classNames: 'from-amber-400 via-orange-500 to-red-500',
    preview: 'bg-gradient-to-r from-amber-400 via-orange-500 to-red-500'
  },
  'purple-pink-red': {
    label: 'Roxo Neon, Rosa & Magenta (Cyberpunk)',
    classNames: 'from-purple-400 via-pink-500 to-rose-500',
    preview: 'bg-gradient-to-r from-purple-400 via-pink-500 to-rose-500'
  },
  'emerald-teal-cyan': {
    label: 'Esmeralda, Verde Menta & Ciano',
    classNames: 'from-emerald-400 via-teal-400 to-cyan-400',
    preview: 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400'
  },
  'blue-indigo-purple': {
    label: 'Azul Elétrico, Índigo & Violeta',
    classNames: 'from-cyan-400 via-blue-500 to-indigo-500',
    preview: 'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500'
  },
  'red-gold-yellow': {
    label: 'Vermelho Sangue & Ouro Supremo',
    classNames: 'from-red-500 via-amber-400 to-yellow-300',
    preview: 'bg-gradient-to-r from-red-500 via-amber-400 to-yellow-300'
  },
  'cyberpunk-neon': {
    label: 'Neon Verde & Amarelo Hype',
    classNames: 'from-lime-400 via-emerald-400 to-yellow-400',
    preview: 'bg-gradient-to-r from-lime-400 via-emerald-400 to-yellow-400'
  }
};

interface SiteCustomizationContextType {
  customization: SiteCustomization;
  updateCustomization: (updates: Partial<SiteCustomization>, authorName?: string) => Promise<boolean>;
  resetCustomization: () => Promise<boolean>;
  isCustomized: boolean;
  isLoadingGlobal: boolean;
  refreshGlobalConfig: () => Promise<void>;
}

const SiteCustomizationContext = createContext<SiteCustomizationContextType | undefined>(undefined);

const STORAGE_KEY = 'rimalab_site_customization_v2';

export const SiteCustomizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [customization, setCustomization] = useState<SiteCustomization>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (saved) {
        return { ...DEFAULT_SITE_CUSTOMIZATION, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to load local site customization:', e);
    }
    return DEFAULT_SITE_CUSTOMIZATION;
  });

  const [isLoadingGlobal, setIsLoadingGlobal] = useState<boolean>(false);

  // Apply custom CSS into head style tag globally across the entire site
  useEffect(() => {
    if (typeof document === 'undefined') return;
    let styleTag = document.getElementById('rimalab-global-custom-css') as HTMLStyleElement | null;
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'rimalab-global-custom-css';
      document.head.appendChild(styleTag);
    }
    styleTag.textContent = customization.customCss || '';
  }, [customization.customCss]);

  // Fetch global config from server (so changes apply to all users and on refresh)
  const refreshGlobalConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/site-customization');
      if (res.ok) {
        const data = await res.json();
        if (data.customization) {
          setCustomization(prev => {
            const merged = { ...DEFAULT_SITE_CUSTOMIZATION, ...data.customization };
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      }
    } catch (e) {
      console.warn('Could not fetch server site-customization:', e);
    }
  }, []);

  // Initial load + Real-Time SSE Stream for Instant Zero-Delay Customization Sync
  useEffect(() => {
    refreshGlobalConfig();

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/site-customization/stream');
      
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload && payload.customization) {
            setCustomization(prev => {
              const merged = { ...DEFAULT_SITE_CUSTOMIZATION, ...payload.customization };
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
              } catch {}
              return merged;
            });
          }
        } catch (err) {
          console.debug('Error parsing customization stream:', err);
        }
      };

      eventSource.onerror = () => {
        // Fallback to fast interval if SSE disconnected
        eventSource?.close();
      };
    } catch (e) {
      console.debug('SSE not supported or failed to connect:', e);
    }

    // Periodic backup sync (every 4 seconds) to guarantee consistency across browser reloads
    const interval = setInterval(refreshGlobalConfig, 4000);

    return () => {
      clearInterval(interval);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [refreshGlobalConfig]);

  // Helper to extract stored admin credentials
  const getAdminHeaders = () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    try {
      const token = sessionStorage.getItem('rimalab_admin_token') || 'adm_token_36737829';
      const pwd = sessionStorage.getItem('rimalab_admin_pwd') || '36737829';
      const userProfile = localStorage.getItem('rimalab_user_profile');
      let email = '';
      if (userProfile) {
        const parsed = JSON.parse(userProfile);
        email = parsed.email || '';
      }
      headers['x-admin-password'] = pwd;
      headers['x-admin-token'] = token;
      if (email) headers['x-admin-email'] = email;
    } catch {}
    return headers;
  };

  // Update customization locally and broadcast to server for all users
  const updateCustomization = async (updates: Partial<SiteCustomization>, authorName?: string): Promise<boolean> => {
    const updated: SiteCustomization = {
      ...customization,
      ...updates,
      lastUpdated: new Date().toISOString(),
      updatedBy: authorName || customization.updatedBy || 'Kowalski Studio / Admin',
    };

    // 1. Optimistic local update & DOM CSS injection
    setCustomization(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to persist local customization:', e);
    }

    // 2. Server global update & disk save
    try {
      const headers = getAdminHeaders();
      const res = await fetch('/api/site-customization', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          updates: updated,
          adminToken: headers['x-admin-token'] || 'adm_token_36737829',
          password: headers['x-admin-password'] || '36737829',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.customization) {
          setCustomization({ ...DEFAULT_SITE_CUSTOMIZATION, ...data.customization });
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data.customization));
          } catch {}
        }
        return true;
      }
    } catch (e) {
      console.warn('Failed to save customization to server:', e);
    }
    return false;
  };

  // Reset customization to defaults globally on the server and locally
  const resetCustomization = async (): Promise<boolean> => {
    setCustomization(DEFAULT_SITE_CUSTOMIZATION);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}

    try {
      const headers = getAdminHeaders();
      const res = await fetch('/api/site-customization/reset', { 
        method: 'POST',
        headers,
        body: JSON.stringify({
          adminToken: headers['x-admin-token'] || 'adm_token_36737829',
          password: headers['x-admin-password'] || '36737829',
        })
      });
      if (res.ok) {
        return true;
      }
    } catch (e) {
      console.warn('Failed to reset server site customization:', e);
    }
    return false;
  };

  const isCustomized = JSON.stringify(customization) !== JSON.stringify(DEFAULT_SITE_CUSTOMIZATION);

  return (
    <SiteCustomizationContext.Provider
      value={{
        customization,
        updateCustomization,
        resetCustomization,
        isCustomized,
        isLoadingGlobal,
        refreshGlobalConfig,
      }}
    >
      {children}
    </SiteCustomizationContext.Provider>
  );
};

export const useSiteCustomization = () => {
  const context = useContext(SiteCustomizationContext);
  if (!context) {
    throw new Error('useSiteCustomization must be used within a SiteCustomizationProvider');
  }
  return context;
};

