import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
  RefreshControl,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authenticatedGet } from "@/utils/api";
import { useAppTheme } from "@/contexts/ThemeContext";
import { COLORS, formatDate } from "@/constants/Together";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Plus, Star, Sparkles, Lock } from "lucide-react-native";

interface SatisfactionLog {
  id: string;
  rating: number;
  note?: string;
  created_at: string;
}

interface Fantasy {
  id: string;
  content: string;
  is_anonymous: boolean;
  created_at: string;
}

interface AISuggestion {
  title: string;
  description: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={16}
          color={star <= rating ? "#FBBF24" : COLORS.border}
          fill={star <= rating ? "#FBBF24" : "transparent"}
        />
      ))}
    </View>
  );
}

export default function IntimacyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [logs, setLogs] = useState<SatisfactionLog[]>([]);
  const [fantasies, setFantasies] = useState<Fantasy[]>([]);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const maxWidth = Math.min(width, 600);

  const loadData = useCallback(async () => {
    try {
      const [logsData, fantasiesData] = await Promise.all([
        authenticatedGet<SatisfactionLog[]>("/api/intimacy/logs").catch(() => []),
        authenticatedGet<Fantasy[]>("/api/intimacy/fantasies").catch(() => []),
      ]);
      setLogs(Array.isArray(logsData) ? logsData.slice(0, 5) : []);
      setFantasies(Array.isArray(fantasiesData) ? fantasiesData.slice(0, 5) : []);
    } catch (e) {
      console.error("[Intimacy] loadData error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadData();
  }, [loadData]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleGetSuggestions = async () => {
    console.log("[Intimacy] Get AI suggestions pressed");
    setAiLoading(true);
    try {
      const data = await authenticatedGet<AISuggestion[]>("/api/intimacy/ai-suggestions");
      setSuggestions(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("[Intimacy] AI suggestions error:", e);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F0FF" }}>
      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={COLORS.accent} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 60, maxWidth, alignSelf: "center", width: "100%" }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Card */}
          <View style={{
            backgroundColor: COLORS.accent,
            borderRadius: 24,
            padding: 24,
            alignItems: "center",
            marginBottom: 24,
            boxShadow: "0 8px 24px rgba(167,139,250,0.35)",
          }}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>💜</Text>
            <Text style={{ fontSize: 22, fontWeight: "900", color: "#fff", textAlign: "center" }}>
              Intimacy Hub
            </Text>
            <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", textAlign: "center", marginTop: 6, lineHeight: 20 }}>
              A private, safe space for your intimate connection
            </Text>
          </View>

          {/* Satisfaction Logs */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: COLORS.text }}>
                ⭐ Satisfaction Log
              </Text>
              <AnimatedPressable
                onPress={() => {
                  console.log("[Intimacy] Log satisfaction pressed");
                  router.push("/log-satisfaction");
                }}
                style={{
                  backgroundColor: COLORS.accent,
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Plus size={14} color="#fff" />
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>Log</Text>
              </AnimatedPressable>
            </View>

            {logs.length === 0 ? (
              <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, alignItems: "center" }}>
                <Text style={{ fontSize: 13, color: COLORS.textSecondary }}>
                  No logs yet. Start tracking your intimate connection 💜
                </Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {logs.map((log) => {
                  const dateText = formatDate(log.created_at);
                  return (
                    <View
                      key={log.id}
                      style={{
                        backgroundColor: "#fff",
                        borderRadius: 16,
                        padding: 16,
                        boxShadow: "0 2px 8px rgba(167,139,250,0.1)",
                      }}
                    >
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <StarRating rating={log.rating} />
                        <Text style={{ fontSize: 11, color: COLORS.textMuted }}>{dateText}</Text>
                      </View>
                      {log.note ? (
                        <Text style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 }}>
                          {log.note}
                        </Text>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Fantasies */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: COLORS.text }}>
                💭 Shared Fantasies
              </Text>
              <AnimatedPressable
                onPress={() => {
                  console.log("[Intimacy] Add fantasy pressed");
                  router.push("/add-fantasy");
                }}
                style={{
                  backgroundColor: COLORS.accentLight,
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Plus size={14} color={COLORS.accent} />
                <Text style={{ color: COLORS.accent, fontWeight: "700", fontSize: 13 }}>Share</Text>
              </AnimatedPressable>
            </View>

            {fantasies.length === 0 ? (
              <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, alignItems: "center" }}>
                <Text style={{ fontSize: 13, color: COLORS.textSecondary }}>
                  No fantasies shared yet. Be the first to share 💜
                </Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {fantasies.map((fantasy) => {
                  const dateText = formatDate(fantasy.created_at);
                  const isAnon = fantasy.is_anonymous;
                  return (
                    <View
                      key={fantasy.id}
                      style={{
                        backgroundColor: "#fff",
                        borderRadius: 16,
                        padding: 16,
                        boxShadow: "0 2px 8px rgba(167,139,250,0.1)",
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                        {isAnon ? (
                          <>
                            <Lock size={12} color={COLORS.accent} />
                            <Text style={{ fontSize: 12, fontWeight: "700", color: COLORS.accent }}>
                              Anonymous 💜
                            </Text>
                          </>
                        ) : null}
                        <Text style={{ fontSize: 11, color: COLORS.textMuted, marginLeft: "auto" }}>
                          {dateText}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 14, color: COLORS.text, lineHeight: 20 }}>
                        {fantasy.content}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* AI Suggestions */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: COLORS.text, marginBottom: 12 }}>
              ✨ AI Suggestions
            </Text>

            <AnimatedPressable
              onPress={handleGetSuggestions}
              disabled={aiLoading}
              style={{
                backgroundColor: COLORS.accent,
                borderRadius: 16,
                paddingVertical: 14,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
                marginBottom: 16,
                boxShadow: "0 4px 16px rgba(167,139,250,0.4)",
              }}
            >
              {aiLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Sparkles size={18} color="#fff" />
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
                    Get AI Suggestions ✨
                  </Text>
                </>
              )}
            </AnimatedPressable>

            {suggestions.length > 0 && (
              <View style={{ gap: 12 }}>
                {suggestions.map((suggestion, index) => (
                  <View
                    key={index}
                    style={{
                      backgroundColor: "#fff",
                      borderRadius: 16,
                      padding: 16,
                      borderLeftWidth: 4,
                      borderLeftColor: COLORS.accent,
                      boxShadow: "0 2px 8px rgba(167,139,250,0.1)",
                    }}
                  >
                    <Text style={{ fontSize: 15, fontWeight: "700", color: COLORS.text, marginBottom: 6 }}>
                      {suggestion.title}
                    </Text>
                    <Text style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 }}>
                      {suggestion.description}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
