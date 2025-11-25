import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Familytree } from '@/types/familytree';

interface FamilyTreeMetaDataState {
  selectedFamilyTree: Familytree | null;
  availableFamilyTrees: Familytree[];
}

const initialState: FamilyTreeMetaDataState = {
  selectedFamilyTree: null,
  availableFamilyTrees: [],
};

const familyTreeMetaDataSlice = createSlice({
  name: 'familyTreeMetaData',
  initialState,
  reducers: {
    setAvailableFamilyTrees: (state, action: PayloadAction<Familytree[]>) => {
      state.availableFamilyTrees = action.payload;
    },
    
    setSelectedFamilyTree: (state, action: PayloadAction<Familytree | null>) => {
      state.selectedFamilyTree = action.payload;
    },
    
    addFamilyTree: (state, action: PayloadAction<Familytree>) => {
      state.availableFamilyTrees.push(action.payload);
    },
    
    updateFamilyTree: (state, action: PayloadAction<Familytree>) => {
      const index = state.availableFamilyTrees.findIndex(tree => tree.id === action.payload.id);
      if (index !== -1) {
        state.availableFamilyTrees[index] = action.payload;
      }
      
      if (state.selectedFamilyTree?.id === action.payload.id) {
        state.selectedFamilyTree = action.payload;
      }
    },
    
    removeFamilyTree: (state, action: PayloadAction<string>) => {
      state.availableFamilyTrees = state.availableFamilyTrees.filter(
        tree => tree.id !== action.payload
      );
    },
  },
});

export const {
  setAvailableFamilyTrees,
  setSelectedFamilyTree,
  addFamilyTree,
  updateFamilyTree,
  removeFamilyTree,
} = familyTreeMetaDataSlice.actions;

export default familyTreeMetaDataSlice.reducer;