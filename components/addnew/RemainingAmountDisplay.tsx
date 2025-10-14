import {View} from 'react-native';

import {Text} from '@/components';

interface RemainingAmountDisplayProps {
  totalPrice: string;
  splitItems: Array<{price: string}>;
}

export const RemainingAmountDisplay = ({
  totalPrice,
  splitItems,
}: RemainingAmountDisplayProps) => {
  const remainingAmount =
    (+totalPrice[1] || 0) -
    splitItems.reduce((sum, item) => sum + (+item.price || 0), 0);

  return (
    <View>
      <Text style={styles.remainingAmountText}>
        Pozostało do podziału: {remainingAmount} zł
      </Text>
    </View>
  );
};

const styles = {
  remainingAmountText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    marginBottom: 12,
    textAlign: 'center' as const,
  },
};
