import {useEffect, useState} from 'react';
import {Image, StyleSheet, View} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

import {
  ActivityIndicator,
  Icon,
  Menu,
  Portal,
  TouchableRipple,
} from 'react-native-paper';
import {useAppDispatch} from '@/hooks';
import {uploadFile} from '@/redux/main/thunks';
import FullWidthImage from './FullImage';
import Modal from './CustomModal';
import {warmColors} from '@/constants/warmTheme';

const isPDF = ({url = ''}: {url: string}) =>
  getExtension(url).toLowerCase() === 'pdf';
const initState = (url: string) => ({url: url ?? ''});

const getExtension = (url: string = '') => {
  const parts = url.split('.');
  return parts[parts.length - 1] || '';
};

const ImageThumbnail = ({
  image,
  onPress,
}: {
  image: {url: string};
  onPress: () => void;
}) => {
  const isPdf = isPDF(image);

  return (
    <TouchableRipple style={styles.touchBtn} onPress={onPress}>
      {isPdf ? (
        <View style={styles.updBtn}>
          <Icon size={80} source="file-pdf-box" color={warmColors.primary} />
        </View>
      ) : (
        <Image style={styles.image} source={{uri: image.url}} />
      )}
    </TouchableRipple>
  );
};

const UploadButton = ({
  disabled,
  onPress,
}: {
  onPress: () => void;
  disabled: boolean;
}) => {
  return (
    <TouchableRipple
      onPress={onPress}
      style={styles.updBtn}
      disabled={disabled}
    >
      {disabled ? (
        <ActivityIndicator size={40} animating color={warmColors.primary} />
      ) : (
        <Icon
          size={48}
          source="file-upload-outline"
          color={warmColors.primary}
        />
      )}
    </TouchableRipple>
  );
};

const CustomImage = ({
  imageSrc,
  editable,
  onChange,
}: {
  imageSrc: string;
  editable: boolean;
}) => {
  const dispatch = useAppDispatch();
  const [image, setImage] = useState(initState(imageSrc));
  const [isSaving, setIsSaving] = useState(false);
  const [isVisibleMenu, setIsVisibleMenu] = useState(false);

  const [isOpenImage, setIsOpenImage] = useState<boolean>(false);

  const handleOpenMenu = (isOpen: boolean) => () => {
    setIsVisibleMenu(isOpen);
  };

  const handleViewImage = (isVisible: boolean) => () => {
    handleOpenMenu(false)();
    setIsOpenImage(isVisible);
  };

  const handleUploadFile = async () => {
    setIsSaving(true);
    handleOpenMenu(false)();
    const docResult = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
    });
    if (docResult.canceled) return;

    const [file] = docResult.assets;

    const data: FormData = new FormData();
    data.append('image', {
      name: file.name,
      mimeType: file.mimeType,
      type: file.mimeType,
      size: file.size,
      uri: file.uri,
    });

    dispatch(uploadFile({file: data}))
      .unwrap()
      .then(resp => {
        setImage(initState(resp.url));
        setIsSaving(false);
        onChange(resp.url);
      })
      .catch(() => {
        setIsSaving(false);
      });
  };

  useEffect(() => {
    setImage(initState(imageSrc));
  }, [imageSrc]);

  return (
    <View style={styles.root}>
      <Menu
        visible={isVisibleMenu}
        anchorPosition="bottom"
        onDismiss={handleOpenMenu(false)}
        anchor={
          image.url ? (
            <ImageThumbnail image={image} onPress={handleOpenMenu(true)} />
          ) : (
            <UploadButton onPress={handleOpenMenu(true)} disabled={isSaving} />
          )
        }
      >
        {image.url && (
          <Menu.Item
            onPress={handleViewImage(true)}
            leadingIcon="open-in-new"
            title="View the image"
          />
        )}
        {editable && (
          <Menu.Item
            onPress={handleUploadFile}
            leadingIcon="file"
            title={'Pick a file'}
          />
        )}
      </Menu>
      {image.url && (
        <Portal>
          <Modal visible={isOpenImage} onDismiss={handleViewImage(false)}>
            <FullWidthImage uri={image.url} />
          </Modal>
        </Portal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    marginVertical: 16,
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    marginTop: 16,
    borderRadius: 8,
  },
  header: {
    flex: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  updBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    maxWidth: '100%',
    aspectRatio: '1',
    borderWidth: 2,
  },
  touchBtn: {
    width: 100,
    height: 100,
    maxWidth: '100%',
    aspectRatio: '1',
  },
});

export default CustomImage;
