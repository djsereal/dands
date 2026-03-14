import React from "react";
import { View, Text, Pressable, Platform } from "react-native";
import { Tabs, useRouter, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { COLORS } from "@/constants/Together";
import { useAppTheme } from "@/contexts/ThemeContext";
import { Home, Image, Heart, CheckCircle, BookOpen } from "lucide-react-native";

const TABS = [
  { name: "(home)", label: "Home", icon: Home, route: "/(tabs)/(home)" },
  { name: "(memories)", label: "Memories", icon: Image, route: "/(tabs)/(memories)" },
  { name: "(connect)", label: "Connect", icon: Heart, route: "/(tabs)/(connect)" },
  { name: "(goals)", label: "Goals", icon: CheckCircle, route: "/(tabs)/(goals)" },
  { name: "(journal)", label: "Journal", icon: BookOpen, route: "/(tabs)/(journal)" },
];

function TogetherTabBar() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();
  const { themeColor } = useAppTheme();

  return (
    <View style={{
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      paddingBottom: insets.bottom,
      backgroundColor: "rgba(255,255,255,0.95)",
      borderTopWidth: 1,
      borderTopColor: "rgba(255,107,157,0.12)",
      boxShadow: "0 -4px 20px rgba(255,107,157,0.1)",
    }}>
      <View style={{ flexDirection: "row", paddingTop: 8, paddingBottom: 4 }}>
        {TABS.map((tab) => {
          const isActive = pathname.includes(tab.name.replace(/[()]/g, ""));
          const Icon = tab.icon;
          return (
            <Pressable
              key={tab.name}
              onPress={() => {
                console.log("[Nav] Tab pressed:", tab.label);
                router.push(tab.route as any);
              }}
              style={{ flex: 1, alignItems: "center", paddingVertical: 6, gap: 3 }}
            >
              <Icon
                size={24}
                color={isActive ? themeColor : COLORS.textMuted}
                fill={isActive ? themeColor : "transparent"}
              />
              <Text style={{
                fontSize: 10,
                fontWeight: isActive ? "700" : "500",
                color: isActive ? themeColor : COLORS.textMuted,
                letterSpacing: 0.2,
              }}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={() => <TogetherTabBar />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="(home)" />
      <Tabs.Screen name="(memories)" />
      <Tabs.Screen name="(connect)" />
      <Tabs.Screen name="(goals)" />
      <Tabs.Screen name="(journal)" />
    </Tabs>
  );
}
