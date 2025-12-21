import React, {useEffect} from 'react';
import {Redirect, Tabs} from 'expo-router';
import {View, StyleSheet, Text} from 'react-native';

import {selectToken} from '@/redux/auth/authSlice';
import {fetchIni} from '@/redux/main/thunks';
import {useAppDispatch, useAppSelector} from '@/hooks';
import {TabBarIcon} from '@/components/navigation/TabBarIcon';
import {sizes} from '@/constants/theme';
import DevModeToggle from '@/components/DevModeToggle';
import StatusIndicator from '@/components/StatusIndicator';
import {selectFailedOperationsCount} from '@/redux/sync/syncSlice';

const SettingsTabIcon = ({color}: {color: string}) => {
  const failedCount = useAppSelector(selectFailedOperationsCount);

  return (
    <View>
      <TabBarIcon name="settings" color={color} />
      {failedCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {failedCount > 9 ? '9+' : failedCount}
          </Text>
        </View>
      )}
    </View>
  );
};

export default function TabLayout() {
  const token = useAppSelector(selectToken);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!token) return;
    dispatch(fetchIni());
  }, [dispatch]);

  if (!token) return <Redirect href="/sign-in" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitle: '',
        tabBarShowLabel: false,
        headerRightContainerStyle: {paddingRight: sizes.xxl},
        headerRight: () => {
          return (
            <DevModeToggle>
              <StatusIndicator />
            </DevModeToggle>
          );
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({color}) => <TabBarIcon name="home" color={color} />,
          title: 'Stron główna',
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          tabBarShowLabel: false,
          tabBarIcon: ({color}) => <TabBarIcon name="cash" color={color} />,
          title: 'Wydatki/Wpływy',
          headerShown: true,
        }}
      />
      <Tabs.Screen
        name="addnew"
        options={{
          tabBarIcon: ({color}) => <TabBarIcon name="add" color={color} />,
          title: 'Dodaj',
        }}
      />
      <Tabs.Screen
        name="summary"
        options={{
          tabBarIcon: ({color}) => (
            <TabBarIcon name="bar-chart" color={color} />
          ),
          title: 'Podsumowanie',
          headerShown: true,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({color}) => <SettingsTabIcon color={color} />,
          title: 'Ustawienia',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
