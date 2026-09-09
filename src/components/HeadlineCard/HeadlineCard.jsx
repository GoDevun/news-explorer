import { formatDisplayDate } from '../../utils/date';
import noImagePlaceholder from '../../images/no-image.svg';
import './HeadlineCard.css';

const TONE_LABELS = { bullish: 'Bullish', bearish: 'Bearish', neutral: 'Neutral' };

const SOURCE_NOTES = {
  keywords: 'by keywords',
  article: 'from article body',
};

function HeadlineCard({ article }) {
  const { sentiment } = article;

  const handleImageError = (event) => {
    event.target.src = noImagePlaceholder;
  };

  return (
    <li className="headline">
      <a className="headline__link" href={article.url} target="_blank" rel="noreferrer">
        <img
          className="headline__image"
          src={article.imageUrl || noImagePlaceholder}
          alt=""
          onError={handleImageError}
        />
        <div className="headline__content">
          <p className="headline__date">{formatDisplayDate(article.publishedAt)}</p>
          <h3 className="headline__title">{article.title}</h3>
          <p className="headline__text">{article.description}</p>
          <p className="headline__source">{article.source}</p>
        </div>
      </a>
      <span className={`headline__tone headline__tone_type_${sentiment.tone}`}>
        {TONE_LABELS[sentiment.tone]}
      </span>
      {/* Say where the label came from: a provider score on the headline needs
          no caveat, but a keyword reading or a body-level score does. */}
      {SOURCE_NOTES[sentiment.source] && (
        <span className="headline__tone-note">{SOURCE_NOTES[sentiment.source]}</span>
      )}
    </li>
  );
}

export default HeadlineCard;
