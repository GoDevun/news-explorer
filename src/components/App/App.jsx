import { useCallback, useEffect, useState } from 'react';
import { Route, Switch, useHistory } from 'react-router-dom';
import Header from '../Header/Header';
import SearchForm from '../SearchForm/SearchForm';
import StockSearchForm from '../StockSearchForm/StockSearchForm';
import Main from '../Main/Main';
import Stocks from '../Stocks/Stocks';
import SavedNews from '../SavedNews/SavedNews';
import ProtectedRoute from '../ProtectedRoute/ProtectedRoute';
import Footer from '../Footer/Footer';
import LoginModal from '../LoginModal/LoginModal';
import RegisterModal from '../RegisterModal/RegisterModal';
import SuccessModal from '../SuccessModal/SuccessModal';
import * as fakeApi from '../../utils/fakeApi';
import { getNews } from '../../utils/newsApi';
import { getStockOverview, STOCK_ERROR_KINDS } from '../../utils/stocksApi';
import { buildStockSignal } from '../../utils/stockSignal';
import {
  CARDS_PER_PAGE,
  JWT_STORAGE_KEY,
  LAST_SEARCH_STORAGE_KEY,
  LAST_TICKER_STORAGE_KEY,
  MISSING_STOCK_KEY_ERROR_MESSAGE,
  SEARCH_ERROR_MESSAGE,
  STOCK_ERROR_MESSAGE,
  STOCK_RATE_LIMIT_ERROR_MESSAGE,
} from '../../utils/constants';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeModal, setActiveModal] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [articles, setArticles] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [visibleCount, setVisibleCount] = useState(CARDS_PER_PAGE);

  const [ticker, setTicker] = useState('');
  const [stock, setStock] = useState(null);
  const [stockSignal, setStockSignal] = useState(null);
  const [hasTickerSearched, setHasTickerSearched] = useState(false);
  const [isStockLoading, setIsStockLoading] = useState(false);
  const [stockError, setStockError] = useState('');
  const [isTickerNotFound, setIsTickerNotFound] = useState(false);
  const [stockVisibleCount, setStockVisibleCount] = useState(CARDS_PER_PAGE);

  const [savedArticles, setSavedArticles] = useState([]);

  const history = useHistory();

  useEffect(() => {
    const token = localStorage.getItem(JWT_STORAGE_KEY);
    if (token) {
      fakeApi
        .checkToken(token)
        .then((user) => {
          setCurrentUser(user);
          setIsLoggedIn(true);
        })
        .catch(() => localStorage.removeItem(JWT_STORAGE_KEY))
        .finally(() => setIsAuthChecking(false));
    } else {
      setIsAuthChecking(false);
    }

    fakeApi
      .getSavedArticles()
      .then((storedArticles) => setSavedArticles(storedArticles))
      .catch(console.error);

    try {
      const lastSearch = JSON.parse(localStorage.getItem(LAST_SEARCH_STORAGE_KEY));
      if (lastSearch && Array.isArray(lastSearch.articles)) {
        setKeyword(lastSearch.keyword);
        setArticles(lastSearch.articles);
        setHasSearched(true);
      }
    } catch {
      localStorage.removeItem(LAST_SEARCH_STORAGE_KEY);
    }

    const lastTicker = localStorage.getItem(LAST_TICKER_STORAGE_KEY);
    if (lastTicker) {
      setTicker(lastTicker);
    }
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal('');
    setAuthError('');
  }, []);

  const handleSearch = (searchKeyword) => {
    setHasSearched(true);
    setIsSearching(true);
    setSearchError('');
    setVisibleCount(CARDS_PER_PAGE);
    setKeyword(searchKeyword);
    getNews(searchKeyword)
      .then((data) => {
        const uniqueArticles = data.articles.filter(
          (article, index, list) =>
            list.findIndex((item) => item.url === article.url) === index
        );
        setArticles(uniqueArticles);
        localStorage.setItem(
          LAST_SEARCH_STORAGE_KEY,
          JSON.stringify({ keyword: searchKeyword, articles: uniqueArticles })
        );
      })
      .catch(() => setSearchError(SEARCH_ERROR_MESSAGE))
      .finally(() => setIsSearching(false));
  };

  const handleShowMore = () => setVisibleCount((count) => count + CARDS_PER_PAGE);

  const handleTickerSearch = (searchTicker) => {
    setHasTickerSearched(true);
    setIsStockLoading(true);
    setStockError('');
    setIsTickerNotFound(false);
    setStockVisibleCount(CARDS_PER_PAGE);
    setTicker(searchTicker);
    setStock(null);
    setStockSignal(null);

    getStockOverview(searchTicker)
      .then((overview) => {
        setStock(overview);
        setStockSignal(buildStockSignal(overview));
        localStorage.setItem(LAST_TICKER_STORAGE_KEY, overview.ticker);
      })
      .catch((error) => {
        if (error.kind === STOCK_ERROR_KINDS.notFound) {
          setIsTickerNotFound(true);
          return;
        }
        if (error.kind === STOCK_ERROR_KINDS.missingKey) {
          setStockError(MISSING_STOCK_KEY_ERROR_MESSAGE);
          return;
        }
        if (error.kind === STOCK_ERROR_KINDS.rateLimit) {
          setStockError(STOCK_RATE_LIMIT_ERROR_MESSAGE);
          return;
        }
        setStockError(STOCK_ERROR_MESSAGE);
      })
      .finally(() => setIsStockLoading(false));
  };

  const handleStockShowMore = () =>
    setStockVisibleCount((count) => count + CARDS_PER_PAGE);

  const handleRegister = (formValues) => {
    setIsSubmitting(true);
    fakeApi
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
    fakeApi
      .authorize(formValues)
      .then((data) => {
        localStorage.setItem(JWT_STORAGE_KEY, data.token);
        return fakeApi.checkToken(data.token);
      })
      .then((user) => {
        setCurrentUser(user);
        setIsLoggedIn(true);
        closeModal();
      })
      .catch((error) => setAuthError(error.message))
      .finally(() => setIsSubmitting(false));
  };

  const handleLogout = () => {
    localStorage.removeItem(JWT_STORAGE_KEY);
    setIsLoggedIn(false);
    setCurrentUser(null);
    history.push('/');
  };

  const handleDeleteArticle = (articleId) => {
    fakeApi
      .deleteArticle(articleId)
      .then(() =>
        setSavedArticles((articlesList) =>
          articlesList.filter((item) => item._id !== articleId)
        )
      )
      .catch(console.error);
  };

  const handleSaveArticle = (article, articleKeyword = keyword) => {
    if (!isLoggedIn) {
      setActiveModal('register');
      return;
    }
    const alreadySavedArticle = savedArticles.find((item) => item.url === article.url);
    if (alreadySavedArticle) {
      handleDeleteArticle(alreadySavedArticle._id);
      return;
    }
    fakeApi
      .saveArticle(article, articleKeyword)
      .then((savedArticle) =>
        setSavedArticles((articlesList) => [...articlesList, savedArticle])
      )
      .catch(console.error);
  };

  const openLoginModal = () => {
    setAuthError('');
    setActiveModal('login');
  };

  const openRegisterModal = () => {
    setAuthError('');
    setActiveModal('register');
  };

  return (
    <div className="page">
      <Switch>
        <Route exact path="/">
          <div className="hero">
            <Header
              theme="dark"
              isLoggedIn={isLoggedIn}
              currentUser={currentUser}
              onSignInClick={openLoginModal}
              onLogout={handleLogout}
            />
            <SearchForm onSearch={handleSearch} />
          </div>
          <Main
            hasSearched={hasSearched}
            isSearching={isSearching}
            searchError={searchError}
            articles={articles}
            visibleCount={visibleCount}
            onShowMore={handleShowMore}
            isLoggedIn={isLoggedIn}
            savedArticles={savedArticles}
            onSaveClick={handleSaveArticle}
          />
        </Route>
        <Route path="/stocks">
          <div className="hero">
            <Header
              theme="dark"
              isLoggedIn={isLoggedIn}
              currentUser={currentUser}
              onSignInClick={openLoginModal}
              onLogout={handleLogout}
            />
            <StockSearchForm onSearch={handleTickerSearch} initialTicker={ticker} />
          </div>
          <Stocks
            hasSearched={hasTickerSearched}
            isLoading={isStockLoading}
            error={stockError}
            isNotFound={isTickerNotFound}
            stock={stock}
            signal={stockSignal}
            visibleCount={stockVisibleCount}
            onShowMore={handleStockShowMore}
            isLoggedIn={isLoggedIn}
            savedArticles={savedArticles}
            onSaveClick={(article) => handleSaveArticle(article, ticker)}
          />
        </Route>
        <ProtectedRoute
          path="/saved-news"
          isLoggedIn={isLoggedIn}
          isAuthChecking={isAuthChecking}
        >
          <Header
            theme="light"
            isLoggedIn={isLoggedIn}
            currentUser={currentUser}
            onSignInClick={openLoginModal}
            onLogout={handleLogout}
          />
          <SavedNews
            currentUser={currentUser}
            savedArticles={savedArticles}
            onDeleteClick={handleDeleteArticle}
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
