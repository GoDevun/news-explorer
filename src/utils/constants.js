export const NEWS_API_BASE_URL = import.meta.env.PROD
  ? 'https://nomoreparties.co/news/v2/everything'
  : 'https://newsapi.org/v2/everything';

export const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY;

export const NEWS_PAGE_SIZE = 100;
export const SEARCH_DAYS_RANGE = 7;
export const CARDS_PER_PAGE = 3;

export const JWT_STORAGE_KEY = 'newsExplorerJwt';
export const LAST_SEARCH_STORAGE_KEY = 'newsExplorerLastSearch';
export const USERS_STORAGE_KEY = 'newsExplorerUsers';
export const SAVED_ARTICLES_STORAGE_KEY = 'newsExplorerSavedArticles';

export const EMPTY_KEYWORD_ERROR_MESSAGE = 'Please enter a keyword';
export const SEARCH_ERROR_MESSAGE =
  'Sorry, something went wrong during the request. Please try again later.';
export const NOTHING_FOUND_TITLE = 'Nothing found';
export const NOTHING_FOUND_TEXT = 'Sorry, but nothing matched your search terms.';

export const CONFLICT_ERROR_MESSAGE = 'This email is not available';
export const UNAUTHORIZED_ERROR_MESSAGE = 'Incorrect email or password';
export const INVALID_TOKEN_ERROR_MESSAGE = 'Invalid token';

export const FINNHUB_API_BASE_URL = 'https://finnhub.io/api/v1';
export const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;

export const STOCK_NEWS_DAYS_RANGE = 14;
export const STOCK_NEWS_LIMIT = 30;
export const TICKER_PATTERN = /^[A-Z][A-Z.-]{0,9}$/;
export const POPULAR_TICKERS = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'AMZN'];

export const LAST_TICKER_STORAGE_KEY = 'newsExplorerLastTicker';

export const EMPTY_TICKER_ERROR_MESSAGE = 'Please enter a ticker symbol';
export const INVALID_TICKER_ERROR_MESSAGE = 'Use a ticker symbol like AAPL or MSFT';
export const MISSING_STOCK_KEY_ERROR_MESSAGE =
  'Market data is not configured. Add VITE_FINNHUB_API_KEY to your .env file and restart the dev server.';
export const STOCK_RATE_LIMIT_ERROR_MESSAGE =
  'Too many requests to the market data API. Wait a minute and try again.';
export const STOCK_ERROR_MESSAGE =
  'Sorry, something went wrong while loading market data. Please try again later.';
export const TICKER_NOT_FOUND_TITLE = 'Ticker not found';
export const TICKER_NOT_FOUND_TEXT =
  'Sorry, but no listed company matched that symbol. Check the spelling and try again.';

export const STOCK_DISCLAIMER =
  'This reading is generated from public market data and headline wording. It is not financial advice.';
