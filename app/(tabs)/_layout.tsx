import React, {useEffect} from 'react';
import {Redirect, Tabs} from 'expo-router';

import {BottomTabBar} from '@/components/navigation/BottomTabBar';
import {
  appHeaderOptions,
  appTabHeaderStatusOptions,
} from '@/components/navigation/AppHeaderTitle';
import {sizes} from '@/constants/theme';
import {useAppDispatch, useAppSelector} from '@/hooks';
import {selectToken} from '@/redux/auth/authSlice';
import {fetchIni} from '@/redux/main/thunks';

export default function TabLayout() {
  const token = useAppSelector(selectToken);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!token) return;
    dispatch(fetchIni());
  }, [dispatch, token]);

  if (!token) return <Redirect href="/sign-in" />;

  return (
    <Tabs
      tabBar={props => <BottomTabBar {...props} />}
      screenOptions={{
        headerShown: true,
        ...appHeaderOptions,
        ...appTabHeaderStatusOptions,
        headerTitleContainerStyle: {paddingLeft: sizes.md},
      }}
    >
      <Tabs.Screen
        name="index"
        options={{title: 'Strona główna', headerShown: false}}
      />
      <Tabs.Screen
        name="records"
        options={{title: 'Wydatki/Wpływy', headerShown: true}}
      />
      <Tabs.Screen name="addnew" options={{title: 'Dodaj'}} />
      <Tabs.Screen
        name="summary"
        options={{title: 'Podsumowanie', headerShown: true}}
      />
      <Tabs.Screen name="settings" options={{title: 'Ustawienia'}} />
    </Tabs>
  );
}
