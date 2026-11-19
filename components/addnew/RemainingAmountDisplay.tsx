import {View} from 'react-native';

import {Text} from '@/components';
import {formatPrice} from '@/common';
import type {AddNewForm} from '@/utils/addNewFormUtils';

interface RemainingAmountDisplayProps {
  totalPrice: AddNewForm['price'];
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
        Pozostało do podziału: {formatPrice(remainingAmount, {roundUp: false})}
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
