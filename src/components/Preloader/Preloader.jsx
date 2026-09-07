import './Preloader.css';

function Preloader({ text = 'Searching for news...' }) {
  return (
    <div className="preloader">
      <div className="preloader__spinner">
        <div className="circle-preloader" />
      </div>
      <p className="preloader__text">{text}</p>
    </div>
  );
}

export default Preloader;
