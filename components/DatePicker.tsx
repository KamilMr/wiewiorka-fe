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
  placeholder?: string;
}

const CustomDatePicker = ({
  label,
  editable,
  disabled,
  readOnly,
  onChange = () => {},
  value,
  style,
  placeholder = 'Wybierz datę',
}: CustomDatePickerProps) => {
  const handleOnConfirm = (date: Date | undefined) => {
    onChange(date || undefined);
  };

  // Show label with placeholder hint when no date selected
  const displayLabel = value ? label : `${label} (${placeholder})`;

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
      label={displayLabel}
      value={value || undefined}
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
