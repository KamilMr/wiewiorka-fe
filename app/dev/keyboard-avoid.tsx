import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Keyboard,
  ScrollView,
} from 'react-native';
import {useAppTheme} from '@/constants/theme';
import {
  KeyboardAwareScrollView,
  useKeyboardHandler,
} from 'react-native-keyboard-controller';
import {useAnimatedStyle, useSharedValue} from 'react-native-reanimated';
import CustomSelect from '@/components/CustomSelect';

const TextF = ({num = 2}) => {
  const t = useAppTheme();
  return (
    <>
      {[...Array(num).keys()].map((el, idx) => (
        <View style={styles.inputContainer} key={idx}>
          <Text style={[styles.label, {color: t.colors.text}]}>Name</Text>
          <TextInput
            style={[
              styles.input,
              {borderColor: t.colors.border, color: t.colors.text},
            ]}
            placeholder="Enter your name"
            placeholderTextColor={t.colors.text + '80'}
          />
        </View>
      ))}
    </>
  );
};

const mockCategories = [
  {label: 'Żywność', value: 'food'},
  {label: 'Transport', value: 'transport'},
  {label: 'Rozrywka', value: 'entertainment'},
  {label: 'Ubrania', value: 'clothes'},
  {label: 'Zdrowie', value: 'health'},
  {label: 'Dom i ogród', value: 'home'},
  {label: 'Edukacja', value: 'education'},
  {label: 'Sport', value: 'sport'},
];

const KeyboardAvoidPage = () => {
  const PADDING = 20;
  const useGradualAnimation = () => {
    // SharedValue for smooth animations on UI thread
    const height = useSharedValue(PADDING);

    // Hook into keyboard events for frame-by-frame tracking
    useKeyboardHandler({
      onStart: e => {
        'worklet'; // Runs on UI thread
        height.value = e.height; // Update SharedValue for potential animations
      },
      onMove: e => {
        'worklet'; // Runs on UI thread - called every frame during keyboard animation
        height.value = e.height; // Smooth SharedValue updates
      },
      onEnd: e => {
        'worklet'; // Runs on UI thread
        height.value = e.height; // Final position
      },
    });

    return {height};
  };
  const {height} = useGradualAnimation();
  const keyboardPadding = useAnimatedStyle(() => {
    return {
      height: Math.abs(height.value),
      marginBottom: height.value > 0 ? 0 : PADDING,
    };
  });

  return (
    <>
      <KeyboardAwareScrollView>
        <View style={{flex: 1}}>
          <TextF num={5} />
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Category</Text>
            <CustomSelect
              items={mockCategories}
              onChange={item => console.log('Selected:', item)}
              placeholder="Select category"
              showDivider={true}
            />
          </View>

          <TextF num={2} />

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Another Category</Text>
            <CustomSelect
              items={mockCategories}
              onChange={item => console.log('Selected:', item)}
              placeholder="Select another category"
              showDivider={false}
            />
          </View>

          <TextF num={2} />
        </View>
      </KeyboardAwareScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 100,
  },
});

export default KeyboardAvoidPage;
