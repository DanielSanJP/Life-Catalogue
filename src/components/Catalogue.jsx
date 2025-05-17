import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient"; // Import the singleton client
import { Link } from "react-router-dom";
import "../styles/Catalogue.css"; // Import your CSS file

function Catalogue() {
  const [fishData, setFishData] = useState([]);
  const [sortMethod, setSortMethod] = useState("nameAsc"); // Updated default sort method
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("fish")
        .select("id, name, price, stock, scientific_name, image_url");

      if (error) {
        console.error("Error fetching data:", error);
      } else {
        // Sort the data initially based on the default sort method
        const sortedData = sortFishData(data, sortMethod);
        setFishData(sortedData);
      }
    };

    fetchData();
  }, [sortMethod]); // Refetch and sort data when sortMethod changes

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
    // Sort the data immediately when the sort method changes
    const sortedData = sortFishData(fishData, method);
    setFishData(sortedData);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
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
          <Link to={`/fish/${fish.id}`} key={fish.id} className="fish-card">
            <img src={fish.image_url} alt={fish.name} />
            <div className="fish-names">
              {fish.name}
              <br />{" "}
              <span className="scientificName">{fish.scientific_name}</span>
              <br />${fish.price}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Catalogue;
