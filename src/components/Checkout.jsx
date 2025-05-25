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
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    paymentMethod: "credit-card",
  });
  const [errors, setErrors] = useState({});
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
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.postalCode.trim())
      newErrors.postalCode = "Postal code is required";

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // 1. Check if customer exists, if not create one
      let { data: existingCustomer, error: customerCheckError } = await supabase
        .from("customers")
        .select("id")
        .eq("email", formData.email)
        .single();

      let customerId;

      if (customerCheckError && customerCheckError.code === "PGRST116") {
        // Customer doesn't exist, create new one
        const { data: newCustomer, error: customerCreateError } = await supabase
          .from("customers")
          .insert({
            name: formData.name,
            email: formData.email,
          })
          .select("id")
          .single();

        if (customerCreateError) throw customerCreateError;
        customerId = newCustomer.id;
      } else if (customerCheckError) {
        throw customerCheckError;
      } else {
        customerId = existingCustomer.id;
      }

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
      navigate("/order-success", {
        state: {
          orderId: saleData.id,
          total: calculateTotal(),
          items: cartItems.length,
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
              <h2>Contact Information</h2>

              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={errors.name ? "error" : ""}
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
                />
                {errors.email && (
                  <span className="error-text">{errors.email}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={errors.phone ? "error" : ""}
                />
                {errors.phone && (
                  <span className="error-text">{errors.phone}</span>
                )}
              </div>
            </div>

            <div className="form-section">
              <h2>Shipping Address</h2>

              <div className="form-group">
                <label htmlFor="address">Street Address *</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className={errors.address ? "error" : ""}
                />
                {errors.address && (
                  <span className="error-text">{errors.address}</span>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">City *</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={errors.city ? "error" : ""}
                  />
                  {errors.city && (
                    <span className="error-text">{errors.city}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="postalCode">Postal Code *</label>
                  <input
                    type="text"
                    id="postalCode"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    className={errors.postalCode ? "error" : ""}
                  />
                  {errors.postalCode && (
                    <span className="error-text">{errors.postalCode}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2>Payment Method</h2>

              <div className="payment-methods">
                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="credit-card"
                    checked={formData.paymentMethod === "credit-card"}
                    onChange={handleInputChange}
                  />
                  <span>Credit Card</span>
                </label>

                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash-on-delivery"
                    checked={formData.paymentMethod === "cash-on-delivery"}
                    onChange={handleInputChange}
                  />
                  <span>Cash on Delivery</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="place-order-btn"
              disabled={loading}
            >
              {loading ? "Processing..." : `Place Order - $${calculateTotal()}`}
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
                <span>Shipping:</span>
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
