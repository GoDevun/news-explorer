import { useCallback, useEffect, useState } from 'react';
import { Route, Switch, useHistory, useParams } from 'react-router-dom';
import Header from '../Header/Header';
import TickerSearch from '../TickerSearch/TickerSearch';
import Home from '../Home/Home';
import SearchResults from '../SearchResults/SearchResults';
import SavedTickers from '../SavedTickers/SavedTickers';
import ProtectedRoute from '../ProtectedRoute/ProtectedRoute';
import Footer from '../Footer/Footer';
import LoginModal from '../LoginModal/LoginModal';
import RegisterModal from '../RegisterModal/RegisterModal';
import SuccessModal from '../SuccessModal/SuccessModal';
import * as api from '../../utils/api';
import {
  LAST_TICKER_STORAGE_KEY,
  NEWS_ERROR_MESSAGE,
  TOKEN_STORAGE_KEY,
} from '../../utils/constants';
import './App.css';

const CARDS_PER_PAGE = 6;

/**
 * Reads the ticker out of the route so results are linkable and the browser's
 * back button works, and refetches whenever the symbol in the URL changes.
 */
function ResultsRoute({ onLoadFeed, savedTickers, feed, ...props }) {
  const { ticker } = useParams();
  const query = decodeURIComponent(ticker);

  useEffect(() => {
    onLoadFeed(query);
  }, [query, onLoadFeed]);

  // Save state follows the resolved symbol, not what was typed: searching
  // "netflix" and saving it should mark NFLX as saved.
  const resolvedSymbol = (feed && feed.symbol) || query.toUpperCase();

  return (
    <SearchResults
      symbol={query}
      feed={feed}
      isSaved={savedTickers.some((item) => item.symbol === resolvedSymbol)}
      {...props}
    />
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeModal, setActiveModal] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [feed, setFeed] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedError, setFeedError] = useState('');
  const [visibleCount, setVisibleCount] = useState(CARDS_PER_PAGE);

  const [savedTickers, setSavedTickers] = useState([]);

  const history = useHistory();

  useEffect(() => {
    const token = api.getToken();
    if (!token) {
      setIsAuthChecking(false);
      return;
    }

    api
      .getCurrentUser(token)
      .then((user) => {
        setCurrentUser(user);
        setIsLoggedIn(true);
        return api.getSavedTickers(token);
      })
      .then((tickers) => setSavedTickers(tickers || []))
      .catch(() => localStorage.removeItem(TOKEN_STORAGE_KEY))
      .finally(() => setIsAuthChecking(false));
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal('');
    setAuthError('');
  }, []);

  /** Navigating is the search: the route owns the ticker, the effect fetches. */
  const handleSearch = (query) => {
    localStorage.setItem(LAST_TICKER_STORAGE_KEY, query);
    history.push(`/search/${encodeURIComponent(query)}`);
  };

  const loadFeed = useCallback((symbol) => {
    setIsLoading(true);
    setFeedError('');
    setVisibleCount(CARDS_PER_PAGE);

    api
      .getNews(symbol)
      .then(setFeed)
      .catch((error) => {
        setFeed(null);
        setFeedError(error.message || NEWS_ERROR_MESSAGE);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleShowMore = () => setVisibleCount((count) => count + CARDS_PER_PAGE);

  const handleRegister = (formValues) => {
    setIsSubmitting(true);
    api
      .register(formValues)
      .then(() => {
        setAuthError('');
        setActiveModal('success');
      })
      .catch((error) => setAuthError(error.message))
      .finally(() => setIsSubmitting(false));
  };

  const handleLogin = (formValues) => {
    setIsSubmitting(true);
    api
      .login(formValues)
      .then((data) => {
        localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
        setCurrentUser(data.user);
        setIsLoggedIn(true);
        closeModal();
        return api.getSavedTickers(data.token);
      })
      .then((tickers) => setSavedTickers(tickers || []))
      .catch((error) => setAuthError(error.message))
      .finally(() => setIsSubmitting(false));
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setIsLoggedIn(false);
    setCurrentUser(null);
    setSavedTickers([]);
    history.push('/');
  };

  const handleSaveTicker = () => {
    if (!isLoggedIn) {
      setActiveModal('register');
      return;
    }
    if (!feed) {
      return;
    }

    const token = api.getToken();
    const existing = savedTickers.find((item) => item.symbol === feed.symbol);

    if (existing) {
      api
        .deleteSavedTicker(existing._id, token)
        .then(() =>
          setSavedTickers((list) => list.filter((item) => item._id !== existing._id))
        )
        .catch(console.error);
      return;
    }

    const firstEntity = feed.articles[0] && feed.articles[0].entity;

    api
      .saveTicker(
        {
          symbol: feed.symbol,
          companyName: (firstEntity && firstEntity.name) || '',
          lastSentiment: {
            score: feed.summary.score,
            tone: feed.summary.tone,
            label: feed.summary.label,
          },
        },
        token
      )
      .then((saved) => setSavedTickers((list) => [saved, ...list]))
      .catch(console.error);
  };

  const handleUpdateNote = (id, note) =>
    api
      .updateSavedTicker(id, { note }, api.getToken())
      .then((updated) =>
        setSavedTickers((list) =>
          list.map((item) => (item._id === updated._id ? updated : item))
        )
      )
      .catch(console.error);

  const handleDeleteTicker = (id) =>
    api
      .deleteSavedTicker(id, api.getToken())
      .then(() => setSavedTickers((list) => list.filter((item) => item._id !== id)))
      .catch(console.error);

  const openLoginModal = () => {
    setAuthError('');
    setActiveModal('login');
  };

  const openRegisterModal = () => {
    setAuthError('');
    setActiveModal('register');
  };

  const headerProps = {
    isLoggedIn,
    currentUser,
    onSignInClick: openLoginModal,
    onLogout: handleLogout,
  };

  return (
    <div className="page">
      <Switch>
        <Route exact path="/">
          <div className="hero">
            <Header theme="dark" {...headerProps} />
            <TickerSearch variant="hero" onSearch={handleSearch} />
          </div>
          <Home />
        </Route>

        <Route path="/search/:ticker">
          <Header theme="light" {...headerProps} />
          <ResultsRoute
            feed={feed}
            isLoading={isLoading}
            error={feedError}
            visibleCount={visibleCount}
            onShowMore={handleShowMore}
            onSearch={handleSearch}
            onLoadFeed={loadFeed}
            isLoggedIn={isLoggedIn}
            savedTickers={savedTickers}
            onSaveClick={handleSaveTicker}
          />
        </Route>

        <ProtectedRoute path="/saved" isLoggedIn={isLoggedIn} isAuthChecking={isAuthChecking}>
          <Header theme="light" {...headerProps} />
          <SavedTickers
            currentUser={currentUser}
            tickers={savedTickers}
            onUpdateNote={handleUpdateNote}
            onDelete={handleDeleteTicker}
          />
        </ProtectedRoute>
      </Switch>

      <Footer />

      <LoginModal
        isOpen={activeModal === 'login'}
        onClose={closeModal}
        onLogin={handleLogin}
        onSwitchToRegister={openRegisterModal}
        isSubmitting={isSubmitting}
        submitError={authError}
      />
      <RegisterModal
        isOpen={activeModal === 'register'}
        onClose={closeModal}
        onRegister={handleRegister}
        onSwitchToLogin={openLoginModal}
        isSubmitting={isSubmitting}
        submitError={authError}
      />
      <SuccessModal
        isOpen={activeModal === 'success'}
        onClose={closeModal}
        onSignInClick={openLoginModal}
      />
    </div>
  );
}

export default App;
