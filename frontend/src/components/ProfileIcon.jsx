import { Link } from "react-router-dom";

const ProfileIcon = () => {
  return (
    <Link
      to="/profile"
      className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
      aria-label="Open profile page"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6 text-gray-700"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20 21a8 8 0 10-16 0"
        />
        <circle cx="12" cy="8" r="3.5" strokeLinecap="round" />
      </svg>
    </Link>
  );
};

export default ProfileIcon;
