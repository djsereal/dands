import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authenticatedGet, authenticatedPatch } from '@/utils/api';
import { COLORS, FONTS } from '@/constants/Together';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user, loading: authLoading } = useAuth();
  const [themeColor, setThemeColor] = useState(COLORS.primary);
  const [themeFont, setThemeFont] = useState(FONTS.regular);
  const [partnerName, setPartnerName] = useState('');
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [anniversaryDate, setAnniversaryDate] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [hasCouple, setHasCouple] = useState(false);

  const refreshCouple = async () => {
    // Don't attempt to fetch couple data if not authenticated
    if (!user) {
      setHasCouple(false);
      setCoupleId(null);
      setAnniversaryDate(null);
      setInviteCode(null);
      return;
    }
    console.log('[ThemeContext] Refreshing couple data for user:', user.id);
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
        console.log('[ThemeContext] Couple loaded, id:', data.id, 'hasCouple: true');
      } else {
        setHasCouple(false);
        console.log('[ThemeContext] No couple found for user');
      }
    } catch (e) {
      console.error('[ThemeContext] refreshCouple error:', e);
      setHasCouple(false);
    }
  };

  const updateTheme = async (color: string, font: string) => {
    console.log('[ThemeContext] Updating theme, color:', color, 'font:', font);
    setThemeColor(color);
    setThemeFont(font);
    // Note: the caller (settings.tsx) is responsible for the API call via authenticatedPatch
    // This function only updates local state to avoid double-patching
  };

  // Fetch couple data whenever auth state changes (user logs in/out)
  useEffect(() => {
    if (!authLoading) {
      refreshCouple();
    }
  }, [user, authLoading]);

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
