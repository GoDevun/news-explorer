import { useEffect } from 'react';

/**
 * Closes a modal on Escape or on a click outside its container.
 * Both listeners are attached only while the modal is open.
 */
export function useModalClose(isOpen, onClose) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const handleMouseDown = (event) => {
      if (event.target.classList.contains('modal')) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [isOpen, onClose]);
}
