import {Stack} from 'expo-router';
import DevModeToggle from '@/components/DevModeToggle';
import StatusIndicator from '@/components/StatusIndicator';
import {sizes} from '@/constants/theme';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerRightContainerStyle: {paddingRight: sizes.xxl},
        headerRight: () => (
          <DevModeToggle>
            <StatusIndicator />
          </DevModeToggle>
        ),
      }}
    >
      <Stack.Screen name="index" options={{title: 'Spiżarnia'}} />
      <Stack.Screen name="shop-list" options={{title: 'Lista zakupów'}} />
    </Stack>
  );
}
