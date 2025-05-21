import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fish, setFish] = useState([]);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // State variables for edit and add functionality
  const [editingFish, setEditingFish] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    scientific_name: "",
    image_url: "",
    price: "",
    stock: 0,
    description: "",
    type: "freshwater", // Default value
  });
  const [fishToDelete, setFishToDelete] = useState(null);

  // State for table/card view toggle
  const [cardView, setCardView] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        navigate("/login");
        return;
      }

      setUser(data.user);
      fetchFish();
    };

    checkUser();
  }, [navigate]);

  // Check screen size and set card view automatically for mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 640) {
        setCardView(true);
      }
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Check for scroll in table wrapper
  useEffect(() => {
    const checkTableScroll = () => {
      const tableWrapper = document.querySelector(".table-responsive-wrapper");
      if (tableWrapper) {
        if (tableWrapper.scrollWidth > tableWrapper.clientWidth) {
          tableWrapper.classList.add("has-scroll");
        } else {
          tableWrapper.classList.remove("has-scroll");
        }
      }
    };

    // Run after render and on resize
    checkTableScroll();
    window.addEventListener("resize", checkTableScroll);

    return () => window.removeEventListener("resize", checkTableScroll);
  }, [fish]);

  const fetchFish = async () => {
    try {
      setLoading(true);

      // Fetch fish data from your Supabase table and order by id
      const { data, error } = await supabase
        .from("fish")
        .select("*")
        .order("id", { ascending: true });

      if (error) throw error;

      setFish(data || []);
    } catch (error) {
      console.error("Error fetching fish:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    setFishToDelete(id); // Open the modal and store the id
  };

  const confirmDelete = async () => {
    try {
      const { error } = await supabase
        .from("fish")
        .delete()
        .eq("id", fishToDelete);
      if (error) throw error;
      fetchFish();
    } catch (error) {
      console.error("Error deleting fish:", error);
      alert(`Error deleting fish: ${error.message}`);
    } finally {
      setFishToDelete(null); // Close the modal
    }
  };

  const cancelDelete = () => {
    setFishToDelete(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };
  const handleEdit = (fish) => {
    setEditingFish(fish);
    setFormData({
      name: fish.name || "",
      scientific_name: fish.scientific_name || "",
      image_url: fish.image_url || "",
      price: fish.price || "",
      stock: fish.stock || 0,
      description: fish.description || "",
      type: fish.type || "freshwater",
    });
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setEditingFish(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Create a clean object for update to prevent any issues
      const dataToUpdate = {
        name: formData.name,
        scientific_name: formData.scientific_name,
        image_url: formData.image_url,
        price: formData.price === "" ? null : parseFloat(formData.price),
        stock: formData.stock === "" ? 0 : parseInt(formData.stock),
        description: formData.description,
        type: formData.type,
      };

      const { error } = await supabase
        .from("fish")
        .update(dataToUpdate)
        .eq("id", editingFish.id);

      if (error) throw error;

      // Refresh the fish list after update
      fetchFish();
      handleCloseModal();
    } catch (error) {
      console.error("Error updating fish:", error);
      alert(`Error updating fish: ${error.message}`);
    }
  };

  const handleAddNew = () => {
    // Reset form data for new entry
    setFormData({
      name: "",
      scientific_name: "",
      image_url: "",
      price: "",
      stock: 0,
      description: "",
      type: "freshwater",
    });
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setUploadProgress(0);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Create a unique filename using timestamp and original name
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 15)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Show upload progress
      const { error } = await supabase.storage
        .from("fish")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          onUploadProgress: (progress) => {
            const percent = Math.round(
              (progress.loaded / progress.total) * 100
            );
            setUploadProgress(percent);
          },
        });

      if (error) throw error;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("fish")
        .getPublicUrl(filePath);

      // Update form with the image URL
      setFormData((prev) => ({
        ...prev,
        image_url: publicUrlData.publicUrl,
      }));
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error uploading image. Please try again.");
    }
  };
  const handleAddSubmit = async (e) => {
    e.preventDefault();

    try {
      // Create a new clean object without an ID field
      const dataToInsert = {
        name: formData.name,
        scientific_name: formData.scientific_name,
        image_url: formData.image_url,
        price: formData.price === "" ? null : parseFloat(formData.price),
        stock: formData.stock === "" ? 0 : parseInt(formData.stock),
        description: formData.description,
        type: formData.type,
      };

      console.log("Data being sent to Supabase:", dataToInsert);

      // First, get the highest ID from the current fish table
      const { data: maxIdResult, error: maxIdError } = await supabase
        .from("fish")
        .select("id")
        .order("id", { ascending: false })
        .limit(1);

      if (maxIdError) throw maxIdError;

      // Calculate the next ID to use
      const nextId =
        maxIdResult && maxIdResult.length > 0 ? maxIdResult[0].id + 1 : 1;

      // Add the ID to the insert data
      dataToInsert.id = nextId;

      // Now insert with the specified ID
      const { data, error } = await supabase
        .from("fish")
        .insert(dataToInsert)
        .select();

      if (error) throw error;

      console.log("Fish added successfully:", data);
      fetchFish();
      handleCloseAddModal();
    } catch (error) {
      console.error("Error adding new fish:", error);
      alert(`Error adding fish: ${error.message}`);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <div className="user-info">
          <span>Logged in as: {user?.email}</span>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <h2>Manage Fish</h2>{" "}
        <div className="dashboard-toolbar">
          <button className="add-fish-button" onClick={handleAddNew}>
            Add New Fish
          </button>
          <button
            className="add-fish-button"
            onClick={() => navigate("/admin/business-queries")}
          >
            Business Queries
          </button>
          <button
            className="toggle-view-btn"
            onClick={() => setCardView(!cardView)}
          >
            {cardView ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"></path>
                  <path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"></path>
                </svg>
                Table View
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                Card View
              </>
            )}
          </button>
        </div>
        {!cardView ? (
          <div
            className={`table-responsive-wrapper${
              fish.length > 0 ? " has-scroll" : ""
            }`}
          >
            <table className="fish-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Scientific Name</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fish.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>
                      {item.image_url ? (
                        <div className="fish-image-container">
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="fish-thumbnail"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/aquarium.png"; // Fallback image
                            }}
                          />
                        </div>
                      ) : (
                        <div className="fish-image-container">
                          <img
                            src="/aquarium.png"
                            alt="No image available"
                            className="fish-thumbnail"
                          />
                        </div>
                      )}
                    </td>
                    <td>{item.name}</td>
                    <td>{item.scientific_name}</td>
                    <td>
                      ${item.price ? parseFloat(item.price).toFixed(2) : "0.00"}
                    </td>
                    <td className="actions">
                      <button
                        className="edit-button"
                        onClick={() => handleEdit(item)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-button"
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="fish-cards">
            {fish.map((item) => (
              <div className="fish-card-item" key={item.id}>
                <div className="fish-card-img">
                  <div className="fish-image-container">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="fish-thumbnail"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/aquarium.png"; // Fallback image
                        }}
                      />
                    ) : (
                      <img
                        src="/aquarium.png"
                        alt="No image available"
                        className="fish-thumbnail"
                      />
                    )}
                  </div>
                </div>
                <div className="fish-card-name">{item.name}</div>
                <div className="fish-card-scientific">
                  {item.scientific_name}
                </div>
                <div className="fish-card-price">
                  ${item.price ? parseFloat(item.price).toFixed(2) : "0.00"}
                </div>
                <div className="fish-card-actions">
                  <button
                    className="edit-button"
                    onClick={() => handleEdit(item)}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => handleDelete(item.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {fish.length === 0 && <p className="no-fish">No fish records found.</p>}
        {/* Add Fish Modal with scrollable content */}
        {isAddModalOpen && (
          <div className="modal-overlay">
            <div className="edit-modal">
              <div className="modal-header">
                <h2>Add New Fish</h2>
              </div>

              <div className="modal-body">
                <form onSubmit={handleAddSubmit} id="add-fish-form">
                  <div className="form-group">
                    <label htmlFor="add-name">Name:</label>
                    <input
                      type="text"
                      id="add-name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="add-scientific_name">
                      Scientific Name:
                    </label>
                    <input
                      type="text"
                      id="add-scientific_name"
                      name="scientific_name"
                      value={formData.scientific_name}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="add-type">Type:</label>
                    <select
                      id="add-type"
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                    >
                      <option value="freshwater">Freshwater</option>
                      <option value="saltwater">Saltwater</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="add-price">Price ($):</label>
                    <input
                      type="number"
                      id="add-price"
                      name="price"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="add-stock">Stock:</label>
                    <input
                      type="number"
                      id="add-stock"
                      name="stock"
                      min="0"
                      value={formData.stock}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="add-description">Description:</label>
                    <textarea
                      id="add-description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="add-image">Image:</label>
                    <div className="file-input-container">
                      <input
                        type="file"
                        id="add-image"
                        name="image"
                        accept="image/*"
                        onChange={handleImageUpload}
                        ref={fileInputRef}
                        className="file-input"
                      />
                      <button
                        type="button"
                        className="file-input-button"
                        onClick={() => fileInputRef.current.click()}
                      >
                        Select Image
                      </button>
                      {formData.image_url && (
                        <span className="file-name">Image selected</span>
                      )}
                    </div>
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="progress-bar-container">
                        <div
                          className="progress-bar"
                          style={{ width: `${uploadProgress}%` }}
                        />
                        <span>{uploadProgress}%</span>
                      </div>
                    )}
                    {formData.image_url && (
                      <div className="image-preview">
                        <img src={formData.image_url} alt="Preview" />
                      </div>
                    )}
                  </div>
                </form>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={handleCloseAddModal}>
                  Cancel
                </button>
                <button type="submit" form="add-fish-form">
                  Add Fish
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Edit Fish Modal with scrollable content */}
        {isEditModalOpen && (
          <div className="modal-overlay">
            <div className="edit-modal">
              <div className="modal-header">
                <h2>Edit Fish</h2>
              </div>

              <div className="modal-body">
                <form onSubmit={handleSubmit} id="edit-fish-form">
                  <div className="form-group">
                    <label htmlFor="name">Name:</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="scientific_name">Scientific Name:</label>
                    <input
                      type="text"
                      id="scientific_name"
                      name="scientific_name"
                      value={formData.scientific_name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="type">Type:</label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type || "freshwater"}
                      onChange={handleInputChange}
                    >
                      <option value="freshwater">Freshwater</option>
                      <option value="saltwater">Saltwater</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="price">Price ($):</label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="stock">Stock:</label>
                    <input
                      type="number"
                      id="stock"
                      name="stock"
                      min="0"
                      value={formData.stock || 0}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="description">Description:</label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description || ""}
                      onChange={handleInputChange}
                      rows="3"
                    />
                  </div>{" "}
                  <div className="form-group">
                    <label htmlFor="image_url">Image:</label>
                    <div className="form-input-group">
                      <input
                        type="text"
                        id="image_url"
                        name="image_url"
                        value={formData.image_url}
                        onChange={handleInputChange}
                        className="full-width"
                      />
                      <div className="file-input-container">
                        <input
                          type="file"
                          id="edit-image"
                          name="image"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="file-input"
                        />
                        <button
                          type="button"
                          className="file-input-button"
                          onClick={() =>
                            document.getElementById("edit-image").click()
                          }
                        >
                          Upload New Image
                        </button>
                      </div>
                    </div>
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="progress-bar-container">
                        <div
                          className="progress-bar"
                          style={{ width: `${uploadProgress}%` }}
                        />
                        <span>{uploadProgress}%</span>
                      </div>
                    )}
                    {formData.image_url && (
                      <div className="image-preview">
                        <img src={formData.image_url} alt="Preview" />
                      </div>
                    )}
                  </div>
                </form>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" form="edit-fish-form">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Delete Confirmation Modal */}
        {fishToDelete && (
          <div className="modal-overlay">
            <div className="confirm-modal">
              <h3>Delete Fish</h3>
              <p>Are you sure you want to delete this fish?</p>
              <div className="modal-footer">
                <button onClick={cancelDelete}>Cancel</button>
                <button className="delete-button" onClick={confirmDelete}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
