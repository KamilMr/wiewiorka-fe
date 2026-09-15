import {Subcategory} from '@/types';
import {CustomModal} from '../CustomModal';

interface GroupedItemsProps {
  nameOfGroup: string;
  items: Subcategory[];
  edit: boolean;
  groupId: string;
}

interface ItemsProps {
  item: Subcategory;
  edit: boolean;
}

interface AddEmptyModal {
  addModal: (arg: CustomModal) => void;
  emptyModal: () => void;
}

interface DeleteCategory {
  id: number | string;
  kind: 'group' | 'category';
}

type HandleDelete = {
  handleDelete: (arg: DeleteCategory) => void;
};

export {
  GroupedItemsProps,
  ItemsProps,
  AddEmptyModal,
  DeleteCategory,
  HandleDelete,
};
