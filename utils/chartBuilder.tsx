import {barDataItem, pieDataItem} from 'react-native-gifted-charts';

import {Text} from '@/components';

import {Subcategory} from '@/types';
import {decId, sumById} from '@/utils/aggregateData';
import _ from 'lodash';
import {formatPrice} from '@/common';

type GroupedValue = number[];

interface GroupedType {
  [key: string]: {[key: string]: GroupedValue};
}

export const buildBarChart = (
  obj: GroupedType,
  f: Set<string>,
  categories: Subcategory[],
) => {
  const values = _.entries(sumById(obj));
  const tR = values.map(([itemId, valueArr]) => {
    const [decGrId, decCatId] = decId(itemId).map(o => +o);
    const isCat = decCatId > 0;

    const foundedCat: Subcategory | undefined = categories.find(iterCat =>
      isCat ? iterCat.id === decCatId : iterCat.groupId === decGrId,
    );
    if (!foundedCat) {
      return undefined;
    }

    if (f.size && !f.has(isCat ? foundedCat.name : foundedCat.groupName || ''))
      return undefined;

    const value = valueArr[0];

    const tR: {id: string} & barDataItem = {
      value: value,
      id: itemId,
      frontColor: foundedCat?.color,
      label: (isCat ? foundedCat?.name : foundedCat?.groupName) || '',
      spacing: 10,
      barWidth: 50,
      topLabelComponent: () => {
        return (
          <Text style={{fontSize: 8}}>
            {formatPrice(_.parseInt(value.toString()))}
          </Text>
        );
      },
    };

    return tR;
  });

  const filteredSorted = tR
    .filter(Boolean)
    .sort((a: any, b: any) => b.value - a.value);

  return filteredSorted;
};

export const buildPieChart = (
  obj: GroupedType,
  f: Set<string>,
  categories: Subcategory[],
) => {
  const values = _.entries(sumById(obj));
  const max = _.sum(values.map(arr => arr[1]).flat(2));
  const perc = (n: number) => ((n * 100) / max).toFixed(2);

  const tR = values
    .map(([itemId, valueArr]) => {
      const [grId, catId] = decId(itemId);
      const isCat = +catId > 0;

      const foundedCat = categories.find((categoryObj: Subcategory) =>
        isCat ? categoryObj.id === +catId : categoryObj.groupId === +grId,
      );

      if (!foundedCat) {
        return undefined;
      }
      if (
        f.size &&
        !f.has(isCat ? foundedCat.name : foundedCat?.groupName || '')
      )
        return undefined;
      const value = valueArr[0];
      const percentage: string = perc(value);
      const tR: {label: string; id: string} & pieDataItem = {
        id: itemId,
        value,
        label: isCat ? foundedCat.name : foundedCat?.groupName || '',
        text: +percentage < 4 ? '' : `${percentage}%`,
        color: foundedCat.color,
      };
      return tR;
    })
    .filter(Boolean)
    .sort((a: any, b: any) => b.value - a.value);
  return tR;
};
