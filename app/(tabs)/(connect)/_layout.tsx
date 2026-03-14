import { Stack } from 'expo-router';
import { COLORS } from '@/constants/Together';

export default function ConnectLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="log-mood"
        options={{
          headerShown: true,
          title: 'Log Your Mood',
          headerBackButtonDisplayMode: 'minimal',
          headerTintColor: COLORS.primary,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="add-vent"
        options={{
          headerShown: true,
          title: 'Add Vent',
          headerBackButtonDisplayMode: 'minimal',
          headerTintColor: COLORS.primary,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="add-activity"
        options={{
          headerShown: true,
          title: 'Log Activity',
          headerBackButtonDisplayMode: 'minimal',
          headerTintColor: COLORS.primary,
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
