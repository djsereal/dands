import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Animated,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { useAppTheme } from "@/contexts/ThemeContext";
import { authenticatedGet } from "@/utils/api";
import { COLORS, MOODS, formatDate, daysAgo } from "@/constants/Together";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import {
  Settings,
  Plus,
  Sparkles,
} from "lucide-react-native";

interface Mood {
  id: string;
  mood: string;
  note?: string;
  created_at: string;
  user_id: string;
}

interface Tip {
  id: string;
  title: string;
  content: string;
  category: string;
}

function DaysCounter({ days, color }: { days: number; color: string }) {
  const animVal = useRef(new Animated.Value(0)).current;
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    animVal.setValue(0);
    Animated.timing(animVal, {
      toValue: days,
      duration: 1500,
      useNativeDriver: false,
    }).start();
    const listener = animVal.addListener(({ value }) => {
      setDisplayed(Math.floor(value));
    });
    return () => animVal.removeListener(listener);
  }, [days]);

  const displayedStr = displayed.toLocaleString();

  return (
    <Text
      style={{
        fontSize: 72,
        fontWeight: "900",
        color,
        letterSpacing: -2,
        fontVariant: ["tabular-nums"],
        lineHeight: 80,
      }}
    >
      {displayedStr}
    </Text>
  );
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { themeColor, hasCouple, anniversaryDate, refreshCouple } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [moods, setMoods] = useState<Mood[]>([]);
  const [tip, setTip] = useState<Tip | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const days = anniversaryDate ? daysAgo(anniversaryDate) : 0;
  const anniversaryFormatted = anniversaryDate ? formatDate(anniversaryDate) : null;

  const loadData = useCallback(async () => {
    try {
      const [moodsData, tipsData] = await Promise.all([
        authenticatedGet<Mood[]>("/api/moods").catch(() => []),
        authenticatedGet<Tip[]>("/api/tips").catch(() => []),
      ]);
      setMoods(Array.isArray(moodsData) ? moodsData.slice(0, 4) : []);
      const tips = Array.isArray(tipsData) ? tipsData : [];
      if (tips.length > 0) {
        setTip(tips[Math.floor(Math.random() * tips.length)]);
      }
    } catch (e) {
      console.error("[Home] loadData error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshCouple(), loadData()]);
    setRefreshing(false);
  }, [refreshCouple, loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getMoodEmoji = (moodKey: string) => {
    const found = MOODS.find((m) => m.key === moodKey);
    return found ? found.emoji : "😊";
  };

  const quickActions = [
    { label: "Log Mood", emoji: "😊", route: "/(tabs)/(connect)/log-mood", color: "#FF6B9D" },
    { label: "Memory", emoji: "📸", route: "/(tabs)/(memories)/add-memory", color: "#FF9E7D" },
    { label: "Vent", emoji: "💬", route: "/(tabs)/(connect)/add-vent", color: "#A78BFA" },
    { label: "Activity", emoji: "✨", route: "/(tabs)/(connect)/add-activity", color: "#60A5FA" },
  ];

  const maxWidth = Math.min(width, 600);
  const welcomeName = user?.name ? user.name.split(" ")[0] : null;
  const welcomeText = welcomeName ? `Welcome back, ${welcomeName}` : "Welcome back";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColor} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Header */}
      <View
        style={{
          backgroundColor: themeColor,
          paddingTop: insets.top + 16,
          paddingBottom: 32,
          paddingHorizontal: 24,
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
          alignSelf: "center",
          width: "100%",
          maxWidth,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 32, fontWeight: "900", color: "#fff", letterSpacing: -0.5 }}>
              Together 💕
            </Text>
            <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", marginTop: 4, fontWeight: "500" }}>
              {welcomeText}
            </Text>
          </View>
          <AnimatedPressable
            onPress={() => {
              console.log("[Home] Settings pressed");
              router.push("/(tabs)/(home)/settings");
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.25)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Settings size={20} color="#fff" />
          </AnimatedPressable>
        </View>

        {/* Days Together Counter */}
        {hasCouple && anniversaryDate ? (
          <View style={{ marginTop: 20, alignItems: "center" }}>
            <DaysCounter days={days} color="#fff" />
            <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.9)", fontWeight: "600", marginTop: 4 }}>
              days together
            </Text>
            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 4 }}>
              Since {anniversaryFormatted}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={{ paddingHorizontal: 20, maxWidth, alignSelf: "center", width: "100%" }}>
        {/* No Couple Onboarding */}
        {!hasCouple && (
          <View
            style={{
              marginTop: 20,
              backgroundColor: COLORS.surface,
              borderRadius: 20,
              padding: 24,
              alignItems: "center",
              boxShadow: COLORS.cardShadow,
            }}
          >
            <Text style={{ fontSize: 40, marginBottom: 12 }}>💑</Text>
            <Text style={{ fontSize: 20, fontWeight: "800", color: COLORS.text, textAlign: "center" }}>
              Start Your Love Story
            </Text>
            <Text style={{ fontSize: 14, color: COLORS.textSecondary, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
              Create a couple profile or join your partner to start tracking your journey together.
            </Text>
            <AnimatedPressable
              onPress={() => {
                console.log("[Home] Setup couple pressed");
                router.push("/(tabs)/(home)/couple-setup");
              }}
              style={{
                marginTop: 20,
                backgroundColor: themeColor,
                borderRadius: 16,
                paddingVertical: 14,
                paddingHorizontal: 32,
                boxShadow: `0 4px 16px ${themeColor}40`,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                Get Started 💕
              </Text>
            </AnimatedPressable>
          </View>
        )}

        {/* Quick Actions */}
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: "800", color: COLORS.text, marginBottom: 12 }}>
            Quick Actions
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {quickActions.map((action) => (
              <AnimatedPressable
                key={action.label}
                onPress={() => {
                  console.log("[Home] Quick action pressed:", action.label);
                  router.push(action.route as any);
                }}
                style={{
                  flex: 1,
                  backgroundColor: COLORS.surface,
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  borderWidth: 1,
                  borderColor: COLORS.borderLight,
                }}
              >
                <Text style={{ fontSize: 24 }}>{action.emoji}</Text>
                <Text style={{ fontSize: 11, fontWeight: "700", color: COLORS.textSecondary, textAlign: "center" }}>
                  {action.label}
                </Text>
              </AnimatedPressable>
            ))}
          </View>
        </View>

        {/* Mood Summary */}
        {moods.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: COLORS.text }}>
                Recent Moods
              </Text>
              <AnimatedPressable onPress={() => router.push("/(tabs)/(connect)" as any)}>
                <Text style={{ fontSize: 13, color: themeColor, fontWeight: "600" }}>See all</Text>
              </AnimatedPressable>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {moods.slice(0, 3).map((mood) => (
                <View
                  key={mood.id}
                  style={{
                    flex: 1,
                    backgroundColor: COLORS.surface,
                    borderRadius: 14,
                    padding: 14,
                    alignItems: "center",
                    gap: 4,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  }}
                >
                  <Text style={{ fontSize: 28 }}>{getMoodEmoji(mood.mood)}</Text>
                  <Text style={{ fontSize: 11, fontWeight: "600", color: COLORS.textSecondary, textTransform: "capitalize" }}>
                    {mood.mood}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Tip of the Day */}
        {tip && (
          <View
            style={{
              marginTop: 20,
              backgroundColor: COLORS.surface,
              borderRadius: 20,
              padding: 20,
              boxShadow: COLORS.cardShadow,
              borderLeftWidth: 4,
              borderLeftColor: themeColor,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Sparkles size={18} color={themeColor} />
              <Text style={{ fontSize: 13, fontWeight: "700", color: themeColor, textTransform: "uppercase", letterSpacing: 0.8 }}>
                Tip of the Day
              </Text>
            </View>
            <Text style={{ fontSize: 16, fontWeight: "700", color: COLORS.text, marginBottom: 6 }}>
              {tip.title}
            </Text>
            <Text style={{ fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 }}>
              {tip.content}
            </Text>
          </View>
        )}

        {loading && (
          <View style={{ marginTop: 40, alignItems: "center" }}>
            <ActivityIndicator color={themeColor} size="large" />
          </View>
        )}
      </View>
    </ScrollView>
  );
}
