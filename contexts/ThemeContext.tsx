import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authenticatedGet, authenticatedPatch } from '@/utils/api';
import { COLORS, FONTS } from '@/constants/Together';

interface CoupleTheme {
  themeColor: string;
  themeFont: string;
  partnerName: string;
  coupleId: string | null;
  anniversaryDate: string | null;
  inviteCode: string | null;
  hasCouple: boolean;
  refreshCouple: () => Promise<void>;
  updateTheme: (color: string, font: string) => Promise<void>;
}

const ThemeContext = createContext<CoupleTheme>({
  themeColor: COLORS.primary,
  themeFont: FONTS.regular,
  partnerName: '',
  coupleId: null,
  anniversaryDate: null,
  inviteCode: null,
  hasCouple: false,
  refreshCouple: async () => {},
  updateTheme: async () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeColor, setThemeColor] = useState(COLORS.primary);
  const [themeFont, setThemeFont] = useState(FONTS.regular);
  const [partnerName, setPartnerName] = useState('');
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [anniversaryDate, setAnniversaryDate] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [hasCouple, setHasCouple] = useState(false);

  const refreshCouple = async () => {
    try {
      const data = await authenticatedGet('/api/couples/me');
      if (data && data.id) {
        setHasCouple(true);
        setCoupleId(data.id);
        setAnniversaryDate(data.anniversary_date || null);
        setInviteCode(data.invite_code || null);
        if (data.theme_color) setThemeColor(data.theme_color);
        if (data.theme_font) setThemeFont(data.theme_font);
        if (data.partner_name) setPartnerName(data.partner_name);
      } else {
        setHasCouple(false);
      }
    } catch {
      setHasCouple(false);
    }
  };

  const updateTheme = async (color: string, font: string) => {
    setThemeColor(color);
    setThemeFont(font);
    try {
      await authenticatedPatch('/api/couples/me', { theme_color: color, theme_font: font });
    } catch (e) {
      console.error('[ThemeContext] updateTheme error:', e);
    }
  };

  useEffect(() => {
    refreshCouple();
  }, []);

  return (
    <ThemeContext.Provider value={{
      themeColor, themeFont, partnerName, coupleId,
      anniversaryDate, inviteCode, hasCouple,
      refreshCouple, updateTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
