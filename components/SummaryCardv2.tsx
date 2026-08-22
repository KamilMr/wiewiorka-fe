import {format} from 'date-fns';

import SummaryCard from '@/components/SummaryCard';
import {useAppSelector} from '@/hooks';
import {selectComparison} from '@/redux/main/selectors';

interface SummaryCard_v2Props {
  date?: string;
}

const SummaryCard_v2 = (props: SummaryCard_v2Props) => {
  const summary = useAppSelector(state => selectComparison(state, 1));
  const date = props.date
    ? format(new Date(props.date), 'MM/yyyy')
    : format(new Date(), 'MM/yyyy');

  const filteredSummary = summary.find(item => item.date === date) || {
    income: 0,
    outcome: 0,
  };

  return (
    <SummaryCard
      income={filteredSummary.income}
      outcome={filteredSummary.outcome}
      date={date}
      costs={{}}
    />
  );
};

export default SummaryCard_v2;
