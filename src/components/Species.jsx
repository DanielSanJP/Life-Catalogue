import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import "../styles/Species.css";

function Species() {
  const [speciesData, setSpeciesData] = useState([]);
  const [sortMethod, setSortMethod] = useState("nameAsc");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("fish")
        .select("id, name, scientific_name, image_url, description");

      if (error) {
        console.error("Error fetching data:", error);
      } else {
        const sortedData = sortSpeciesData(data, sortMethod);
        setSpeciesData(sortedData);
      }
    };

    fetchData();
  }, [sortMethod]);

  const sortSpeciesData = (data, method) => {
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
        default:
          return 0;
      }
    });
  };

  const handleSortChange = (method) => {
    setSortMethod(method);
    const sortedData = sortSpeciesData(speciesData, method);
    setSpeciesData(sortedData);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredSpecies = speciesData.filter(
    (species) =>
      species.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      species.scientific_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return (
    <div className="species-encyclopedia">
      <h1>Fish Species Encyclopedia</h1>
      <div className="controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by name or scientific name..."
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
          </select>
        </div>
      </div>

      <div className="species-list">
        {filteredSpecies.map((species) => (
          <div key={species.id} className="species-card">
            <img src={species.image_url} alt={species.name} />
            <div className="species-info">
              <h2>{species.name}</h2>
              <h3 className="species-scientific-name">
                {species.scientific_name}
              </h3>
              {species.habitat && (
                <p className="habitat">
                  <strong>Habitat:</strong> {species.habitat}
                </p>
              )}
              {species.size_range && (
                <p className="size">
                  <strong>Size:</strong> {species.size_range}
                </p>
              )}
              {species.diet && (
                <p className="diet">
                  <strong>Diet:</strong> {species.diet}
                </p>
              )}
              <p className="description-preview">
                {species.description?.substring(0, 100)}
                {species.description?.length > 100 ? "..." : ""}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Species;
