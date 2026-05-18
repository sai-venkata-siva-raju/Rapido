import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import UserDataContext from "../context/UserDataContext";
import CaptainDataContext from "../context/CaptainDataContext";

const CaptainLogin = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const navigate = useNavigate();
  const { setUserData, setAuthRole } = useContext(UserDataContext);
  const { setCaptainData } = useContext(CaptainDataContext);

  // Handle input change
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
      .post(`${import.meta.env.VITE_BASE_URL}/api/captains/login`, formData, {
        withCredentials: true,
      })
      .then((res) => {
        console.log("Captain login successful:", res.data);
        setUserData({
          name:
            `${res.data?.captain?.fullname?.firstname || ""} ${res.data?.captain?.fullname?.lastname || ""}`.trim(),
          email: res.data?.captain?.email || formData.email,
        });
        setCaptainData({
          name:
            `${res.data?.captain?.fullname?.firstname || ""} ${res.data?.captain?.fullname?.lastname || ""}`.trim(),
          email: res.data?.captain?.email || formData.email,
        });
        setAuthRole(res.data?.role || "captain");
        setFormData({
          email: "",
          password: "",
        });
        navigate("/captain-home");
      })
      .catch((err) => {
        console.error("Captain login error:", err);
        alert(err?.response?.data?.message || "Login failed. Please try again.");
      });
  };

  return (
    <div className="min-h-screen bg-yellow-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Heading */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Captain Login
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Sign in to continue driving
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
              className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
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
              className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
            />
            <div className="mt-2 text-right">
              <Link
                to="/forgot-password/captain"
                className="text-xs font-medium text-gray-500 hover:text-black hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full bg-yellow-400 text-black py-3 rounded-xl font-semibold text-sm hover:bg-yellow-500 transition"
          >
            Login as Captain
          </button>

          {/* Signup */}
          <p className="text-center text-sm text-gray-500">
            Want to join as a captain?{" "}
            <Link to="/captain-signup">
              <span className="text-black font-medium cursor-pointer hover:underline">
                Register
              </span>
            </Link>
          </p>

          {/* User Login Button */}
          <Link to="/login">
            <button
              type="button"
              className="w-full bg-black text-white py-3 rounded-xl font-semibold text-sm hover:bg-gray-900 transition"
            >
              Sign in as User
            </button>
          </Link>
        </form>
      </div>
    </div>
  );
};

export default CaptainLogin;
