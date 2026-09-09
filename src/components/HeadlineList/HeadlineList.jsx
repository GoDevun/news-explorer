import HeadlineCard from '../HeadlineCard/HeadlineCard';
import './HeadlineList.css';

function HeadlineList({ title, articles, visibleCount, onShowMore }) {
  const visibleArticles = articles.slice(0, visibleCount);
  const isShowMoreVisible = visibleCount < articles.length;

  return (
    <section className="headlines" aria-label="Scored headlines">
      <h2 className="headlines__title">{title}</h2>
      <ul className="headlines__list">
        {visibleArticles.map((article) => (
          <HeadlineCard key={article.id} article={article} />
        ))}
      </ul>
      {isShowMoreVisible && (
        <button className="headlines__show-more" type="button" onClick={onShowMore}>
          Show more
        </button>
      )}
    </section>
  );
}

export default HeadlineList;
