import { useState } from 'react';
import {
  EMPTY_TICKER_ERROR_MESSAGE,
  INVALID_TICKER_ERROR_MESSAGE,
  POPULAR_TICKERS,
  TICKER_PATTERN,
} from '../../utils/constants';
import './StockSearchForm.css';

function StockSearchForm({ onSearch, initialTicker = '' }) {
  const [searchValue, setSearchValue] = useState(initialTicker);
  const [searchFormError, setSearchFormError] = useState('');

  const submitTicker = (value) => {
    const ticker = value.trim().toUpperCase();

    if (!ticker) {
      setSearchFormError(EMPTY_TICKER_ERROR_MESSAGE);
      return;
    }
    if (!TICKER_PATTERN.test(ticker)) {
      setSearchFormError(INVALID_TICKER_ERROR_MESSAGE);
      return;
    }

    setSearchFormError('');
    onSearch(ticker);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    submitTicker(searchValue);
  };

  const handlePopularClick = (ticker) => {
    setSearchValue(ticker);
    submitTicker(ticker);
  };

  return (
    <section className="stock-search">
      <h1 className="stock-search__title">Bullish or bearish?</h1>
      <p className="stock-search__subtitle">
        Enter a ticker to see how the price, the analysts and the last two weeks of
        headlines are leaning.
      </p>
      <form
        className="stock-search__form"
        name="stock-search"
        onSubmit={handleSubmit}
        noValidate
      >
        <input
          className="stock-search__input"
          type="text"
          name="ticker"
          placeholder="Enter ticker, e.g. AAPL"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck="false"
          maxLength={10}
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value.toUpperCase())}
          required
        />
        <button className="stock-search__button" type="submit">
          Analyze
        </button>
      </form>
      <span className="stock-search__error">{searchFormError}</span>
      <ul className="stock-search__popular">
        {POPULAR_TICKERS.map((ticker) => (
          <li key={ticker}>
            <button
              className="stock-search__chip"
              type="button"
              onClick={() => handlePopularClick(ticker)}
            >
              {ticker}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default StockSearchForm;
