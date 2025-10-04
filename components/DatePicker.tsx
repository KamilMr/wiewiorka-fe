import {
  DatePickerInput,
  pl,
  registerTranslation,
} from 'react-native-paper-dates';
import {View} from 'react-native';

registerTranslation('pl', pl);

interface CustomDatePickerProps {
  editable?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  label?: string;
  onChange: (date: Date | undefined) => void;
  style?: object;
  value: Date | null;
}

const defaultValue = new Date();

const CustomDatePicker = ({
  label,
  editable,
  disabled,
  readOnly,
  onChange = () => {},
  value,
  style,
}: CustomDatePickerProps) => {
  const handleOnConfirm = (date: Date | undefined) => {
    if (!date) return;
    onChange(date);
  };

  return (
    <DatePickerInput
      inputMode="start"
      mode="outlined"
      editable={editable}
      iconSize={32}
      disabled={disabled}
      readOnly={readOnly}
      keyboardType="numeric"
      locale="pl"
      label={label}
      value={value || defaultValue}
      onChange={handleOnConfirm}
      style={[
        {
          underlineColorAndroid: 'transparent',
          backgroundColor: 'transparent',
          justifyContent: 'flex-end',
        },
        style,
      ]}
    />
  );
};

export default CustomDatePicker;
