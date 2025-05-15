import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import "../styles/FIshDetails.css";

function FishDetails() {
  const { id } = useParams();
  const [fish, setFish] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        <Link to="/" className="back-button">
          Return to Catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="fish-details-container">
      <div className="back-link">
        <Link to="/">
          <span>←</span> Back to Catalogue
        </Link>
      </div>

      <div className="fish-details-card">
        <div className="fish-details-image">
          <img src={fish.image_url} alt={fish.name} />
        </div>

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
              <span className="value">{fish.stock} available</span>
            </div>
          </div>

          <div className="fish-type">
            <span className="type-tag">{fish.type}</span>
          </div>

          <div className="description">
            <h3>Description</h3>
            <p>{fish.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FishDetails;
