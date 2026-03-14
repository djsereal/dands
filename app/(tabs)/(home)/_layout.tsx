import { Stack } from 'expo-router';
import { COLORS } from '@/constants/Together';

export default function HomeLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="couple-setup"
        options={{
          headerShown: true,
          title: 'Start Your Story',
          headerBackButtonDisplayMode: 'minimal',
          headerTintColor: COLORS.primary,
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          headerShown: true,
          title: 'Couple Settings',
          headerBackButtonDisplayMode: 'minimal',
          headerTintColor: COLORS.primary,
        }}
      />
    </Stack>
  );
}
