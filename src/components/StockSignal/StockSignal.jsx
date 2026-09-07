import { STOCK_DISCLAIMER } from '../../utils/constants';
import './StockSignal.css';

const formatScore = (score) => `${score > 0 ? '+' : ''}${score.toFixed(2)}`;

function StockSignal({ signal, unavailable = [] }) {
  // The gauge runs from -1 (bearish) on the left to +1 (bullish) on the right.
  const markerPosition = ((signal.score + 1) / 2) * 100;

  return (
    <section className="signal" aria-label="Bullish or bearish reading">
      <div className="signal__verdict">
        <div>
          <p className="signal__eyebrow">Overall reading</p>
          <p className={`signal__label signal__label_tone_${signal.tone}`}>
            {signal.label}
          </p>
        </div>
        <p className="signal__score">
          <span className="signal__score-value">{formatScore(signal.score)}</span>
          <span className="signal__score-scale">on a -1 to +1 scale</span>
        </p>
      </div>

      <div className="signal__gauge">
        <div
          className="signal__gauge-track"
          role="img"
          aria-label={`Composite score ${formatScore(signal.score)}: ${signal.label}`}
        >
          <span className="signal__gauge-marker" style={{ left: `${markerPosition}%` }} />
        </div>
        <div className="signal__gauge-labels">
          <span>Bearish</span>
          <span>Neutral</span>
          <span>Bullish</span>
        </div>
      </div>

      <ul className="signal__factors">
        {signal.factors.map((factor) => (
          <li className="signal__factor" key={factor.key}>
            <div className="signal__factor-header">
              <h3 className="signal__factor-name">{factor.name}</h3>
              <span className={`signal__tag signal__tag_tone_${factor.tone}`}>
                {factor.tone}
              </span>
            </div>
            <div className="signal__factor-bar">
              <span
                className={`signal__factor-fill signal__factor-fill_tone_${factor.tone}`}
                style={{
                  width: `${Math.abs(factor.score) * 50}%`,
                  left: factor.score >= 0 ? '50%' : `${50 - Math.abs(factor.score) * 50}%`,
                }}
              />
            </div>
            <p className="signal__factor-detail">{factor.detail}</p>
            <p className="signal__factor-weight">{factor.share}% of the reading</p>
          </li>
        ))}
      </ul>

      {unavailable.length > 0 && (
        <p className="signal__note">
          Scored without {unavailable.join(' and ')} - that data was not returned by
          the market data API for this symbol.
        </p>
      )}
      <p className="signal__disclaimer">{STOCK_DISCLAIMER}</p>
    </section>
  );
}

export default StockSignal;
