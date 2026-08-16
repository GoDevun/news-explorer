import About from '../About/About';
import NewsCardList from '../NewsCardList/NewsCardList';
import Preloader from '../Preloader/Preloader';
import notFoundIcon from '../../images/not-found.svg';
import { NOTHING_FOUND_TITLE, NOTHING_FOUND_TEXT } from '../../utils/constants';
import './Main.css';

function Main({
  hasSearched,
  isSearching,
  searchError,
  articles,
  visibleCount,
  onShowMore,
  isLoggedIn,
  savedArticles,
  onSaveClick,
}) {
  const visibleArticles = articles.slice(0, visibleCount);
  const isShowMoreVisible = visibleCount < articles.length;

  return (
    <main className="main">
      {hasSearched && (
        <section className="main__results" aria-label="Search results">
          {isSearching && <Preloader />}
          {!isSearching && searchError && (
            <p className="main__message main__message_type_error">{searchError}</p>
          )}
          {!isSearching && !searchError && articles.length === 0 && (
            <div className="main__not-found">
              <img
                className="main__not-found-icon"
                src={notFoundIcon}
                alt="Sad magnifying glass"
              />
              <h2 className="main__not-found-title">{NOTHING_FOUND_TITLE}</h2>
              <p className="main__not-found-text">{NOTHING_FOUND_TEXT}</p>
            </div>
          )}
          {!isSearching && !searchError && articles.length > 0 && (
            <NewsCardList
              articles={visibleArticles}
              mode="search"
              isLoggedIn={isLoggedIn}
              savedArticles={savedArticles}
              onSaveClick={onSaveClick}
              isShowMoreVisible={isShowMoreVisible}
              onShowMore={onShowMore}
            />
          )}
        </section>
      )}
      <About />
    </main>
  );
}

export default Main;
