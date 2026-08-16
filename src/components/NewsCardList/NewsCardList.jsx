import NewsCard from '../NewsCard/NewsCard';
import './NewsCardList.css';

function NewsCardList({
  articles,
  mode,
  isLoggedIn,
  savedArticles = [],
  onSaveClick,
  onDeleteClick,
  isShowMoreVisible,
  onShowMore,
}) {
  return (
    <div className="cards">
      {mode === 'search' && <h2 className="cards__title">Search results</h2>}
      <ul className="cards__list">
        {articles.map((article) => (
          <NewsCard
            key={article._id || article.url}
            article={article}
            mode={mode}
            isLoggedIn={isLoggedIn}
            isSaved={
              mode === 'search' &&
              savedArticles.some((item) => item.url === article.url)
            }
            onSaveClick={onSaveClick}
            onDeleteClick={onDeleteClick}
          />
        ))}
      </ul>
      {mode === 'search' && isShowMoreVisible && (
        <button className="cards__show-more" type="button" onClick={onShowMore}>
          Show more
        </button>
      )}
    </div>
  );
}

export default NewsCardList;
