import {Stack} from 'expo-router';
import DevModeToggle from '@/components/DevModeToggle';
import StatusIndicator from '@/components/StatusIndicator';
import {sizes} from '@/constants/theme';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        title: 'Długi',
        headerRightContainerStyle: {paddingRight: sizes.xxl},
        headerRight: () => (
          <DevModeToggle>
            <StatusIndicator />
          </DevModeToggle>
        ),
      }}
    >
      <Stack.Screen name="index" options={{title: 'Długi'}} />
      <Stack.Screen name="[id]" options={{title: 'Szczegóły długu'}} />
    </Stack>
  );
}
