import authorPhoto from '../../images/author.svg';
import './About.css';

function About() {
  return (
    <section className="about">
      <img className="about__photo" src={authorPhoto} alt="Author of the project" />
      <div className="about__info">
        <h2 className="about__title">About the author</h2>
        <p className="about__text">
          Hi, I&apos;m Devun — a software engineer and graduate of the TripleTen
          Software Engineering program. Throughout the program I built a series of
          full-stack applications, working with HTML, CSS, JavaScript, React,
          Node.js, Express, and MongoDB, and this project brings all of those
          skills together.
        </p>
        <p className="about__text">
          I enjoy turning designs into responsive, pixel-accurate interfaces and
          building the APIs that power them. I&apos;m currently looking for
          opportunities where I can keep growing as a developer and contribute to a
          team building real products.
        </p>
      </div>
    </section>
  );
}

export default About;
