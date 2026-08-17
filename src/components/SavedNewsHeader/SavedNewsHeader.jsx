import './SavedNewsHeader.css';

function SavedNewsHeader({ currentUser, savedArticles }) {
  const articleWord = savedArticles.length === 1 ? 'article' : 'articles';
  const keywords = [
    ...new Set(savedArticles.map((article) => article.keyword).filter(Boolean)),
  ];
  const mainKeywords = keywords.slice(0, 2).join(', ');
  const extraKeywordCount = keywords.length - 2;

  return (
    <section className="saved-header">
      <p className="saved-header__caption">Saved articles</p>
      <h1 className="saved-header__title">
        {currentUser ? `${currentUser.username}, you` : 'You'} have{' '}
        {savedArticles.length} saved {articleWord}
      </h1>
      {keywords.length > 0 && (
        <p className="saved-header__keywords">
          By keywords:{' '}
          <span className="saved-header__keywords-accent">
            <span className="saved-header__keywords-list">{mainKeywords}</span>
            {extraKeywordCount > 0 && `, and ${extraKeywordCount} other`}
          </span>
        </p>
      )}
    </section>
  );
}

export default SavedNewsHeader;
