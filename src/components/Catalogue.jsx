import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Link } from "react-router-dom";
import { addToCart } from "../utils/cartUtils";
import "../styles/Catalogue.css";

function Catalogue() {
  const [fishData, setFishData] = useState([]);
  const [sortMethod, setSortMethod] = useState("nameAsc");
  const [searchTerm, setSearchTerm] = useState("");
  const [addingToCart, setAddingToCart] = useState({});
  const [cartSuccess, setCartSuccess] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from("fish")
        .select("id, name, price, stock, scientific_name, image_url");

      const sortedData = sortFishData(data, sortMethod);
      setFishData(sortedData);
    };

    fetchData();
  }, [sortMethod]);

  const sortFishData = (data, method) => {
    return [...data].sort((a, b) => {
      switch (method) {
        case "nameAsc":
          return a.name.localeCompare(b.name);
        case "nameDesc":
          return b.name.localeCompare(a.name);
        case "scientificAsc":
          return a.scientific_name.localeCompare(b.scientific_name);
        case "scientificDesc":
          return b.scientific_name.localeCompare(a.scientific_name);
        case "priceLow":
          return a.price - b.price;
        case "priceHigh":
          return b.price - a.price;
        default:
          return 0;
      }
    });
  };

  const handleSortChange = (method) => {
    setSortMethod(method);
    const sortedData = sortFishData(fishData, method);
    setFishData(sortedData);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleAddToCart = async (fish, e) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation();

    if (fish.stock <= 0) {
      alert("This fish is out of stock!");
      return;
    }

    setAddingToCart((prev) => ({ ...prev, [fish.id]: true }));

    try {
      // Add to cart using the utility function
      addToCart(fish);

      // Show success state
      setCartSuccess((prev) => ({ ...prev, [fish.id]: true }));

      // Reset states after delays
      setTimeout(() => {
        setAddingToCart((prev) => ({ ...prev, [fish.id]: false }));
      }, 1000);

      setTimeout(() => {
        setCartSuccess((prev) => ({ ...prev, [fish.id]: false }));
      }, 2000);
    } catch {
      alert("Error adding item to cart. Please try again.");
      setAddingToCart((prev) => ({ ...prev, [fish.id]: false }));
    }
  };

  const getButtonText = (fish) => {
    if (cartSuccess[fish.id]) return "Added to Cart!";
    if (addingToCart[fish.id]) return "Adding...";
    if (fish.stock <= 0) return "Out of Stock";
    return "Add to Cart";
  };

  const getButtonClass = (fish) => {
    let baseClass = "add-to-cart-btn";
    if (fish.stock <= 0) baseClass += " out-of-stock";
    if (cartSuccess[fish.id]) baseClass += " success";
    return baseClass;
  };

  const filteredFish = fishData.filter(
    (fish) =>
      fish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fish.scientific_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="catalogue">
      <h1>Fish Catalogue</h1>
      <div className="controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search fish..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <div className="sort-dropdown">
          <label htmlFor="sort-method">Sort by: </label>
          <select
            id="sort-method"
            value={sortMethod}
            onChange={(e) => handleSortChange(e.target.value)}
          >
            <option value="nameAsc">Common Name (A-Z)</option>
            <option value="nameDesc">Common Name (Z-A)</option>
            <option value="scientificAsc">Scientific Name (A-Z)</option>
            <option value="scientificDesc">Scientific Name (Z-A)</option>
            <option value="priceLow">Price (Low to High)</option>
            <option value="priceHigh">Price (High to Low)</option>
          </select>
        </div>
      </div>
      <div className="fish-container">
        {filteredFish.map((fish) => (
          <div key={fish.id} className="fish-card-wrapper">
            <Link to={`/fish/${fish.id}`} className="fish-card">
              <img src={fish.image_url} alt={fish.name} />
              <div className="fish-names">
                {fish.name}
                <br />
                <span className="scientificName">{fish.scientific_name}</span>
                <br />
                <span className="price">${fish.price}</span>
                <br />
                <span className="stock">
                  {fish.stock > 0 ? `${fish.stock} in stock` : "Out of stock"}
                </span>
                <button
                  onClick={(e) => handleAddToCart(fish, e)}
                  disabled={fish.stock <= 0 || addingToCart[fish.id]}
                  className={getButtonClass(fish)}
                >
                  {getButtonText(fish)}
                </button>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Catalogue;
