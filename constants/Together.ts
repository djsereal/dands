export const COLORS = {
  primary: '#FF6B9D',
  secondary: '#FF9E7D',
  accent: '#A78BFA',
  accentLight: '#C4B5FD',
  background: '#FFF5F8',
  surface: '#FFFFFF',
  surfaceAlt: '#FFF0F5',
  text: '#2D1B33',
  textSecondary: '#8B6B7A',
  textMuted: '#C4A0B0',
  border: 'rgba(255, 107, 157, 0.15)',
  borderLight: 'rgba(255, 107, 157, 0.08)',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  gradientStart: '#FF6B9D',
  gradientMid: '#FF9E7D',
  gradientEnd: '#A78BFA',
  cardShadow: '0 4px 16px rgba(255, 107, 157, 0.15)',
  cardShadowStrong: '0 8px 24px rgba(255, 107, 157, 0.25)',
};

export const MOODS = [
  { key: 'happy', emoji: '😊', label: 'Happy' },
  { key: 'loved', emoji: '💕', label: 'Loved' },
  { key: 'anxious', emoji: '😰', label: 'Anxious' },
  { key: 'sad', emoji: '😢', label: 'Sad' },
  { key: 'angry', emoji: '😠', label: 'Angry' },
  { key: 'grateful', emoji: '🙏', label: 'Grateful' },
  { key: 'excited', emoji: '🎉', label: 'Excited' },
  { key: 'tired', emoji: '😴', label: 'Tired' },
];

export const MEMORY_PROMPTS = [
  'First date',
  'Our home',
  'A silly moment',
  'Date night',
  'Travel together',
  'Morning routine',
  'Favorite meal together',
  'A hard day we got through',
];

export const JOURNAL_TYPES = [
  { key: 'reflection', emoji: '🪞', label: 'Reflection' },
  { key: 'gratitude', emoji: '🙏', label: 'Gratitude' },
  { key: 'hard_time', emoji: '🌧️', label: 'Hard Time' },
  { key: 'good_time', emoji: '☀️', label: 'Good Time' },
];

export const TIP_CATEGORIES = [
  { key: '', label: 'All' },
  { key: 'communication', label: 'Communication' },
  { key: 'intimacy', label: 'Intimacy' },
  { key: 'trust', label: 'Trust' },
  { key: 'fun', label: 'Fun' },
  { key: 'growth', label: 'Growth' },
];

export const THEME_COLORS = [
  '#FF6B9D', '#FF9E7D', '#A78BFA', '#60A5FA',
  '#34D399', '#FBBF24', '#F87171', '#FB923C',
  '#E879F9', '#38BDF8', '#4ADE80', '#F472B6',
];

export const THEME_FONTS = [
  { key: 'Nunito', label: 'Nunito', preview: 'Our Love Story' },
  { key: 'Playfair', label: 'Playfair Display', preview: 'Our Love Story' },
  { key: 'Quicksand', label: 'Quicksand', preview: 'Our Love Story' },
  { key: 'Lobster', label: 'Lobster', preview: 'Our Love Story' },
  { key: 'Pacifico', label: 'Pacifico', preview: 'Our Love Story' },
];

export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function daysAgo(dateStr: string | undefined | null): number {
  if (!dateStr) return 0;
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}
