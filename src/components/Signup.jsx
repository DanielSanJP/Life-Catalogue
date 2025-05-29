import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css"; // We can reuse the login styles

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      // Create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (authError) throw authError;

      console.log("Signup successful:", authData);

      // Check if email confirmation is required
      if (authData?.user?.identities?.[0]?.identity_data?.email_confirmed_at) {
        // Email already confirmed (or no confirmation required)
        setSuccessMessage("Account created successfully!");

        // Redirect to home or a welcome page
        setTimeout(() => {
          navigate("/");
        }, 1500);
      } else {
        // Email confirmation required
        setSuccessMessage("Account created!");

        // Sign them out since they need to confirm email
        await supabase.auth.signOut();

        // Redirect to login page after a delay
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      }

      // Clear form
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setFullName("");
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form signup-form">
        <h2>Create Account</h2>
        {error && <div className="error-message">{error}</div>}
        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}

        <form onSubmit={handleSignup}>
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength="6"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="signup-button">
            {loading ? "Creating Account..." : "Sign Up"}
          </button>

          <div className="form-footer">
            Already have an account?{" "}
            <span className="link" onClick={() => navigate("/login")}>
              Login
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Signup;
