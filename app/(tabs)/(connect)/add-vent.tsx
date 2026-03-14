import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Switch,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { authenticatedPost } from "@/utils/api";
import { useAppTheme } from "@/contexts/ThemeContext";
import { COLORS } from "@/constants/Together";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Lock } from "lucide-react-native";

export default function AddVentScreen() {
  const router = useRouter();
  const { themeColor } = useAppTheme();
  const { width } = useWindowDimensions();

  const [content, setContent] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const maxWidth = Math.min(width, 600);

  const handleSave = async () => {
    if (!content.trim()) {
      setError("Please write something first");
      return;
    }
    console.log("[AddVent] Save pressed, private:", isPrivate);
    setLoading(true);
    setError("");
    try {
      await authenticatedPost("/api/vents", {
        content: content.trim(),
        is_private: isPrivate,
      });
      router.back();
    } catch (e: any) {
      console.error("[AddVent] Save error:", e);
      setError(e?.message || "Failed to save vent");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      contentContainerStyle={{ padding: 24, paddingBottom: 60, maxWidth, alignSelf: "center", width: "100%" }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={{ fontSize: 22, fontWeight: "900", color: COLORS.text, marginBottom: 8 }}>
        What's on your mind? 💬
      </Text>
      <Text style={{ fontSize: 15, color: COLORS.textSecondary, marginBottom: 24, lineHeight: 22 }}>
        It's okay to let it out. Your feelings are valid. 💜
      </Text>

      <TextInput
        placeholder="Write freely here... no judgment, just expression 💜"
        placeholderTextColor={COLORS.textMuted}
        value={content}
        onChangeText={setContent}
        multiline
        numberOfLines={8}
        style={{
          backgroundColor: COLORS.surface,
          borderRadius: 16,
          borderWidth: 1.5,
          borderColor: COLORS.border,
          paddingHorizontal: 16,
          paddingVertical: 16,
          fontSize: 16,
          color: COLORS.text,
          minHeight: 200,
          textAlignVertical: "top",
          lineHeight: 24,
          marginBottom: 20,
        }}
        autoFocus
      />

      {/* Private Toggle */}
      <View style={{
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 24,
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
          <Lock size={18} color={isPrivate ? COLORS.accent : COLORS.textMuted} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: COLORS.text }}>Keep this private</Text>
            <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
              Only you can see this vent
            </Text>
          </View>
        </View>
        <Switch
          value={isPrivate}
          onValueChange={(val) => {
            console.log("[AddVent] Private toggle:", val);
            setIsPrivate(val);
          }}
          trackColor={{ false: COLORS.border, true: COLORS.accent }}
          thumbColor="#fff"
        />
      </View>

      {error ? (
        <Text style={{ color: COLORS.error, fontSize: 14, textAlign: "center", marginBottom: 12 }}>{error}</Text>
      ) : null}

      <AnimatedPressable
        onPress={handleSave}
        disabled={loading}
        style={{
          backgroundColor: COLORS.accent,
          borderRadius: 16,
          paddingVertical: 14,
          alignItems: "center",
          boxShadow: "0 4px 16px rgba(167,139,250,0.4)",
        }}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Share 💜</Text>
        }
      </AnimatedPressable>
    </ScrollView>
  );
}
