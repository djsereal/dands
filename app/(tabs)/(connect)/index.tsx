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
import { authenticatedGet, authenticatedDelete } from "@/utils/api";
import { useAppTheme } from "@/contexts/ThemeContext";
import { COLORS, MOODS, formatDate } from "@/constants/Together";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Plus, Lock, Trash2, Heart } from "lucide-react-native";


interface Mood {
  id: string;
  mood: string;
  note?: string;
  created_at: string;
}

interface Vent {
  id: string;
  content: string;
  is_private: boolean;
  created_at: string;
}

interface Activity {
  id: string;
  title: string;
  description?: string;
  date?: string;
  created_at: string;
}

function SectionHeader({ title, emoji, onAdd, color }: { title: string; emoji: string; onAdd: () => void; color: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text style={{ fontSize: 20 }}>{emoji}</Text>
        <Text style={{ fontSize: 18, fontWeight: "800", color: COLORS.text }}>{title}</Text>
      </View>
      <AnimatedPressable
        onPress={onAdd}
        style={{
          backgroundColor: color,
          borderRadius: 20,
          paddingHorizontal: 14,
          paddingVertical: 7,
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
        }}
      >
        <Plus size={14} color="#fff" />
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>Add</Text>
      </AnimatedPressable>
    </View>
  );
}

export default function ConnectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { themeColor } = useAppTheme();
  const { width } = useWindowDimensions();

  const [moods, setMoods] = useState<Mood[]>([]);
  const [vents, setVents] = useState<Vent[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteVentId, setDeleteVentId] = useState<string | null>(null);
  const [deleteActivityId, setDeleteActivityId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState<"vent" | "activity">("vent");

  const maxWidth = Math.min(width, 600);

  const loadData = useCallback(async () => {
    try {
      const [moodsData, ventsData, activitiesData] = await Promise.all([
        authenticatedGet<Mood[]>("/api/moods").catch(() => []),
        authenticatedGet<Vent[]>("/api/vents").catch(() => []),
        authenticatedGet<Activity[]>("/api/activities").catch(() => []),
      ]);
      setMoods(Array.isArray(moodsData) ? moodsData.slice(0, 6) : []);
      setVents(Array.isArray(ventsData) ? ventsData.slice(0, 5) : []);
      setActivities(Array.isArray(activitiesData) ? activitiesData.slice(0, 5) : []);
    } catch (e) {
      console.error("[Connect] loadData error:", e);
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

  const getMoodEmoji = (moodKey: string) => {
    const found = MOODS.find((m) => m.key === moodKey);
    return found ? found.emoji : "😊";
  };

  const confirmDelete = (type: "vent" | "activity", id: string) => {
    setDeleteType(type);
    if (type === "vent") setDeleteVentId(id);
    else setDeleteActivityId(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      if (deleteType === "vent" && deleteVentId) {
        console.log("[Connect] Delete vent:", deleteVentId);
        await authenticatedDelete(`/api/vents/${deleteVentId}`);
        setVents((prev) => prev.filter((v) => v.id !== deleteVentId));
      } else if (deleteType === "activity" && deleteActivityId) {
        console.log("[Connect] Delete activity:", deleteActivityId);
        await authenticatedDelete(`/api/activities/${deleteActivityId}`);
        setActivities((prev) => prev.filter((a) => a.id !== deleteActivityId));
      }
    } catch (e) {
      console.error("[Connect] Delete error:", e);
    } finally {
      setShowDeleteModal(false);
      setDeleteVentId(null);
      setDeleteActivityId(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Header */}
      <View style={{
        backgroundColor: themeColor,
        paddingTop: insets.top + 16,
        paddingBottom: 20,
        paddingHorizontal: 20,
      }}>
        <Text style={{ fontSize: 28, fontWeight: "900", color: "#fff", letterSpacing: -0.5 }}>
          Connect 💕
        </Text>
        <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", marginTop: 4 }}>
          Stay in tune with each other
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={themeColor} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 120, maxWidth, alignSelf: "center", width: "100%" }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColor} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Mood Section */}
          <SectionHeader
            title="Moods"
            emoji="😊"
            onAdd={() => {
              console.log("[Connect] Log mood pressed");
              router.push("/(tabs)/(connect)/log-mood");
            }}
            color={themeColor}
          />
          {moods.length === 0 ? (
            <View style={{ backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, alignItems: "center", marginBottom: 24 }}>
              <Text style={{ fontSize: 13, color: COLORS.textSecondary }}>No moods logged yet. How are you feeling? 💭</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {moods.map((mood) => (
                  <View
                    key={mood.id}
                    style={{
                      backgroundColor: COLORS.surface,
                      borderRadius: 16,
                      padding: 14,
                      alignItems: "center",
                      minWidth: 80,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    }}
                  >
                    <Text style={{ fontSize: 28 }}>{getMoodEmoji(mood.mood)}</Text>
                    <Text style={{ fontSize: 11, fontWeight: "600", color: COLORS.textSecondary, marginTop: 4, textTransform: "capitalize" }}>
                      {mood.mood}
                    </Text>
                    <Text style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>
                      {formatDate(mood.created_at).split(",")[0]}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}

          {/* Vents Section */}
          <SectionHeader
            title="Vents"
            emoji="💬"
            onAdd={() => {
              console.log("[Connect] Add vent pressed");
              router.push("/(tabs)/(connect)/add-vent");
            }}
            color={COLORS.accent}
          />
          {vents.length === 0 ? (
            <View style={{ backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, alignItems: "center", marginBottom: 24 }}>
              <Text style={{ fontSize: 13, color: COLORS.textSecondary }}>No vents yet. It's okay to share what's on your mind 💜</Text>
            </View>
          ) : (
            <View style={{ gap: 10, marginBottom: 24 }}>
              {vents.map((vent) => (
                <View
                  key={vent.id}
                  style={{
                    backgroundColor: COLORS.surface,
                    borderRadius: 16,
                    padding: 16,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 10,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      {vent.is_private && <Lock size={12} color={COLORS.accent} />}
                      {vent.is_private && (
                        <Text style={{ fontSize: 11, color: COLORS.accent, fontWeight: "600" }}>Private</Text>
                      )}
                      <Text style={{ fontSize: 11, color: COLORS.textMuted }}>
                        {formatDate(vent.created_at)}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 14, color: COLORS.text, lineHeight: 20 }} numberOfLines={3}>
                      {vent.content}
                    </Text>
                  </View>
                  <AnimatedPressable onPress={() => confirmDelete("vent", vent.id)}>
                    <Trash2 size={16} color={COLORS.textMuted} />
                  </AnimatedPressable>
                </View>
              ))}
            </View>
          )}

          {/* Activities Section */}
          <SectionHeader
            title="Activities"
            emoji="✨"
            onAdd={() => {
              console.log("[Connect] Add activity pressed");
              router.push("/(tabs)/(connect)/add-activity");
            }}
            color={COLORS.secondary}
          />
          {activities.length === 0 ? (
            <View style={{ backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, alignItems: "center", marginBottom: 24 }}>
              <Text style={{ fontSize: 13, color: COLORS.textSecondary }}>No activities yet. Log something you did together! ✨</Text>
            </View>
          ) : (
            <View style={{ gap: 10, marginBottom: 24 }}>
              {activities.map((activity) => (
                <View
                  key={activity.id}
                  style={{
                    backgroundColor: COLORS.surface,
                    borderRadius: 16,
                    padding: 16,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 10,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: COLORS.text, marginBottom: 4 }}>
                      {activity.title}
                    </Text>
                    {activity.description ? (
                      <Text style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 }} numberOfLines={2}>
                        {activity.description}
                      </Text>
                    ) : null}
                    <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>
                      {formatDate(activity.date || activity.created_at)}
                    </Text>
                  </View>
                  <AnimatedPressable onPress={() => confirmDelete("activity", activity.id)}>
                    <Trash2 size={16} color={COLORS.textMuted} />
                  </AnimatedPressable>
                </View>
              ))}
            </View>
          )}

          {/* Intimacy Button */}
          <AnimatedPressable
            onPress={() => {
              console.log("[Connect] Intimacy hub pressed");
              router.push("/intimacy");
            }}
            style={{
              backgroundColor: COLORS.accent,
              borderRadius: 16,
              paddingVertical: 14,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 4px 16px rgba(167,139,250,0.35)",
            }}
          >
            <Heart size={18} color="#fff" fill="#fff" />
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>💜 Intimacy Hub</Text>
          </AnimatedPressable>
        </ScrollView>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <View style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center", alignItems: "center", padding: 24,
        }}>
          <View style={{ backgroundColor: COLORS.surface, borderRadius: 24, padding: 28, width: "100%", maxWidth: 360 }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: COLORS.text, textAlign: "center", marginBottom: 8 }}>
              Delete {deleteType === "vent" ? "Vent" : "Activity"}?
            </Text>
            <Text style={{ fontSize: 15, color: COLORS.textSecondary, textAlign: "center", marginBottom: 24, lineHeight: 22 }}>
              This will be permanently deleted.
            </Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <AnimatedPressable
                onPress={() => setShowDeleteModal(false)}
                style={{ flex: 1, backgroundColor: COLORS.surfaceAlt, borderRadius: 14, paddingVertical: 13, alignItems: "center" }}
              >
                <Text style={{ fontWeight: "700", color: COLORS.text }}>Cancel</Text>
              </AnimatedPressable>
              <AnimatedPressable
                onPress={handleDelete}
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
