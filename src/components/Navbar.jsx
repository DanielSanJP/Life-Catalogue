import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { getCartItemCount } from "../utils/cartUtils";
import "../styles/Navbar.css";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      const currentUser = data.user;
      setUser(currentUser);

      if (currentUser) {
        // Check admin status from the user_roles table
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", currentUser.id);

        // Check if user has admin role
        const isUserAdmin =
          roleData && roleData.length > 0 && roleData[0].role === "admin";
        setIsAdmin(isUserAdmin);
      } else {
        setIsAdmin(false);
      }
    };

    getUser();
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const currentUser = session?.user || null;
        setUser(currentUser);

        if (currentUser) {
          // Check admin status from the user_roles table on auth state change
          const checkAdminRole = async () => {
            const { data: roleData } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", currentUser.id);

            const isUserAdmin =
              roleData && roleData.length > 0 && roleData[0].role === "admin";
            setIsAdmin(isUserAdmin);
          };

          checkAdminRole();
        } else {
          setIsAdmin(false);
        }
      }
    );

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Separate useEffect for cart management
  useEffect(() => {
    // Initialize cart count
    const updateCartCount = () => {
      const count = getCartItemCount();
      setCartItemCount(count);
    };

    // Set initial count
    updateCartCount();

    // Listen for cart updates
    const handleCartUpdate = () => {
      updateCartCount();
    };

    // Listen for storage events (in case cart is updated from another tab)
    const handleStorageChange = (event) => {
      if (event.key === "fishCart") {
        updateCartCount();
      }
    };

    // Add event listeners
    window.addEventListener("cartUpdated", handleCartUpdate);
    window.addEventListener("storage", handleStorageChange);

    // Cleanup event listeners
    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []); // Empty dependency array since we want this to run once

  // Also update cart count when navigating to/from cart page
  useEffect(() => {
    if (location.pathname === "/cart" || location.pathname === "/catalogue") {
      const count = getCartItemCount();
      setCartItemCount(count);
    }
  }, [location.pathname]);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <Link to="/">
            <img
              src="/aquarium.png"
              alt="Life Catalogue Logo"
              className="logo-image"
            />
            <span>Life Catalogue</span>
          </Link>
        </div>
        <div className="navbar-links">
          <Link to="/" className={location.pathname === "/" ? "active" : ""}>
            Home
          </Link>
          <Link
            to="/catalogue"
            className={location.pathname === "/catalogue" ? "active" : ""}
          >
            Fish Catalogue
          </Link>
          <Link
            to="/species"
            className={location.pathname === "/species" ? "active" : ""}
          >
            Species
          </Link>
          <Link
            to="/about"
            className={location.pathname === "/about" ? "active" : ""}
          >
            About
          </Link>
        </div>
        <div className="navbar-actions">
          <Link to="/cart" className="cart-button">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="m1 1 4 4 2 12h12l3-6H7"></path>
            </svg>{" "}
            {cartItemCount > 0 && (
              <span className="cart-badge">{cartItemCount}</span>
            )}{" "}
          </Link>{" "}
          {/* Simplified admin/login link logic */}
          {user && isAdmin && (
            <Link to="/admin" className="admin-link">
              Admin
            </Link>
          )}
          {!user && (
            <div className="auth-buttons">
              <Link to="/login" className="login-link">
                Login
              </Link>
              <Link to="/signup" className="signup-link">
                Sign Up
              </Link>
            </div>
          )}
          {user && (
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          )}
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
