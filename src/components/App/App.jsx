import { useCallback, useEffect, useState } from 'react';
import { Route, Switch, useHistory } from 'react-router-dom';
import Header from '../Header/Header';
import SearchForm from '../SearchForm/SearchForm';
import Main from '../Main/Main';
import SavedNews from '../SavedNews/SavedNews';
import Footer from '../Footer/Footer';
import LoginModal from '../LoginModal/LoginModal';
import RegisterModal from '../RegisterModal/RegisterModal';
import SuccessModal from '../SuccessModal/SuccessModal';
import * as fakeApi from '../../utils/fakeApi';
import { getNews } from '../../utils/newsApi';
import {
  CARDS_PER_PAGE,
  JWT_STORAGE_KEY,
  LAST_SEARCH_STORAGE_KEY,
  SEARCH_ERROR_MESSAGE,
} from '../../utils/constants';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
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
        .catch(() => localStorage.removeItem(JWT_STORAGE_KEY));
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

  const handleSaveArticle = (article) => {
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
      .saveArticle(article, keyword)
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
        <Route path="/saved-news">
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
        </Route>
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
