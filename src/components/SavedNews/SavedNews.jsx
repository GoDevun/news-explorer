import SavedNewsHeader from '../SavedNewsHeader/SavedNewsHeader';
import NewsCardList from '../NewsCardList/NewsCardList';
import './SavedNews.css';

function SavedNews({ currentUser, savedArticles, onDeleteClick }) {
  return (
    <main className="saved-news">
      <SavedNewsHeader currentUser={currentUser} savedArticles={savedArticles} />
      <div className="saved-news__cards">
        {savedArticles.length > 0 ? (
          <NewsCardList
            articles={savedArticles}
            mode="saved"
            onDeleteClick={onDeleteClick}
          />
        ) : (
          <p className="saved-news__empty-message">
            You haven&apos;t saved any articles yet.
          </p>
        )}
      </div>
    </main>
  );
}

export default SavedNews;
