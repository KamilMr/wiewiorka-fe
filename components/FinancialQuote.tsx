import {useRef} from 'react';
import {StyleSheet, useWindowDimensions, View} from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import {useSharedValue} from 'react-native-reanimated';
import Carousel, {ICarouselInstance} from 'react-native-reanimated-carousel';

import Text from '@/components/CustomText';
import WarmCard from '@/components/warm/WarmCard';
import {warmColors} from '@/constants/warmTheme';
import {quotes} from '@/utils/quotes';

const FinancialQuote = () => {
  const {width: screenWidth} = useWindowDimensions();
  const ref = useRef<ICarouselInstance>(null);
  const progress = useSharedValue<number>(0);
  const today = new Date();
  const defaultIndex = today.getDate() % quotes.length;

  return (
    <View style={styles.wrapper}>
      <Carousel
        ref={ref}
        width={screenWidth - 32}
        height={190}
        data={quotes}
        defaultIndex={defaultIndex}
        onProgressChange={progress}
        loop
        renderItem={({item}) => (
          <WarmCard style={styles.container}>
            <View style={styles.labelRow}>
              <View style={styles.icon}>
                <FontAwesome6
                  name="quote-left"
                  size={12}
                  color={warmColors.primary}
                  iconStyle="solid"
                />
              </View>
              <Text style={styles.label}>Myśl na dziś</Text>
            </View>
            <Text style={styles.quote}>{item.text}</Text>
            <Text style={styles.author}>— {item.author}</Text>
          </WarmCard>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'stretch',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: warmColors.accent,
  },
  label: {
    color: warmColors.mutedForeground,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  quote: {
    color: warmColors.foreground,
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 21,
  },
  author: {
    color: warmColors.primary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'right',
  },
});

export default FinancialQuote;
