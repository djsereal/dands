import { Stack } from 'expo-router';
import { COLORS } from '@/constants/Together';

export default function GoalsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="add-goal"
        options={{
          headerShown: true,
          title: 'Add Goal',
          headerBackButtonDisplayMode: 'minimal',
          headerTintColor: COLORS.primary,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="add-todo"
        options={{
          headerShown: true,
          title: 'Add To-Do',
          headerBackButtonDisplayMode: 'minimal',
          headerTintColor: COLORS.primary,
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
