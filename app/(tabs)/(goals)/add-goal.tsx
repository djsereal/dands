import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { authenticatedPost } from "@/utils/api";
import { useAppTheme } from "@/contexts/ThemeContext";
import { COLORS, formatDate } from "@/constants/Together";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Calendar } from "lucide-react-native";

export default function AddGoalScreen() {
  const router = useRouter();
  const { themeColor } = useAppTheme();
  const { width } = useWindowDimensions();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const maxWidth = Math.min(width, 600);

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Please enter a goal title");
      return;
    }
    console.log("[AddGoal] Save pressed, title:", title);
    setLoading(true);
    setError("");
    try {
      await authenticatedPost("/api/goals", {
        title: title.trim(),
        description: description.trim() || undefined,
        target_date: targetDate ? targetDate.toISOString().split("T")[0] : undefined,
      });
      router.back();
    } catch (e: any) {
      console.error("[AddGoal] Save error:", e);
      setError(e?.message || "Failed to save goal");
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
        New Shared Goal 🎯
      </Text>
      <Text style={{ fontSize: 15, color: COLORS.textSecondary, marginBottom: 28, lineHeight: 22 }}>
        What do you want to achieve together?
      </Text>

      <Text style={{ fontSize: 15, fontWeight: "700", color: COLORS.text, marginBottom: 8 }}>Goal Title</Text>
      <TextInput
        placeholder="e.g. Save for a vacation, Exercise together..."
        placeholderTextColor={COLORS.textMuted}
        value={title}
        onChangeText={setTitle}
        style={{
          backgroundColor: COLORS.surface,
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: COLORS.border,
          paddingHorizontal: 16,
          paddingVertical: 14,
          fontSize: 16,
          color: COLORS.text,
          marginBottom: 20,
        }}
        autoFocus
      />

      <Text style={{ fontSize: 15, fontWeight: "700", color: COLORS.text, marginBottom: 8 }}>Description (optional)</Text>
      <TextInput
        placeholder="Describe your goal in more detail..."
        placeholderTextColor={COLORS.textMuted}
        value={description}
        onChangeText={setDescription}
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
          marginBottom: 20,
        }}
      />

      <Text style={{ fontSize: 15, fontWeight: "700", color: COLORS.text, marginBottom: 8 }}>Target Date (optional)</Text>
      <AnimatedPressable
        onPress={() => setShowDatePicker(true)}
        style={{
          backgroundColor: COLORS.surface,
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: COLORS.border,
          paddingHorizontal: 16,
          paddingVertical: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          marginBottom: 28,
        }}
      >
        <Calendar size={18} color={themeColor} />
        <Text style={{ fontSize: 16, color: targetDate ? COLORS.text : COLORS.textMuted }}>
          {targetDate ? formatDate(targetDate.toISOString()) : "Pick a target date"}
        </Text>
      </AnimatedPressable>

      {showDatePicker && (
        <DateTimePicker
          value={targetDate || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          minimumDate={new Date()}
          onChange={(_, d) => {
            setShowDatePicker(false);
            if (d) setTargetDate(d);
          }}
        />
      )}

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
          : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Set Goal 🎯</Text>
        }
      </AnimatedPressable>
    </ScrollView>
  );
}
