import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { Link, Navigate, useNavigate } from "react-router-dom";
import UserDataContext from "../context/UserDataContext";
import CaptainDataContext from "../context/CaptainDataContext";

const Profile = () => {
  const {
    authRole,
    userData,
    profileData,
    setProfileData,
    setUserData,
    setAuthRole,
    clearSession,
  } = useContext(UserDataContext);
  const {
    captainData,
    captainProfileData,
    setCaptainData,
    setCaptainProfileData,
    clearCaptainSession,
  } = useContext(CaptainDataContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      const endpoints =
        authRole === "captain"
          ? ["/api/captains/profile"]
          : authRole === "user"
          ? ["/api/users/profile"]
          : ["/api/users/profile", "/api/captains/profile"];

      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_BASE_URL}${endpoint}`,
            { withCredentials: true }
          );

          if (!isMounted) return;

          const data = endpoint.includes("captains")
            ? response.data
            : response.data.user;

          setProfileData(data);
          if (endpoint.includes("captains")) {
            setCaptainProfileData(data);
            setCaptainData({
              name:
                data?.fullname
                  ? `${data.fullname.firstname || ""} ${data.fullname.lastname || ""}`.trim()
                  : captainData.name,
              email: data?.email || captainData.email,
            });
          }
          setUserData({
            name:
              data?.fullname
                ? `${data.fullname.firstname || ""} ${data.fullname.lastname || ""}`.trim()
                : userData.name,
            email: data?.email || userData.email,
          });
          setAuthRole(endpoint.includes("captains") ? "captain" : "user");
          setError("");
          setLoading(false);
          return;
        } catch (err) {
          // Keep trying the other endpoint if available.
        }
      }

      if (isMounted) {
        setError("You are not signed in. Please login first.");
        setLoading(false);
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [
    authRole,
    captainData.email,
    captainData.name,
    setAuthRole,
    setCaptainData,
    setCaptainProfileData,
    setProfileData,
    setUserData,
    userData.email,
    userData.name,
  ]);

  const handleLogout = async () => {
    const logoutEndpoint =
      authRole === "captain" ? "/api/captains/logout" : "/api/users/logout";

    try {
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}${logoutEndpoint}`,
        {},
        { withCredentials: true }
      );
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      clearSession();
      clearCaptainSession();
      navigate(authRole === "captain" ? "/captain-login" : "/login", {
        replace: true,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-sm text-gray-500">
        Loading profile...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-yellow-50 px-4 py-8">
        <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center">
          <div className="w-full rounded-[2rem] bg-white p-8 text-center shadow-xl ring-1 ring-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            <p className="mt-3 text-sm text-gray-600">{error}</p>
            <Link
              to="/login"
              className="mt-6 inline-flex rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const name =
    profileData?.fullname
      ? `${profileData.fullname.firstname || ""} ${profileData.fullname.lastname || ""}`.trim()
      : authRole === "captain"
      ? captainData.name || "Profile"
      : userData.name || "Profile";
  const email =
    profileData?.email ||
    (authRole === "captain" ? captainData.email : userData.email) ||
    "No email available";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-yellow-50">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">
              Rapid-go
            </p>
            <h1 className="mt-2 text-3xl font-black text-gray-900 sm:text-4xl">
              Profile
            </h1>
          </div>
          <Link
            to="/home"
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 transition hover:shadow-md"
          >
            Back home
          </Link>
        </header>

        <main className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-[2rem] bg-white p-6 shadow-xl ring-1 ring-gray-200 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-900 text-xl font-bold text-white">
                {name
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")
                  .toUpperCase() || "P"}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">
                  {authRole || "session"}
                </p>
                <h2 className="mt-1 text-2xl font-bold text-gray-900">{name}</h2>
                <p className="mt-2 text-sm text-gray-600">{email}</p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                  Role
                </p>
                <p className="mt-2 text-sm font-semibold text-gray-900">
                  {authRole || "Unknown"}
                </p>
              </div>
              <div className="rounded-3xl bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                  Email
                </p>
                <p className="mt-2 text-sm font-semibold text-gray-900">
                  {email}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-8 inline-flex rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
            >
              Logout
            </button>
          </section>

          <aside className="rounded-[2rem] bg-gray-900 p-6 text-white shadow-xl sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">
              Account Details
            </p>
            {authRole === "captain" ? (
              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-sm text-gray-400">Vehicle color</p>
                  <p className="mt-1 text-lg font-semibold">
                    {captainProfileData?.verhicle?.color || profileData?.verhicle?.color || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Vehicle model</p>
                  <p className="mt-1 text-lg font-semibold">
                    {captainProfileData?.verhicle?.model || profileData?.verhicle?.model || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Vehicle type</p>
                  <p className="mt-1 text-lg font-semibold">
                    {captainProfileData?.verhicle?.vehicleType || profileData?.verhicle?.vehicleType || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Capacity</p>
                  <p className="mt-1 text-lg font-semibold">
                    {captainProfileData?.verhicle?.capicity || profileData?.verhicle?.capicity || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  <p className="mt-1 text-lg font-semibold">
                    {captainProfileData?.status || profileData?.status || "inactive"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-sm text-gray-400">First name</p>
                  <p className="mt-1 text-lg font-semibold">
                    {profileData?.fullname?.firstname || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Last name</p>
                  <p className="mt-1 text-lg font-semibold">
                    {profileData?.fullname?.lastname || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Account state</p>
                  <p className="mt-1 text-lg font-semibold">Active session</p>
                </div>
              </div>
            )}
          </aside>
        </main>
      </div>
    </div>
  );
};

export default Profile;
