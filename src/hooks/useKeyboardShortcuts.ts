import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import { setNodes } from '@/stores/slices/familyTreeSlice';
import { undo, redo } from '@/stores/slices/historySlice';

export const useKeyboardShortcuts = () => {
  const dispatch = useAppDispatch();
  const history = useAppSelector(state => state.history);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl+Z (Windows/Linux) or Cmd+Z (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (history.canUndo) {
          const previousState = history.past[history.past.length - 1];
          if (previousState) {
            dispatch(undo());
            dispatch(setNodes(previousState.nodes));
          }
        }
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
      ) {
        e.preventDefault();
        if (history.canRedo) {
          const nextState = history.future[0];
          if (nextState) {
            dispatch(redo());
            dispatch(setNodes(nextState.nodes));
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, history]);
};