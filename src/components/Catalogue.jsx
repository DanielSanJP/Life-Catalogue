import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient"; // Import the singleton client
import { Link } from "react-router-dom";
import "../styles/Catalogue.css"; // Import your CSS file

function Catalogue() {
  const [fishData, setFishData] = useState([]);
  const [sortMethod, setSortMethod] = useState("name"); // State for sorting method

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("fish")
        .select("id, name, price, stock, scientific_name, image_url");

      if (error) {
        console.error("Error fetching data:", error);
      } else {
        // Sort the data initially based on the default sort method
        const sortedData = data.sort((a, b) => {
          if (sortMethod === "name") return a.name.localeCompare(b.name);
          if (sortMethod === "price") return a.price - b.price;
          return 0;
        });
        setFishData(sortedData);
      }
    };

    fetchData();
  }, [sortMethod]); // Refetch and sort data when sortMethod changes

  const handleSortChange = (method) => {
    setSortMethod(method);
    // Sort the data immediately when the sort method changes
    const sortedData = [...fishData].sort((a, b) => {
      if (method === "name") return a.name.localeCompare(b.name);
      if (method === "price") return a.price - b.price;
      return 0;
    });
    setFishData(sortedData);
  };

  return (
    <div className="catalogue">
      <h1>Fish Catalogue</h1>
      <div className="sort-dropdown">
        <label htmlFor="sort-method">Sort by: </label>
        <select
          id="sort-method"
          value={sortMethod}
          onChange={(e) => handleSortChange(e.target.value)}
        >
          <option value="name">Name</option>
          <option value="price">Price</option>
        </select>
      </div>
      <div className="fish-container">
        {fishData.map((fish) => (
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
