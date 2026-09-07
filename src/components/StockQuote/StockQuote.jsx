import './StockQuote.css';

const isFiniteNumber = (value) => typeof value === 'number' && Number.isFinite(value);

const formatPrice = (value) => (isFiniteNumber(value) ? `$${value.toFixed(2)}` : '--');

const formatSignedPrice = (value) =>
  isFiniteNumber(value) ? `${value > 0 ? '+' : ''}${value.toFixed(2)}` : '--';

const formatSignedPercent = (value) =>
  isFiniteNumber(value) ? `${value > 0 ? '+' : ''}${value.toFixed(2)}%` : '--';

const formatMarketCap = (value) => {
  if (!isFiniteNumber(value)) {
    return '--';
  }
  // Finnhub reports market capitalization in millions.
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}T`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(2)}B`;
  }
  return `$${value.toFixed(0)}M`;
};

function StockQuote({ ticker, profile, quote, metrics }) {
  const change = quote.d;
  const changeTone = !isFiniteNumber(change) || change === 0
    ? 'neutral'
    : change > 0
      ? 'bullish'
      : 'bearish';

  const weekHigh = metrics && metrics['52WeekHigh'];
  const weekLow = metrics && metrics['52WeekLow'];
  const hasWeekRange =
    isFiniteNumber(weekHigh) && isFiniteNumber(weekLow) && weekHigh > weekLow;
  const weekPosition = hasWeekRange
    ? Math.min(100, Math.max(0, ((quote.c - weekLow) / (weekHigh - weekLow)) * 100))
    : 0;

  return (
    <section className="stock-quote" aria-label={`${ticker} quote`}>
      <div className="stock-quote__header">
        <div className="stock-quote__identity">
          {profile && profile.logo && (
            <img
              className="stock-quote__logo"
              src={profile.logo}
              alt=""
              aria-hidden="true"
            />
          )}
          <div>
            <h2 className="stock-quote__name">
              {(profile && profile.name) || ticker}
            </h2>
            <p className="stock-quote__meta">
              <span className="stock-quote__ticker">{ticker}</span>
              {profile && profile.exchange && ` · ${profile.exchange}`}
              {profile && profile.finnhubIndustry && ` · ${profile.finnhubIndustry}`}
            </p>
          </div>
        </div>
        <div className="stock-quote__price-block">
          <p className="stock-quote__price">{formatPrice(quote.c)}</p>
          <p className={`stock-quote__change stock-quote__change_tone_${changeTone}`}>
            {formatSignedPrice(change)} ({formatSignedPercent(quote.dp)})
          </p>
        </div>
      </div>

      <ul className="stock-quote__stats">
        <li className="stock-quote__stat">
          <span className="stock-quote__stat-label">Open</span>
          <span className="stock-quote__stat-value">{formatPrice(quote.o)}</span>
        </li>
        <li className="stock-quote__stat">
          <span className="stock-quote__stat-label">Previous close</span>
          <span className="stock-quote__stat-value">{formatPrice(quote.pc)}</span>
        </li>
        <li className="stock-quote__stat">
          <span className="stock-quote__stat-label">Day range</span>
          <span className="stock-quote__stat-value">
            {formatPrice(quote.l)} - {formatPrice(quote.h)}
          </span>
        </li>
        <li className="stock-quote__stat">
          <span className="stock-quote__stat-label">Market cap</span>
          <span className="stock-quote__stat-value">
            {formatMarketCap(profile && profile.marketCapitalization)}
          </span>
        </li>
      </ul>

      {hasWeekRange && (
        <div className="stock-quote__range">
          <div className="stock-quote__range-labels">
            <span>52-week low {formatPrice(weekLow)}</span>
            <span>52-week high {formatPrice(weekHigh)}</span>
          </div>
          <div
            className="stock-quote__range-track"
            role="img"
            aria-label={`Price is ${Math.round(weekPosition)}% of the way up the 52-week range`}
          >
            <span
              className="stock-quote__range-marker"
              style={{ left: `${weekPosition}%` }}
            />
          </div>
        </div>
      )}
    </section>
  );
}

export default StockQuote;
