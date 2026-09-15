import {createAsyncThunk} from '@reduxjs/toolkit';

import type {RootState} from '../store';
import {makeRandomId} from '@/common';
import {addToQueue} from '../sync/syncSlice';
import {
  addSubcategoryAction,
  updateSubcategoryAction,
  deleteSubcategoryAction,
  addGroupCategoryAction,
  updateGroupCategoryAction,
  deleteGroupCategoryAction,
} from './mainSlice';

export const addSubcategoryLocal = createAsyncThunk<
  any,
  {name: string; color: string; groupId: number | string},
  {state: RootState}
>('subcategory/addLocal', async (payload, thunkAPI) => {
  const {dispatch, getState} = thunkAPI;
  const {name, color, groupId} = payload;
  const auth = getState().auth;
  const frontendId = `f_${makeRandomId(8)}`;
  const colorHex = color.split('#')[1] || 'ffffff';
  const tempSubcategory = {
    id: frontendId,
    name,
    color: colorHex,
    groupId,
    owner: auth.name,
    ownerId: auth.houses[0],
  };

  dispatch(addSubcategoryAction(tempSubcategory));
  dispatch(
    addToQueue({
      path: ['main', 'category'],
      method: 'POST',
      data: {name, color: colorHex, groupId},
      handler: 'genericSync',
      frontendId,
      cb: 'replaceSubcategoryAction',
    }),
  );

  return tempSubcategory;
});

export const updateSubcategoryLocal = createAsyncThunk<
  any,
  {id: number | string; name: string; color: string; groupId: number | string},
  {state: RootState}
>('subcategory/updateLocal', async (payload, thunkAPI) => {
  const {dispatch} = thunkAPI;
  const {id, name, color, groupId} = payload;
  const colorHex = color.split('#')[1] || 'ffffff';

  dispatch(updateSubcategoryAction(payload));
  dispatch(
    addToQueue({
      path: ['main', 'category', id.toString()],
      method: 'PUT',
      data: {name, color: colorHex, groupId},
      handler: 'genericSync',
      frontendId: id.toString(),
    }),
  );

  return payload;
});

export const deleteSubcategoryLocal = createAsyncThunk<
  any,
  string | number,
  {state: RootState}
>('subcategory/deleteLocal', async (id, thunkAPI) => {
  const {dispatch} = thunkAPI;

  dispatch(deleteSubcategoryAction(id));
  dispatch(
    addToQueue({
      path: ['main', 'category', id.toString()],
      method: 'DELETE',
      handler: 'genericSync',
      frontendId: id.toString(),
    }),
  );

  return id;
});

export const addGroupCategoryLocal = createAsyncThunk<
  any,
  {name: string; color: string},
  {state: RootState}
>('groupCategory/addLocal', async (payload, thunkAPI) => {
  const {dispatch, getState} = thunkAPI;
  const {name, color} = payload;
  const auth = getState().auth;
  const frontendId = `f_g_${makeRandomId(8)}`;
  const colorHex = color.split('#')[1] || 'ffffff';
  const tempGroupCategory = {
    id: frontendId,
    name,
    color: colorHex,
    owner: auth.name,
    ownerId: auth.houses[0],
  };

  dispatch(addGroupCategoryAction(tempGroupCategory));
  dispatch(
    addToQueue({
      path: ['main', 'category', 'group'],
      method: 'POST',
      data: {name, color: colorHex},
      handler: 'genericSync',
      frontendId,
      cb: 'replaceGroupCategoryAction',
    }),
  );

  return tempGroupCategory;
});

export const updateGroupCategoryLocal = createAsyncThunk<
  any,
  {id: number | string; name: string; color: string},
  {state: RootState}
>('groupCategory/updateLocal', async (payload, thunkAPI) => {
  const {dispatch} = thunkAPI;
  const {id, name, color} = payload;
  const colorHex = color.split('#')[1] || 'ffffff';

  dispatch(updateGroupCategoryAction(payload));
  dispatch(
    addToQueue({
      path: ['main', 'category', 'group', id.toString()],
      method: 'PUT',
      data: {name, color: colorHex},
      handler: 'genericSync',
      frontendId: id.toString(),
    }),
  );

  return payload;
});

export const deleteGroupCategoryLocal = createAsyncThunk<
  any,
  string | number,
  {state: RootState}
>('groupCategory/deleteLocal', async (id, thunkAPI) => {
  const {dispatch, getState} = thunkAPI;
  const group = getState().main.categories[id];

  if (group && group.subcategories.length > 0) {
    throw new Error('HAS_SUBCATEGORIES');
  }

  dispatch(deleteGroupCategoryAction(id));
  dispatch(
    addToQueue({
      path: ['main', 'category', 'group', id.toString()],
      method: 'DELETE',
      handler: 'genericSync',
      frontendId: id.toString(),
    }),
  );

  return id;
});
