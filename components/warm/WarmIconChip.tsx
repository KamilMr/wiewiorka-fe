import React from 'react';
import {StyleSheet, View, ViewStyle} from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

interface Props {
  icon: React.ComponentProps<typeof FontAwesome6>['name'];
  background: string;
  color: string;
  size?: number;
  iconSize?: number;
  iconStyle?: React.ComponentProps<typeof FontAwesome6>['iconStyle'];
  style?: ViewStyle;
}

export default function WarmIconChip({
  icon,
  background,
  color,
  size = 40,
  iconSize = 16,
  iconStyle = 'solid',
  style,
}: Props) {
  return (
    <View
      style={[
        styles.chip,
        {width: size, height: size, borderRadius: size / 2, backgroundColor: background},
        style,
      ]}
    >
      <FontAwesome6 name={icon} size={iconSize} color={color} iconStyle={iconStyle} />
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
