// src/pages/Auth/Login.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login, getPreferences } from "../../api";
import "../../styles/Auth.css";

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // ✅ 1. Authenticate user
      const res = await login(form);
      const { token, user } = res.data;

      // ✅ 2. Save token and user details
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // ✅ 3. Also store user email separately for easy global access
      localStorage.setItem("userEmail", user.email);

      const email = user.email;
      const role = user.role || "user";

      // ✅ 4. Redirect admin users
      if (role === "admin") {
        navigate("/admin");
        return;
      }

      // ✅ 5. Check if local preferences exist
      const localPrefs = localStorage.getItem(`preferences_${email}`);
      if (localPrefs) {
        navigate("/Choose");
        return;
      }

      // ✅ 6. Otherwise fetch preferences from backend
      try {
        const prefsRes = await getPreferences(email);
        if (prefsRes.data && prefsRes.data.genres?.length > 0) {
          localStorage.setItem(
            `preferences_${email}`,
            JSON.stringify(prefsRes.data)
          );
          navigate("/dashboard");
        } else {
          navigate("/Choose");
        }
      } catch (err) {
        console.error("❌ Error fetching preferences:", err);
        navigate("/preferences");
      }
    } catch (err) {
      console.error("❌ Login failed:", err);
      setError("Invalid email or password");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Login</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <button type="submit" className="auth-btn">
            Login
          </button>
        </form>
        <div className="auth-footer">
          Don’t have an account? <Link to="/signup">Signup</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
