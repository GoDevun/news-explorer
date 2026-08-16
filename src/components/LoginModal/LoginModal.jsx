import { useEffect } from 'react';
import ModalWithForm from '../ModalWithForm/ModalWithForm';
import { useFormWithValidation } from '../../hooks/useFormWithValidation';

function LoginModal({
  isOpen,
  onClose,
  onLogin,
  onSwitchToRegister,
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
    onLogin({ email: values.email, password: values.password });
  };

  return (
    <ModalWithForm
      name="login"
      title="Sign in"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      buttonText={isSubmitting ? 'Signing in...' : 'Sign in'}
      isButtonDisabled={!isValid || isSubmitting}
      submitError={submitError}
      altText="Sign up"
      onAltClick={onSwitchToRegister}
    >
      <label className="modal__label" htmlFor="login-email">
        Email
      </label>
      <input
        className="modal__input"
        id="login-email"
        name="email"
        type="email"
        placeholder="Enter email"
        value={values.email || ''}
        onChange={handleChange}
        required
      />
      <span className="modal__input-error">{errors.email}</span>
      <label className="modal__label" htmlFor="login-password">
        Password
      </label>
      <input
        className="modal__input"
        id="login-password"
        name="password"
        type="password"
        placeholder="Enter password"
        value={values.password || ''}
        onChange={handleChange}
        required
      />
      <span className="modal__input-error">{errors.password}</span>
    </ModalWithForm>
  );
}

export default LoginModal;
