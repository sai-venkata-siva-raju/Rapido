import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import UserDataContext from "../context/UserDataContext";
import CaptainDataContext from "../context/CaptainDataContext";

const initialFormData = {
  firstname: "",
  lastname: "",
  email: "",
  color: "",
  model: "",
  capacity: "",
  vehicleType: "",
  password: "",
  confirmPassword: "",
};

const CaptainSignup = () => {
  const [formData, setFormData] = useState(initialFormData);
  const navigate = useNavigate();
  const { setUserData, setAuthRole } = useContext(UserDataContext);
  const { setCaptainData } = useContext(CaptainDataContext);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    axios
      .post(`${import.meta.env.VITE_BASE_URL}/api/captains/register`, {
        fullname: {
          firstname: formData.firstname,
          lastname: formData.lastname,
        },
        email: formData.email,
        password: formData.password,
        verhicle: {
          color: formData.color,
          model: formData.model,
          capicity: Number(formData.capacity),
          vehicleType: formData.vehicleType,
        },
      }, {
        withCredentials: true,
      })
      .then((res) => {
        console.log("Captain signup successful:", res.data);
        setUserData({
          name: `${formData.firstname} ${formData.lastname}`,
          email: formData.email,
        });
        setCaptainData({
          name: `${formData.firstname} ${formData.lastname}`,
          email: formData.email,
        });
        setAuthRole(res.data?.role || "captain");
        setFormData(initialFormData);
        navigate("/captain-home");
      })
      .catch((err) => {
        console.error("Captain signup error:", err);
        alert(err?.response?.data?.message || "Signup failed. Please try again.");
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-xl border border-yellow-100 p-6 sm:p-8">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="text-center mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-yellow-500">
              Captain Sign Up
            </p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">
              Join as a captain
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Set up your driving profile and start accepting rides.
            </p>
          </div>

          <div>
            <label htmlFor="firstname" className="mb-1 block text-sm font-medium text-gray-700">
              First Name
            </label>
            <input
              id="firstname"
              type="text"
              placeholder="Enter your first name"
              required
              value={formData.firstname}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
            />
          </div>

          <div>
            <label htmlFor="lastname" className="mb-1 block text-sm font-medium text-gray-700">
              Last Name
            </label>
            <input
              id="lastname"
              type="text"
              placeholder="Enter your last name"
              required
              value={formData.lastname}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
            />
          </div>

          <div>
            <label htmlFor="color" className="mb-1 block text-sm font-medium text-gray-700">
              Vehicle Color
            </label>
            <input
              id="color"
              type="text"
              placeholder="Enter vehicle color"
              required
              value={formData.color}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
            />
          </div>

          <div>
            <label htmlFor="model" className="mb-1 block text-sm font-medium text-gray-700">
              Vehicle Model
            </label>
            <input
              id="model"
              type="text"
              placeholder="Enter vehicle model"
              required
              value={formData.model}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
            />
          </div>

          <div>
            <label htmlFor="capacity" className="mb-1 block text-sm font-medium text-gray-700">
              Vehicle Capacity
            </label>
            <input
              id="capacity"
              type="number"
              placeholder="Enter vehicle capacity"
              required
              value={formData.capacity}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
            />
          </div>

          <div>
            <label htmlFor="vehicleType" className="mb-1 block text-sm font-medium text-gray-700">
              Vehicle Type
            </label>
            <select
              id="vehicleType"
              required
              value={formData.vehicleType}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 bg-white"
            >
              <option value="" disabled>
                Select vehicle type
              </option>
              <option value="car">Car</option>
              <option value="motorcycle">Motorcycle</option>
              <option value="van">Van</option>
            </select>
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Create a password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-yellow-400 py-3 text-sm font-semibold text-black transition hover:bg-yellow-500"
          >
            Create captain account
          </button>

          <p className="text-center text-sm text-gray-500">
            Already a captain?{" "}
            <Link to="/captain-login" className="font-medium text-black hover:underline">
              Login
            </Link>
          </p>

          <Link
            to="/signup"
            className="block w-full rounded-xl bg-black py-3 text-center text-sm font-semibold text-white transition hover:bg-gray-900"
          >
            Sign up as User
          </Link>
        </form>
      </div>
    </div>
  );
};

export default CaptainSignup;
