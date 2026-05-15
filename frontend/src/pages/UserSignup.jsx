import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import UserDataContext from "../context/UserDataContext";

const initialFormData = {
  firstname: "",
  lastname: "",
  email: "",
  password: "",
  confirmPassword: "",
};


const UserSignup = () => {
  const [formData, setFormData] = useState(initialFormData);
  const navigate = useNavigate();
  const { setUserData, setAuthRole } = useContext(UserDataContext);

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
      .post(`${import.meta.env.VITE_BASE_URL}/api/users/register`, {
        fullname: {
          firstname: formData.firstname,
          lastname: formData.lastname,
        },
        email: formData.email,
        password: formData.password,
      }, {
        withCredentials: true,
      })
      .then((res) => {
        console.log("Signup successful:", res.data);
        setUserData({
          name: `${formData.firstname} ${formData.lastname}`,
          email: formData.email,
        });
        setAuthRole(res.data?.role || "user");
        navigate("/home");
      })
      .catch((err) => {
        console.error("Signup error:", err);
        alert(err?.response?.data?.message || "Signup failed. Please try again.");
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-200 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-xl border border-gray-200 p-6 sm:p-8">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="text-center mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
              Passenger Sign Up
            </p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">
              Create your account
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Join Rapid-go and book your next ride in a few taps.
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
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
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
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
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
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
            />
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
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
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
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-black py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
          >
            Create account
          </button>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-black hover:underline">
              Login
            </Link>
          </p>

          <Link
            to="/captain-signup"
            className="block w-full rounded-xl bg-yellow-400 py-3 text-center text-sm font-semibold text-black transition hover:bg-yellow-500"
          >
            Sign up as Captain
          </Link>
        </form>
      </div>
    </div>
  );
};

export default UserSignup;
