import { useEscapeClose } from '../../hooks/useEscapeClose';
import '../ModalWithForm/ModalWithForm.css';
import './SuccessModal.css';

function SuccessModal({ isOpen, onClose, onSignInClick }) {
  useEscapeClose(isOpen, onClose);

  const handleOverlayMouseDown = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={`modal ${isOpen ? 'modal_open' : ''}`}
      onMouseDown={handleOverlayMouseDown}
    >
      <div className="modal__container">
        <button
          className="modal__close-button"
          type="button"
          aria-label="Close modal"
          onClick={onClose}
        />
        <h2 className="modal__title modal__title_type_success">
          Registration successfully completed!
        </h2>
        <button
          className="modal__alt-button modal__alt-button_type_success"
          type="button"
          onClick={onSignInClick}
        >
          Sign in
        </button>
      </div>
    </div>
  );
}

export default SuccessModal;
