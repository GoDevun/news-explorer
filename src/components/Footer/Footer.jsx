import { Link } from 'react-router-dom';
import githubIcon from '../../images/github.svg';
import linkedinIcon from '../../images/linkedin.svg';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <p className="footer__copyright">
        © {new Date().getFullYear()} StockSentiment, Powered by Marketaux
      </p>
      <nav className="footer__nav" aria-label="Footer navigation">
        <ul className="footer__links">
          <li className="footer__links-item">
            <Link className="footer__link" to="/">
              Home
            </Link>
          </li>
          <li className="footer__links-item">
            <a
              className="footer__link"
              href="https://tripleten.com"
              target="_blank"
              rel="noreferrer"
            >
              TripleTen
            </a>
          </li>
        </ul>
        <ul className="footer__socials">
          <li className="footer__socials-item">
            <a
              className="footer__social-link"
              href="https://github.com/GoDevun"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
            >
              <img className="footer__social-icon" src={githubIcon} alt="GitHub" />
            </a>
          </li>
          <li className="footer__socials-item">
            <a
              className="footer__social-link"
              href="https://www.linkedin.com/in/devun-cooksey-b49705271"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
            >
              <img
                className="footer__social-icon"
                src={linkedinIcon}
                alt="LinkedIn"
              />
            </a>
          </li>
        </ul>
      </nav>
    </footer>
  );
}

export default Footer;
