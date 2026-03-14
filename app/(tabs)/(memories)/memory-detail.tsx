import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  ActivityIndicator,
  Modal,
  useWindowDimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { authenticatedGet, authenticatedDelete } from "@/utils/api";
import { useAppTheme } from "@/contexts/ThemeContext";
import { COLORS, formatDate } from "@/constants/Together";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Trash2 } from "lucide-react-native";

interface Memory {
  id: string;
  prompt: string;
  image_url?: string;
  caption?: string;
  created_at: string;
}

export default function MemoryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { themeColor } = useAppTheme();
  const { width } = useWindowDimensions();

  const [memory, setMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const imageSource = memory?.image_url ? { uri: memory.image_url } : null;
  const dateText = memory ? formatDate(memory.created_at) : "";

  useEffect(() => {
    const load = async () => {
      try {
        const data = await authenticatedGet<Memory>(`/api/memories/${id}`);
        setMemory(data);
      } catch (e) {
        console.error("[MemoryDetail] load error:", e);
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const handleDelete = async () => {
    console.log("[MemoryDetail] Delete confirmed for:", id);
    setDeleting(true);
    try {
      await authenticatedDelete(`/api/memories/${id}`);
      router.back();
    } catch (e) {
      console.error("[MemoryDetail] Delete error:", e);
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background }}>
        <ActivityIndicator color={themeColor} size="large" />
      </View>
    );
  }

  if (!memory) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background }}>
        <Text style={{ fontSize: 16, color: COLORS.textSecondary }}>Memory not found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {imageSource ? (
          <Image
            source={imageSource}
            style={{ width, height: width * 0.85 }}
            resizeMode="cover"
          />
        ) : (
          <View style={{
            width,
            height: width * 0.85,
            backgroundColor: COLORS.surfaceAlt,
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Text style={{ fontSize: 60 }}>📸</Text>
          </View>
        )}

        <View style={{ backgroundColor: COLORS.background, padding: 24 }}>
          <View style={{
            backgroundColor: `${themeColor}20`,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 6,
            alignSelf: "flex-start",
            marginBottom: 12,
          }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: themeColor }}>
              {memory.prompt}
            </Text>
          </View>

          {memory.caption ? (
            <Text style={{ fontSize: 16, color: COLORS.text, lineHeight: 24, marginBottom: 12 }} selectable>
              {memory.caption}
            </Text>
          ) : null}

          <Text style={{ fontSize: 13, color: COLORS.textMuted }}>{dateText}</Text>

          <AnimatedPressable
            onPress={() => setShowDeleteModal(true)}
            style={{
              marginTop: 24,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              backgroundColor: COLORS.surface,
              borderRadius: 14,
              paddingVertical: 13,
              borderWidth: 1.5,
              borderColor: COLORS.error + "40",
            }}
          >
            <Trash2 size={18} color={COLORS.error} />
            <Text style={{ color: COLORS.error, fontWeight: "700", fontSize: 15 }}>Delete Memory</Text>
          </AnimatedPressable>
        </View>
      </ScrollView>

      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 }}>
          <View style={{ backgroundColor: COLORS.surface, borderRadius: 24, padding: 28, width: "100%", maxWidth: 360 }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: COLORS.text, textAlign: "center", marginBottom: 8 }}>
              Delete Memory?
            </Text>
            <Text style={{ fontSize: 15, color: COLORS.textSecondary, textAlign: "center", marginBottom: 24, lineHeight: 22 }}>
              This memory will be permanently deleted. This cannot be undone.
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
                disabled={deleting}
                style={{ flex: 1, backgroundColor: COLORS.error, borderRadius: 14, paddingVertical: 13, alignItems: "center" }}
              >
                {deleting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={{ fontWeight: "700", color: "#fff" }}>Delete</Text>
                }
              </AnimatedPressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
