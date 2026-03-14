import { Stack } from 'expo-router';
import { COLORS } from '@/constants/Together';

export default function MemoriesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="add-memory"
        options={{
          headerShown: true,
          title: 'Add Memory',
          headerBackButtonDisplayMode: 'minimal',
          headerTintColor: COLORS.primary,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="memory-detail"
        options={{
          headerShown: true,
          title: '',
          headerBackButtonDisplayMode: 'minimal',
          headerTintColor: '#fff',
          headerTransparent: true,
        }}
      />
    </Stack>
  );
}
