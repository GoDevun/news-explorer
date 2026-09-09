import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../Navigation/Navigation';
import './Header.css';

function Header({ theme, isLoggedIn, currentUser, onSignInClick, onLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  const handleSignInClick = () => {
    closeMenu();
    onSignInClick();
  };

  const handleLogout = () => {
    closeMenu();
    onLogout();
  };

  return (
    <header
      className={`header header_theme_${theme} ${isMenuOpen ? 'header_menu-open' : ''}`}
    >
      <Link className="header__logo" to="/" onClick={closeMenu}>
        StockSentiment
      </Link>
      <Navigation
        theme={theme}
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        isMenuOpen={isMenuOpen}
        onToggleMenu={() => setIsMenuOpen((open) => !open)}
        onCloseMenu={closeMenu}
        onSignInClick={handleSignInClick}
        onLogout={handleLogout}
      />
    </header>
  );
}

export default Header;
