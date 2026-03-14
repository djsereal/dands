import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { authenticatedPost } from "@/utils/api";
import { useAppTheme } from "@/contexts/ThemeContext";
import { COLORS, MOODS } from "@/constants/Together";
import { AnimatedPressable } from "@/components/AnimatedPressable";

export default function LogMoodScreen() {
  const router = useRouter();
  const { themeColor } = useAppTheme();
  const { width } = useWindowDimensions();

  const [selectedMood, setSelectedMood] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const maxWidth = Math.min(width, 600);

  const handleSave = async () => {
    if (!selectedMood) {
      setError("Please select a mood");
      return;
    }
    console.log("[LogMood] Save pressed, mood:", selectedMood);
    setLoading(true);
    setError("");
    try {
      await authenticatedPost("/api/moods", {
        mood: selectedMood,
        note: note || undefined,
      });
      router.back();
    } catch (e: any) {
      console.error("[LogMood] Save error:", e);
      setError(e?.message || "Failed to save mood");
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
        How are you feeling? 💭
      </Text>
      <Text style={{ fontSize: 15, color: COLORS.textSecondary, marginBottom: 28, lineHeight: 22 }}>
        Let your partner know your emotional state today.
      </Text>

      {/* Mood Grid */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 28 }}>
        {MOODS.map((mood) => {
          const isSelected = selectedMood === mood.key;
          return (
            <AnimatedPressable
              key={mood.key}
              onPress={() => {
                console.log("[LogMood] Mood selected:", mood.key);
                setSelectedMood(mood.key);
              }}
              style={{
                width: (maxWidth - 48 - 36) / 4,
                aspectRatio: 1,
                backgroundColor: isSelected ? `${themeColor}20` : COLORS.surface,
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                borderWidth: 2,
                borderColor: isSelected ? themeColor : "transparent",
                boxShadow: isSelected ? `0 4px 12px ${themeColor}30` : "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <Text style={{ fontSize: 32 }}>{mood.emoji}</Text>
              <Text style={{
                fontSize: 11,
                fontWeight: "700",
                color: isSelected ? themeColor : COLORS.textSecondary,
                textAlign: "center",
              }}>
                {mood.label}
              </Text>
            </AnimatedPressable>
          );
        })}
      </View>

      {/* Note */}
      <Text style={{ fontSize: 16, fontWeight: "700", color: COLORS.text, marginBottom: 10 }}>
        Add a note (optional)
      </Text>
      <TextInput
        placeholder="What's on your mind? 💭"
        placeholderTextColor={COLORS.textMuted}
        value={note}
        onChangeText={setNote}
        multiline
        numberOfLines={4}
        style={{
          backgroundColor: COLORS.surface,
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: COLORS.border,
          paddingHorizontal: 16,
          paddingVertical: 14,
          fontSize: 15,
          color: COLORS.text,
          minHeight: 100,
          textAlignVertical: "top",
          marginBottom: 24,
        }}
      />

      {error ? (
        <Text style={{ color: COLORS.error, fontSize: 14, textAlign: "center", marginBottom: 12 }}>{error}</Text>
      ) : null}

      <AnimatedPressable
        onPress={handleSave}
        disabled={loading}
        style={{
          backgroundColor: themeColor,
          borderRadius: 16,
          paddingVertical: 14,
          alignItems: "center",
          boxShadow: `0 4px 16px ${themeColor}40`,
        }}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Log Mood 💕</Text>
        }
      </AnimatedPressable>
    </ScrollView>
  );
}
