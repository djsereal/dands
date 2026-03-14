import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Pressable,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { COLORS } from "@/constants/Together";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Heart, Mail, Lock, User, Eye, EyeOff, ChevronDown } from "lucide-react-native";

export default function AuthScreen() {
  const { user, loading, signInWithEmail, signUpWithEmail, signInWithApple, signInWithGoogle } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [emailExpanded, setEmailExpanded] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState("");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 100 }),
    ]).start();
  }, []);

  useEffect(() => {
    if (user) {
      router.replace("/(tabs)/(home)");
    }
  }, [user]);

  const handleEmailAuth = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    console.log("[Auth] Email auth pressed, mode:", mode);
    setError("");
    setAuthLoading(true);
    try {
      if (mode === "signup") {
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (e: any) {
      console.error("[Auth] Email auth error:", e);
      setError(e?.message || "Authentication failed. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleApple = async () => {
    console.log("[Auth] Apple sign in pressed");
    setError("");
    setAuthLoading(true);
    try {
      await signInWithApple();
    } catch (e: any) {
      console.error("[Auth] Apple sign in error:", e);
      setError(e?.message || "Apple sign in failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogle = async () => {
    console.log("[Auth] Google sign in pressed");
    setError("");
    setAuthLoading(true);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      console.error("[Auth] Google sign in error:", e);
      setError(e?.message || "Google sign in failed");
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.primary }}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: COLORS.background }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Gradient Header */}
        <View
          style={{
            backgroundColor: COLORS.primary,
            paddingTop: 80,
            paddingBottom: 60,
            paddingHorizontal: 32,
            alignItems: "center",
            borderBottomLeftRadius: 40,
            borderBottomRightRadius: 40,
          }}
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], alignItems: "center" }}>
            <View style={{
              width: 80, height: 80, borderRadius: 40,
              backgroundColor: "rgba(255,255,255,0.25)",
              alignItems: "center", justifyContent: "center",
              marginBottom: 16,
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            }}>
              <Heart size={40} color="#fff" fill="#fff" />
            </View>
            <Text style={{ fontSize: 40, fontWeight: "900", color: "#fff", letterSpacing: -1 }}>
              Together
            </Text>
            <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.9)", marginTop: 8, fontWeight: "500", textAlign: "center" }}>
              Your love story, beautifully tracked
            </Text>
          </Animated.View>
        </View>

        <View style={{ padding: 24, maxWidth: 480, width: "100%", alignSelf: "center" }}>
          {/* Mode Toggle */}
          <View style={{
            flexDirection: "row",
            backgroundColor: COLORS.surfaceAlt,
            borderRadius: 14,
            padding: 4,
            marginBottom: 24,
          }}>
            {(["signin", "signup"] as const).map((m) => {
              const isActive = mode === m;
              return (
                <AnimatedPressable
                  key={m}
                  onPress={() => { setMode(m); setError(""); }}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 11,
                    alignItems: "center",
                    backgroundColor: isActive ? COLORS.primary : "transparent",
                    boxShadow: isActive ? "0 2px 8px rgba(255,107,157,0.3)" : undefined,
                  }}
                >
                  <Text style={{ color: isActive ? "#fff" : COLORS.textSecondary, fontWeight: "700", fontSize: 15 }}>
                    {m === "signin" ? "Sign In" : "Sign Up"}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </View>

          {/* Apple Sign In — FIRST per App Store requirement */}
          <AnimatedPressable
            onPress={handleApple}
            disabled={authLoading}
            style={{
              backgroundColor: "#000",
              borderRadius: 16,
              paddingVertical: 14,
              paddingHorizontal: 20,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              marginBottom: 12,
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            }}
          >
            <Text style={{ fontSize: 20, lineHeight: 24 }}>🍎</Text>
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
              Continue with Apple
            </Text>
          </AnimatedPressable>

          {/* Google Sign In */}
          <AnimatedPressable
            onPress={handleGoogle}
            disabled={authLoading}
            style={{
              backgroundColor: COLORS.surface,
              borderRadius: 16,
              paddingVertical: 14,
              paddingHorizontal: 20,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              marginBottom: 16,
              borderWidth: 1.5,
              borderColor: COLORS.border,
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <Text style={{ fontSize: 20, lineHeight: 24 }}>🌐</Text>
            <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: "700" }}>
              Continue with Google
            </Text>
          </AnimatedPressable>

          {/* Divider */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 12 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
            <Text style={{ color: COLORS.textMuted, fontSize: 13, fontWeight: "600" }}>or</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
          </View>

          {/* Email Collapsible */}
          <AnimatedPressable
            onPress={() => setEmailExpanded(!emailExpanded)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              paddingVertical: 12,
              marginBottom: emailExpanded ? 16 : 0,
            }}
          >
            <Mail size={18} color={COLORS.primary} />
            <Text style={{ color: COLORS.primary, fontWeight: "700", fontSize: 15 }}>
              Continue with Email
            </Text>
            <ChevronDown
              size={18}
              color={COLORS.primary}
              style={{ transform: [{ rotate: emailExpanded ? "180deg" : "0deg" }] }}
            />
          </AnimatedPressable>

          {emailExpanded && (
            <View style={{ gap: 12 }}>
              {mode === "signup" && (
                <View style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: COLORS.surface,
                  borderRadius: 14,
                  borderWidth: 1.5,
                  borderColor: COLORS.border,
                  paddingHorizontal: 16,
                  gap: 10,
                }}>
                  <User size={18} color={COLORS.textSecondary} />
                  <TextInput
                    placeholder="Your name"
                    placeholderTextColor={COLORS.textMuted}
                    value={name}
                    onChangeText={setName}
                    style={{ flex: 1, paddingVertical: 14, fontSize: 16, color: COLORS.text }}
                  />
                </View>
              )}
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: COLORS.surface,
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: COLORS.border,
                paddingHorizontal: 16,
                gap: 10,
              }}>
                <Mail size={18} color={COLORS.textSecondary} />
                <TextInput
                  placeholder="Email address"
                  placeholderTextColor={COLORS.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={{ flex: 1, paddingVertical: 14, fontSize: 16, color: COLORS.text }}
                />
              </View>
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: COLORS.surface,
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: COLORS.border,
                paddingHorizontal: 16,
                gap: 10,
              }}>
                <Lock size={18} color={COLORS.textSecondary} />
                <TextInput
                  placeholder="Password"
                  placeholderTextColor={COLORS.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  style={{ flex: 1, paddingVertical: 14, fontSize: 16, color: COLORS.text }}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  {showPassword
                    ? <EyeOff size={18} color={COLORS.textSecondary} />
                    : <Eye size={18} color={COLORS.textSecondary} />
                  }
                </Pressable>
              </View>

              {error ? (
                <Text style={{ color: COLORS.error, fontSize: 14, textAlign: "center", fontWeight: "500" }}>
                  {error}
                </Text>
              ) : null}

              <AnimatedPressable
                onPress={handleEmailAuth}
                disabled={authLoading}
                style={{
                  backgroundColor: COLORS.primary,
                  borderRadius: 16,
                  paddingVertical: 14,
                  alignItems: "center",
                  boxShadow: "0 4px 16px rgba(255,107,157,0.4)",
                }}
              >
                {authLoading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                      {mode === "signin" ? "Sign In 💕" : "Create Account 💕"}
                    </Text>
                }
              </AnimatedPressable>
            </View>
          )}

          <Text style={{ textAlign: "center", color: COLORS.textMuted, fontSize: 12, marginTop: 24, lineHeight: 18 }}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
