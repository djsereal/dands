import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
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
import { Plus, Camera } from "lucide-react-native";

interface Memory {
  id: string;
  prompt: string;
  image_url?: string;
  caption?: string;
  created_at: string;
}

function MemoryCard({ memory, onPress, cardWidth }: { memory: Memory; onPress: () => void; cardWidth: number }) {
  const imageSource = memory.image_url ? { uri: memory.image_url } : null;
  const dateText = formatDate(memory.created_at);

  return (
    <AnimatedPressable
      onPress={onPress}
      style={{
        width: cardWidth,
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        marginBottom: 12,
      }}
    >
      {imageSource ? (
        <Image
          source={imageSource}
          style={{ width: "100%", height: cardWidth * 0.75 }}
          resizeMode="cover"
        />
      ) : (
        <View style={{
          width: "100%",
          height: cardWidth * 0.75,
          backgroundColor: COLORS.surfaceAlt,
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Text style={{ fontSize: 40 }}>📸</Text>
        </View>
      )}
      <View style={{ padding: 12 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.primary, marginBottom: 4 }}>
          {memory.prompt}
        </Text>
        {memory.caption ? (
          <Text style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 }} numberOfLines={2}>
            {memory.caption}
          </Text>
        ) : null}
        <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 6 }}>
          {dateText}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

export default function MemoriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { themeColor } = useAppTheme();
  const { width } = useWindowDimensions();

  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const maxWidth = Math.min(width, 600);
  const cardWidth = (maxWidth - 48) / 2;

  const loadMemories = useCallback(async () => {
    try {
      const data = await authenticatedGet<Memory[]>("/api/memories");
      setMemories(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("[Memories] load error:", e);
      setMemories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadMemories();
  }, [loadMemories]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMemories();
    setRefreshing(false);
  }, [loadMemories]);

  // Build two-column data
  const leftCol = memories.filter((_, i) => i % 2 === 0);
  const rightCol = memories.filter((_, i) => i % 2 === 1);

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
          Memories 📸
        </Text>
        <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", marginTop: 4 }}>
          Your beautiful moments together
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={themeColor} size="large" />
        </View>
      ) : memories.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 40 }}>
          <Text style={{ fontSize: 60, marginBottom: 16 }}>📸</Text>
          <Text style={{ fontSize: 20, fontWeight: "800", color: COLORS.text, textAlign: "center" }}>
            No memories yet
          </Text>
          <Text style={{ fontSize: 15, color: COLORS.textSecondary, textAlign: "center", marginTop: 8, lineHeight: 22 }}>
            Add your first memory and start capturing your love story!
          </Text>
          <AnimatedPressable
            onPress={() => {
              console.log("[Memories] Add first memory pressed");
              router.push("/(tabs)/(memories)/add-memory");
            }}
            style={{
              marginTop: 24,
              backgroundColor: themeColor,
              borderRadius: 16,
              paddingVertical: 14,
              paddingHorizontal: 28,
              boxShadow: `0 4px 16px ${themeColor}40`,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Add First Memory 💕</Text>
          </AnimatedPressable>
        </View>
      ) : (
        <FlatList
          data={[{ key: "grid" }]}
          keyExtractor={(item) => item.key}
          contentContainerStyle={{ padding: 16, paddingBottom: 100, maxWidth, alignSelf: "center", width: "100%" }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColor} />}
          renderItem={() => (
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                {leftCol.map((m) => (
                  <MemoryCard
                    key={m.id}
                    memory={m}
                    cardWidth={cardWidth}
                    onPress={() => {
                      console.log("[Memories] Memory pressed:", m.id);
                      router.push({ pathname: "/(tabs)/(memories)/memory-detail", params: { id: m.id } });
                    }}
                  />
                ))}
              </View>
              <View style={{ flex: 1 }}>
                {rightCol.map((m) => (
                  <MemoryCard
                    key={m.id}
                    memory={m}
                    cardWidth={cardWidth}
                    onPress={() => {
                      console.log("[Memories] Memory pressed:", m.id);
                      router.push({ pathname: "/(tabs)/(memories)/memory-detail", params: { id: m.id } });
                    }}
                  />
                ))}
              </View>
            </View>
          )}
        />
      )}

      {/* FAB */}
      <AnimatedPressable
        onPress={() => {
          console.log("[Memories] FAB add memory pressed");
          router.push("/(tabs)/(memories)/add-memory");
        }}
        style={{
          position: "absolute",
          bottom: insets.bottom + 90,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: themeColor,
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 4px 16px ${themeColor}60`,
        }}
      >
        <Plus size={24} color="#fff" />
      </AnimatedPressable>
    </View>
  );
}
