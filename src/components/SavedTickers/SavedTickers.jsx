import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDisplayDate } from '../../utils/date';
import './SavedTickers.css';

const TONE_LABELS = { bullish: 'Bullish', bearish: 'Bearish', neutral: 'Neutral' };

/** One row, with inline note editing so the list supports the full CRUD set. */
function SavedTickerRow({ ticker, onUpdateNote, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [noteDraft, setNoteDraft] = useState(ticker.note || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    onUpdateNote(ticker._id, noteDraft).finally(() => {
      setIsSaving(false);
      setIsEditing(false);
    });
  };

  const tone = (ticker.lastSentiment && ticker.lastSentiment.tone) || 'neutral';

  return (
    <li className="saved__item">
      <div className="saved__main">
        <Link className="saved__symbol" to={`/search/${ticker.symbol}`}>
          {ticker.symbol}
        </Link>
        <div className="saved__meta">
          {ticker.companyName && (
            <span className="saved__company">{ticker.companyName}</span>
          )}
          <span className="saved__added">
            Saved {formatDisplayDate(ticker.createdAt)}
          </span>
        </div>
      </div>

      <span className={`saved__tone saved__tone_type_${tone}`}>
        {(ticker.lastSentiment && ticker.lastSentiment.label) || TONE_LABELS[tone]}
      </span>

      <div className="saved__note">
        {isEditing ? (
          <div className="saved__note-edit">
            <input
              className="saved__note-input"
              type="text"
              maxLength={280}
              value={noteDraft}
              aria-label={`Note for ${ticker.symbol}`}
              onChange={(event) => setNoteDraft(event.target.value)}
            />
            <button
              className="saved__button"
              type="button"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              className="saved__button saved__button_type_ghost"
              type="button"
              onClick={() => {
                setNoteDraft(ticker.note || '');
                setIsEditing(false);
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            className="saved__note-text"
            type="button"
            onClick={() => setIsEditing(true)}
          >
            {ticker.note || 'Add a note'}
          </button>
        )}
      </div>

      <button
        className="saved__button saved__button_type_danger"
        type="button"
        onClick={() => onDelete(ticker._id)}
      >
        Remove
      </button>
    </li>
  );
}

function SavedTickers({ currentUser, tickers, onUpdateNote, onDelete }) {
  return (
    <main className="saved">
      <section className="saved__header">
        <p className="saved__eyebrow">Saved tickers</p>
        <h1 className="saved__title">
          {currentUser ? currentUser.name : 'You'}, you have {tickers.length}{' '}
          saved {tickers.length === 1 ? 'ticker' : 'tickers'}
        </h1>
      </section>

      {tickers.length === 0 ? (
        <p className="saved__empty">
          Nothing saved yet. Search a ticker and use <b>Save ticker</b> to keep it here.
        </p>
      ) : (
        <ul className="saved__list">
          {tickers.map((ticker) => (
            <SavedTickerRow
              key={ticker._id}
              ticker={ticker}
              onUpdateNote={onUpdateNote}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </main>
  );
}

export default SavedTickers;
