import { useEffect } from 'react';
import ModalWithForm from '../ModalWithForm/ModalWithForm';
import { useFormWithValidation } from '../../hooks/useFormWithValidation';

function RegisterModal({
  isOpen,
  onClose,
  onRegister,
  onSwitchToLogin,
  isSubmitting,
  submitError,
}) {
  const { values, errors, isValid, handleChange, resetForm } = useFormWithValidation();

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onRegister({
      email: values.email,
      password: values.password,
      username: values.username,
    });
  };

  return (
    <ModalWithForm
      name="register"
      title="Sign up"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      buttonText={isSubmitting ? 'Signing up...' : 'Sign up'}
      isButtonDisabled={!isValid || isSubmitting}
      submitError={submitError}
      altText="Sign in"
      onAltClick={onSwitchToLogin}
    >
      <label className="modal__label" htmlFor="register-email">
        Email
      </label>
      <input
        className="modal__input"
        id="register-email"
        name="email"
        type="email"
        placeholder="Enter email"
        value={values.email || ''}
        onChange={handleChange}
        required
      />
      <span className="modal__input-error">{errors.email}</span>
      <label className="modal__label" htmlFor="register-password">
        Password
      </label>
      <input
        className="modal__input"
        id="register-password"
        name="password"
        type="password"
        placeholder="Enter password"
        value={values.password || ''}
        onChange={handleChange}
        required
      />
      <span className="modal__input-error">{errors.password}</span>
      <label className="modal__label" htmlFor="register-username">
        Username
      </label>
      <input
        className="modal__input"
        id="register-username"
        name="username"
        type="text"
        placeholder="Enter your username"
        value={values.username || ''}
        onChange={handleChange}
        minLength="2"
        maxLength="30"
        required
      />
      <span className="modal__input-error">{errors.username}</span>
    </ModalWithForm>
  );
}

export default RegisterModal;
