import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  useWindowDimensions,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { authenticatedPost } from "@/utils/api";
import { useAppTheme } from "@/contexts/ThemeContext";
import { COLORS, MEMORY_PROMPTS } from "@/constants/Together";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Camera, Image as ImageIcon, Check } from "lucide-react-native";

export default function AddMemoryScreen() {
  const router = useRouter();
  const { themeColor } = useAppTheme();
  const { width } = useWindowDimensions();

  const [selectedPrompt, setSelectedPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const maxWidth = Math.min(width, 600);

  const pickImage = async () => {
    console.log("[AddMemory] Pick image pressed");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUrl(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!selectedPrompt) {
      setError("Please select a prompt");
      return;
    }
    console.log("[AddMemory] Save pressed, prompt:", selectedPrompt);
    setLoading(true);
    setError("");
    try {
      await authenticatedPost("/api/memories", {
        prompt: selectedPrompt,
        image_url: imageUrl || undefined,
        caption: caption || undefined,
      });
      router.back();
    } catch (e: any) {
      console.error("[AddMemory] Save error:", e);
      setError(e?.message || "Failed to save memory");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      contentContainerStyle={{ padding: 20, paddingBottom: 60, maxWidth, alignSelf: "center", width: "100%" }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Prompt Selection */}
      <Text style={{ fontSize: 18, fontWeight: "800", color: COLORS.text, marginBottom: 12 }}>
        Choose a Prompt
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
        {MEMORY_PROMPTS.map((prompt) => {
          const isSelected = selectedPrompt === prompt;
          return (
            <AnimatedPressable
              key={prompt}
              onPress={() => setSelectedPrompt(prompt)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: isSelected ? themeColor : COLORS.surface,
                borderWidth: 1.5,
                borderColor: isSelected ? themeColor : COLORS.border,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              {isSelected && <Check size={12} color="#fff" />}
              <Text style={{
                fontSize: 13,
                fontWeight: "600",
                color: isSelected ? "#fff" : COLORS.textSecondary,
              }}>
                {prompt}
              </Text>
            </AnimatedPressable>
          );
        })}
      </View>

      {/* Image Picker */}
      <Text style={{ fontSize: 18, fontWeight: "800", color: COLORS.text, marginBottom: 12 }}>
        Add a Photo
      </Text>
      <AnimatedPressable
        onPress={pickImage}
        style={{
          backgroundColor: COLORS.surface,
          borderRadius: 16,
          borderWidth: 2,
          borderColor: COLORS.border,
          borderStyle: "dashed",
          height: 180,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
          overflow: "hidden",
        }}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
        ) : (
          <View style={{ alignItems: "center", gap: 8 }}>
            <Camera size={32} color={COLORS.textMuted} />
            <Text style={{ fontSize: 14, color: COLORS.textSecondary, fontWeight: "600" }}>
              Tap to pick a photo
            </Text>
          </View>
        )}
      </AnimatedPressable>

      {/* URL Input */}
      <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 8, fontWeight: "600" }}>
        Or paste an image URL
      </Text>
      <TextInput
        placeholder="https://..."
        placeholderTextColor={COLORS.textMuted}
        value={imageUrl}
        onChangeText={setImageUrl}
        autoCapitalize="none"
        keyboardType="url"
        style={{
          backgroundColor: COLORS.surface,
          borderRadius: 12,
          borderWidth: 1.5,
          borderColor: COLORS.border,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 14,
          color: COLORS.text,
          marginBottom: 24,
        }}
      />

      {/* Caption */}
      <Text style={{ fontSize: 18, fontWeight: "800", color: COLORS.text, marginBottom: 12 }}>
        Caption
      </Text>
      <TextInput
        placeholder="Write something about this moment... 💕"
        placeholderTextColor={COLORS.textMuted}
        value={caption}
        onChangeText={setCaption}
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
          : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Save Memory 💕</Text>
        }
      </AnimatedPressable>
    </ScrollView>
  );
}
