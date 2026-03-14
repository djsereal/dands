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
import { COLORS, JOURNAL_TYPES } from "@/constants/Together";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Check } from "lucide-react-native";

export default function AddJournalScreen() {
  const router = useRouter();
  const { themeColor } = useAppTheme();
  const { width } = useWindowDimensions();

  const [selectedType, setSelectedType] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const maxWidth = Math.min(width, 600);

  const handleSave = async () => {
    if (!selectedType) {
      setError("Please select an entry type");
      return;
    }
    if (!content.trim()) {
      setError("Please write something");
      return;
    }
    console.log("[AddJournal] Save pressed, type:", selectedType);
    setLoading(true);
    setError("");
    try {
      await authenticatedPost("/api/journal", {
        type: selectedType,
        content: content.trim(),
      });
      router.back();
    } catch (e: any) {
      console.error("[AddJournal] Save error:", e);
      setError(e?.message || "Failed to save entry");
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
        New Journal Entry 📝
      </Text>
      <Text style={{ fontSize: 15, color: COLORS.textSecondary, marginBottom: 24, lineHeight: 22 }}>
        Take a moment to reflect on your relationship.
      </Text>

      {/* Type Selector */}
      <Text style={{ fontSize: 16, fontWeight: "700", color: COLORS.text, marginBottom: 12 }}>
        Entry Type
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
        {JOURNAL_TYPES.map((type) => {
          const isSelected = selectedType === type.key;
          return (
            <AnimatedPressable
              key={type.key}
              onPress={() => {
                console.log("[AddJournal] Type selected:", type.key);
                setSelectedType(type.key);
              }}
              style={{
                flex: 1,
                minWidth: "45%",
                backgroundColor: isSelected ? `${themeColor}15` : COLORS.surface,
                borderRadius: 16,
                padding: 16,
                alignItems: "center",
                gap: 6,
                borderWidth: 2,
                borderColor: isSelected ? themeColor : "transparent",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <Text style={{ fontSize: 28 }}>{type.emoji}</Text>
              <Text style={{
                fontSize: 13,
                fontWeight: "700",
                color: isSelected ? themeColor : COLORS.textSecondary,
                textAlign: "center",
              }}>
                {type.label}
              </Text>
              {isSelected && (
                <View style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: themeColor,
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Check size={10} color="#fff" />
                </View>
              )}
            </AnimatedPressable>
          );
        })}
      </View>

      {/* Content */}
      <Text style={{ fontSize: 16, fontWeight: "700", color: COLORS.text, marginBottom: 12 }}>
        Your Thoughts
      </Text>
      <TextInput
        placeholder="Write freely... this is your safe space 💕"
        placeholderTextColor={COLORS.textMuted}
        value={content}
        onChangeText={setContent}
        multiline
        numberOfLines={10}
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
          marginBottom: 24,
        }}
        autoFocus
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
          : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Save Entry 💕</Text>
        }
      </AnimatedPressable>
    </ScrollView>
  );
}
