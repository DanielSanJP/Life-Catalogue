import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";
import { supabase } from "../supabaseClient";

function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data.user;

        if (user) {
          setAuthenticated(true);

          // Check admin status from the user_roles table
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("*")
            .eq("user_id", user.id);

          // Check if the role is admin (more robust check)
          const isUserAdmin =
            roleData &&
            roleData.length > 0 &&
            roleData.some((role) => role.role === "admin");

          // Set isAdmin state
          setIsAdmin(isUserAdmin);
        } else {
          setAuthenticated(false);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        setAuthenticated(false);
        setIsAdmin(false);
      } finally {
        // Only set loading to false after everything is complete
        setLoading(false);
      }
    };

    checkAuth();

    // Also update the auth listener with the same logic
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setAuthenticated(true);

          // Instead of defining checkAdminRole as a nested function,
          // run it directly and await its result before updating loading
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("*")
            .eq("user_id", session.user.id);

          const isUserAdmin =
            roleData && roleData.some((role) => role.role === "admin");
          setIsAdmin(isUserAdmin);

          // Only set loading to false AFTER we've determined admin status
          setLoading(false);
        } else {
          setAuthenticated(false);
          setIsAdmin(false);
          setLoading(false);
        }
      }
    );

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []); // Add empty dependency array here

  // Add loading check here
  if (loading) {
    // Return a loading indicator while checking authentication
    return <div>Loading...</div>;
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Add PropTypes validation
ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;
