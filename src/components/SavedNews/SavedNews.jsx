import SavedNewsHeader from '../SavedNewsHeader/SavedNewsHeader';
import NewsCardList from '../NewsCardList/NewsCardList';
import './SavedNews.css';

function SavedNews({ currentUser, savedArticles, onDeleteClick }) {
  return (
    <main className="saved-news">
      <SavedNewsHeader currentUser={currentUser} savedArticles={savedArticles} />
      <section className="saved-news__cards" aria-label="Saved articles">
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
      </section>
    </main>
  );
}

export default SavedNews;
