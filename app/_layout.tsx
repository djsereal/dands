import "react-native-reanimated";
import React, { useEffect } from "react";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider as TogetherThemeProvider } from "@/contexts/ThemeContext";

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

function NavigationGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const inAuthScreen = segments[0] === "auth-screen";
    const inAuthPopup = segments[0] === "auth-popup";
    const inAuthCallback = segments[0] === "auth-callback";
    if (!user && !inAuthScreen && !inAuthPopup && !inAuthCallback) {
      router.replace("/auth-screen");
    }
  }, [user, loading, segments]);

  return <>{children}</>;
}

function RootLayoutInner() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <NavigationGuard>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="auth-screen" options={{ headerShown: false }} />
              <Stack.Screen name="auth-popup" options={{ headerShown: false }} />
              <Stack.Screen name="auth-callback" options={{ headerShown: false }} />
              <Stack.Screen
                name="intimacy"
                options={{
                  title: "Intimacy Hub",
                  headerShown: true,
                  presentation: "modal",
                }}
              />
              <Stack.Screen
                name="log-satisfaction"
                options={{
                  title: "Log Satisfaction",
                  headerShown: true,
                  presentation: "modal",
                }}
              />
              <Stack.Screen
                name="add-fantasy"
                options={{
                  title: "Share a Fantasy",
                  headerShown: true,
                  presentation: "modal",
                }}
              />
            </Stack>
          </NavigationGuard>
          <SystemBars style="auto" />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <TogetherThemeProvider>
        <RootLayoutInner />
      </TogetherThemeProvider>
    </AuthProvider>
  );
}
