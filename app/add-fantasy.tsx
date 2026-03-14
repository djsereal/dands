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
import { COLORS } from "@/constants/Together";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Lock } from "lucide-react-native";

export default function AddFantasyScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const maxWidth = Math.min(width, 600);

  const handleSave = async () => {
    if (!content.trim()) {
      setError("Please write something first");
      return;
    }
    console.log("[AddFantasy] Save pressed, anonymous:", isAnonymous);
    setLoading(true);
    setError("");
    try {
      await authenticatedPost("/api/intimacy/fantasies", {
        content: content.trim(),
        is_anonymous: isAnonymous,
      });
      router.back();
    } catch (e: any) {
      console.error("[AddFantasy] Save error:", e);
      setError(e?.message || "Failed to share fantasy");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#F5F0FF" }}
      contentContainerStyle={{ padding: 24, paddingBottom: 60, maxWidth, alignSelf: "center", width: "100%" }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={{ fontSize: 22, fontWeight: "900", color: COLORS.text, marginBottom: 8 }}>
        Share a Fantasy 💭
      </Text>
      <Text style={{ fontSize: 15, color: COLORS.textSecondary, marginBottom: 24, lineHeight: 22 }}>
        This is a safe, private space to share your desires with your partner. 💜
      </Text>

      <TextInput
        placeholder="Share what's on your mind... 💜"
        placeholderTextColor={COLORS.textMuted}
        value={content}
        onChangeText={setContent}
        multiline
        numberOfLines={8}
        style={{
          backgroundColor: "#fff",
          borderRadius: 16,
          borderWidth: 1.5,
          borderColor: `${COLORS.accent}30`,
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

      {/* Anonymous Toggle */}
      <View style={{
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 24,
        boxShadow: "0 2px 8px rgba(167,139,250,0.1)",
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
          <Lock size={18} color={isAnonymous ? COLORS.accent : COLORS.textMuted} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: COLORS.text }}>Share anonymously</Text>
            <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
              Your name won't be shown
            </Text>
          </View>
        </View>
        <Switch
          value={isAnonymous}
          onValueChange={(val) => {
            console.log("[AddFantasy] Anonymous toggle:", val);
            setIsAnonymous(val);
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
