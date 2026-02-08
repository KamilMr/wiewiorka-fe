import {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {Text, Button, Tooltip, IconButton} from 'react-native-paper';
import {useAppTheme, sizes} from '@/constants/theme';
import {TextInput, Select} from '@/components';
import Stepper from './Stepper';

const UNIT_OPTIONS = [
  {label: 'sztuka', value: 'szt'},
  {label: 'kilogram', value: 'kg'},
  {label: 'gram', value: 'g'},
  {label: 'mililitr', value: 'ml'},
];

export interface StorageFormData {
  name: string;
  unit: string;
  itemNumber: number;
  minValue: number;
  step: number;
}

interface StorageFormProps {
  onSubmit: (data: StorageFormData) => void;
  onCancel: () => void;
  initial?: Partial<StorageFormData>;
  loading?: boolean;
}

const StorageForm = ({onSubmit, onCancel, initial, loading}: StorageFormProps) => {
  const t = useAppTheme();
  const [name, setName] = useState(initial?.name ?? '');
  const [unit, setUnit] = useState(initial?.unit ?? 'szt');
  const [itemNumber, setItemNumber] = useState(initial?.itemNumber ?? 1);
  const [minValue, setMinValue] = useState(initial?.minValue ?? 1);
  const [step, setStep] = useState(initial?.step ?? 1);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit({name: trimmed, unit, itemNumber, minValue, step});
  };

  return (
    <View style={styles.container}>
      <TextInput
        label="Nazwa"
        mode="outlined"
        value={name}
        onChangeText={setName}
      />

      <Select
        items={UNIT_OPTIONS}
        value={unit}
        onChange={item => setUnit(item.value)}
        placeholder="Jednostka"
      />

      <View style={styles.stepperRow}>
        <Text variant="bodyLarge" style={{color: t.colors.textPrimary}}>
          Ilość
        </Text>
        <Stepper value={itemNumber} onChange={setItemNumber} min={0} />
      </View>

      <View>
        <View style={styles.stepperRow}>
          <Tooltip title="Próg dodania do listy zakupów">
            <Text variant="bodyLarge" style={{color: t.colors.textPrimary}}>
              Ilość min
            </Text>
          </Tooltip>
          <Stepper value={minValue} onChange={setMinValue} min={0} />
        </View>
      </View>

      <View style={styles.stepperRow}>
        <View style={styles.labelWithIcon}>
          <Text variant="bodyLarge" style={{color: t.colors.textPrimary}}>
            Krok
          </Text>
          <Tooltip title="Ile dodaje każde kliknięcie +/−">
            <IconButton
              icon="information-outline"
              size={18}
              style={styles.infoIcon}
            />
          </Tooltip>
        </View>
        <Stepper value={step} onChange={setStep} min={1} />
      </View>

      <View style={styles.buttons}>
        <Button mode="outlined" onPress={onCancel} style={styles.button}>
          Przerwij
        </Button>
        <Button mode="contained" onPress={handleSubmit} style={styles.button} loading={loading} disabled={loading}>
          Zapisz
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: sizes.sm,
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    margin: 0,
  },
  buttons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: sizes.sm,
  },
  button: {
    flex: 1,
    borderRadius: 8,
  },
});

export default StorageForm;
