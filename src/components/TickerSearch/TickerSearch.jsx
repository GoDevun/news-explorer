import { useEffect, useState } from 'react';
import {
  EMPTY_TICKER_ERROR_MESSAGE,
  INVALID_TICKER_ERROR_MESSAGE,
  POPULAR_TICKERS,
  TICKER_PATTERN,
} from '../../utils/constants';
import './TickerSearch.css';

/**
 * One search control in two dresses: the large hero on the landing page, and
 * the compact bar that stays pinned to the top of the results page so another
 * ticker is always one keystroke away.
 */
function TickerSearch({ onSearch, variant = 'hero', initialTicker = '' }) {
  const [searchValue, setSearchValue] = useState(initialTicker);
  const [formError, setFormError] = useState('');

  // Keep the bar in step when the route changes under it, e.g. on back/forward.
  useEffect(() => {
    setSearchValue(initialTicker);
  }, [initialTicker]);

  const submitTicker = (value) => {
    const ticker = value.trim().toUpperCase();

    if (!ticker) {
      setFormError(EMPTY_TICKER_ERROR_MESSAGE);
      return;
    }
    if (!TICKER_PATTERN.test(ticker)) {
      setFormError(INVALID_TICKER_ERROR_MESSAGE);
      return;
    }

    setFormError('');
    onSearch(ticker);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    submitTicker(searchValue);
  };

  const isCompact = variant === 'compact';

  return (
    <section className={`ticker-search ticker-search_variant_${variant}`}>
      {!isCompact && (
        <>
          <h1 className="ticker-search__title">Bullish or bearish?</h1>
          <p className="ticker-search__subtitle">
            Search any ticker to see the latest financial news scored headline by
            headline, in one feed instead of a dozen tabs.
          </p>
        </>
      )}

      <form
        className="ticker-search__form"
        name="ticker-search"
        onSubmit={handleSubmit}
        noValidate
      >
        <input
          className="ticker-search__input"
          type="text"
          name="ticker"
          aria-label="Ticker symbol"
          placeholder={isCompact ? 'Search another ticker' : 'Enter ticker, e.g. AAPL'}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck="false"
          maxLength={10}
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value.toUpperCase())}
          required
        />
        <button className="ticker-search__button" type="submit">
          Search
        </button>
      </form>

      <span className="ticker-search__error">{formError}</span>

      {!isCompact && (
        <ul className="ticker-search__popular">
          {POPULAR_TICKERS.map((ticker) => (
            <li key={ticker}>
              <button
                className="ticker-search__chip"
                type="button"
                onClick={() => submitTicker(ticker)}
              >
                {ticker}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default TickerSearch;
