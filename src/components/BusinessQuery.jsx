import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import "../styles/BusinessQuery.css";

function BusinessQuery() {
  const [activeTab, setActiveTab] = useState("lowStock");
  const [queryResults, setQueryResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const tableContainerRef = useRef(null);

  const fetchQueryResults = async (queryType) => {
    setLoading(true);
    try {
      let data = [];

      switch (queryType) {
        case "lowStock":
          // Fish with stock less than 10
          const { data: lowStockData, error: lowStockError } = await supabase
            .from("fish")
            .select("name, stock")
            .lt("stock", 10)
            .order("stock");

          if (lowStockError) throw lowStockError;
          data = lowStockData;
          break;

        case "recentSales":
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

        case "topSelling":
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

        case "customerSales":
          // Get total number of sales per customer
          const { data: customerSalesData, error: customerSalesError } =
            await supabase.from("customers").select(`
              name,
              sales(count)
            `);

          if (customerSalesError) throw customerSalesError;

          data = customerSalesData
            .map((customer) => ({
              name: customer.name,
              sales_count: customer.sales.length,
            }))
            .sort((a, b) => b.sales_count - a.sales_count);
          break;

        case "customerPurchases":
          // Get customers and what fish they bought
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

          // Flatten the nested structure
          data = [];
          customerPurchasesData.forEach((customer) => {
            customer.sales.forEach((sale) => {
              sale.orders.forEach((order) => {
                data.push({
                  customer_name: customer.name,
                  fish_name: order.fish.name,
                  quantity: order.quantity,
                });
              });
            });
          });
          break;

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

  // Define the columns for each query type
  const queryColumns = {
    lowStock: ["Name", "Stock"],
    recentSales: ["ID", "Customer", "Date", "Total"],
    topSelling: ["Fish Name", "Total Sold"],
    customerSales: ["Customer Name", "Sales Count"],
    customerPurchases: ["Customer Name", "Fish Purchased", "Quantity"],
  };

  return (
    <div className="business-query-container">
      <h1>Business Queries Dashboard</h1>

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
              Customers and what fish they bought
              <br />
              Helpful for customer support or personalized suggestions based on
              purchase history.
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
                        {Object.values(result).map((value, i) => (
                          <td key={i}>{value}</td>
                        ))}
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
    </div>
  );
}

export default BusinessQuery;
