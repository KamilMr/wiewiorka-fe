import {useEffect, useState} from 'react';
import {useNavigation} from 'expo-router';
import {ScrollView, View, StyleSheet} from 'react-native';
import {FAB, Portal, Dialog, Button} from 'react-native-paper';

import _ from 'lodash';

import {
  Glow,
  Modal,
  NoData,
  TextInput,
  IconButtonWithStatus as IconButton,
} from '@/components';
import {CustomModal} from '@/components/CustomModal';
import {useAppTheme, sizes} from '@/constants/theme';
import {useAppDispatch, useAppSelector} from '@/hooks';
import {selectCategories, selectMainCategories} from '@/redux/main/selectors';
import {
  deleteSubcategorySync,
  deleteGroupCategorySync,
  addGroupCategorySync,
} from '@/redux/main/thunks';
import {setSnackbar} from '@/redux/main/mainSlice';
import GroupedItemsList from '@/components/categories/GroupedItemsList';
import {DeleteCategory} from '@/components/categories/types';
import KeyboardView from '@/components/KeyboardView';

const modalState: () => CustomModal = () => ({
  visible: false,
  title: '',
  content: '',
  onDismiss: () => {},
  onApprove: () => {},
});

export default function MainView() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const categories = useAppSelector(selectCategories);
  const [edit, setEdit] = useState(true);
  const [modalContent, setModalContent] = useState<CustomModal>(modalState());
  const mainCategories = useAppSelector(selectMainCategories);

  const [newGroup, setNewGroup] = useState({name: ''});
  const [addDialogVisible, setAddDialogVisible] = useState(false);

  const emptyModal = () => {
    setModalContent(modalState());
  };

  const addModal = ({
    title,
    content,
    onDismiss,
    onApprove,
  }: CustomModal): void => {
    setModalContent({
      visible: true,
      title,
      content,
      onDismiss,
      onApprove,
    });
  };

  const t = useAppTheme();

  const grouped = _.groupBy(categories, 'groupName');

  // useEffect(() => {
  //   navigation.setOptions({
  //     headerRight: () => (
  //       <Glow isGlowing={!edit} glowColor={t.colors.primary}>
  //         <IconButton
  //           showLoading
  //           icon={edit ? 'check' : 'pencil'}
  //           onPressIn={() => setEdit(!edit)}
  //           iconColor={t.colors.primary}
  //         />
  //       </Glow>
  //     ),
  //   });
  // }, [navigation, edit]);

  const handleDelete = async ({id, kind}: DeleteCategory) => {
    try {
      if (kind === 'category') {
        await dispatch(deleteSubcategorySync(id)).unwrap();
      }
      if (kind === 'group') {
        await dispatch(deleteGroupCategorySync(id)).unwrap();
      }
      emptyModal();
    } catch (error) {
      dispatch(
        setSnackbar({
          open: true,
          type: 'error',
          msg:  'Nie udało się usunąć',
        }),
      );
      emptyModal();
    }
  };

  const handleSave = async () => {
    if (!newGroup.name.trim()) {
      dispatch(
        setSnackbar({
          open: true,
          type: 'error',
          msg: 'Nazwa kategorii nie może być pusta',
        }),
      );
      return;
    }

    try {
      await dispatch(
        addGroupCategorySync({name: newGroup.name, color: '#FFFFFF'}),
      ).unwrap();
      setNewGroup({name: ''});
      setAddDialogVisible(false);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      dispatch(
        setSnackbar({
          open: true,
          type: 'error',
          msg: errorMsg || 'Nie udało się zapisać',
        }),
      );
    }
  };

  const handleCancelAdd = () => {
    setNewGroup({name: ''});
    setAddDialogVisible(false);
  };

  return (
    <KeyboardView style={styles.container}>
      <View style={[styles.content, {backgroundColor: t.colors.white}]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {!mainCategories.length ? (
            <NoData text="Edytuj aby dodać kategorię" />
          ) : (
            mainCategories.map(([groupName, groupId]) => (
              <GroupedItemsList
                key={groupId}
                nameOfGroup={groupName}
                items={grouped[groupName]}
                edit={edit}
                addModal={addModal}
                emptyModal={emptyModal}
                handleDelete={handleDelete}
                groupId={groupId}
              />
            ))
          )}
        </ScrollView>

        {edit && (
          <FAB
            icon="plus"
            label="Dodaj kategorię"
            color="white"
            style={[styles.fab, {backgroundColor: t.colors.primary}]}
            onPress={() => setAddDialogVisible(true)}
          />
        )}

        <Portal>
          <Dialog
            visible={addDialogVisible}
            onDismiss={handleCancelAdd}
            style={styles.dialog}
          >
            <Dialog.Title>Nowa kategoria główna</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Nazwa kategorii"
                mode="outlined"
                value={newGroup.name}
                onChangeText={text => setNewGroup({name: text})}
                autoFocus
                onSubmitEditing={handleSave}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={handleCancelAdd}>Anuluj</Button>
              <Button onPress={handleSave}>Dodaj</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <Modal
          visible={modalContent.visible}
          title={modalContent.title}
          content={modalContent.content}
          onDismiss={modalContent.onDismiss}
          onApprove={modalContent.onApprove}
        />
      </View>
    </KeyboardView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  fab: {
    position: 'absolute',
    margin: sizes.xl,
    right: 0,
    bottom: 0,
  },
  dialog: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '90%',
  },
});
