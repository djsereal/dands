import { Stack } from 'expo-router';
import { COLORS } from '@/constants/Together';

export default function JournalLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="add-journal"
        options={{
          headerShown: true,
          title: 'New Journal Entry',
          headerBackButtonDisplayMode: 'minimal',
          headerTintColor: COLORS.primary,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="tip-detail"
        options={{
          headerShown: true,
          title: 'Tip',
          headerBackButtonDisplayMode: 'minimal',
          headerTintColor: COLORS.primary,
        }}
      />
    </Stack>
  );
}
