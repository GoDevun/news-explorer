import { SENTIMENT_DISCLAIMER } from '../../utils/constants';
import './SentimentSummary.css';

const formatScore = (score) => `${score > 0 ? '+' : ''}${score.toFixed(2)}`;

const formatStaleTime = (isoString) => {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

function SentimentSummary({ symbol, summary, meta, isSaved, isLoggedIn, onSaveClick }) {
  const markerPosition = ((summary.score + 1) / 2) * 100;
  const { counts } = summary;

  return (
    <section className="summary" aria-label={`${symbol} sentiment reading`}>
      <div className="summary__header">
        <div>
          <p className="summary__eyebrow">{symbol} · overall reading</p>
          <p className={`summary__label summary__label_tone_${summary.tone}`}>
            {summary.label}
          </p>
        </div>
        <div className="summary__header-side">
          <p className="summary__score">
            <span className="summary__score-value">{formatScore(summary.score)}</span>
            <span className="summary__score-scale">on a -1 to +1 scale</span>
          </p>
          <button
            className={`summary__save ${isSaved ? 'summary__save_active' : ''}`}
            type="button"
            onClick={onSaveClick}
          >
            {isSaved ? 'Saved' : 'Save ticker'}
          </button>
          {!isLoggedIn && (
            <span className="summary__save-hint">Sign in to save tickers</span>
          )}
        </div>
      </div>

      <div className="summary__gauge">
        <div
          className="summary__gauge-track"
          role="img"
          aria-label={`Score ${formatScore(summary.score)}: ${summary.label}`}
        >
          <span className="summary__gauge-marker" style={{ left: `${markerPosition}%` }} />
        </div>
        <div className="summary__gauge-labels">
          <span>Bearish</span>
          <span>Neutral</span>
          <span>Bullish</span>
        </div>
      </div>

      <ul className="summary__counts">
        <li className="summary__count summary__count_tone_bullish">
          <span className="summary__count-value">{counts.bullish}</span>
          <span className="summary__count-label">Bullish</span>
        </li>
        <li className="summary__count summary__count_tone_neutral">
          <span className="summary__count-value">{counts.neutral}</span>
          <span className="summary__count-label">Neutral</span>
        </li>
        <li className="summary__count summary__count_tone_bearish">
          <span className="summary__count-value">{counts.bearish}</span>
          <span className="summary__count-label">Bearish</span>
        </li>
        <li className="summary__count">
          <span className="summary__count-value">{summary.analyzed}</span>
          <span className="summary__count-label">Headlines scored</span>
        </li>
      </ul>

      {meta && meta.stale && (
        <p className="summary__notice">
          {meta.notice} Last updated {formatStaleTime(meta.staleSince)}.
        </p>
      )}
      <p className="summary__disclaimer">{SENTIMENT_DISCLAIMER}</p>
    </section>
  );
}

export default SentimentSummary;
