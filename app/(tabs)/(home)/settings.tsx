import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { authenticatedGet, authenticatedPatch, authenticatedPost } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { useAppTheme } from "@/contexts/ThemeContext";
import { COLORS, THEME_COLORS, THEME_FONTS, formatDate } from "@/constants/Together";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { LoadingButton } from "@/components/LoadingButton";
import { Copy, Check, Calendar, LogOut, Palette, Type, Mail, ShieldCheck, ChevronRight } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { themeColor, themeFont, anniversaryDate, inviteCode, refreshCouple, updateTheme } = useAppTheme();
  const { width } = useWindowDimensions();

  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [selectedColor, setSelectedColor] = useState(themeColor);
  const [selectedFont, setSelectedFont] = useState(themeFont);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [anniversary, setAnniversary] = useState(
    anniversaryDate ? new Date(anniversaryDate) : new Date()
  );
  const [saved, setSaved] = useState(false);

  // Email invite
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<"idle" | "success" | "error">("idle");
  const [inviteError, setInviteError] = useState("");

  // 2FA status
  const [twoFaVerified, setTwoFaVerified] = useState<boolean | null>(null);

  useEffect(() => {
    const fetch2FAStatus = async () => {
      console.log("[Settings] Fetching 2FA status");
      try {
        const res = await authenticatedGet<{ phone: string | null; phone_verified: boolean }>("/api/2fa/status");
        console.log("[Settings] 2FA status:", res);
        setTwoFaVerified(res.phone_verified);
      } catch (e) {
        console.error("[Settings] Failed to fetch 2FA status:", e);
        setTwoFaVerified(false);
      }
    };
    fetch2FAStatus();
  }, []);

  const handleEmailInvite = async () => {
    if (!inviteEmail.trim()) {
      setInviteError("Please enter an email address");
      return;
    }
    console.log("[Settings] Send invite pressed, email:", inviteEmail.trim());
    setInviteLoading(true);
    setInviteStatus("idle");
    setInviteError("");
    try {
      await authenticatedPost("/api/couples/invite", { email: inviteEmail.trim() });
      console.log("[Settings] Invite sent successfully");
      setInviteStatus("success");
      setInviteEmail("");
    } catch (e: any) {
      console.error("[Settings] Invite error:", e);
      setInviteStatus("error");
      setInviteError(e?.message || "Failed to send invite");
    } finally {
      setInviteLoading(false);
    }
  };

  const maxWidth = Math.min(width, 600);

  const handleSave = async () => {
    console.log("[Settings] Save pressed, color:", selectedColor, "font:", selectedFont);
    setLoading(true);
    try {
      await authenticatedPatch("/api/couples/me", {
        theme_color: selectedColor,
        theme_font: selectedFont,
        anniversary_date: anniversary.toISOString().split("T")[0],
      });
      await updateTheme(selectedColor, selectedFont);
      await refreshCouple();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error("[Settings] Save error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (inviteCode) {
      await Clipboard.setStringAsync(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSignOut = async () => {
    console.log("[Settings] Sign out confirmed");
    setShowSignOutModal(false);
    await signOut();
    router.replace("/auth-screen");
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
    >
      <View style={{ maxWidth, width: "100%", alignSelf: "center", gap: 20 }}>

        {/* Anniversary Date */}
        <View style={{ backgroundColor: COLORS.surface, borderRadius: 20, padding: 20, boxShadow: COLORS.cardShadow }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Calendar size={18} color={selectedColor} />
            <Text style={{ fontSize: 16, fontWeight: "800", color: COLORS.text }}>Anniversary Date</Text>
          </View>
          <AnimatedPressable
            onPress={() => setShowDatePicker(true)}
            style={{
              backgroundColor: COLORS.surfaceAlt,
              borderRadius: 12,
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Text style={{ fontSize: 15, color: COLORS.text, flex: 1 }}>
              {formatDate(anniversary.toISOString())}
            </Text>
          </AnimatedPressable>
          {(showDatePicker || Platform.OS !== "ios") && (
            <DateTimePicker
              value={anniversary}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              maximumDate={new Date()}
              onChange={(_, date) => {
                setShowDatePicker(false);
                if (date) setAnniversary(date);
              }}
            />
          )}
        </View>

        {/* Theme Color */}
        <View style={{ backgroundColor: COLORS.surface, borderRadius: 20, padding: 20, boxShadow: COLORS.cardShadow }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Palette size={18} color={selectedColor} />
            <Text style={{ fontSize: 16, fontWeight: "800", color: COLORS.text }}>Theme Color</Text>
          </View>
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

        {/* Font */}
        <View style={{ backgroundColor: COLORS.surface, borderRadius: 20, padding: 20, boxShadow: COLORS.cardShadow }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Type size={18} color={selectedColor} />
            <Text style={{ fontSize: 16, fontWeight: "800", color: COLORS.text }}>Font Style</Text>
          </View>
          <View style={{ gap: 8 }}>
            {THEME_FONTS.map((font) => (
              <AnimatedPressable
                key={font.key}
                onPress={() => setSelectedFont(font.key)}
                style={{
                  backgroundColor: selectedFont === font.key ? `${selectedColor}15` : COLORS.surfaceAlt,
                  borderRadius: 12,
                  padding: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderWidth: 1.5,
                  borderColor: selectedFont === font.key ? selectedColor : "transparent",
                }}
              >
                <View>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: COLORS.textSecondary }}>{font.label}</Text>
                  <Text style={{ fontSize: 17, color: COLORS.text }}>{font.preview}</Text>
                </View>
                {selectedFont === font.key && <Check size={16} color={selectedColor} />}
              </AnimatedPressable>
            ))}
          </View>
        </View>

        {/* Invite Code */}
        {inviteCode ? (
          <View style={{ backgroundColor: COLORS.surface, borderRadius: 20, padding: 20, boxShadow: COLORS.cardShadow }}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: COLORS.text, marginBottom: 14 }}>
              Invite Code
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Text style={{ fontSize: 24, fontWeight: "900", color: COLORS.primary, letterSpacing: 4, flex: 1 }}>
                {inviteCode}
              </Text>
              <AnimatedPressable
                onPress={handleCopy}
                style={{
                  backgroundColor: copied ? COLORS.success : selectedColor,
                  borderRadius: 10,
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {copied ? <Check size={14} color="#fff" /> : <Copy size={14} color="#fff" />}
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>
                  {copied ? "Copied!" : "Copy"}
                </Text>
              </AnimatedPressable>
            </View>
          </View>
        ) : null}

        {/* Invite Partner by Email */}
        <View style={{ backgroundColor: COLORS.surface, borderRadius: 20, padding: 20, boxShadow: COLORS.cardShadow }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Mail size={18} color={selectedColor} />
            <Text style={{ fontSize: 16, fontWeight: "800", color: COLORS.text }}>Invite Partner by Email</Text>
          </View>
          <TextInput
            placeholder="partner@email.com"
            placeholderTextColor={COLORS.textMuted}
            value={inviteEmail}
            onChangeText={(t) => { setInviteEmail(t); setInviteStatus("idle"); setInviteError(""); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={{
              backgroundColor: COLORS.surfaceAlt,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: COLORS.border,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 15,
              color: COLORS.text,
              marginBottom: 12,
            }}
          />
          {inviteStatus === "success" ? (
            <Text style={{ color: COLORS.success, fontSize: 14, fontWeight: "600", textAlign: "center", marginBottom: 8 }}>
              Invite sent! 💕
            </Text>
          ) : inviteStatus === "error" ? (
            <Text style={{ color: COLORS.error, fontSize: 14, textAlign: "center", marginBottom: 8 }}>
              {inviteError}
            </Text>
          ) : null}
          <LoadingButton
            title="Send Invite"
            loading={inviteLoading}
            onPress={handleEmailInvite}
            style={{ backgroundColor: selectedColor }}
            loadingColor="#fff"
          />
        </View>

        {/* Two-Factor Authentication */}
        <AnimatedPressable
          onPress={() => {
            console.log("[Settings] Two-Factor Authentication row pressed");
            router.push("/two-factor");
          }}
          style={{
            backgroundColor: COLORS.surface,
            borderRadius: 20,
            padding: 20,
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            boxShadow: COLORS.cardShadow,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: `${selectedColor}18`,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShieldCheck size={20} color={selectedColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "800", color: COLORS.text }}>
              Two-Factor Authentication
            </Text>
            {twoFaVerified === null ? (
              <Text style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 2 }}>
                Loading...
              </Text>
            ) : twoFaVerified ? (
              <Text style={{ fontSize: 13, color: COLORS.success, fontWeight: "700", marginTop: 2 }}>
                Enabled ✓
              </Text>
            ) : (
              <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 2 }}>
                Not set up
              </Text>
            )}
          </View>
          <ChevronRight size={18} color={COLORS.textMuted} />
        </AnimatedPressable>

        {/* Save Button */}
        <AnimatedPressable
          onPress={handleSave}
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
            : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                {saved ? "Saved! ✓" : "Save Changes"}
              </Text>
          }
        </AnimatedPressable>

        {/* Sign Out */}
        <AnimatedPressable
          onPress={() => setShowSignOutModal(true)}
          style={{
            backgroundColor: COLORS.surface,
            borderRadius: 16,
            paddingVertical: 14,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
            borderWidth: 1.5,
            borderColor: COLORS.error + "40",
          }}
        >
          <LogOut size={18} color={COLORS.error} />
          <Text style={{ color: COLORS.error, fontWeight: "700", fontSize: 16 }}>Sign Out</Text>
        </AnimatedPressable>
      </View>

      {/* Sign Out Confirmation Modal */}
      <Modal visible={showSignOutModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 }}>
          <View style={{ backgroundColor: COLORS.surface, borderRadius: 24, padding: 28, width: "100%", maxWidth: 360 }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: COLORS.text, textAlign: "center", marginBottom: 8 }}>
              Sign Out?
            </Text>
            <Text style={{ fontSize: 15, color: COLORS.textSecondary, textAlign: "center", marginBottom: 24, lineHeight: 22 }}>
              You'll need to sign in again to access your Together account.
            </Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <AnimatedPressable
                onPress={() => setShowSignOutModal(false)}
                style={{ flex: 1, backgroundColor: COLORS.surfaceAlt, borderRadius: 14, paddingVertical: 13, alignItems: "center" }}
              >
                <Text style={{ fontWeight: "700", color: COLORS.text }}>Cancel</Text>
              </AnimatedPressable>
              <AnimatedPressable
                onPress={handleSignOut}
                style={{ flex: 1, backgroundColor: COLORS.error, borderRadius: 14, paddingVertical: 13, alignItems: "center" }}
              >
                <Text style={{ fontWeight: "700", color: "#fff" }}>Sign Out</Text>
              </AnimatedPressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
