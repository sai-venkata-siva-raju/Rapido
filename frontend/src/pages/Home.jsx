import { useContext, useEffect, useState } from "react";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import { divIcon, latLngBounds } from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import ProfileIcon from "../components/ProfileIcon";
import LocationSearchPanel from "../components/LocationSearchPanel";
import UserDataContext from "../context/UserDataContext";
import { io } from "socket.io-client";

const initialFormData = {
  source: "",
  destination: "",
  vehicleType: "car",
};

const defaultMapCenter = [16.5062, 80.6480];

const routePointIcon = (fillColor, label) =>
  divIcon({
    className: "",
    html: `
      <div style="
        display:flex;
        flex-direction:column;
        align-items:center;
        gap:8px;
        transform: translate(-50%, -100%);
      ">
        <div style="
          width:18px;
          height:18px;
          border-radius:9999px;
          border:4px solid white;
          background:${fillColor};
          box-shadow:0 0 0 10px rgba(255,255,255,0.08);
        "></div>
        <div style="
          padding:4px 10px;
          border-radius:9999px;
          background:rgba(15,23,42,0.9);
          color:white;
          font-size:11px;
          font-weight:700;
          letter-spacing:0.08em;
          text-transform:uppercase;
        ">${label}</div>
      </div>
    `,
    iconSize: [1, 1],
    iconAnchor: [9, 18],
  });

const MapFitBounds = ({ bounds }) => {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [bounds, map]);

  return null;
};

const geocodeAddress = async (address) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(address)}&limit=1`
  );
  if (!response.ok) {
    throw new Error("Unable to geocode address");
  }

  const data = await response.json();
  if (!data?.length) {
    throw new Error("Address not found");
  }

  return {
    lat: Number(data[0].lat),
    lng: Number(data[0].lon),
    label: data[0].display_name || address,
  };
};

const normalizeRide = (ride, fallback = {}) => {
  if (!ride) {
    return null;
  }

  return {
    id: ride._id || ride.id,
    source: ride.pickupLocation || fallback.source || "",
    destination: ride.dropoffLocation || fallback.destination || "",
    vehicleType: ride.vehicleType || fallback.vehicleType || "car",
    fare: ride.fare ?? fallback.fare ?? null,
    paymentStatus: ride.paymentStatus || fallback.paymentStatus || "pending",
    requestedAt:
      fallback.requestedAt ||
      (ride.createdAt
        ? new Date(ride.createdAt).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })
        : new Date().toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })),
    status: ride.status || fallback.status || "requested",
    otp: ride.otp || fallback.otp || "",
    captainId: ride.captainId || fallback.captainId || null,
    paymentID: ride.paymentID || fallback.paymentID || "",
    orderID: ride.orderID || fallback.orderID || "",
    signature: ride.signature || fallback.signature || "",
  };
};

const Home = () => {
  const { userData } = useContext(UserDataContext) || {};
  const [formData, setFormData] = useState(initialFormData);
  const [activeField, setActiveField] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [fareEstimate, setFareEstimate] = useState(null);
  const [fareLoading, setFareLoading] = useState(false);
  const [tripRequest, setTripRequest] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [pickupPoint, setPickupPoint] = useState(null);
  const [dropoffPoint, setDropoffPoint] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [mapError, setMapError] = useState("");
  const [currentRideLoading, setCurrentRideLoading] = useState(false);
  const [socketReady, setSocketReady] = useState(false);

  const baseUrl = import.meta.env.VITE_BASE_URL;
  const [socket, setSocket] = useState(null);

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const launchPayment = async (ride) => {
    setPaymentLoading(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setMessage("Unable to load Razorpay checkout.");
        return;
      }

      const orderResponse = await axios.post(
        `${baseUrl}/api/payments/create-order`,
        { rideId: ride.id },
        { withCredentials: true }
      );

      const orderData = orderResponse.data;
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Rapid-go",
        description: orderData.description,
        order_id: orderData.orderId,
        prefill: {
          name: orderData.customerName || userData?.name || "",
          email: orderData.customerEmail || userData?.email || "",
        },
        theme: {
          color: "#facc15",
        },
        handler: async function (response) {
          try {
            const verifyResponse = await axios.post(
              `${baseUrl}/api/payments/verify`,
              {
                rideId: ride.id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              },
              { withCredentials: true }
            );

            const verifiedRide = verifyResponse.data?.ride;
            setTripRequest((current) => ({
              ...current,
              paymentStatus: verifiedRide?.paymentStatus || "paid",
              paymentID: verifiedRide?.paymentID || response.razorpay_payment_id,
              orderID: verifiedRide?.orderID || response.razorpay_order_id,
              signature: verifiedRide?.signature || response.razorpay_signature,
            }));
            setMessage("Payment completed successfully.");
          } catch (error) {
            console.error("Payment verification failed:", error);
            setMessage(
              error?.response?.data?.message ||
                error?.response?.data?.error ||
                "Payment verification failed."
            );
          }
        },
        modal: {
          ondismiss: () => {
            setMessage("Payment window closed.");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Payment initiation failed:", error);
      setMessage(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Unable to start payment."
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleChange = (event) => {
    const { id, value } = event.target;
    setFormData((current) => ({
      ...current,
      [id]: value,
    }));
    setActiveField(id === "source" || id === "destination" ? id : null);
  };

  const handleSuggestionSelect = (suggestion) => {
    const value = suggestion.description || suggestion.structured_formatting?.main_text || "";
    setFormData((current) => ({
      ...current,
      [activeField]: value,
    }));
    setActiveField(null);
    setSuggestions([]);
  };

  useEffect(() => {
    const query = activeField ? formData[activeField] : "";
    if (!activeField || query.trim().length < 2) {
      setSuggestions([]);
      return undefined;
    }

    const timeout = setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const response = await axios.get(`${baseUrl}/api/maps/get-suggestions`, {
          params: { address: query.trim() },
          withCredentials: true,
        });
        setSuggestions(response.data?.suggestions || []);
      } catch (error) {
        console.error("Failed to load suggestions:", error);
        setSuggestions([]);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [activeField, formData.destination, formData.source, baseUrl]);

  useEffect(() => {
    const pickupLocation = formData.source.trim();
    const dropoffLocation = formData.destination.trim();

    if (pickupLocation.length < 2 || dropoffLocation.length < 2) {
      setFareEstimate(null);
      return undefined;
    }

    const timeout = setTimeout(async () => {
      setFareLoading(true);
      try {
        const response = await axios.get(`${baseUrl}/api/rides/fare`, {
          params: {
            pickupLocation,
            dropoffLocation,
          },
          withCredentials: true,
        });
        setFareEstimate(response.data);
      } catch (error) {
        console.error("Failed to load fare estimate:", error);
        setFareEstimate(null);
      } finally {
        setFareLoading(false);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [baseUrl, formData.destination, formData.source]);

  useEffect(() => {
    let isMounted = true;

    const loadCurrentRide = async () => {
      setCurrentRideLoading(true);
      try {
        const response = await axios.get(`${baseUrl}/api/rides/current`, {
          withCredentials: true,
        });

        if (!isMounted) {
          return;
        }

        if (response.data?.ride) {
          setTripRequest((current) =>
            normalizeRide(response.data.ride, current || {})
          );
        }
      } catch (error) {
        console.error("Failed to load current ride:", error);
      } finally {
        if (isMounted) {
          setCurrentRideLoading(false);
        }
      }
    };

    loadCurrentRide();
    const interval = setInterval(loadCurrentRide, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [baseUrl]);

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
      setTripRequest((current) => {
        if (!current || String(current.id) !== String(payload.rideId)) {
          return current;
        }

        const existingCaptainId =
          current.captainId && typeof current.captainId === "object"
            ? current.captainId
            : null;

        return {
          ...current,
          status: payload.status || current.status,
          captainId:
            existingCaptainId || (payload.captainId ? { _id: payload.captainId } : null),
        };
      });
    });

    socketInstance.on("ride:captain-location", (payload) => {
      setTripRequest((current) => {
        if (!current || String(current.id) !== String(payload.rideId)) {
          return current;
        }

        const existingCaptainId =
          current.captainId && typeof current.captainId === "object"
            ? current.captainId
            : { _id: payload.captainId };

        return {
          ...current,
          captainId: {
            ...existingCaptainId,
            location: {
              latitude: payload.latitude,
              longitude: payload.longitude,
            },
            _id: existingCaptainId._id || payload.captainId,
          },
        };
      });
    });

    socketInstance.on("disconnect", () => {
      setSocketReady(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
      setSocket(null);
      setSocketReady(false);
    };
  }, [baseUrl]);

  useEffect(() => {
    let isMounted = true;

    const resolveMapPoints = async () => {
      const pickupLocation = formData.source.trim();
      const dropoffLocation = formData.destination.trim();

      if (pickupLocation.length < 3 || dropoffLocation.length < 3) {
        setPickupPoint(null);
        setDropoffPoint(null);
        setRouteCoordinates([]);
        setMapError("");
        return;
      }

      try {
        const [pickup, dropoff] = await Promise.all([
          geocodeAddress(pickupLocation),
          geocodeAddress(dropoffLocation),
        ]);

        if (!isMounted) {
          return;
        }

        setPickupPoint(pickup);
        setDropoffPoint(dropoff);
        setRouteCoordinates([]);
        setMapError("");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        console.error("Failed to geocode route:", error);
        setPickupPoint(null);
        setDropoffPoint(null);
        setRouteCoordinates([]);
        setMapError(error?.message || "Unable to resolve map route");
      }
    };

    resolveMapPoints();

    return () => {
      isMounted = false;
    };
  }, [formData.destination, formData.source]);

  useEffect(() => {
    let isMounted = true;

    const loadRoute = async () => {
      if (!pickupPoint || !dropoffPoint) {
        setRouteCoordinates([]);
        return;
      }

      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${pickupPoint.lng},${pickupPoint.lat};${dropoffPoint.lng},${dropoffPoint.lat}?overview=full&geometries=geojson`
        );

        if (!response.ok) {
          throw new Error("Unable to load route");
        }

        const data = await response.json();
        const coordinates = data?.routes?.[0]?.geometry?.coordinates || [];

        if (!coordinates.length) {
          throw new Error("Route not available");
        }

        if (!isMounted) {
          return;
        }

        setRouteCoordinates(coordinates.map(([lng, lat]) => [lat, lng]));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        console.error("Failed to load route line:", error);
        setRouteCoordinates([
          [pickupPoint.lat, pickupPoint.lng],
          [dropoffPoint.lat, dropoffPoint.lng],
        ]);
      }
    };

    loadRoute();

    return () => {
      isMounted = false;
    };
  }, [dropoffPoint, pickupPoint]);

  useEffect(() => {
    if (!socket || !tripRequest?.id) {
      return undefined;
    }

    socket.emit("ride:join", { rideId: tripRequest.id });
  }, [socket, tripRequest?.id]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setMessage("");

    if (!formData.source.trim() || !formData.destination.trim()) {
      setMessage("Please enter both pickup and drop-off locations.");
      return;
    }

    setSubmitting(true);
    axios
      .post(
        `${baseUrl}/api/rides/create`,
        {
          pickupLocation: formData.source.trim(),
          dropoffLocation: formData.destination.trim(),
          vehicleType: formData.vehicleType,
        },
        { withCredentials: true }
      )
      .then((response) => {
        const ride = normalizeRide(response.data, {
          source: formData.source.trim(),
          destination: formData.destination.trim(),
          vehicleType: formData.vehicleType,
        });
        setTripRequest(ride);
        setMessage("Ride request created successfully. Opening payment...");
        return launchPayment(ride);
      })
      .catch((error) => {
        console.error("Ride creation failed:", error);
        setMessage(
          error?.response?.data?.message ||
            error?.response?.data?.error ||
            "Ride creation failed. Please try again."
        );
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  const activeFare = fareEstimate?.[formData.vehicleType];
  const captainPoint =
    tripRequest?.captainId?.location?.latitude &&
    tripRequest?.captainId?.location?.longitude
      ? {
          lat: tripRequest.captainId.location.latitude,
          lng: tripRequest.captainId.location.longitude,
        }
      : null;
  const mapBounds =
    routeCoordinates.length > 1
      ? latLngBounds([
          ...routeCoordinates,
          ...(captainPoint ? [[captainPoint.lat, captainPoint.lng]] : []),
        ])
      : pickupPoint && dropoffPoint
      ? latLngBounds([
          [pickupPoint.lat, pickupPoint.lng],
          [dropoffPoint.lat, dropoffPoint.lng],
          ...(captainPoint ? [[captainPoint.lat, captainPoint.lng]] : []),
        ])
      : null;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7d6,_#ffffff_45%,_#eef2ff_100%)]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-yellow-600">
              Rapid-go
            </p>
            <h1 className="mt-2 text-3xl font-black text-gray-900 sm:text-4xl">
              Book your next ride
            </h1>
          </div>
          <ProfileIcon />
        </header>

        <main className="mt-8 grid flex-1 gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[2rem] border border-gray-200 bg-white/90 p-5 shadow-2xl shadow-yellow-100/50 backdrop-blur sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-yellow-600">
                  Trip request
                </p>
                <h2 className="mt-2 text-2xl font-bold text-gray-900">
                  {userData?.name ? `Hi, ${userData.name}` : "Plan a pickup"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Search a pickup and drop-off location, check the estimated fare,
                  then submit your ride request.
                </p>
              </div>
              <div className="rounded-2xl bg-yellow-100 px-4 py-3 text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-700">
                  Live
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {fareLoading ? "Calculating fare" : "Map ready"}
                </p>
              </div>
            </div>

            <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="source"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Source
                </label>
                <input
                  id="source"
                  type="text"
                  value={formData.source}
                  onChange={handleChange}
                  onFocus={() => setActiveField("source")}
                  placeholder="Enter pickup location"
                  className="w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-black focus:bg-white focus:ring-2 focus:ring-black/10"
                />
              </div>

              <div>
                <label
                  htmlFor="destination"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Destination
                </label>
                <input
                  id="destination"
                  type="text"
                  value={formData.destination}
                  onChange={handleChange}
                  onFocus={() => setActiveField("destination")}
                  placeholder="Enter drop location"
                  className="w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-black focus:bg-white focus:ring-2 focus:ring-black/10"
                />
              </div>

              <div>
                <label
                  htmlFor="vehicleType"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Vehicle type
                </label>
                <select
                  id="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-black focus:bg-white focus:ring-2 focus:ring-black/10"
                >
                  <option value="car">Car</option>
                  <option value="motorcycle">Motorcycle</option>
                  <option value="van">Van</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting || paymentLoading || currentRideLoading}
                className="w-full rounded-2xl bg-black px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:bg-gray-500"
              >
                {submitting
                  ? "Submitting..."
                  : paymentLoading
                  ? "Opening payment..."
                  : currentRideLoading
                  ? "Loading ride..."
                  : "Book and pay"}
              </button>
            </form>

            {message && (
              <div
                className={`mt-5 rounded-2xl px-4 py-3 text-sm ${
                  message.toLowerCase().includes("success")
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border border-amber-200 bg-amber-50 text-amber-800"
                }`}
              >
                {message}
              </div>
            )}

            {activeField && (
              <div className="mt-5">
                <LocationSearchPanel
                  title={`${activeField === "source" ? "Pickup" : "Drop-off"} suggestions`}
                  suggestions={suggestions}
                  isLoading={suggestionsLoading}
                  onSelect={handleSuggestionSelect}
                  onClose={() => setActiveField(null)}
                />
              </div>
            )}

            <div className="mt-6 rounded-3xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
                    Fare estimate
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {fareLoading ? "Calculating the route..." : "Based on your route and vehicle"}
                  </p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-2 text-right shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                    Selected
                  </p>
                  <p className="mt-1 text-sm font-semibold capitalize text-gray-900">
                    {formData.vehicleType}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {["car", "motorcycle", "van"].map((type) => (
                  <div
                    key={type}
                    className={`rounded-2xl p-4 ${
                      formData.vehicleType === type
                        ? "bg-black text-white"
                        : "bg-white text-gray-900"
                    }`}
                  >
                    <p className="text-sm font-semibold capitalize">{type}</p>
                    <p className="mt-2 text-2xl font-black">
                      {fareEstimate?.[type] ? `₹${fareEstimate[type]}` : "—"}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-gray-500">
                {activeFare
                  ? `Estimated fare for ${formData.vehicleType}: ₹${activeFare}`
                  : "Select both locations to see live fare estimates."}
              </p>
            </div>

            {tripRequest && (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
                  Request submitted
                </p>
                <div className="mt-3 grid gap-3 text-sm text-gray-700 sm:grid-cols-2">
                  <div>
                    <span className="block text-xs uppercase tracking-[0.2em] text-gray-500">
                      Ride ID
                    </span>
                    <p className="mt-1 font-medium">{tripRequest.id || "-"}</p>
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-[0.2em] text-gray-500">
                      Status
                    </span>
                    <p className="mt-1 font-medium capitalize">{tripRequest.status}</p>
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-[0.2em] text-gray-500">
                      Source
                    </span>
                    <p className="mt-1 font-medium">{tripRequest.source || "-"}</p>
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-[0.2em] text-gray-500">
                      Destination
                    </span>
                    <p className="mt-1 font-medium">{tripRequest.destination || "-"}</p>
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-[0.2em] text-gray-500">
                      Vehicle type
                    </span>
                    <p className="mt-1 font-medium capitalize">{tripRequest.vehicleType || "-"}</p>
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-[0.2em] text-gray-500">
                      Fare
                    </span>
                    <p className="mt-1 font-medium">{tripRequest.fare ? `₹${tripRequest.fare}` : "—"}</p>
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-[0.2em] text-gray-500">
                      OTP
                    </span>
                    <p className="mt-1 font-mono text-base font-semibold tracking-[0.15em]">
                      {tripRequest.otp || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-[0.2em] text-gray-500">
                      Payment
                    </span>
                    <p className="mt-1 font-medium capitalize">
                      {tripRequest.paymentStatus || "pending"}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="block text-xs uppercase tracking-[0.2em] text-gray-500">
                      Share OTP with captain
                    </span>
                    <p className="mt-1 text-sm text-gray-700">
                      Give this OTP to your captain to start the trip.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-[2rem] border border-gray-200 bg-[#0f172a] shadow-2xl shadow-slate-300/40">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 text-white">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-yellow-300">
                  Trip view
                </p>
                <h3 className="mt-1 text-xl font-semibold">
                  Route between pickup and drop
                </h3>
              </div>
              <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
                Live booking
              </div>
            </div>

            <div className="relative min-h-[520px]">
              <MapContainer
                center={defaultMapCenter}
                zoom={6}
                scrollWheelZoom
                className="h-[520px] w-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapFitBounds
                  bounds={mapBounds}
                />

                {pickupPoint && (
                  <Marker
                    position={[pickupPoint.lat, pickupPoint.lng]}
                    icon={routePointIcon("#facc15", "Pickup")}
                  >
                    <Popup>Pickup: {pickupPoint.label}</Popup>
                  </Marker>
                )}

                {dropoffPoint && (
                  <Marker
                    position={[dropoffPoint.lat, dropoffPoint.lng]}
                    icon={routePointIcon("#38bdf8", "Drop")}
                  >
                    <Popup>Drop: {dropoffPoint.label}</Popup>
                  </Marker>
                )}

                {routeCoordinates.length > 1 && (
                  <Polyline
                    positions={routeCoordinates}
                    pathOptions={{
                      color: "#facc15",
                      weight: 5,
                      opacity: 0.85,
                    }}
                  />
                )}

                {captainPoint && (
                  <Marker
                    position={[captainPoint.lat, captainPoint.lng]}
                    icon={routePointIcon("#22c55e", "Captain")}
                  >
                    <Popup>Captain live location</Popup>
                  </Marker>
                )}

                {!pickupPoint && !dropoffPoint && (
                  <CircleMarker
                    center={defaultMapCenter}
                    radius={9}
                    pathOptions={{ color: "#facc15", fillColor: "#facc15", fillOpacity: 0.9 }}
                  />
                )}
              </MapContainer>

              <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-3xl border border-white/10 bg-slate-900/85 p-4 text-white shadow-xl backdrop-blur">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-gray-400">
                      Trip status
                    </p>
                      <p className="mt-1 text-lg font-semibold">
                      {tripRequest
                        ? tripRequest.status === "in_progress"
                          ? "Captain is on the way. Live tracking is active."
                          : tripRequest.status === "accepted"
                          ? "Captain accepted the ride. Tracking live location."
                          : "Ride request created and waiting for a captain."
                          : "Enter details to preview the route."}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-3 text-right">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                      Vehicle
                    </p>
                    <p className="mt-1 text-sm font-semibold capitalize">
                      {formData.vehicleType}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-xs text-gray-400">
                  Socket status: {socketReady ? "connected" : "connecting..."}
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white/5 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                      Source
                    </p>
                    <p className="mt-1 text-sm font-medium text-white">
                      {formData.source || "Add pickup location"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                      Destination
                    </p>
                    <p className="mt-1 text-sm font-medium text-white">
                      {formData.destination || "Add drop location"}
                    </p>
                  </div>
                </div>

                {mapError && (
                  <p className="mt-3 text-xs text-amber-300">{mapError}</p>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Home;
