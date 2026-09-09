import TickerSearch from '../TickerSearch/TickerSearch';
import SentimentSummary from '../SentimentSummary/SentimentSummary';
import HeadlineList from '../HeadlineList/HeadlineList';
import Preloader from '../Preloader/Preloader';
import notFoundIcon from '../../images/not-found.svg';
import { NOTHING_FOUND_TEXT, NOTHING_FOUND_TITLE } from '../../utils/constants';
import './SearchResults.css';

/**
 * The results page. The search bar is pinned above the results so the next
 * ticker is always reachable without going back to the landing page.
 */
function SearchResults({
  symbol,
  feed,
  isLoading,
  error,
  visibleCount,
  onShowMore,
  onSearch,
  isLoggedIn,
  isSaved,
  onSaveClick,
}) {
  const hasArticles = feed && feed.articles.length > 0;

  return (
    <main className="results">
      <div className="results__searchbar">
        <div className="results__searchbar-inner">
          <TickerSearch variant="compact" initialTicker={symbol} onSearch={onSearch} />
        </div>
      </div>

      <div className="results__body">
        {isLoading && <Preloader text={`Scoring the latest ${symbol} coverage...`} />}

        {!isLoading && error && (
          <p className="results__message results__message_type_error">{error}</p>
        )}

        {!isLoading && !error && feed && !hasArticles && (
          <div className="results__not-found">
            <img
              className="results__not-found-icon"
              src={notFoundIcon}
              alt="Sad magnifying glass"
            />
            <h2 className="results__not-found-title">{NOTHING_FOUND_TITLE}</h2>
            <p className="results__not-found-text">{NOTHING_FOUND_TEXT}</p>
          </div>
        )}

        {!isLoading && !error && feed && hasArticles && feed.matchedBy !== 'symbol' && (
          <p className="results__match-note">
            {feed.matchedBy === 'name' ? (
              <>
                Matched <b>{feed.query}</b> to <b>{feed.symbol}</b>
                {feed.entityName ? ` — ${feed.entityName}` : ''}.
              </>
            ) : (
              <>
                No articles are tagged <b>{feed.symbol}</b>, so these are stories
                mentioning <b>{feed.keyword || feed.query}</b>. Headline scores still
                apply; per-company sentiment from the provider may not.
              </>
            )}
          </p>
        )}

        {!isLoading && !error && feed && hasArticles && (
          <div className="results__panels">
            <SentimentSummary
              symbol={feed.symbol}
              summary={feed.summary}
              meta={feed.meta}
              isLoggedIn={isLoggedIn}
              isSaved={isSaved}
              onSaveClick={onSaveClick}
            />
            <HeadlineList
              title={`${feed.symbol} headlines`}
              articles={feed.articles}
              visibleCount={visibleCount}
              onShowMore={onShowMore}
            />
          </div>
        )}
      </div>
    </main>
  );
}

export default SearchResults;
