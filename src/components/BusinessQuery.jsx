import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import "../styles/BusinessQuery.css";

function BusinessQuery() {
  const [activeTab, setActiveTab] = useState("lowStock");
  const [queryResults, setQueryResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [user, setUser] = useState(null);
  const tableContainerRef = useRef(null);
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
    };

    checkUser();
  }, [navigate]);

  const fetchQueryResults = async (queryType) => {
    setLoading(true);
    try {
      let data = [];

      switch (queryType) {
        case "lowStock": {
          // Fish with stock less than 10
          const { data: lowStockData, error: lowStockError } = await supabase
            .from("fish")
            .select("name, stock")
            .lt("stock", 10)
            .order("stock");

          if (lowStockError) throw lowStockError;
          data = lowStockData;
          break;
        }

        case "recentSales": {
          // Recent sales with customer names
          const { data: salesData, error: salesError } = await supabase
            .from("sales")
            .select(
              `
              id, 
              title,
              created_at,
              customers!inner(name)
            `
            )
            .gte(
              "created_at",
              new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
            )
            .order("created_at", { ascending: false });

          if (salesError) throw salesError;

          // Format the date for display
          data = salesData.map((sale) => ({
            id: sale.id,
            customer_name: sale.customers.name,
            created_at: new Date(sale.created_at).toLocaleDateString(),
            title: sale.title,
          }));
          break;
        }

        case "topSelling": {
          // Get top selling fish by joining orders and fish tables
          const { data: topData, error: topError } = await supabase
            .from("orders")
            .select(
              `
              fish!inner(name),
              quantity
            `
            )
            .order("quantity", { ascending: false });

          if (topError) throw topError;

          // Aggregate results by fish name
          const fishSales = {};
          topData.forEach((item) => {
            const fishName = item.fish.name;
            if (!fishSales[fishName]) {
              fishSales[fishName] = 0;
            }
            fishSales[fishName] += item.quantity;
          });

          // Convert to array and sort
          data = Object.entries(fishSales)
            .map(([name, total_sold]) => ({ name, total_sold }))
            .sort((a, b) => b.total_sold - a.total_sold)
            .slice(0, 10);
          break;
        }

        case "customerSales": {
          // Get total number of sales per customer - FIXED QUERY
          const { data: customerSalesData, error: customerSalesError } =
            await supabase.from("customers").select(`
                name,
                sales(id)
              `);

          if (customerSalesError) throw customerSalesError;

          data = customerSalesData
            .map((customer) => ({
              name: customer.name,
              sales_count: customer.sales ? customer.sales.length : 0,
            }))
            .filter((customer) => customer.sales_count > 0) // Only show customers with sales
            .sort((a, b) => b.sales_count - a.sales_count);
          break;
        }

        case "customerPurchases": {
          // Get customers and what fish they bought - GROUPED BY CUSTOMER
          const { data: customerPurchasesData, error: customerPurchasesError } =
            await supabase.from("customers").select(`
              name,
              sales!inner(
                orders!inner(
                  quantity,
                  fish!inner(name)
                )
              )
            `);

          if (customerPurchasesError) throw customerPurchasesError;

          // Group purchases by customer
          const customerPurchases = {};

          customerPurchasesData.forEach((customer) => {
            if (!customerPurchases[customer.name]) {
              customerPurchases[customer.name] = {};
            }

            if (customer.sales && Array.isArray(customer.sales)) {
              customer.sales.forEach((sale) => {
                if (sale.orders && Array.isArray(sale.orders)) {
                  sale.orders.forEach((order) => {
                    if (order.fish && order.fish.name) {
                      const fishName = order.fish.name;
                      if (!customerPurchases[customer.name][fishName]) {
                        customerPurchases[customer.name][fishName] = 0;
                      }
                      customerPurchases[customer.name][fishName] +=
                        order.quantity || 0;
                    }
                  });
                }
              });
            }
          });

          // Convert to array format for display - only include customers with purchases
          data = [];
          Object.entries(customerPurchases).forEach(
            ([customerName, fishPurchases]) => {
              // Only add customers who have actually purchased fish
              if (Object.keys(fishPurchases).length > 0) {
                const fishList = Object.entries(fishPurchases)
                  .map(([fishName, quantity]) => `${fishName} (${quantity})`)
                  .join(", ");

                const totalPurchases = Object.values(fishPurchases).reduce(
                  (sum, qty) => sum + qty,
                  0
                );

                data.push({
                  customer_name: customerName,
                  fish_purchased: fishList || "",
                  total_purchases: totalPurchases,
                });
              }
            }
          );

          // Sort by total purchases (most active customers first)
          data.sort((a, b) => b.total_purchases - a.total_purchases);
          break;
        }

        default:
          data = [];
      }

      setQueryResults(data);
    } catch (error) {
      console.error("Error fetching query results:", error);
      setQueryResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueryResults(activeTab);
  }, [activeTab]);

  // Add this effect
  useEffect(() => {
    const handleScroll = () => {
      const container = tableContainerRef.current;
      if (!container) return;

      // Check if table is wider than container
      const hasOverflow = container.scrollWidth > container.clientWidth;

      if (hasOverflow) {
        container.classList.add("has-overflow");

        // Check scroll position
        if (container.scrollLeft > 0) {
          container.classList.add("scrolled");
        } else {
          container.classList.remove("scrolled");
        }
      } else {
        container.classList.remove("has-overflow");
        container.classList.remove("scrolled");
      }
    };

    const container = tableContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      // Run once to initialize
      handleScroll();

      // Also check when window resizes
      window.addEventListener("resize", handleScroll);
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
      window.removeEventListener("resize", handleScroll);
    };
  }, [queryResults, activeTab]); // Re-run when results or tab changes

  // Define the columns for each query type - UPDATED FOR CUSTOMER PURCHASES
  const queryColumns = {
    lowStock: ["Name", "Stock"],
    recentSales: ["ID", "Customer", "Date", "Total"],
    topSelling: ["Fish Name", "Total Sold"],
    customerSales: ["Customer Name", "Sales Count"],
    customerPurchases: ["Customer Name", "Fish Purchased", "Total Quantity"],
  };

  return (
    <div className="business-query-container">
      <div className="query-header">
        <h1>Business Queries</h1>
        <div className="user-info">
          <span>Logged in as: {user?.email}</span>
          <button onClick={() => navigate("/admin")} className="back-button">
            Back to Dashboard
          </button>
        </div>
      </div>

      <div className="query-tabs">
        <button
          className={activeTab === "lowStock" ? "active" : ""}
          onClick={() => setActiveTab("lowStock")}
        >
          Low Stock Fish
        </button>
        <button
          className={activeTab === "recentSales" ? "active" : ""}
          onClick={() => setActiveTab("recentSales")}
        >
          Recent Sales
        </button>
        <button
          className={activeTab === "topSelling" ? "active" : ""}
          onClick={() => setActiveTab("topSelling")}
        >
          Top Selling Fish
        </button>
        <button
          className={activeTab === "customerSales" ? "active" : ""}
          onClick={() => setActiveTab("customerSales")}
        >
          Sales Per Customer
        </button>
        <button
          className={activeTab === "customerPurchases" ? "active" : ""}
          onClick={() => setActiveTab("customerPurchases")}
        >
          Customer Purchases
        </button>
      </div>

      <div className="query-content">
        <div className="query-description">
          {activeTab === "lowStock" && (
            <p>
              Fish that are low in stock (less than 10 left)
              <br />
              This helps staff know which fish need to be restocked soon.
            </p>
          )}
          {activeTab === "recentSales" && (
            <p>
              Sales made in the last 30 days <br /> Useful to track recent
              activity and understand how much product is being sold.
            </p>
          )}
          {activeTab === "topSelling" && (
            <p>
              Total quantity sold per fish (most popular first)
              <br />
              Helps identify best-selling fish so the store can focus on
              stocking popular types.
            </p>
          )}
          {activeTab === "customerSales" && (
            <p>
              Total number of sales per customer
              <br />
              Lets staff see how often each customer buys from the store. Good
              for loyalty rewards or outreach.
            </p>
          )}
          {activeTab === "customerPurchases" && (
            <p>
              Summary of each customer&apos;s fish purchases
              <br />
              Shows what types of fish each customer has bought and total
              quantities. Helpful for customer support or personalized
              suggestions based on purchase history.
            </p>
          )}
        </div>

        <div className="query-results">
          {loading ? (
            <p>Loading results...</p>
          ) : (
            <div className="table-responsive" ref={tableContainerRef}>
              <table>
                <thead>
                  <tr>
                    {queryColumns[activeTab].map((column) => (
                      <th key={column}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {queryResults.length > 0 ? (
                    queryResults.map((result, index) => (
                      <tr key={index}>
                        {activeTab === "customerPurchases" ? (
                          <>
                            <td>{result.customer_name}</td>
                            <td>
                              <button
                                className="view-details-btn"
                                onClick={() => {
                                  setSelectedCustomer({
                                    name: result.customer_name,
                                    fishList: result.fish_purchased || "",
                                  });
                                  setIsModalOpen(true);
                                }}
                              >
                                View Details (
                                {result.fish_purchased
                                  ? result.fish_purchased.split(", ").length
                                  : 0}{" "}
                                items)
                              </button>
                            </td>
                            <td>{result.total_purchases}</td>
                          </>
                        ) : (
                          Object.values(result).map((value, i) => (
                            <td key={i}>{value}</td>
                          ))
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={queryColumns[activeTab].length}
                        className="no-results"
                      >
                        No results found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <button
          className="refresh-button"
          onClick={() => fetchQueryResults(activeTab)}
        >
          Refresh Data
        </button>
      </div>

      {/* Purchase Details Modal */}
      {isModalOpen && selectedCustomer && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedCustomer.name}&apos;s Purchases</h2>
              <button
                className="close-button"
                onClick={() => setIsModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <ul className="fish-purchase-list">
                {selectedCustomer.fishList &&
                  selectedCustomer.fishList.split(", ").map((fish, index) => {
                    // Extract fish name and quantity from format "FishName (quantity)"
                    const match = fish.match(/(.*) \((\d+)\)/);
                    if (match) {
                      const [, fishName, quantity] = match;
                      return (
                        <li key={index}>
                          <span className="fish-name">{fishName}</span>
                          <span className="fish-quantity">{quantity}</span>
                        </li>
                      );
                    }
                    return <li key={index}>{fish}</li>;
                  })}
                {(!selectedCustomer.fishList ||
                  selectedCustomer.fishList === "") && (
                  <li>No purchases found</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BusinessQuery;
