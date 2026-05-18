import { useContext, useEffect, useState } from "react";
import axios from "axios";
import ProfileIcon from "../components/ProfileIcon";
import CaptainDataContext from "../context/CaptainDataContext";
import { io } from "socket.io-client";

const CaptainHome = () => {
  const { captainData } = useContext(CaptainDataContext) || {};
  const [pendingRides, setPendingRides] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [socketReady, setSocketReady] = useState(false);
  const [socket, setSocket] = useState(null);

  const baseUrl = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    if (!baseUrl) {
      return undefined;
    }

    const socketInstance = io(baseUrl, {
      withCredentials: true,
    });

    socketInstance.on("connect", () => {
      setSocketReady(true);
    });

    socketInstance.on("ride:update", (payload) => {
      setActiveRide((current) => {
        if (!current || String(current._id) !== String(payload.rideId)) {
          return current;
        }

        return {
          ...current,
          status: payload.status || current.status,
        };
      });
    });

    socketInstance.on("ride:new", (ride) => {
      setPendingRides((current) => {
        if (current.some((item) => String(item._id) === String(ride._id))) {
          return current;
        }

        return [ride, ...current];
      });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
      setSocket(null);
      setSocketReady(false);
    };
  }, [baseUrl]);

  const fetchDashboardData = async () => {
    try {
      const [pendingResponse, activeResponse] = await Promise.all([
        axios.get(`${baseUrl}/api/rides/captain/pending`, {
          withCredentials: true,
        }),
        axios.get(`${baseUrl}/api/rides/captain/active`, {
          withCredentials: true,
        }),
      ]);

      setPendingRides(pendingResponse.data?.rides || []);
      setActiveRide(activeResponse.data?.ride || null);
    } catch (error) {
      console.error("Failed to load captain dashboard:", error);
      setStatusMessage(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Unable to load captain rides."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, [baseUrl]);

  useEffect(() => {
    let watchId = null;

    const pushLocation = async (latitude, longitude) => {
      try {
        if (socket) {
          socket.emit("ride:captain-location", { latitude, longitude });
        } else {
          await axios.post(
            `${baseUrl}/api/captains/location`,
            { latitude, longitude },
            { withCredentials: true }
          );
        }
      } catch (error) {
        console.error("Failed to update captain location:", error);
      }
    };

    if (locationEnabled && "geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          pushLocation(
            position.coords.latitude,
            position.coords.longitude
          );
        },
        (error) => {
          console.error("Geolocation error:", error);
          setStatusMessage("Unable to access location. Please allow location permission.");
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [baseUrl, locationEnabled]);

  const acceptRide = async (rideId) => {
    setActionLoading(true);
    setStatusMessage("");
    try {
      await axios.post(
        `${baseUrl}/api/rides/confirm`,
        { rideId },
        { withCredentials: true }
      );
      setStatusMessage("Ride accepted.");
      setPendingRides((current) => current.filter((ride) => ride._id !== rideId));
      await fetchDashboardData();
    } catch (error) {
      console.error("Failed to accept ride:", error);
      setStatusMessage(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Unable to accept ride."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const startRide = async () => {
    if (!activeRide?._id || !otp.trim()) {
      setStatusMessage("Enter the OTP shared by the rider.");
      return;
    }

    setActionLoading(true);
    setStatusMessage("");
    try {
      await axios.post(
        `${baseUrl}/api/rides/start`,
        { rideId: activeRide._id, otp: otp.trim() },
        { withCredentials: true }
      );
      setOtp("");
      setStatusMessage("Ride started.");
      await fetchDashboardData();
    } catch (error) {
      console.error("Failed to start ride:", error);
      setStatusMessage(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Unable to start ride."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const endRide = async () => {
    if (!activeRide?._id) {
      return;
    }

    setActionLoading(true);
    setStatusMessage("");
    try {
      await axios.post(
        `${baseUrl}/api/rides/end`,
        { rideId: activeRide._id },
        { withCredentials: true }
      );
      setStatusMessage("Ride completed.");
      await fetchDashboardData();
    } catch (error) {
      console.error("Failed to end ride:", error);
      setStatusMessage(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Unable to end ride."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const activeRideIsRunning = activeRide?.status === "in_progress";
  const activeRideIsAccepted = activeRide?.status === "accepted";

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-gray-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-yellow-600">
              Rapid-go Captain
            </p>
            <h1 className="mt-2 text-3xl font-black text-gray-900 sm:text-4xl">
              Captain dashboard
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {captainData?.name ? `Welcome back, ${captainData.name}` : "Manage live rides and location tracking."}
            </p>
          </div>
          <ProfileIcon />
        </header>

        {statusMessage && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {statusMessage}
          </div>
        )}

        <main className="mt-8 grid flex-1 gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <aside className="rounded-[2rem] bg-gray-900 p-6 text-white shadow-xl sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">
              Live status
            </p>
            <h2 className="mt-3 text-2xl font-bold">Ready to accept rides?</h2>
            <p className="mt-4 text-sm leading-7 text-gray-300">
              Keep your location on while you are on duty so riders can see your
              live movement on the map.
            </p>
            <p className="mt-3 text-xs text-gray-400">
              Socket status: {socketReady ? "connected" : "connecting..."}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                  Pending
                </p>
                <p className="mt-2 text-lg font-semibold">{pendingRides.length}</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                  Active ride
                </p>
                <p className="mt-2 text-lg font-semibold">
                  {activeRide ? activeRide.status : "None"}
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                Live location
              </p>
              <p className="mt-2 text-sm text-gray-300">
                Turn on location sharing so the rider map can track you in real time.
              </p>
              <button
                type="button"
                onClick={() => setLocationEnabled((current) => !current)}
                className={`mt-4 w-full rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  locationEnabled
                    ? "bg-emerald-400 text-gray-900 hover:bg-emerald-300"
                    : "bg-white text-gray-900 hover:bg-gray-100"
                }`}
              >
                {locationEnabled ? "Stop sharing location" : "Start sharing location"}
              </button>
            </div>
          </aside>

          <section className="rounded-[2rem] bg-white p-6 shadow-xl ring-1 ring-gray-200 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-yellow-600">
                  Captain tools
                </p>
                <h2 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl">
                  Pending rides and active trip
                </h2>
              </div>
              <button
                type="button"
                onClick={fetchDashboardData}
                className="rounded-2xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-200"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="mt-8 rounded-3xl bg-gray-50 p-6 text-sm text-gray-500">
                Loading captain dashboard...
              </div>
            ) : (
              <>
                <div className="mt-8 rounded-3xl border border-gray-200 bg-gray-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
                    Active ride
                  </p>
                  {activeRide ? (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {activeRide.pickupLocation}
                        </p>
                        <p className="mt-1 text-sm text-gray-600">
                          Pickup location
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {activeRide.dropoffLocation}
                        </p>
                        <p className="mt-1 text-sm text-gray-600">
                          Drop-off location
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 capitalize">
                          {activeRide.vehicleType}
                        </p>
                        <p className="mt-1 text-sm text-gray-600">
                          Vehicle type
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          ₹{activeRide.fare}
                        </p>
                        <p className="mt-1 text-sm text-gray-600">Estimated fare</p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-sm font-semibold text-gray-900">
                          {activeRide.userId?.fullname?.firstname || activeRide.userId?.name || "Rider"}
                        </p>
                        <p className="mt-1 text-sm text-gray-600">
                          Rider name
                        </p>
                      </div>
                      {activeRideIsAccepted && (
                        <div className="sm:col-span-2">
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Enter OTP shared by rider
                          </label>
                          <input
                            value={otp}
                            onChange={(event) => setOtp(event.target.value)}
                            placeholder="Enter 6 digit OTP"
                            className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10"
                          />
                        </div>
                      )}
                      <div className="sm:col-span-2 flex flex-wrap gap-3">
                        {activeRideIsAccepted && (
                          <button
                            type="button"
                            onClick={startRide}
                            disabled={actionLoading}
                            className="rounded-2xl bg-yellow-400 px-4 py-3 text-sm font-semibold text-gray-900 transition hover:bg-yellow-500 disabled:cursor-not-allowed disabled:bg-yellow-200"
                          >
                            Start ride
                          </button>
                        )}
                        {activeRideIsRunning && (
                          <button
                            type="button"
                            onClick={endRide}
                            disabled={actionLoading}
                            className="rounded-2xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-500"
                          >
                            End ride
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-gray-600">
                      No active ride right now.
                    </p>
                  )}
                </div>

                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
                    Pending rides
                  </p>

                  <div className="mt-4 grid gap-4">
                    {pendingRides.length === 0 ? (
                      <div className="rounded-3xl bg-gray-50 p-5 text-sm text-gray-600">
                        No pending rides at the moment.
                      </div>
                    ) : (
                      pendingRides.map((ride) => (
                        <div
                          key={ride._id}
                          className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {ride.pickupLocation}
                              </p>
                              <p className="mt-1 text-sm text-gray-600">
                                to {ride.dropoffLocation}
                              </p>
                            </div>
                            <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                              {ride.vehicleType}
                            </span>
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                                Fare
                              </p>
                              <p className="mt-1 text-sm font-semibold text-gray-900">
                                ₹{ride.fare}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                                Status
                              </p>
                              <p className="mt-1 text-sm font-semibold text-gray-900 capitalize">
                                {ride.status}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                                Rider
                              </p>
                              <p className="mt-1 text-sm font-semibold text-gray-900">
                                {ride.userId?.fullname?.firstname || ride.userId?.name || "User"}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => acceptRide(ride._id)}
                            disabled={actionLoading || !!activeRide}
                            className="mt-4 w-full rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:bg-gray-400"
                          >
                            Accept ride
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default CaptainHome;
