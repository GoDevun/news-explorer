import { useEscapeClose } from '../../hooks/useEscapeClose';
import './ModalWithForm.css';

function ModalWithForm({
  name,
  title,
  isOpen,
  onClose,
  onSubmit,
  buttonText,
  isButtonDisabled,
  submitError,
  altText,
  onAltClick,
  children,
}) {
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
        <h2 className="modal__title">{title}</h2>
        <form className="modal__form" name={name} onSubmit={onSubmit} noValidate>
          {children}
          <span className="modal__submit-error">{submitError}</span>
          <button
            className="modal__submit-button"
            type="submit"
            disabled={isButtonDisabled}
          >
            {buttonText}
          </button>
        </form>
        {altText && (
          <p className="modal__alt-text">
            or{' '}
            <button className="modal__alt-button" type="button" onClick={onAltClick}>
              {altText}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

export default ModalWithForm;
