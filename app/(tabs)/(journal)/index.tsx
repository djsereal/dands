import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
  RefreshControl,
  Pressable,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authenticatedGet, authenticatedDelete } from "@/utils/api";
import { useAppTheme } from "@/contexts/ThemeContext";
import { COLORS, JOURNAL_TYPES, TIP_CATEGORIES, formatDate } from "@/constants/Together";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Plus, Trash2, ChevronRight } from "lucide-react-native";

interface JournalEntry {
  id: string;
  type: string;
  content: string;
  created_at: string;
}

interface Tip {
  id: string;
  title: string;
  content: string;
  category: string;
  source_url?: string;
}

export default function JournalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { themeColor } = useAppTheme();
  const { width } = useWindowDimensions();

  const [activeTab, setActiveTab] = useState<"journal" | "tips">("journal");
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [tips, setTips] = useState<Tip[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const maxWidth = Math.min(width, 600);

  const loadData = useCallback(async () => {
    try {
      const [entriesData, tipsData] = await Promise.all([
        authenticatedGet<JournalEntry[]>("/api/journal").catch(() => []),
        authenticatedGet<Tip[]>(`/api/tips${selectedCategory ? `?category=${selectedCategory}` : ""}`).catch(() => []),
      ]);
      setEntries(Array.isArray(entriesData) ? entriesData : []);
      setTips(Array.isArray(tipsData) ? tipsData : []);
    } catch (e) {
      console.error("[Journal] loadData error:", e);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useFocusEffect(useCallback(() => {
    loadData();
  }, [loadData]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const loadTipsByCategory = useCallback(async (cat: string) => {
    setSelectedCategory(cat);
    try {
      const data = await authenticatedGet<Tip[]>(`/api/tips${cat ? `?category=${cat}` : ""}`);
      setTips(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("[Journal] loadTips error:", e);
    }
  }, []);

  const getJournalTypeInfo = (type: string) => {
    return JOURNAL_TYPES.find((t) => t.key === type) || { emoji: "📝", label: type };
  };

  const handleDeleteEntry = async () => {
    if (!deleteId) return;
    console.log("[Journal] Delete entry:", deleteId);
    try {
      await authenticatedDelete(`/api/journal/${deleteId}`);
      setEntries((prev) => prev.filter((e) => e.id !== deleteId));
    } catch (e) {
      console.error("[Journal] Delete error:", e);
    } finally {
      setDeleteId(null);
      setShowDeleteModal(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Header */}
      <View style={{
        backgroundColor: themeColor,
        paddingTop: insets.top + 16,
        paddingBottom: 0,
        paddingHorizontal: 20,
      }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <View>
            <Text style={{ fontSize: 28, fontWeight: "900", color: "#fff", letterSpacing: -0.5 }}>
              Journal 📖
            </Text>
            <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", marginTop: 4 }}>
              Reflect and grow together
            </Text>
          </View>
          {activeTab === "journal" && (
            <AnimatedPressable
              onPress={() => {
                console.log("[Journal] Add entry pressed");
                router.push("/(tabs)/(journal)/add-journal");
              }}
              style={{
                backgroundColor: "rgba(255,255,255,0.25)",
                borderRadius: 20,
                paddingHorizontal: 14,
                paddingVertical: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Plus size={16} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>New Entry</Text>
            </AnimatedPressable>
          )}
        </View>

        {/* Tab Switcher */}
        <View style={{ flexDirection: "row", gap: 0 }}>
          {(["journal", "tips"] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  alignItems: "center",
                  borderBottomWidth: 3,
                  borderBottomColor: isActive ? "#fff" : "transparent",
                }}
              >
                <Text style={{
                  fontSize: 15,
                  fontWeight: "700",
                  color: isActive ? "#fff" : "rgba(255,255,255,0.6)",
                }}>
                  {tab === "journal" ? "📝 Journal" : "💡 Tips"}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={themeColor} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 100, maxWidth, alignSelf: "center", width: "100%" }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColor} />}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === "journal" ? (
            entries.length === 0 ? (
              <View style={{ alignItems: "center", paddingTop: 60 }}>
                <Text style={{ fontSize: 60, marginBottom: 16 }}>📖</Text>
                <Text style={{ fontSize: 20, fontWeight: "800", color: COLORS.text, textAlign: "center" }}>
                  No journal entries yet
                </Text>
                <Text style={{ fontSize: 15, color: COLORS.textSecondary, textAlign: "center", marginTop: 8, lineHeight: 22 }}>
                  Start reflecting on your relationship journey 💕
                </Text>
                <AnimatedPressable
                  onPress={() => router.push("/(tabs)/(journal)/add-journal")}
                  style={{
                    marginTop: 24,
                    backgroundColor: themeColor,
                    borderRadius: 16,
                    paddingVertical: 14,
                    paddingHorizontal: 28,
                    boxShadow: `0 4px 16px ${themeColor}40`,
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Write First Entry 💕</Text>
                </AnimatedPressable>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {entries.map((entry) => {
                  const typeInfo = getJournalTypeInfo(entry.type);
                  const dateText = formatDate(entry.created_at);
                  return (
                    <View
                      key={entry.id}
                      style={{
                        backgroundColor: COLORS.surface,
                        borderRadius: 16,
                        padding: 16,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        flexDirection: "row",
                        alignItems: "flex-start",
                        gap: 12,
                      }}
                    >
                      <View style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: `${themeColor}15`,
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        <Text style={{ fontSize: 22 }}>{typeInfo.emoji}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                          <Text style={{ fontSize: 13, fontWeight: "700", color: themeColor }}>
                            {typeInfo.label}
                          </Text>
                          <Text style={{ fontSize: 11, color: COLORS.textMuted }}>{dateText}</Text>
                        </View>
                        <Text style={{ fontSize: 14, color: COLORS.text, lineHeight: 20 }} numberOfLines={3}>
                          {entry.content}
                        </Text>
                      </View>
                      <AnimatedPressable
                        onPress={() => {
                          setDeleteId(entry.id);
                          setShowDeleteModal(true);
                        }}
                        style={{ padding: 4 }}
                      >
                        <Trash2 size={16} color={COLORS.textMuted} />
                      </AnimatedPressable>
                    </View>
                  );
                })}
              </View>
            )
          ) : (
            <View>
              {/* Category Filter */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {TIP_CATEGORIES.map((cat) => {
                    const isActive = selectedCategory === cat.key;
                    return (
                      <AnimatedPressable
                        key={cat.key}
                        onPress={() => {
                          console.log("[Journal] Category filter:", cat.key);
                          loadTipsByCategory(cat.key);
                        }}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          borderRadius: 20,
                          backgroundColor: isActive ? themeColor : COLORS.surface,
                          borderWidth: 1.5,
                          borderColor: isActive ? themeColor : COLORS.border,
                        }}
                      >
                        <Text style={{
                          fontSize: 13,
                          fontWeight: "700",
                          color: isActive ? "#fff" : COLORS.textSecondary,
                        }}>
                          {cat.label}
                        </Text>
                      </AnimatedPressable>
                    );
                  })}
                </View>
              </ScrollView>

              {tips.length === 0 ? (
                <View style={{ alignItems: "center", paddingTop: 40 }}>
                  <Text style={{ fontSize: 40, marginBottom: 12 }}>💡</Text>
                  <Text style={{ fontSize: 16, color: COLORS.textSecondary, textAlign: "center" }}>
                    No tips found for this category
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  {tips.map((tip) => (
                    <AnimatedPressable
                      key={tip.id}
                      onPress={() => {
                        console.log("[Journal] Tip pressed:", tip.id);
                        router.push({ pathname: "/(tabs)/(journal)/tip-detail", params: { id: tip.id } });
                      }}
                      style={{
                        backgroundColor: COLORS.surface,
                        borderRadius: 16,
                        padding: 16,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <View style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: `${themeColor}15`,
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        <Text style={{ fontSize: 22 }}>💡</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: "700", color: COLORS.text, marginBottom: 4 }}>
                          {tip.title}
                        </Text>
                        <Text style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 }} numberOfLines={2}>
                          {tip.content}
                        </Text>
                        {tip.category ? (
                          <View style={{
                            marginTop: 8,
                            backgroundColor: `${themeColor}15`,
                            borderRadius: 8,
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            alignSelf: "flex-start",
                          }}>
                            <Text style={{ fontSize: 11, fontWeight: "700", color: themeColor, textTransform: "capitalize" }}>
                              {tip.category}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <ChevronRight size={18} color={COLORS.textMuted} />
                    </AnimatedPressable>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <View style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center", alignItems: "center", padding: 24,
        }}>
          <View style={{ backgroundColor: COLORS.surface, borderRadius: 24, padding: 28, width: "100%", maxWidth: 360 }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: COLORS.text, textAlign: "center", marginBottom: 8 }}>
              Delete Entry?
            </Text>
            <Text style={{ fontSize: 15, color: COLORS.textSecondary, textAlign: "center", marginBottom: 24, lineHeight: 22 }}>
              This journal entry will be permanently deleted.
            </Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <AnimatedPressable
                onPress={() => { setShowDeleteModal(false); setDeleteId(null); }}
                style={{ flex: 1, backgroundColor: COLORS.surfaceAlt, borderRadius: 14, paddingVertical: 13, alignItems: "center" }}
              >
                <Text style={{ fontWeight: "700", color: COLORS.text }}>Cancel</Text>
              </AnimatedPressable>
              <AnimatedPressable
                onPress={handleDeleteEntry}
                style={{ flex: 1, backgroundColor: COLORS.error, borderRadius: 14, paddingVertical: 13, alignItems: "center" }}
              >
                <Text style={{ fontWeight: "700", color: "#fff" }}>Delete</Text>
              </AnimatedPressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
