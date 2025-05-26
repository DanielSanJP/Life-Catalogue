import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../styles/Checkout.css";

function Checkout() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });
  const [errors, setErrors] = useState({});
  const [existingCustomer, setExistingCustomer] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem("fishCart");
    if (savedCart) {
      const cart = JSON.parse(savedCart);
      setCartItems(cart);

      // If cart is empty, redirect to cart page
      if (cart.length === 0) {
        navigate("/cart");
      }
    } else {
      navigate("/cart");
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Check for existing customer when email changes
    if (name === "email" && value.includes("@")) {
      checkExistingCustomer(value);
    }
  };

  const checkExistingCustomer = async (email) => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, email")
        .eq("email", email.toLowerCase())
        .single();

      if (!error && data) {
        setExistingCustomer(data);
        // Pre-fill the name if customer exists
        setFormData((prev) => ({
          ...prev,
          name: data.name,
        }));
      } else {
        setExistingCustomer(null);
      }
    } catch {
      // Customer doesn't exist, which is fine
      setExistingCustomer(null);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotal = () => {
    return cartItems
      .reduce((total, item) => total + item.price * item.quantity, 0)
      .toFixed(2);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getOrCreateCustomer = async () => {
    const email = formData.email.toLowerCase();
    const name = formData.name.trim();

    try {
      // First, try to get existing customer
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id, name, email")
        .eq("email", email)
        .single();

      if (existingCustomer) {
        // Customer exists, update name if it's different (in case they updated it)
        if (existingCustomer.name !== name) {
          const { error: updateError } = await supabase
            .from("customers")
            .update({ name: name })
            .eq("id", existingCustomer.id);

          if (updateError) {
            console.warn("Could not update customer name:", updateError);
          }
        }
        return existingCustomer.id;
      }

      // Customer doesn't exist, create new one using upsert
      const { data: newCustomer, error: insertError } = await supabase
        .from("customers")
        .upsert(
          {
            email: email,
            name: name,
          },
          {
            onConflict: "email", // Handle conflicts on email column
            ignoreDuplicates: false, // Update if exists
          }
        )
        .select("id")
        .single();

      if (insertError) throw insertError;
      return newCustomer.id;
    } catch (error) {
      console.error("Error handling customer:", error);
      throw new Error("Failed to process customer information");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // 1. Get or create customer (handles duplicates properly)
      const customerId = await getOrCreateCustomer();

      // 2. Create a sale record
      const { data: saleData, error: saleError } = await supabase
        .from("sales")
        .insert({
          customer_id: customerId,
          title: `Order for ${getTotalItems()} fish - Total: $${calculateTotal()}`,
          created_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (saleError) throw saleError;

      // 3. Create order records for each item in cart
      const orderPromises = cartItems.map((item) =>
        supabase.from("orders").insert({
          sale_id: saleData.id,
          fish_id: item.id,
          quantity: item.quantity,
        })
      );

      await Promise.all(orderPromises);

      // 4. Update fish stock
      const stockUpdatePromises = cartItems.map((item) =>
        supabase
          .from("fish")
          .update({
            stock: item.stock - item.quantity,
          })
          .eq("id", item.id)
      );

      await Promise.all(stockUpdatePromises);

      // 5. Clear cart and redirect
      localStorage.removeItem("fishCart");

      // Dispatch event to update navbar cart count
      window.dispatchEvent(
        new CustomEvent("cartUpdated", {
          detail: { cart: [] },
        })
      );

      navigate("/order-success", {
        state: {
          orderId: saleData.id,
          total: calculateTotal(),
          items: cartItems.length,
          customerName: formData.name,
          isReturningCustomer: !!existingCustomer,
        },
      });
    } catch (error) {
      console.error("Error processing order:", error);
      alert("There was an error processing your order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="checkout-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="checkout-content">
        <div className="checkout-form-section">
          <h1>Checkout</h1>

          <form onSubmit={handleSubmit} className="checkout-form">
            <div className="form-section">
              <h2>Customer Information</h2>
              <p className="form-description">
                Please provide your name and email to complete your order.
              </p>

              {existingCustomer && (
                <div className="existing-customer-notice">
                  <p>
                    👋 Welcome back! We found your account with this email. You
                    can update your name if needed.
                  </p>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={errors.name ? "error" : ""}
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <span className="error-text">{errors.name}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={errors.email ? "error" : ""}
                  placeholder="Enter your email address"
                />
                {errors.email && (
                  <span className="error-text">{errors.email}</span>
                )}
              </div>
            </div>

            <div className="form-section">
              <h2>Order Notes</h2>
              <p className="order-note">
                🐠 This is a demo fish store for educational purposes.
                <br />
                📧 You&apos;ll receive a confirmation email after placing your
                order.
                <br />
                🚚 All orders are processed for demonstration only.
                {existingCustomer && (
                  <>
                    <br />
                    🎉 As a returning customer, thank you for your continued
                    business!
                  </>
                )}
              </p>
            </div>

            <button
              type="submit"
              className="place-order-btn"
              disabled={loading}
            >
              {loading
                ? "Processing Order..."
                : `Complete Order - $${calculateTotal()}`}
            </button>
          </form>
        </div>

        <div className="order-summary-section">
          <div className="order-summary-card">
            <h2>Order Summary</h2>

            <div className="order-items">
              {cartItems.map((item) => (
                <div key={item.id} className="order-item">
                  <img src={item.image_url} alt={item.name} />
                  <div className="item-details">
                    <h4>{item.name}</h4>
                    <p className="scientific-name">{item.scientific_name}</p>
                    <p>Quantity: {item.quantity}</p>
                    <p className="item-price">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="order-totals">
              <div className="total-line">
                <span>Subtotal ({getTotalItems()} items):</span>
                <span>${calculateTotal()}</span>
              </div>
              <div className="total-line">
                <span>Processing Fee:</span>
                <span>Free</span>
              </div>
              <div className="total-line final-total">
                <span>Total:</span>
                <span>${calculateTotal()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
