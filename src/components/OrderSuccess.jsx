import { useLocation, Link } from "react-router-dom";
import "../styles/OrderSuccess.css";

function OrderSuccess() {
  const location = useLocation();
  const orderData = location.state;

  if (!orderData) {
    return (
      <div className="order-success-container">
        <div className="error-message">
          <h2>Order information not found</h2>
          <Link to="/catalogue" className="continue-shopping-btn">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="order-success-container">
      <div className="success-card">
        <div className="success-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22,4 12,14.01 9,11.01"></polyline>
          </svg>
        </div>

        <h1>Order Placed Successfully!</h1>
        <p className="success-message">
          Thank you for your order. We&apos;ve received your order and will
          process it shortly.
        </p>

        <div className="order-details">
          <h2>Order Summary</h2>
          <div className="order-info">
            <div className="info-row">
              <span>Order ID:</span>
              <span>#{orderData.orderId}</span>
            </div>
            <div className="info-row">
              <span>Total Items:</span>
              <span>{orderData.items}</span>
            </div>
            <div className="info-row">
              <span>Total Amount:</span>
              <span>${orderData.total}</span>
            </div>
          </div>
        </div>

        <div className="next-steps">
          <h3>What&apos;s Next?</h3>
          <ul>
            <li>You&apos;ll receive an email confirmation shortly</li>
            <li>We&apos;ll prepare your fish for delivery</li>
            <li>Estimated delivery: 2-3 business days</li>
          </ul>
        </div>

        <div className="action-buttons">
          <Link to="/catalogue" className="continue-shopping-btn">
            Continue Shopping
          </Link>
          <Link to="/" className="home-btn">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default OrderSuccess;
