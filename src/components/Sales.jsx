import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import "../styles/Sales.css";

function Sales() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
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
      fetchSales();
    };

    checkUser();
  }, [navigate]);

  const fetchSales = async () => {
    try {
      setLoading(true);

      // Fetch sales with customer information and order details
      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select(
          `
          id,
          title,
          created_at,
          customers!inner(
            id,
            name,
            email
          ),
          orders!inner(
            id,
            quantity,
            fish!inner(
              id,
              name,
              price,
              scientific_name,
              image_url
            )
          )
        `
        )
        .order("created_at", { ascending: false });

      if (salesError) throw salesError;

      // Process the data to calculate totals and format
      const processedSales = salesData.map((sale) => {
        const totalAmount = sale.orders.reduce((total, order) => {
          return total + order.fish.price * order.quantity;
        }, 0);

        const totalItems = sale.orders.reduce((total, order) => {
          return total + order.quantity;
        }, 0);

        return {
          ...sale,
          totalAmount: totalAmount,
          totalItems: totalItems,
          formattedDate: new Date(sale.created_at).toLocaleDateString(),
          formattedTime: new Date(sale.created_at).toLocaleTimeString(),
        };
      });

      setSales(processedSales);
    } catch (error) {
      console.error("Error fetching sales:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (sale) => {
    setSelectedSale(sale);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSale(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const getSortedAndFilteredSales = () => {
    let filteredSales = [...sales];

    // Apply sorting
    switch (sortBy) {
      case "newest":
        filteredSales.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        break;
      case "oldest":
        filteredSales.sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
        break;
      case "highest":
        filteredSales.sort((a, b) => b.totalAmount - a.totalAmount);
        break;
      case "lowest":
        filteredSales.sort((a, b) => a.totalAmount - b.totalAmount);
        break;
      default:
        break;
    }

    return filteredSales;
  };

  const getTotalRevenue = () => {
    return sales
      .reduce((total, sale) => total + sale.totalAmount, 0)
      .toFixed(2);
  };

  const getTotalOrders = () => {
    return sales.length;
  };

  const getTotalItemsSold = () => {
    return sales.reduce((total, sale) => total + sale.totalItems, 0);
  };

  if (loading) {
    return <div className="loading">Loading sales data...</div>;
  }

  return (
    <div className="sales-container">
      <div className="sales-header">
        <div className="header-content">
          <h1>Sales Management</h1>
          <div className="user-info">
            <span>Logged in as: {user?.email}</span>
            <button onClick={() => navigate("/admin")} className="back-button">
              Back to Dashboard
            </button>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-cards">
        <div className="stat-card">
          <h3>Total Revenue</h3>
          <p className="stat-value">${getTotalRevenue()}</p>
        </div>
        <div className="stat-card">
          <h3>Total Orders</h3>
          <p className="stat-value">{getTotalOrders()}</p>
        </div>
        <div className="stat-card">
          <h3>Items Sold</h3>
          <p className="stat-value">{getTotalItemsSold()}</p>
        </div>
        <div className="stat-card">
          <h3>Average Order</h3>
          <p className="stat-value">
            $
            {getTotalOrders() > 0
              ? (getTotalRevenue() / getTotalOrders()).toFixed(2)
              : "0.00"}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="sales-controls">
        <div className="control-group">
          <label htmlFor="sort-select">Sort by:</label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Amount</option>
            <option value="lowest">Lowest Amount</option>
          </select>
        </div>

        <button onClick={fetchSales} className="refresh-button">
          Refresh Data
        </button>
      </div>

      {/* Sales Table */}
      <div className="sales-table-container">
        {sales.length === 0 ? (
          <div className="no-sales">
            <p>No sales found.</p>
          </div>
        ) : (
          <table className="sales-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {getSortedAndFilteredSales().map((sale) => (
                <tr key={sale.id}>
                  <td>#{sale.id}</td>
                  <td>
                    <div className="customer-info">
                      <div className="customer-name">{sale.customers.name}</div>
                      <div className="customer-email">
                        {sale.customers.email}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="date-info">
                      <div>{sale.formattedDate}</div>
                      <div className="time">{sale.formattedTime}</div>
                    </div>
                  </td>
                  <td>{sale.totalItems}</td>
                  <td className="amount">${sale.totalAmount.toFixed(2)}</td>
                  <td>
                    <button
                      onClick={() => handleViewDetails(sale)}
                      className="view-details-btn"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Sale Details Modal */}
      {showModal && selectedSale && (
        <div className="modal-overlay">
          <div className="sale-modal">
            <div className="modal-header">
              <h2>Order Details - #{selectedSale.id}</h2>
              <button onClick={handleCloseModal} className="close-btn">
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="sale-info">
                <div className="info-section">
                  <h3>Customer Information</h3>
                  <p>
                    <strong>Name:</strong> {selectedSale.customers.name}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedSale.customers.email}
                  </p>
                </div>

                <div className="info-section">
                  <h3>Order Information</h3>
                  <p>
                    <strong>Order Date:</strong> {selectedSale.formattedDate} at{" "}
                    {selectedSale.formattedTime}
                  </p>
                  <p>
                    <strong>Total Items:</strong> {selectedSale.totalItems}
                  </p>
                  <p>
                    <strong>Total Amount:</strong> $
                    {selectedSale.totalAmount.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="order-items">
                <h3>Items Ordered</h3>
                <div className="items-list">
                  {selectedSale.orders.map((order) => (
                    <div key={order.id} className="order-item">
                      <img
                        src={order.fish.image_url}
                        alt={order.fish.name}
                        className="item-image"
                      />
                      <div className="item-details">
                        <h4>{order.fish.name}</h4>
                        <p className="scientific-name">
                          {order.fish.scientific_name}
                        </p>
                        <div className="item-pricing">
                          <span>Quantity: {order.quantity}</span>
                          <span>Price: ${order.fish.price}</span>
                          <span className="item-total">
                            Total: $
                            {(order.fish.price * order.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={handleCloseModal} className="close-modal-btn">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sales;
