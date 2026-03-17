import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Animated,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, ShieldCheck, Phone, CheckCircle } from "lucide-react-native";
import { COLORS, FONTS } from "@/constants/Together";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { LoadingButton } from "@/components/LoadingButton";
import { authenticatedGet, authenticatedPost } from "@/utils/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Step = "phone" | "code" | "success";

export default function TwoFactorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [sendLoading, setSendLoading] = useState(false);

  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [codeError, setCodeError] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const digitRefs = useRef<(TextInput | null)[]>([]);

  // Fade-in animation for each step
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  const successScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(16);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 320, useNativeDriver: true }),
    ]).start();
  }, [step]);

  useEffect(() => {
    if (step === "success") {
      Animated.spring(successScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 14,
        bounciness: 10,
      }).start();
    }
  }, [step]);

  const handleSendCode = async () => {
    const trimmed = phone.trim();
    if (!trimmed) {
      setPhoneError("Please enter your phone number");
      return;
    }
    console.log("[2FA] Send code pressed, phone:", trimmed);
    setSendLoading(true);
    setPhoneError("");
    try {
      const res = await authenticatedPost("/api/2fa/send", { phone: trimmed });
      console.log("[2FA] Send code response:", res);
      setStep("code");
    } catch (e: any) {
      console.error("[2FA] Send code error:", e);
      setPhoneError(e?.message || "Failed to send code. Please try again.");
    } finally {
      setSendLoading(false);
    }
  };

  const handleResend = async () => {
    console.log("[2FA] Resend code pressed, phone:", phone.trim());
    setResendLoading(true);
    setCodeError("");
    try {
      await authenticatedPost("/api/2fa/send", { phone: phone.trim() });
      console.log("[2FA] Resend successful");
    } catch (e: any) {
      console.error("[2FA] Resend error:", e);
      setCodeError("Failed to resend code. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerify = async () => {
    const code = digits.join("");
    if (code.length < 6) {
      setCodeError("Please enter all 6 digits");
      return;
    }
    console.log("[2FA] Verify pressed, phone:", phone.trim(), "code:", code);
    setVerifyLoading(true);
    setCodeError("");
    try {
      const res = await authenticatedPost("/api/2fa/verify", { phone: phone.trim(), code });
      console.log("[2FA] Verify response:", res);
      setStep("success");
    } catch (e: any) {
      console.error("[2FA] Verify error:", e);
      setCodeError(e?.message || "Invalid code. Please try again.");
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleDigitChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    setCodeError("");
    if (digit && index < 5) {
      digitRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !digits[index] && index > 0) {
      const newDigits = [...digits];
      newDigits[index - 1] = "";
      setDigits(newDigits);
      digitRefs.current[index - 1]?.focus();
    }
  };

  const codeSentTo = phone.trim();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingBottom: 16,
          paddingHorizontal: 20,
          backgroundColor: COLORS.surface,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.borderLight,
        }}
      >
        <AnimatedPressable
          onPress={() => {
            console.log("[2FA] Back button pressed");
            router.back();
          }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: COLORS.surfaceAlt,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ArrowLeft size={20} color={COLORS.text} />
        </AnimatedPressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "800", color: COLORS.text, fontFamily: FONTS.extraBold }}>
            Two-Factor Authentication
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.textSecondary, fontFamily: FONTS.regular }}>
            Secure your account with SMS
          </Text>
        </View>
        <ShieldCheck size={22} color={COLORS.primary} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Step 1: Enter Phone */}
          {step === "phone" && (
            <View style={{ gap: 24 }}>
              {/* Illustration card */}
              <View
                style={{
                  backgroundColor: COLORS.surface,
                  borderRadius: 20,
                  padding: 28,
                  alignItems: "center",
                  gap: 12,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  boxShadow: COLORS.cardShadow,
                }}
              >
                <View
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    backgroundColor: `${COLORS.primary}18`,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 4,
                  }}
                >
                  <Phone size={32} color={COLORS.primary} />
                </View>
                <Text style={{ fontSize: 20, fontWeight: "800", color: COLORS.text, textAlign: "center", fontFamily: FONTS.extraBold }}>
                  Verify your phone
                </Text>
                <Text style={{ fontSize: 15, color: COLORS.textSecondary, textAlign: "center", lineHeight: 22, fontFamily: FONTS.regular }}>
                  We'll send a 6-digit code to confirm your number and keep your account safe.
                </Text>
              </View>

              {/* Phone input */}
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.textSecondary, fontFamily: FONTS.bold, letterSpacing: 0.3 }}>
                  PHONE NUMBER
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: COLORS.surface,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: phoneError ? COLORS.error : COLORS.border,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 14,
                      backgroundColor: COLORS.surfaceAlt,
                      borderRightWidth: 1,
                      borderRightColor: COLORS.border,
                    }}
                  >
                    <Text style={{ fontSize: 15, color: COLORS.textSecondary, fontFamily: FONTS.bold }}>+1</Text>
                  </View>
                  <TextInput
                    value={phone}
                    onChangeText={(t) => { setPhone(t); setPhoneError(""); }}
                    placeholder="(555) 000-0000"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="phone-pad"
                    returnKeyType="done"
                    onSubmitEditing={handleSendCode}
                    autoFocus
                    style={{
                      flex: 1,
                      paddingHorizontal: 14,
                      paddingVertical: 14,
                      fontSize: 16,
                      color: COLORS.text,
                      fontFamily: FONTS.semiBold,
                    }}
                  />
                </View>
                {phoneError ? (
                  <Text style={{ fontSize: 13, color: COLORS.error, fontFamily: FONTS.regular }}>
                    {phoneError}
                  </Text>
                ) : null}
              </View>

              <LoadingButton
                title="Send Code"
                loading={sendLoading}
                onPress={handleSendCode}
                style={{ backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 15 }}
                loadingColor="#fff"
              />
            </View>
          )}

          {/* Step 2: Enter Code */}
          {step === "code" && (
            <View style={{ gap: 24 }}>
              {/* Info card */}
              <View
                style={{
                  backgroundColor: COLORS.surface,
                  borderRadius: 20,
                  padding: 24,
                  alignItems: "center",
                  gap: 8,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  boxShadow: COLORS.cardShadow,
                }}
              >
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: `${COLORS.primary}18`,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 4,
                  }}
                >
                  <Text style={{ fontSize: 28 }}>💬</Text>
                </View>
                <Text style={{ fontSize: 18, fontWeight: "800", color: COLORS.text, textAlign: "center", fontFamily: FONTS.extraBold }}>
                  Enter the code
                </Text>
                <Text style={{ fontSize: 14, color: COLORS.textSecondary, textAlign: "center", lineHeight: 20, fontFamily: FONTS.regular }}>
                  Code sent to
                </Text>
                <Text style={{ fontSize: 15, fontWeight: "700", color: COLORS.primary, fontFamily: FONTS.bold }}>
                  {codeSentTo}
                </Text>
              </View>

              {/* 6-digit inputs */}
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.textSecondary, fontFamily: FONTS.bold, letterSpacing: 0.3, textAlign: "center" }}>
                  VERIFICATION CODE
                </Text>
                <View style={{ flexDirection: "row", gap: 10, justifyContent: "center" }}>
                  {digits.map((digit, i) => (
                    <TextInput
                      key={i}
                      ref={(r) => { digitRefs.current[i] = r; }}
                      value={digit}
                      onChangeText={(t) => handleDigitChange(t, i)}
                      onKeyPress={({ nativeEvent }) => handleDigitKeyPress(nativeEvent.key, i)}
                      keyboardType="number-pad"
                      maxLength={1}
                      selectTextOnFocus
                      style={{
                        width: 48,
                        height: 56,
                        borderRadius: 14,
                        borderWidth: 2,
                        borderColor: digit ? COLORS.primary : codeError ? COLORS.error : COLORS.border,
                        backgroundColor: digit ? `${COLORS.primary}10` : COLORS.surface,
                        textAlign: "center",
                        fontSize: 22,
                        fontWeight: "800",
                        color: COLORS.text,
                        fontFamily: FONTS.black,
                      }}
                    />
                  ))}
                </View>
                {codeError ? (
                  <Text style={{ fontSize: 13, color: COLORS.error, textAlign: "center", fontFamily: FONTS.regular }}>
                    {codeError}
                  </Text>
                ) : null}
              </View>

              <LoadingButton
                title="Verify Phone"
                loading={verifyLoading}
                onPress={handleVerify}
                style={{ backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 15 }}
                loadingColor="#fff"
              />

              {/* Resend */}
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 14, color: COLORS.textSecondary, fontFamily: FONTS.regular }}>
                  Didn't receive it?
                </Text>
                <AnimatedPressable
                  onPress={handleResend}
                  disabled={resendLoading}
                  style={{ paddingVertical: 8, paddingHorizontal: 16 }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "700", color: resendLoading ? COLORS.textMuted : COLORS.primary, fontFamily: FONTS.bold }}>
                    {resendLoading ? "Sending..." : "Resend code"}
                  </Text>
                </AnimatedPressable>
              </View>

              {/* Change number */}
              <AnimatedPressable
                onPress={() => {
                  console.log("[2FA] Change number pressed");
                  setDigits(["", "", "", "", "", ""]);
                  setCodeError("");
                  setStep("phone");
                }}
                style={{ alignItems: "center", paddingVertical: 4 }}
              >
                <Text style={{ fontSize: 13, color: COLORS.textSecondary, fontFamily: FONTS.regular }}>
                  Wrong number? Change it
                </Text>
              </AnimatedPressable>
            </View>
          )}

          {/* Step 3: Success */}
          {step === "success" && (
            <View style={{ gap: 24, alignItems: "center", paddingTop: 20 }}>
              <Animated.View
                style={{
                  transform: [{ scale: successScale }],
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: `${COLORS.success}20`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CheckCircle size={52} color={COLORS.success} />
              </Animated.View>

              <View style={{ alignItems: "center", gap: 8 }}>
                <Text style={{ fontSize: 26, fontWeight: "900", color: COLORS.text, textAlign: "center", fontFamily: FONTS.black }}>
                  Phone verified!
                </Text>
                <Text style={{ fontSize: 22 }}>💕</Text>
                <Text style={{ fontSize: 15, color: COLORS.textSecondary, textAlign: "center", lineHeight: 22, fontFamily: FONTS.regular, maxWidth: 280 }}>
                  Your account is now protected with two-factor authentication.
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: COLORS.surface,
                  borderRadius: 16,
                  padding: 20,
                  width: "100%",
                  borderWidth: 1,
                  borderColor: `${COLORS.success}30`,
                  boxShadow: `0 4px 16px ${COLORS.success}15`,
                  gap: 6,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.textSecondary, fontFamily: FONTS.bold }}>
                  VERIFIED NUMBER
                </Text>
                <Text style={{ fontSize: 16, fontWeight: "700", color: COLORS.text, fontFamily: FONTS.bold }}>
                  {codeSentTo}
                </Text>
              </View>

              <AnimatedPressable
                onPress={() => {
                  console.log("[2FA] Done pressed, navigating back");
                  router.back();
                }}
                style={{
                  backgroundColor: COLORS.primary,
                  borderRadius: 14,
                  paddingVertical: 15,
                  paddingHorizontal: 48,
                  alignItems: "center",
                  boxShadow: `0 4px 16px ${COLORS.primary}40`,
                  width: "100%",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16, fontFamily: FONTS.extraBold }}>
                  Done
                </Text>
              </AnimatedPressable>
            </View>
          )}

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
