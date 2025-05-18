import { useEffect } from "react";
import "../styles/About.css";

function About() {
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="about-container">
      <div className="about-hero">
        <img
          src="/hero.jpg"
          alt="Beautiful aquarium ecosystem"
          className="about-hero-image"
        />
        <div className="about-hero-text">
          <h1>About Life Catalogue</h1>
          <p>
            Discover the underwater world with our comprehensive fish database
          </p>
        </div>
      </div>

      <div className="about-content">
        <section className="about-section">
          <h2>Our Mission</h2>
          <p>
            Life Catalogue was established with a clear vision: to create the
            most comprehensive, accurate, and accessible database of aquatic
            species for enthusiasts, researchers, and aquarists worldwide. We
            believe that understanding aquatic life is essential for
            conservation efforts and maintaining healthy aquarium ecosystems.
          </p>
          <p>
            Our team of marine biologists, experienced aquarists, and software
            developers work together to provide you with detailed,
            scientifically accurate information about thousands of fish species,
            their habitats, care requirements, and compatibility with other
            aquatic life.
          </p>
        </section>

        <section className="about-section">
          <h2>Key Features</h2>
          <div className="feature-cards">
            <div className="feature-card">
              <h3>Detailed Database</h3>
              <p>
                Access detailed information on thousands of freshwater and
                marine fish species, including care guidelines, habitat
                requirements, and compatibility with other species.
              </p>
            </div>
            <div className="feature-card">
              <h3>Scientific Accuracy</h3>
              <p>
                All information is verified by marine biologists and experienced
                aquarists to ensure the highest level of accuracy and
                reliability.
              </p>
            </div>
            <div className="feature-card">
              <h3>Regular Updates</h3>
              <p>
                Our database is continuously updated with new species, research
                findings, and care techniques to provide you with the most
                current information available.
              </p>
            </div>
          </div>
        </section>

        <section className="about-section team-section">
          <h2>Our Team</h2>
          <div className="team-info">
            <p>
              Life Catalogue is made possible by a dedicated team of marine
              biology experts, experienced aquarists, and software developers
              who share a passion for aquatic life. Our specialists have years
              of experience in fish keeping, research, and conservation,
              ensuring that the information we provide is both accurate and
              practical.
            </p>
            <p>
              We collaborate with aquariums, research institutions, and
              conservation organizations around the world to contribute to the
              protection and understanding of aquatic ecosystems.
            </p>
          </div>
        </section>

        <section className="about-section">
          <h2>Join Our Community</h2>
          <p>
            Whether you&apos;re a beginner setting up your first aquarium, a
            seasoned aquarist expanding your collection, or a researcher looking
            for specific information, Life Catalogue is designed to meet your
            needs. Join our growing community of fish enthusiasts, share your
            experiences, and help us improve our database.
          </p>
          <p>
            Together, we can promote responsible fish keeping practices and
            contribute to the conservation of aquatic species worldwide.
          </p>
        </section>
      </div>
    </div>
  );
}

export default About;
