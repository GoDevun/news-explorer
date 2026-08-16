import { useState } from 'react';
import { EMPTY_KEYWORD_ERROR_MESSAGE } from '../../utils/constants';
import './SearchForm.css';

function SearchForm({ onSearch }) {
  const [searchValue, setSearchValue] = useState('');
  const [searchFormError, setSearchFormError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const keyword = searchValue.trim();
    if (!keyword) {
      setSearchFormError(EMPTY_KEYWORD_ERROR_MESSAGE);
      return;
    }
    setSearchFormError('');
    onSearch(keyword);
  };

  return (
    <section className="search">
      <h1 className="search__title">What&apos;s going on in the world?</h1>
      <p className="search__subtitle">
        Find the latest news on any topic and save them in your personal account.
      </p>
      <form className="search__form" name="search" onSubmit={handleSubmit} noValidate>
        <input
          className="search__input"
          type="text"
          name="keyword"
          placeholder="Enter topic"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          required
        />
        <button className="search__button" type="submit">
          Search
        </button>
      </form>
      <span className="search__error">{searchFormError}</span>
    </section>
  );
}

export default SearchForm;
