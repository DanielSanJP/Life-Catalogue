import { Link } from "react-router-dom";
import "../styles/Footer.css";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>Life Catalogue</h3>
          <p>
            Your premier source for aquatic life information and cataloguing
            services.
          </p>
        </div>

        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/catalogue">Fish Catalogue</Link>
            </li>
            <li>
              <Link to="/species">Species</Link>
            </li>
            <li>
              <Link to="/about">About</Link>
            </li>
            {/* <li>
              <Link to="/contact">Contact</Link>
            </li> */}
          </ul>
        </div>

        <div className="footer-section">
          <h4>Contact Us</h4>
          <address>
            <p>123 Aquatic Avenue</p>
            <p>Ocean City, Marine State</p>
            <p>Email: contact@lifecatalogue.com</p>
          </address>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {currentYear} Life Catalogue. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
