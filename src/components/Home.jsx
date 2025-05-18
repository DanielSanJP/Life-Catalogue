import { Link } from "react-router-dom";
import "../styles/Home.css";

function Home() {
  return (
    <div className="home-container">
      <div className="home-hero">
        <img
          src="/home.jpg"
          alt="Beautiful aquatic life showcase"
          className="home-hero-image"
        />
        <div className="home-hero-content">
          <h1>Life Catalogue</h1>
          <p>
            Your premier source for aquatic life information and cataloguing
            services
          </p>
          <div className="home-hero-buttons">
            <Link to="/catalogue" className="primary-button">
              Explore Catalogue
            </Link>
            <Link to="/species" className="secondary-button">
              View Species
            </Link>
          </div>
        </div>
      </div>

      <section className="home-features">
        <h2>Discover Our Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>Comprehensive Database</h3>
            <p>
              Explore our extensive collection of aquatic species with detailed
              information and high-quality images.
            </p>
          </div>
          <div className="feature-card">
            <h3>Scientific Accuracy</h3>
            <p>
              All information is verified by marine biologists and experienced
              aquarists for accuracy and reliability.
            </p>
          </div>
          <div className="feature-card">
            <h3>Regular Updates</h3>
            <p>
              Our database is continuously updated with new species, research
              findings, and care techniques.
            </p>
          </div>
        </div>
      </section>

      <section className="home-cta">
        <div className="cta-content">
          <h2>Start Your Aquatic Journey Today</h2>
          <p>
            Whether you&apos;re a beginner or an experienced enthusiast, our
            platform provides valuable resources for all levels.
          </p>
          <Link to="/about" className="cta-button">
            Learn More About Us
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;
