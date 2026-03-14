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

export default function AddTodoScreen() {
  const router = useRouter();
  const { themeColor } = useAppTheme();
  const { width } = useWindowDimensions();

  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const maxWidth = Math.min(width, 600);

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Please enter a title");
      return;
    }
    console.log("[AddTodo] Save pressed, title:", title);
    setLoading(true);
    setError("");
    try {
      await authenticatedPost("/api/todos", {
        title: title.trim(),
        due_date: dueDate ? dueDate.toISOString().split("T")[0] : undefined,
      });
      router.back();
    } catch (e: any) {
      console.error("[AddTodo] Save error:", e);
      setError(e?.message || "Failed to save todo");
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
        New To-Do ✅
      </Text>
      <Text style={{ fontSize: 15, color: COLORS.textSecondary, marginBottom: 28, lineHeight: 22 }}>
        Add a task to your shared list.
      </Text>

      <Text style={{ fontSize: 15, fontWeight: "700", color: COLORS.text, marginBottom: 8 }}>Task Title</Text>
      <TextInput
        placeholder="e.g. Book restaurant, Call the plumber..."
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

      <Text style={{ fontSize: 15, fontWeight: "700", color: COLORS.text, marginBottom: 8 }}>Due Date (optional)</Text>
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
        <Text style={{ fontSize: 16, color: dueDate ? COLORS.text : COLORS.textMuted }}>
          {dueDate ? formatDate(dueDate.toISOString()) : "Pick a due date"}
        </Text>
      </AnimatedPressable>

      {showDatePicker && (
        <DateTimePicker
          value={dueDate || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(_, d) => {
            setShowDatePicker(false);
            if (d) setDueDate(d);
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
          backgroundColor: COLORS.accent,
          borderRadius: 16,
          paddingVertical: 14,
          alignItems: "center",
          boxShadow: "0 4px 16px rgba(167,139,250,0.4)",
        }}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Add To-Do ✅</Text>
        }
      </AnimatedPressable>
    </ScrollView>
  );
}
