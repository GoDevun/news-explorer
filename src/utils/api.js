import { API_BASE_URL, TOKEN_STORAGE_KEY } from './constants';

/**
 * Client for our own REST layer. The backend already normalizes provider data
 * and answers with a consistent `{ message }` on failure, so this stays thin.
 */

const parseResponse = async (response) => {
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(body.message || `Error: ${response.status}`);
    error.statusCode = response.status;
    throw error;
  }

  return body;
};

const request = (path, { method = 'GET', body, token } = {}) =>
  fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }).then(parseResponse);

export const getToken = () => localStorage.getItem(TOKEN_STORAGE_KEY);

export const register = ({ name, email, password }) =>
  request('/signup', { method: 'POST', body: { name, email, password } });

export const login = ({ email, password }) =>
  request('/signin', { method: 'POST', body: { email, password } });

export const getCurrentUser = (token) => request('/users/me', { token });

export const getNews = (symbol) =>
  request(`/news?symbol=${encodeURIComponent(symbol)}`);

export const getSavedTickers = (token) => request('/tickers', { token });

export const saveTicker = (ticker, token) =>
  request('/tickers', { method: 'POST', body: ticker, token });

export const updateSavedTicker = (id, updates, token) =>
  request(`/tickers/${id}`, { method: 'PATCH', body: updates, token });

export const deleteSavedTicker = (id, token) =>
  request(`/tickers/${id}`, { method: 'DELETE', token });
