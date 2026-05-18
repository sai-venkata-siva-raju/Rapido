import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const PasswordReset = () => {
  const { role: routeRole } = useParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [devOtp, setDevOtp] = useState("");

  const role = routeRole === "captain" ? "captain" : "user";
  const loginPath = role === "captain" ? "/captain-login" : "/login";
  const apiBase = useMemo(() => {
    const segment = role === "captain" ? "captains" : "users";
    return `${import.meta.env.VITE_BASE_URL}/api/${segment}`;
  }, [role]);

  const pageCopy =
    role === "captain"
      ? {
          title: "Captain password reset",
          subtitle: "Verify your email with a one-time code and set a new password.",
          accent: "from-yellow-400 to-orange-500",
          cardAccent: "border-yellow-100",
        }
      : {
          title: "User password reset",
          subtitle: "Use the OTP sent to your email to recover your account.",
          accent: "from-gray-900 to-gray-700",
          cardAccent: "border-gray-200",
        };

  const handleSendOtp = async (event) => {
    event.preventDefault();
    if (!email.trim()) {
      setStatusMessage("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);
      setStatusMessage("Sending OTP...");
      setDevOtp("");

      const response = await axios.post(
        `${apiBase}/forgot-password`,
        { email: email.trim() },
        { withCredentials: true }
      );

      setOtpSent(true);
      setStatusMessage(response.data?.message || "OTP sent to your email.");
      setDevOtp(response.data?.devOtp || "");
    } catch (error) {
      setStatusMessage(error?.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();

    if (!otp.trim()) {
      setStatusMessage("Enter the OTP you received.");
      return;
    }

    if (newPassword.length < 6) {
      setStatusMessage("Password should be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusMessage("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setStatusMessage("Updating password...");

      const response = await axios.post(
        `${apiBase}/reset-password`,
        {
          email: email.trim(),
          otp: otp.trim(),
          newPassword,
        },
        { withCredentials: true }
      );

      setStatusMessage(response.data?.message || "Password updated successfully.");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setOtpSent(false);

      setTimeout(() => {
        navigate(loginPath);
      }, 1200);
    } catch (error) {
      setStatusMessage(error?.response?.data?.message || "Could not reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,199,0,0.18),_transparent_40%),linear-gradient(180deg,_#fffaf0_0%,_#ffffff_38%,_#f7f7f7_100%)] px-4 py-10 flex items-center justify-center">
      <div className={`w-full max-w-md rounded-3xl border ${pageCopy.cardAccent} bg-white/95 shadow-2xl backdrop-blur p-6 sm:p-8`}>
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gray-400">
            Password Reset
          </p>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">{pageCopy.title}</h1>
          <p className="mt-2 text-sm text-gray-500">{pageCopy.subtitle}</p>
          <div className={`mx-auto mt-4 h-1.5 w-24 rounded-full bg-gradient-to-r ${pageCopy.accent}`} />
        </div>

        <form className="space-y-4" onSubmit={otpSent ? handleResetPassword : handleSendOtp}>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter your account email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
            />
          </div>

          {otpSent ? (
            <>
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-900">OTP verification</p>
                <p className="mt-1 text-sm text-gray-500">
                  Enter the 6-digit code sent to <span className="font-medium text-gray-900">{email}</span>.
                </p>
              </div>

              <div>
                <label htmlFor="otp" className="mb-1 block text-sm font-medium text-gray-700">
                  OTP
                </label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter 6 digit OTP"
                  required
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="mb-1 block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  placeholder="Create a new password"
                  required
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter your new password"
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
                />
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-900">Step 1: request your OTP</p>
              <p className="mt-1 text-sm text-gray-500">
                We’ll send a one-time code to your email so you can verify ownership of the account.
              </p>
            </div>
          )}

          {statusMessage ? (
            <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
              {statusMessage}
            </div>
          ) : null}

          {devOtp ? (
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-900">
              Dev OTP: <span className="font-semibold">{devOtp}</span>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-xl bg-gradient-to-r ${pageCopy.accent} py-3 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70`}
          >
            {loading ? "Please wait..." : otpSent ? "Reset Password" : "Send OTP"}
          </button>

          {otpSent ? (
            <button
              type="button"
              onClick={() => {
                setOtpSent(false);
                setOtp("");
                setNewPassword("");
                setConfirmPassword("");
                setStatusMessage("");
                setDevOtp("");
              }}
              className="w-full rounded-xl border border-gray-300 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Change email
            </button>
          ) : null}

          <p className="text-center text-sm text-gray-500">
            Back to{" "}
            <Link to={loginPath} className="font-medium text-black hover:underline">
              login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default PasswordReset;
