import {
  BarChart,
  type BarChartPropsType,
  type barDataItem,
} from 'react-native-gifted-charts';

interface Props {
  barData: barDataItem[];
  title?: string;
}

const CustomBar = (props: Props & BarChartPropsType) => {
  const {barData, ...rest} = props;
  return <BarChart data={barData} xAxisTextNumberOfLines={3} {...rest} />;
};

export default CustomBar;
