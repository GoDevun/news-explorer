export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const TOKEN_STORAGE_KEY = 'snsToken';
export const LAST_TICKER_STORAGE_KEY = 'snsLastTicker';

export const TICKER_PATTERN = /^[A-Z][A-Z.-]{0,9}$/;
export const POPULAR_TICKERS = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'AMZN'];

export const EMPTY_TICKER_ERROR_MESSAGE = 'Please enter a ticker symbol';
export const INVALID_TICKER_ERROR_MESSAGE = 'Use a ticker symbol like AAPL or MSFT';

export const NEWS_ERROR_MESSAGE =
  'Sorry, the feed could not be loaded. Please try again in a moment.';
export const NOTHING_FOUND_TITLE = 'No coverage found';
export const NOTHING_FOUND_TEXT =
  'No recent articles mention that ticker. Check the symbol and try again.';

export const SENTIMENT_DISCLAIMER =
  'Headlines are scored from provider sentiment on the headline first, then a keyword reading, then the provider\u2019s score for the ticker elsewhere in the article. Each card says which. This is not financial advice.';
