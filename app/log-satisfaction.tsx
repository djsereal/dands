import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Animated,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { authenticatedPost } from "@/utils/api";
import { COLORS } from "@/constants/Together";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Star } from "lucide-react-native";

export default function LogSatisfactionScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [rating, setRating] = useState(0);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const maxWidth = Math.min(width, 600);

  const starLabels = ["", "Not great", "Okay", "Good", "Great", "Amazing! 💜"];

  const handleSave = async () => {
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }
    console.log("[LogSatisfaction] Save pressed, rating:", rating);
    setLoading(true);
    setError("");
    try {
      await authenticatedPost("/api/intimacy/logs", {
        rating,
        note: note.trim() || undefined,
      });
      router.back();
    } catch (e: any) {
      console.error("[LogSatisfaction] Save error:", e);
      setError(e?.message || "Failed to save log");
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
        Log Satisfaction 💜
      </Text>
      <Text style={{ fontSize: 15, color: COLORS.textSecondary, marginBottom: 32, lineHeight: 22 }}>
        How was your intimate connection today?
      </Text>

      {/* Star Rating */}
      <View style={{ alignItems: "center", marginBottom: 32 }}>
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <AnimatedPressable
              key={star}
              onPress={() => {
                console.log("[LogSatisfaction] Star selected:", star);
                setRating(star);
              }}
              scaleValue={0.85}
              style={{ padding: 4 }}
            >
              <Star
                size={48}
                color={star <= rating ? "#FBBF24" : COLORS.border}
                fill={star <= rating ? "#FBBF24" : "transparent"}
              />
            </AnimatedPressable>
          ))}
        </View>
        {rating > 0 && (
          <Text style={{ fontSize: 16, fontWeight: "700", color: COLORS.accent }}>
            {starLabels[rating]}
          </Text>
        )}
      </View>

      {/* Note */}
      <Text style={{ fontSize: 16, fontWeight: "700", color: COLORS.text, marginBottom: 10 }}>
        Add a note (optional)
      </Text>
      <TextInput
        placeholder="Any thoughts or feelings to share... 💜"
        placeholderTextColor={COLORS.textMuted}
        value={note}
        onChangeText={setNote}
        multiline
        numberOfLines={4}
        style={{
          backgroundColor: "#fff",
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: `${COLORS.accent}30`,
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
          backgroundColor: COLORS.accent,
          borderRadius: 16,
          paddingVertical: 14,
          alignItems: "center",
          boxShadow: "0 4px 16px rgba(167,139,250,0.4)",
        }}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Save Log 💜</Text>
        }
      </AnimatedPressable>
    </ScrollView>
  );
}
