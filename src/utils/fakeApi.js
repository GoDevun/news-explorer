import {
  USERS_STORAGE_KEY,
  SAVED_ARTICLES_STORAGE_KEY,
  CONFLICT_ERROR_MESSAGE,
  UNAUTHORIZED_ERROR_MESSAGE,
  INVALID_TOKEN_ERROR_MESSAGE,
} from './constants';

// This module simulates backend responses until the real API is built in
// stages 2 and 3. Data is persisted in localStorage and every "request"
// resolves asynchronously to mimic network latency.

const FAKE_LATENCY_MS = 500;

const simulateRequest = (handler) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(handler());
      } catch (error) {
        reject(error);
      }
    }, FAKE_LATENCY_MS);
  });

const readStorage = (storageKey) => {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || [];
  } catch {
    return [];
  }
};

export const register = ({ email, password, username }) =>
  simulateRequest(() => {
    const users = readStorage(USERS_STORAGE_KEY);
    if (users.some((user) => user.email === email)) {
      throw new Error(CONFLICT_ERROR_MESSAGE);
    }
    localStorage.setItem(
      USERS_STORAGE_KEY,
      JSON.stringify([...users, { email, password, username }])
    );
    return { email, username };
  });

export const authorize = ({ email, password }) =>
  simulateRequest(() => {
    const users = readStorage(USERS_STORAGE_KEY);
    const matchedUser = users.find(
      (user) => user.email === email && user.password === password
    );
    if (!matchedUser) {
      throw new Error(UNAUTHORIZED_ERROR_MESSAGE);
    }
    return { token: btoa(email) };
  });

export const checkToken = (token) =>
  simulateRequest(() => {
    const email = atob(token);
    const users = readStorage(USERS_STORAGE_KEY);
    const matchedUser = users.find((user) => user.email === email);
    if (!matchedUser) {
      throw new Error(INVALID_TOKEN_ERROR_MESSAGE);
    }
    return { email: matchedUser.email, username: matchedUser.username };
  });

export const getSavedArticles = () =>
  simulateRequest(() => readStorage(SAVED_ARTICLES_STORAGE_KEY));

export const saveArticle = (article, keyword) =>
  simulateRequest(() => {
    const savedArticles = readStorage(SAVED_ARTICLES_STORAGE_KEY);
    const savedArticle = {
      ...article,
      keyword,
      _id: `${Date.now()}${Math.random().toString(36).slice(2)}`,
    };
    localStorage.setItem(
      SAVED_ARTICLES_STORAGE_KEY,
      JSON.stringify([...savedArticles, savedArticle])
    );
    return savedArticle;
  });

export const deleteArticle = (articleId) =>
  simulateRequest(() => {
    const savedArticles = readStorage(SAVED_ARTICLES_STORAGE_KEY);
    localStorage.setItem(
      SAVED_ARTICLES_STORAGE_KEY,
      JSON.stringify(savedArticles.filter((article) => article._id !== articleId))
    );
    return { _id: articleId };
  });
