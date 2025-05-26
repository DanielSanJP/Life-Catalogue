import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/Cart.css";

function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const location = useLocation();

  // Function to load cart from localStorage
  const loadCartFromStorage = () => {
    const savedCart = localStorage.getItem("fishCart");
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        console.log("Loading cart from storage:", parsedCart);
        setCartItems(parsedCart);
      } catch (error) {
        console.error("Error parsing cart from localStorage:", error);
        setCartItems([]);
      }
    } else {
      console.log("No cart found in localStorage");
      setCartItems([]);
    }
  };

  // Load cart when component mounts or when navigating to cart page
  useEffect(() => {
    loadCartFromStorage();
  }, [location.pathname]); // Reload when path changes

  // Listen for cart updates from other components
  useEffect(() => {
    const handleCartUpdate = (event) => {
      console.log("Cart component received update event:", event.detail);
      loadCartFromStorage();
    };

    const handleStorageChange = (event) => {
      if (event.key === "fishCart") {
        console.log("Storage change detected in Cart component");
        loadCartFromStorage();
      }
    };

    window.addEventListener("cartUpdated", handleCartUpdate);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const updateQuantity = (fishId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(fishId);
      return;
    }

    const updatedItems = cartItems.map((item) =>
      item.id === fishId ? { ...item, quantity: newQuantity } : item
    );

    setCartItems(updatedItems);
    localStorage.setItem("fishCart", JSON.stringify(updatedItems));

    // Dispatch event to update navbar
    window.dispatchEvent(
      new CustomEvent("cartUpdated", {
        detail: { cart: updatedItems },
      })
    );
  };

  const removeFromCart = (fishId) => {
    const updatedItems = cartItems.filter((item) => item.id !== fishId);

    setCartItems(updatedItems);
    localStorage.setItem("fishCart", JSON.stringify(updatedItems));

    // Dispatch event to update navbar
    window.dispatchEvent(
      new CustomEvent("cartUpdated", {
        detail: { cart: updatedItems },
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.setItem("fishCart", JSON.stringify([]));

    // Dispatch event to update navbar
    window.dispatchEvent(
      new CustomEvent("cartUpdated", {
        detail: { cart: [] },
      })
    );
  };

  const calculateTotal = () => {
    return cartItems
      .reduce((total, item) => total + item.price * item.quantity, 0)
      .toFixed(2);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-container">
        <div className="cart-header">
          <h1>Shopping Cart</h1>
        </div>
        <div className="empty-cart">
          <div className="empty-cart-icon">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Add some fish to your cart to see them here!</p>
          <Link to="/catalogue" className="continue-shopping-btn">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h1>Shopping Cart</h1>
        <span className="cart-count">({getTotalItems()} items)</span>
      </div>

      <div className="cart-content">
        <div className="cart-items">
          {cartItems.map((item) => (
            <div key={item.id} className="cart-item">
              <div className="cart-item-image">
                <img src={item.image_url} alt={item.name} />
              </div>

              <div className="cart-item-details">
                <h3>{item.name}</h3>
                <p className="scientific-name">{item.scientific_name}</p>
                <p className="item-price">${item.price}</p>
              </div>

              <div className="cart-item-controls">
                <div className="quantity-controls">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="quantity-btn"
                  >
                    -
                  </button>
                  <span className="quantity">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="quantity-btn"
                  >
                    +
                  </button>
                </div>

                <div className="item-total">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>

                <button
                  onClick={() => removeFromCart(item.id)}
                  className="remove-btn"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <div className="summary-card">
            <h3>Order Summary</h3>

            <div className="summary-line">
              <span>Subtotal ({getTotalItems()} items):</span>
              <span>${calculateTotal()}</span>
            </div>

            <div className="summary-line">
              <span>Shipping:</span>
              <span>Free</span>
            </div>

            <div className="summary-line total">
              <span>Total:</span>
              <span>${calculateTotal()}</span>
            </div>

            <div className="cart-actions">
              <Link to="/checkout" className="checkout-btn">
                Proceed to Checkout
              </Link>

              <button onClick={clearCart} className="clear-cart-btn">
                Clear Cart
              </button>

              <Link to="/catalogue" className="continue-shopping-link">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;
