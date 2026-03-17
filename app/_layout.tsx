import "react-native-reanimated";
import React, { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useColorScheme, Text, TextInput } from "react-native";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider as TogetherThemeProvider } from "@/contexts/ThemeContext";
import {
  useFonts,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
  Nunito_400Regular_Italic,
  Nunito_700Bold_Italic,
} from "@expo-google-fonts/nunito";

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

// Routes that are accessible without authentication
const PUBLIC_ROUTES = ["auth-screen", "auth-popup", "auth-callback"];

function NavigationGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const currentRoute = segments[0] as string | undefined;
    const isPublicRoute = currentRoute ? PUBLIC_ROUTES.includes(currentRoute) : false;

    if (!user && !isPublicRoute) {
      console.log("[NavigationGuard] No user, redirecting to auth-screen from:", currentRoute);
      router.replace("/auth-screen");
    } else if (user && currentRoute === "auth-screen") {
      console.log("[NavigationGuard] User authenticated, redirecting to tabs");
      router.replace("/(tabs)/(home)");
    }
  }, [user, loading, segments]);

  return <>{children}</>;
}

function RootLayoutInner() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
    Nunito_400Regular_Italic,
    Nunito_700Bold_Italic,
    // Keep SpaceMono for ErrorBoundary monospace fallback
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  // Apply Nunito as the default font for all Text and TextInput components globally
  const defaultTextStyle: any = { fontFamily: "Nunito_400Regular" };
  if ((Text as any).defaultProps == null) (Text as any).defaultProps = {};
  (Text as any).defaultProps.style = defaultTextStyle;
  if ((TextInput as any).defaultProps == null) (TextInput as any).defaultProps = {};
  (TextInput as any).defaultProps.style = defaultTextStyle;

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
              <Stack.Screen
                name="two-factor"
                options={{
                  headerShown: false,
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
