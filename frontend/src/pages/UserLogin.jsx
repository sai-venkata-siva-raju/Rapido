import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import UserDataContext from "../context/UserDataContext";

const UserLogin = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const navigate = useNavigate();
  const { setUserData, setAuthRole } = useContext(UserDataContext);

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();

    axios
      .post(`${import.meta.env.VITE_BASE_URL}/api/users/login`, formData, {
        withCredentials: true,
      })
      .then((res) => {
        console.log("Login successful:", res.data);
        setUserData({
          name:
            `${res.data?.user?.fullname?.firstname || ""} ${res.data?.user?.fullname?.lastname || ""}`.trim(),
          email: res.data?.user?.email || formData.email,
        });
        setAuthRole(res.data?.role || "user");
        setFormData({
          email: "",
          password: "",
        });
        navigate("/home");
      })
      .catch((err) => {
        console.error("Login error:", err);
        alert(err?.response?.data?.message || "Login failed. Please try again.");
      });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Welcome Back
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Login to your account
            </p>
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address
            </label>

            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-black focus:border-black transition"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-black focus:border-black transition"
            />
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full bg-black text-white py-3 rounded-xl font-semibold text-sm hover:bg-gray-900 transition"
          >
            Login
          </button>

          {/* Signup */}
          <p className="text-center text-sm text-gray-500">
            Don’t have an account?{" "}
            <Link to="/signup">
              <span className="text-black font-medium cursor-pointer hover:underline">
                Sign Up
              </span>
            </Link>
          </p>

          {/* Captain Login Button */}
          <Link to="/captain-login">
            <button
              type="button"
              className="w-full bg-yellow-400 text-black py-3 rounded-xl font-semibold text-sm hover:bg-yellow-500 transition"
            >
              Sign in as Captain
            </button>
          </Link>
        </form>
      </div>
    </div>
  );
};

export default UserLogin;
