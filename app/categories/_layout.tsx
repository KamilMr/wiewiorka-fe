import React from 'react';
import {Redirect, Stack} from 'expo-router';
import {View} from 'react-native';

import {IconButton} from 'react-native-paper';

import {useAppSelector} from '@/hooks';
import {selectToken} from '@/redux/auth/authSlice';
import DevModeToggle from '@/components/DevModeToggle';
import StatusIndicator from '@/components/StatusIndicator';
import {sizes} from '@/constants/theme';

export default function Layout() {
  const token = useAppSelector(selectToken);

  if (!token) return <Redirect href="/sign-in" />;

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={() => ({
          headerShown: true,
          title: 'Kategorie',
          headerRightContainerStyle: {paddingRight: sizes.xxl},
          headerRight: () => (
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <DevModeToggle>
                <StatusIndicator />
              </DevModeToggle>
            </View>
          ),
        })}
      />
      <Stack.Screen
        name="[id]"
        options={() => ({
          headerShown: true,
          title: 'Edycja',
          headerRightContainerStyle: {paddingRight: sizes.xxl},
          headerRight: () => (
            <DevModeToggle>
              <StatusIndicator />
            </DevModeToggle>
          ),
        })}
      />
    </Stack>
  );
}
