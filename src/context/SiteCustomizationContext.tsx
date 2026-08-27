import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
    style: 'red' | 'amber' | 'emerald' | 'purple' | 'blue';
  };
  accentColor: 'amber' | 'emerald' | 'purple' | 'red' | 'cyan' | 'blue';
  topTickerText: string;
  lastUpdated?: string;
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
  accentColor: 'amber',
  topTickerText: '🎤 Luquita MC & ⚡ Kowalski MC • Mestres da Rima, Métrica & Inteligência Artificial',
  lastUpdated: new Date().toISOString()
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
  updateCustomization: (updates: Partial<SiteCustomization>) => void;
  resetCustomization: () => void;
  isCustomized: boolean;
}

const SiteCustomizationContext = createContext<SiteCustomizationContextType | undefined>(undefined);

const STORAGE_KEY = 'rimalab_site_customization_v1';

export const SiteCustomizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [customization, setCustomization] = useState<SiteCustomization>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_SITE_CUSTOMIZATION, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to load site customization:', e);
    }
    return DEFAULT_SITE_CUSTOMIZATION;
  });

  const updateCustomization = (updates: Partial<SiteCustomization>) => {
    setCustomization((prev) => {
      const updated: SiteCustomization = {
        ...prev,
        ...updates,
        lastUpdated: new Date().toISOString(),
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to persist site customization:', e);
      }
      return updated;
    });
  };

  const resetCustomization = () => {
    setCustomization(DEFAULT_SITE_CUSTOMIZATION);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  };

  const isCustomized = JSON.stringify(customization) !== JSON.stringify(DEFAULT_SITE_CUSTOMIZATION);

  return (
    <SiteCustomizationContext.Provider
      value={{
        customization,
        updateCustomization,
        resetCustomization,
        isCustomized,
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
