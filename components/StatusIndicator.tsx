import React from 'react';
import {View} from 'react-native';
import {useNetInfo} from '@react-native-community/netinfo';
import {useAppSelector} from '@/hooks';
import {selectOperations} from '@/redux/sync/syncSlice';
import {useAppTheme} from '@/constants/theme';

const StatusIndicator: React.FC = () => {
  const netInfo = useNetInfo();
  const operations = useAppSelector(selectOperations);
  const t = useAppTheme();

  const getStatusDotColor = () => {
    if (!netInfo.isConnected) return t.colors.mutedForeground;
    if (netInfo.isInternetReachable === false) return t.colors.chart5;
    return t.colors.success;
  };

  const getStatusDotStyle = () => {
    const baseStyle = {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: getStatusDotColor(),
    };

    if (netInfo.isConnected && operations.length > 0) {
      return {
        ...baseStyle,
        borderWidth: 2,
        borderColor: t.colors.chart5,
      };
    }

    return baseStyle;
  };

  return <View style={getStatusDotStyle()} />;
};

export default StatusIndicator;
