import Text from '@/components/CustomText';
import {useAppTheme} from '@/constants/theme';
import {View} from 'react-native';

const NoData = ({text = 'Brak danych'}) => {
  const t = useAppTheme();
  return (
    <View
      style={{
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: t.colors.surface,
      }}
    >
      <Text variant="titleLarge">{text}</Text>
    </View>
  );
};

export default NoData;
