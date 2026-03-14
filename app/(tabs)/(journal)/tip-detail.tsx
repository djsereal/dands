import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import * as Linking from "expo-linking";
import { authenticatedGet } from "@/utils/api";
import { useAppTheme } from "@/contexts/ThemeContext";
import { COLORS } from "@/constants/Together";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { ExternalLink } from "lucide-react-native";

interface Tip {
  id: string;
  title: string;
  content: string;
  category: string;
  source_url?: string;
}

export default function TipDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { themeColor } = useAppTheme();
  const { width } = useWindowDimensions();

  const [tip, setTip] = useState<Tip | null>(null);
  const [loading, setLoading] = useState(true);

  const maxWidth = Math.min(width, 600);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await authenticatedGet<Tip>(`/api/tips/${id}`);
        setTip(data);
      } catch (e) {
        console.error("[TipDetail] load error:", e);
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const handleOpenSource = async () => {
    if (tip?.source_url) {
      console.log("[TipDetail] Open source URL:", tip.source_url);
      await Linking.openURL(tip.source_url);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background }}>
        <ActivityIndicator color={themeColor} size="large" />
      </View>
    );
  }

  if (!tip) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background }}>
        <Text style={{ fontSize: 16, color: COLORS.textSecondary }}>Tip not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      contentContainerStyle={{ padding: 24, paddingBottom: 60, maxWidth, alignSelf: "center", width: "100%" }}
    >
      {/* Category Badge */}
      {tip.category ? (
        <View style={{
          backgroundColor: `${themeColor}20`,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 6,
          alignSelf: "flex-start",
          marginBottom: 16,
        }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: themeColor, textTransform: "capitalize" }}>
            {tip.category}
          </Text>
        </View>
      ) : null}

      {/* Title */}
      <Text style={{ fontSize: 24, fontWeight: "900", color: COLORS.text, lineHeight: 32, marginBottom: 16 }}>
        {tip.title}
      </Text>

      {/* Content */}
      <View style={{
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        padding: 20,
        boxShadow: COLORS.cardShadow,
        marginBottom: 24,
      }}>
        <Text style={{ fontSize: 16, color: COLORS.text, lineHeight: 26 }} selectable>
          {tip.content}
        </Text>
      </View>

      {/* Source Link */}
      {tip.source_url ? (
        <AnimatedPressable
          onPress={handleOpenSource}
          style={{
            backgroundColor: COLORS.surface,
            borderRadius: 16,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            borderWidth: 1.5,
            borderColor: COLORS.border,
          }}
        >
          <ExternalLink size={20} color={themeColor} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.textSecondary, marginBottom: 2 }}>
              Source
            </Text>
            <Text style={{ fontSize: 14, color: themeColor, fontWeight: "600" }} numberOfLines={1}>
              {tip.source_url}
            </Text>
          </View>
        </AnimatedPressable>
      ) : null}
    </ScrollView>
  );
}
