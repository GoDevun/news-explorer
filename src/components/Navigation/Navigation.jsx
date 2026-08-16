import { NavLink } from 'react-router-dom';
import './Navigation.css';

function Navigation({
  theme,
  isLoggedIn,
  currentUser,
  isMenuOpen,
  onToggleMenu,
  onCloseMenu,
  onSignInClick,
  onLogout,
}) {
  return (
    <nav
      className={`nav nav_theme_${theme} ${isMenuOpen ? 'nav_menu-open' : ''}`}
      aria-label="Site navigation"
    >
      <button
        className={`nav__menu-button ${isMenuOpen ? 'nav__menu-button_open' : ''}`}
        type="button"
        aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
        onClick={onToggleMenu}
      />
      <div className={`nav__content ${isMenuOpen ? 'nav__content_open' : ''}`}>
        <ul className="nav__list">
          <li className="nav__item">
            <NavLink
              exact
              to="/"
              className="nav__link"
              activeClassName="nav__link_active"
              onClick={onCloseMenu}
            >
              Home
            </NavLink>
          </li>
          {isLoggedIn && (
            <li className="nav__item">
              <NavLink
                to="/saved-news"
                className="nav__link"
                activeClassName="nav__link_active"
                onClick={onCloseMenu}
              >
                Saved articles
              </NavLink>
            </li>
          )}
        </ul>
        {isLoggedIn ? (
          <button className="nav__auth-button" type="button" onClick={onLogout}>
            <span className="nav__username">
              {currentUser ? currentUser.username : ''}
            </span>
            <span className="nav__logout-icon" />
          </button>
        ) : (
          <button className="nav__auth-button" type="button" onClick={onSignInClick}>
            Sign in
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navigation;
