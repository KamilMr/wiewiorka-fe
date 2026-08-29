import {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {TabBarIcon} from '@/components/navigation/TabBarIcon';
import {typography} from '@/constants/theme';
import {warmColors, warmRadius, warmShadow} from '@/constants/warmTheme';
import {useAppSelector} from '@/hooks';
import {selectFailedOperationsCount} from '@/redux/sync/syncSlice';

const BAR_HEIGHT = 76;

const tabs = {
  index: {label: 'Główna', icon: 'home'},
  records: {label: 'Finanse', icon: 'cash'},
  addnew: {label: 'Dodaj', icon: 'add'},
  summary: {label: 'Analiza', icon: 'bar-chart'},
  settings: {label: 'Ustaw.', icon: 'settings'},
} as const;

type TabName = keyof typeof tabs;

export function BottomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const {bottom: safeAreaBottom} = useSafeAreaInsets();
  const failedOperationsCount = useAppSelector(selectFailedOperationsCount);

  return (
    <View
      style={[
        styles.bar,
        {height: BAR_HEIGHT + safeAreaBottom, paddingBottom: safeAreaBottom},
      ]}
    >
      {state.routes.map((route, index) => {
        const tab = tabs[route.name as TabName];
        if (!tab) return null;

        const {options} = descriptors[route.key];
        const isFocused = state.index === index;
        const isAddTab = route.name === 'addnew';
        const accessibilityLabel =
          options.tabBarAccessibilityLabel ?? options.title ?? tab.label;

        const handlePress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate({
              name: route.name,
              params: route.params,
              merge: true,
            });
          }
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{selected: isFocused}}
            accessibilityLabel={accessibilityLabel}
            testID={options.tabBarButtonTestID}
            onPress={handlePress}
            onLongPress={() =>
              navigation.emit({type: 'tabLongPress', target: route.key})
            }
            style={({pressed}) => [
              styles.tab,
              isAddTab && styles.addTab,
              pressed && styles.pressed,
            ]}
          >
            {isAddTab ? (
              <>
                <View style={styles.addButton}>
                  <TabBarIcon name="add" color={warmColors.primaryForeground} />
                </View>
                <Text style={[styles.label, styles.addLabel]}>Dodaj</Text>
              </>
            ) : (
              <View
                style={[
                  styles.regularContent,
                  isFocused && styles.activeContent,
                ]}
              >
                <View style={styles.iconContainer}>
                  <TabBarIcon
                    name={tab.icon}
                    color={
                      isFocused
                        ? warmColors.sidebarPrimary
                        : warmColors.mutedForeground
                    }
                  />
                  {route.name === 'settings' && failedOperationsCount > 0 ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {failedOperationsCount > 9
                          ? '9+'
                          : failedOperationsCount}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.label,
                    {
                      color: isFocused
                        ? warmColors.sidebarPrimary
                        : warmColors.mutedForeground,
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: warmColors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: warmColors.sidebarBorder,
    overflow: 'visible',
  },
  tab: {
    flex: 1,
    minWidth: 44,
    minHeight: 44,
    height: BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  regularContent: {
    minWidth: 44,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderRadius: warmRadius.lg,
  },
  activeContent: {
    backgroundColor: warmColors.decorPrimary,
  },
  iconContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.labelSmall,
    fontWeight: '600',
  },
  addTab: {
    justifyContent: 'flex-start',
  },
  addButton: {
    width: 64,
    height: 64,
    marginTop: -24,
    borderWidth: 6,
    borderColor: warmColors.background,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: warmColors.primary,
    ...warmShadow.md,
    elevation: 4,
  },
  addLabel: {
    marginTop: 2,
    color: warmColors.sidebarPrimary,
  },
  pressed: {
    opacity: 0.8,
  },
  badge: {
    position: 'absolute',
    zIndex: 1,
    top: -6,
    right: -10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: warmRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: warmColors.destructive,
  },
  badgeText: {
    color: warmColors.destructiveForeground,
    fontSize: 10,
    fontWeight: '700',
  },
});
