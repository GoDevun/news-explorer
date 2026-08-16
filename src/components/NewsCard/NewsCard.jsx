import { formatDisplayDate } from '../../utils/date';
import noImagePlaceholder from '../../images/no-image.svg';
import './NewsCard.css';

function NewsCard({ article, mode, isLoggedIn, isSaved, onSaveClick, onDeleteClick }) {
  const isSearchMode = mode === 'search';

  const handleImageError = (event) => {
    event.target.src = noImagePlaceholder;
  };

  return (
    <li className="news-card">
      <a
        className="news-card__link"
        href={article.url}
        target="_blank"
        rel="noreferrer"
      >
        <img
          className="news-card__image"
          src={article.urlToImage || noImagePlaceholder}
          alt={article.title || 'News article'}
          onError={handleImageError}
        />
        <div className="news-card__content">
          <p className="news-card__date">{formatDisplayDate(article.publishedAt)}</p>
          <h3 className="news-card__title">{article.title}</h3>
          <p className="news-card__text">{article.description}</p>
          <p className="news-card__source">{article.source && article.source.name}</p>
        </div>
      </a>
      {isSearchMode ? (
        <>
          <button
            className={`news-card__button news-card__button_type_save ${
              isSaved ? 'news-card__button_active' : ''
            }`}
            type="button"
            aria-label={isSaved ? 'Remove article from saved' : 'Save article'}
            onClick={() => onSaveClick(article)}
          />
          {!isLoggedIn && (
            <span className="news-card__tooltip">Sign in to save articles</span>
          )}
        </>
      ) : (
        <>
          <span className="news-card__keyword">{article.keyword}</span>
          <button
            className="news-card__button news-card__button_type_delete"
            type="button"
            aria-label="Remove article from saved"
            onClick={() => onDeleteClick(article._id)}
          />
          <span className="news-card__tooltip">Remove from saved</span>
        </>
      )}
    </li>
  );
}

export default NewsCard;
