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

export default function AddActivityScreen() {
  const router = useRouter();
  const { themeColor } = useAppTheme();
  const { width } = useWindowDimensions();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const maxWidth = Math.min(width, 600);

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Please enter a title");
      return;
    }
    console.log("[AddActivity] Save pressed, title:", title);
    setLoading(true);
    setError("");
    try {
      await authenticatedPost("/api/activities", {
        title: title.trim(),
        description: description.trim() || undefined,
        date: date.toISOString().split("T")[0],
      });
      router.back();
    } catch (e: any) {
      console.error("[AddActivity] Save error:", e);
      setError(e?.message || "Failed to save activity");
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
        Log an Activity ✨
      </Text>
      <Text style={{ fontSize: 15, color: COLORS.textSecondary, marginBottom: 28, lineHeight: 22 }}>
        What did you do together today?
      </Text>

      {/* Title */}
      <Text style={{ fontSize: 15, fontWeight: "700", color: COLORS.text, marginBottom: 8 }}>Activity Title</Text>
      <TextInput
        placeholder="e.g. Movie night, Cooking together..."
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

      {/* Description */}
      <Text style={{ fontSize: 15, fontWeight: "700", color: COLORS.text, marginBottom: 8 }}>Description (optional)</Text>
      <TextInput
        placeholder="Tell us more about it..."
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

      {/* Date */}
      <Text style={{ fontSize: 15, fontWeight: "700", color: COLORS.text, marginBottom: 8 }}>Date</Text>
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
        <Text style={{ fontSize: 16, color: COLORS.text }}>{formatDate(date.toISOString())}</Text>
      </AnimatedPressable>

      {(showDatePicker || Platform.OS !== "ios") && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          maximumDate={new Date()}
          onChange={(_, d) => {
            setShowDatePicker(false);
            if (d) setDate(d);
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
          : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Log Activity ✨</Text>
        }
      </AnimatedPressable>
    </ScrollView>
  );
}
