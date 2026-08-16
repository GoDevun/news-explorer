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
