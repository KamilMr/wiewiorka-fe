import {Modal, Portal, Button} from 'react-native-paper';
import ColorPicker, {
  Panel1,
  Swatches,
  Preview,
  OpacitySlider,
  HueSlider,
} from 'reanimated-color-picker';
import {runOnJS} from 'react-native-reanimated';

interface CustomColorPicker {
  value: string;
  visible: boolean;
  onChange: (hex: string) => void;
  openModal: () => void;
  closeModal: () => void;
}

export default function CustomColorPicker({
  value,
  visible,
  onChange,
  openModal,
  closeModal,
}: CustomColorPicker) {
  const onSelectColor = ({hex}: {hex: string}) => {
    'worklet';
    runOnJS(onChange)(hex);
  };

  return (
    <Portal>
      <Modal visible={visible} animationType="slide">
        <ColorPicker
          style={{width: '70%', margin: 'auto'}}
          value={value || '#FFFFFF'}
          onComplete={onSelectColor}
        >
          <Preview />
          <Panel1 />
          <HueSlider />
          <OpacitySlider />
          <Swatches />
        </ColorPicker>

        <Button
          style={{alignSelf: 'center'}}
          mode="contained"
          onPress={closeModal}
        >
          Ok
        </Button>
      </Modal>
    </Portal>
  );
}
