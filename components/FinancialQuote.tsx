import {useRef} from 'react';
import {View, Text, StyleSheet, Dimensions} from 'react-native';
import {useSharedValue} from 'react-native-reanimated';
import Carousel, {ICarouselInstance} from 'react-native-reanimated-carousel';
import {useAppTheme} from '@/constants/theme';
import {quotes} from '@/utils/quotes';

const {width: screenWidth} = Dimensions.get('window');
const CAROUSEL_WIDTH = screenWidth - 32;

const FinancialQuote = () => {
  const t = useAppTheme();
  const ref = useRef<ICarouselInstance>(null);
  const progress = useSharedValue<number>(0);
  const today = new Date();
  const defaultIndex = today.getDate() % quotes.length;

  return (
    <View style={styles.wrapper}>
      <Carousel
        ref={ref}
        width={CAROUSEL_WIDTH}
        height={140}
        data={quotes}
        defaultIndex={defaultIndex}
        onProgressChange={progress}
        loop
        renderItem={({item}) => (
          <View style={styles.container}>
            <Text style={[styles.quote, {color: t.colors.onBackground}]}>
              {item.text}
            </Text>
            <Text style={[styles.author, {color: t.colors.onBackground}]}>
              — {item.author}
            </Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 8,
  },
  container: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
  },
  quote: {
    fontSize: 16,
    fontStyle: 'italic',
    marginBottom: 8,
    textAlign: 'center',
  },
  author: {
    fontSize: 14,
    textAlign: 'right',
  },
  paginationContainer: {
    gap: 6,
    marginTop: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  activeDot: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    overflow: 'hidden',
  },
});

export default FinancialQuote;
