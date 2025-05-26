import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { addToCart } from "../utils/cartUtils";
import "../styles/FishDetails.css";

function FishDetails() {
  const { id } = useParams();
  const [fish, setFish] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0); // Scroll to top on mount or id change
    const fetchFishDetails = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("fish")
        .select("*")
        .eq("id", id)
        .single();

      if (error) console.error("Error fetching fish details:", error);
      else setFish(data);

      setLoading(false);
    };

    fetchFishDetails();
  }, [id]);

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= fish.stock) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    if (fish.stock <= 0) {
      alert("This fish is out of stock!");
      return;
    }

    if (quantity > fish.stock) {
      alert(`Only ${fish.stock} items available in stock!`);
      return;
    }

    setAddingToCart(true);

    try {
      // Add to cart with specified quantity
      for (let i = 0; i < quantity; i++) {
        addToCart(fish);
      }

      // Show success message
      alert(
        `Added ${quantity} ${fish.name}${quantity > 1 ? "s" : ""} to cart!`
      );

      console.log(`Added ${quantity} ${fish.name}(s) to cart successfully`);
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Error adding item to cart. Please try again.");
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading fish details...</p>
      </div>
    );
  }

  if (!fish) {
    return (
      <div className="error-container">
        <h2>Fish Not Found</h2>
        <p>Sorry, we couldn&apos;t find the fish you&apos;re looking for.</p>
        <Link to="/catalogue" className="back-button">
          Return to Catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="fish-details-container">
      <div className="back-link">
        <Link to="/catalogue">
          <span>←</span> Back to Catalogue
        </Link>
      </div>

      <div className="fish-details-card">
        {/* Left column with image and description */}
        <div className="fish-details-left">
          <div className="fish-details-image">
            <img src={fish.image_url} alt={fish.name} />
          </div>

          <div className="fish-description-left">
            <h3>Description</h3>
            <p>{fish.description}</p>
          </div>
        </div>

        {/* Right column with fish info and purchase options */}
        <div className="fish-details-info">
          <h1>{fish.name}</h1>
          <h3 className="scientific-name">{fish.scientific_name}</h3>

          <div className="fish-price-stock">
            <div className="price">
              <span className="label">Price</span>
              <span className="value">${fish.price}</span>
            </div>
            <div className="stock">
              <span className="label">Stock</span>
              <span className="value">
                {fish.stock > 0 ? `${fish.stock} available` : "Out of stock"}
              </span>
            </div>
          </div>

          <div className="fish-type">
            <span className="type-tag">{fish.type}</span>
          </div>

          {fish.stock > 0 && (
            <div className="purchase-section">
              <div className="quantity-section">
                <label htmlFor="quantity">Quantity:</label>
                <div className="quantity-controls">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                    className="quantity-btn"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    id="quantity"
                    min="1"
                    max={fish.stock}
                    value={quantity}
                    onChange={(e) =>
                      handleQuantityChange(parseInt(e.target.value) || 1)
                    }
                    className="quantity-input"
                  />
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= fish.stock}
                    className="quantity-btn"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="total-price">
                <span className="total-label">Total:</span>
                <span className="total-value">
                  ${(fish.price * quantity).toFixed(2)}
                </span>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={addingToCart || fish.stock <= 0}
                className="add-to-cart-details-btn"
              >
                {addingToCart
                  ? "Adding to Cart..."
                  : `Add ${quantity > 1 ? `${quantity} ` : ""}to Cart`}
              </button>
            </div>
          )}

          {fish.stock <= 0 && (
            <div className="out-of-stock-section">
              <button disabled className="out-of-stock-btn">
                Out of Stock
              </button>
              <p className="stock-message">
                This fish is currently out of stock. Please check back later.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FishDetails;
