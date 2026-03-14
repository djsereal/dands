import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { authenticatedPost } from "@/utils/api";
import { useAppTheme } from "@/contexts/ThemeContext";
import { COLORS, THEME_COLORS, THEME_FONTS, formatDate } from "@/constants/Together";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Copy, Check, Calendar } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";

type Mode = "choose" | "create" | "join";

export default function CoupleSetupScreen() {
  const router = useRouter();
  const { refreshCouple } = useAppTheme();
  const { width } = useWindowDimensions();

  const [mode, setMode] = useState<Mode>("choose");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [createdCode, setCreatedCode] = useState("");
  const [copied, setCopied] = useState(false);

  // Create form
  const [anniversaryDate, setAnniversaryDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState(COLORS.primary);
  const [selectedFont, setSelectedFont] = useState("Nunito");

  const maxWidth = Math.min(width, 600);

  const handleCreate = async () => {
    console.log("[CoupleSetup] Create couple pressed");
    setLoading(true);
    setError("");
    try {
      const data = await authenticatedPost("/api/couples/create", {
        anniversary_date: anniversaryDate.toISOString().split("T")[0],
        theme_color: selectedColor,
        theme_font: selectedFont,
      });
      setCreatedCode(data.invite_code || data.inviteCode || "");
      await refreshCouple();
    } catch (e: any) {
      console.error("[CoupleSetup] Create error:", e);
      setError(e?.message || "Failed to create couple");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      setError("Please enter an invite code");
      return;
    }
    console.log("[CoupleSetup] Join couple pressed");
    setLoading(true);
    setError("");
    try {
      await authenticatedPost("/api/couples/join", { invite_code: inviteCode.trim() });
      await refreshCouple();
      router.replace("/(tabs)/(home)");
    } catch (e: any) {
      console.error("[CoupleSetup] Join error:", e);
      setError(e?.message || "Invalid invite code");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(createdCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (createdCode) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: COLORS.background }} contentContainerStyle={{ padding: 24, alignItems: "center" }}>
        <View style={{ maxWidth, width: "100%", alignItems: "center" }}>
          <Text style={{ fontSize: 60, marginBottom: 16 }}>🎉</Text>
          <Text style={{ fontSize: 24, fontWeight: "900", color: COLORS.text, textAlign: "center" }}>
            Your story begins!
          </Text>
          <Text style={{ fontSize: 15, color: COLORS.textSecondary, textAlign: "center", marginTop: 8, lineHeight: 22 }}>
            Share this invite code with your partner so they can join your couple.
          </Text>
          <View style={{
            marginTop: 32,
            backgroundColor: COLORS.surface,
            borderRadius: 20,
            padding: 24,
            width: "100%",
            alignItems: "center",
            boxShadow: COLORS.cardShadow,
          }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.textSecondary, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>
              Invite Code
            </Text>
            <Text style={{ fontSize: 32, fontWeight: "900", color: COLORS.primary, letterSpacing: 4 }}>
              {createdCode}
            </Text>
            <AnimatedPressable
              onPress={handleCopy}
              style={{
                marginTop: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                backgroundColor: copied ? COLORS.success : COLORS.primary,
                borderRadius: 12,
                paddingVertical: 10,
                paddingHorizontal: 20,
              }}
            >
              {copied ? <Check size={16} color="#fff" /> : <Copy size={16} color="#fff" />}
              <Text style={{ color: "#fff", fontWeight: "700" }}>{copied ? "Copied!" : "Copy Code"}</Text>
            </AnimatedPressable>
          </View>
          <AnimatedPressable
            onPress={() => router.replace("/(tabs)/(home)")}
            style={{
              marginTop: 24,
              backgroundColor: COLORS.primary,
              borderRadius: 16,
              paddingVertical: 14,
              paddingHorizontal: 40,
              boxShadow: "0 4px 16px rgba(255,107,157,0.4)",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Go to Dashboard 💕</Text>
          </AnimatedPressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ maxWidth, width: "100%", alignSelf: "center" }}>
        {mode === "choose" && (
          <View style={{ gap: 16 }}>
            <Text style={{ fontSize: 22, fontWeight: "900", color: COLORS.text, textAlign: "center", marginBottom: 8 }}>
              How would you like to start? 💕
            </Text>
            <AnimatedPressable
              onPress={() => setMode("create")}
              style={{
                backgroundColor: COLORS.primary,
                borderRadius: 20,
                padding: 24,
                alignItems: "center",
                gap: 8,
                boxShadow: "0 4px 16px rgba(255,107,157,0.35)",
              }}
            >
              <Text style={{ fontSize: 40 }}>💑</Text>
              <Text style={{ fontSize: 20, fontWeight: "800", color: "#fff" }}>Start Our Story</Text>
              <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", textAlign: "center" }}>
                Create a new couple profile and invite your partner
              </Text>
            </AnimatedPressable>
            <AnimatedPressable
              onPress={() => setMode("join")}
              style={{
                backgroundColor: COLORS.surface,
                borderRadius: 20,
                padding: 24,
                alignItems: "center",
                gap: 8,
                borderWidth: 2,
                borderColor: COLORS.border,
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <Text style={{ fontSize: 40 }}>🔗</Text>
              <Text style={{ fontSize: 20, fontWeight: "800", color: COLORS.text }}>Join My Partner</Text>
              <Text style={{ fontSize: 14, color: COLORS.textSecondary, textAlign: "center" }}>
                Enter an invite code from your partner
              </Text>
            </AnimatedPressable>
          </View>
        )}

        {mode === "create" && (
          <View style={{ gap: 20 }}>
            <Text style={{ fontSize: 22, fontWeight: "900", color: COLORS.text }}>
              Create Your Couple 💕
            </Text>

            {/* Anniversary Date */}
            <View>
              <Text style={{ fontSize: 15, fontWeight: "700", color: COLORS.text, marginBottom: 8 }}>
                Anniversary Date
              </Text>
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
                }}
              >
                <Calendar size={18} color={COLORS.primary} />
                <Text style={{ fontSize: 16, color: COLORS.text, flex: 1 }}>
                  {formatDate(anniversaryDate.toISOString())}
                </Text>
              </AnimatedPressable>
              {(showDatePicker || Platform.OS !== "ios") && (
                <DateTimePicker
                  value={anniversaryDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  maximumDate={new Date()}
                  onChange={(_, date) => {
                    setShowDatePicker(false);
                    if (date) setAnniversaryDate(date);
                  }}
                />
              )}
            </View>

            {/* Theme Color */}
            <View>
              <Text style={{ fontSize: 15, fontWeight: "700", color: COLORS.text, marginBottom: 8 }}>
                Theme Color
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {THEME_COLORS.map((color) => (
                  <Pressable
                    key={color}
                    onPress={() => setSelectedColor(color)}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: color,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: selectedColor === color ? 3 : 0,
                      borderColor: "#fff",
                      boxShadow: selectedColor === color ? `0 0 0 3px ${color}` : "0 2px 6px rgba(0,0,0,0.15)",
                    }}
                  >
                    {selectedColor === color && <Check size={18} color="#fff" />}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Font Picker */}
            <View>
              <Text style={{ fontSize: 15, fontWeight: "700", color: COLORS.text, marginBottom: 8 }}>
                Font Style
              </Text>
              <View style={{ gap: 8 }}>
                {THEME_FONTS.map((font) => (
                  <AnimatedPressable
                    key={font.key}
                    onPress={() => setSelectedFont(font.key)}
                    style={{
                      backgroundColor: selectedFont === font.key ? `${selectedColor}15` : COLORS.surface,
                      borderRadius: 14,
                      padding: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderWidth: 1.5,
                      borderColor: selectedFont === font.key ? selectedColor : COLORS.border,
                    }}
                  >
                    <View>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: COLORS.textSecondary }}>{font.label}</Text>
                      <Text style={{ fontSize: 18, color: COLORS.text, marginTop: 2 }}>{font.preview}</Text>
                    </View>
                    {selectedFont === font.key && <Check size={18} color={selectedColor} />}
                  </AnimatedPressable>
                ))}
              </View>
            </View>

            {error ? (
              <Text style={{ color: COLORS.error, fontSize: 14, textAlign: "center" }}>{error}</Text>
            ) : null}

            <AnimatedPressable
              onPress={handleCreate}
              disabled={loading}
              style={{
                backgroundColor: selectedColor,
                borderRadius: 16,
                paddingVertical: 14,
                alignItems: "center",
                boxShadow: `0 4px 16px ${selectedColor}40`,
              }}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Create Our Story 💕</Text>
              }
            </AnimatedPressable>

            <AnimatedPressable onPress={() => setMode("choose")} style={{ alignItems: "center", paddingVertical: 8 }}>
              <Text style={{ color: COLORS.textSecondary, fontWeight: "600" }}>← Back</Text>
            </AnimatedPressable>
          </View>
        )}

        {mode === "join" && (
          <View style={{ gap: 20 }}>
            <Text style={{ fontSize: 22, fontWeight: "900", color: COLORS.text }}>
              Join Your Partner 🔗
            </Text>
            <Text style={{ fontSize: 15, color: COLORS.textSecondary, lineHeight: 22 }}>
              Ask your partner for their invite code and enter it below.
            </Text>
            <TextInput
              placeholder="Enter invite code"
              placeholderTextColor={COLORS.textMuted}
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
              style={{
                backgroundColor: COLORS.surface,
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: COLORS.border,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 20,
                fontWeight: "700",
                color: COLORS.text,
                textAlign: "center",
                letterSpacing: 4,
              }}
            />
            {error ? (
              <Text style={{ color: COLORS.error, fontSize: 14, textAlign: "center" }}>{error}</Text>
            ) : null}
            <AnimatedPressable
              onPress={handleJoin}
              disabled={loading}
              style={{
                backgroundColor: COLORS.primary,
                borderRadius: 16,
                paddingVertical: 14,
                alignItems: "center",
                boxShadow: "0 4px 16px rgba(255,107,157,0.4)",
              }}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Join 💕</Text>
              }
            </AnimatedPressable>
            <AnimatedPressable onPress={() => setMode("choose")} style={{ alignItems: "center", paddingVertical: 8 }}>
              <Text style={{ color: COLORS.textSecondary, fontWeight: "600" }}>← Back</Text>
            </AnimatedPressable>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
