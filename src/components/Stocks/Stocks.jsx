import StockQuote from '../StockQuote/StockQuote';
import StockSignal from '../StockSignal/StockSignal';
import NewsCardList from '../NewsCardList/NewsCardList';
import Preloader from '../Preloader/Preloader';
import notFoundIcon from '../../images/not-found.svg';
import {
  STOCK_NEWS_DAYS_RANGE,
  TICKER_NOT_FOUND_TEXT,
  TICKER_NOT_FOUND_TITLE,
} from '../../utils/constants';
import './Stocks.css';

function Stocks({
  hasSearched,
  isLoading,
  error,
  isNotFound,
  stock,
  signal,
  visibleCount,
  onShowMore,
  isLoggedIn,
  savedArticles,
  onSaveClick,
}) {
  const articles = (stock && stock.articles) || [];
  const visibleArticles = articles.slice(0, visibleCount);
  const isShowMoreVisible = visibleCount < articles.length;

  return (
    <main className="stocks">
      {hasSearched && (
        <section className="stocks__results" aria-label="Ticker analysis">
          {isLoading && <Preloader text="Reading the tape..." />}

          {!isLoading && error && (
            <p className="stocks__message stocks__message_type_error">{error}</p>
          )}

          {!isLoading && !error && isNotFound && (
            <div className="stocks__not-found">
              <img
                className="stocks__not-found-icon"
                src={notFoundIcon}
                alt="Sad magnifying glass"
              />
              <h2 className="stocks__not-found-title">{TICKER_NOT_FOUND_TITLE}</h2>
              <p className="stocks__not-found-text">{TICKER_NOT_FOUND_TEXT}</p>
            </div>
          )}

          {!isLoading && !error && !isNotFound && stock && signal && (
            <div className="stocks__panels">
              <StockQuote
                ticker={stock.ticker}
                profile={stock.profile}
                quote={stock.quote}
                metrics={stock.metrics}
              />
              <StockSignal signal={signal} unavailable={stock.unavailable} />
              {articles.length > 0 ? (
                <NewsCardList
                  title={`${stock.ticker} headlines`}
                  articles={visibleArticles}
                  mode="search"
                  tones={signal.news.tones}
                  isLoggedIn={isLoggedIn}
                  savedArticles={savedArticles}
                  onSaveClick={onSaveClick}
                  isShowMoreVisible={isShowMoreVisible}
                  onShowMore={onShowMore}
                />
              ) : (
                <p className="stocks__message">
                  No company headlines were published for {stock.ticker} in the last{' '}
                  {STOCK_NEWS_DAYS_RANGE} days, so the reading leans on price and
                  analyst data alone.
                </p>
              )}
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default Stocks;
