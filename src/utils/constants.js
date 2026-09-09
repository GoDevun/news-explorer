export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const TOKEN_STORAGE_KEY = 'snsToken';
export const LAST_TICKER_STORAGE_KEY = 'snsLastTicker';

export const MAX_QUERY_LENGTH = 40;
export const POPULAR_TICKERS = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'AMZN'];

export const EMPTY_TICKER_ERROR_MESSAGE = 'Enter a ticker or company name';

export const NEWS_ERROR_MESSAGE =
  'Sorry, the feed could not be loaded. Please try again in a moment.';
export const NOTHING_FOUND_TITLE = 'No coverage found';
export const NOTHING_FOUND_TEXT =
  'No recent articles mention that company. Try the ticker symbol, or a different spelling of the name.';

export const SENTIMENT_DISCLAIMER =
  'Headlines are scored from provider sentiment on the headline first, then a keyword reading, then the provider\u2019s score for the ticker elsewhere in the article. Each card says which. This is not financial advice.';
