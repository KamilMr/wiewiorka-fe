import {useState} from 'react';
import {StyleSheet, View, TextInput, Pressable} from 'react-native';
import {Text} from 'react-native-paper';
import {useAppTheme} from '@/constants/theme';

interface StepperProps {
  value: number;
  unit?: string;
  onChange: (value: number) => void;
  min?: number;
}

const Stepper = ({value, unit, onChange, min = 0}: StepperProps) => {
  const t = useAppTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  const handleDecrement = () => {
    const next = value - 1;
    if (next >= min) onChange(next);
  };

  const handleIncrement = () => onChange(value + 1);

  const handleStartEdit = () => {
    setDraft(String(value));
    setIsEditing(true);
  };

  const handleEndEdit = () => {
    setIsEditing(false);
    const parsed = parseFloat(draft);
    if (!isNaN(parsed) && parsed >= min) onChange(parsed);
    else setDraft(String(value));
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={handleDecrement} style={styles.button}>
        <Text variant="headlineMedium" style={{color: t.colors.textPrimary}}>
          —
        </Text>
      </Pressable>

      {isEditing ? (
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onBlur={handleEndEdit}
          onSubmitEditing={handleEndEdit}
          keyboardType="numeric"
          autoFocus
          selectTextOnFocus
          style={[styles.input, {color: t.colors.textPrimary}]}
        />
      ) : (
        <Pressable onPress={handleStartEdit}>
          <Text variant="bodyLarge" style={{color: t.colors.textPrimary}}>
            {value}{unit ? ` ${unit}` : ''}
          </Text>
        </Pressable>
      )}

      <Pressable onPress={handleIncrement} style={styles.button}>
        <Text variant="headlineMedium" style={{color: t.colors.textPrimary}}>
          +
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  input: {
    fontSize: 16,
    textAlign: 'center',
    minWidth: 40,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
});

export default Stepper;
