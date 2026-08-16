import {
  NEWS_API_BASE_URL,
  NEWS_API_KEY,
  NEWS_PAGE_SIZE,
  SEARCH_DAYS_RANGE,
} from './constants';

const checkResponse = (response) =>
  response.ok ? response.json() : Promise.reject(new Error(`Error: ${response.status}`));

const formatQueryDate = (date) => date.toISOString().split('T')[0];

export const getNews = (keyword) => {
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - SEARCH_DAYS_RANGE);

  const searchParams = new URLSearchParams({
    q: keyword,
    from: formatQueryDate(fromDate),
    to: formatQueryDate(toDate),
    pageSize: NEWS_PAGE_SIZE,
    apiKey: NEWS_API_KEY,
  });

  return fetch(`${NEWS_API_BASE_URL}?${searchParams}`).then(checkResponse);
};
