import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fish, setFish] = useState([]);
  const navigate = useNavigate();

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
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
        <h2>Manage Fish</h2>
        <button className="add-fish-button">Add New Fish</button>

        <table className="fish-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Species</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {fish.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.name}</td>
                <td>{item.species || item.scientific_name}</td>
                <td>
                  <button className="edit-button">Edit</button>
                  <button className="delete-button">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {fish.length === 0 && <p className="no-fish">No fish records found.</p>}
      </div>
    </div>
  );
}

export default Dashboard;
