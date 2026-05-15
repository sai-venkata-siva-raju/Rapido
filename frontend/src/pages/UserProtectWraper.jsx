import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { Navigate, useLocation } from "react-router-dom";
import UserDataContext from "../context/UserDataContext";

const UserProtectWraper = ({ children, allowedRoles = ["user"] }) => {
  const { authRole, setAuthRole, setProfileData } = useContext(UserDataContext);
  const [status, setStatus] = useState("checking");
  const location = useLocation();
  const allowedRolesKey = allowedRoles.join("|");

  useEffect(() => {
    let isMounted = true;

    const verifyToken = async () => {
      const endpoints =
        allowedRoles.includes("captain") && !allowedRoles.includes("user")
          ? ["/api/captains/profile", "/api/users/profile"]
          : ["/api/users/profile", "/api/captains/profile"];

      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_BASE_URL}${endpoint}`,
            { withCredentials: true }
          );

          if (!isMounted) return;

          setProfileData(endpoint.includes("captains") ? response.data : response.data.user);
          setAuthRole(endpoint.includes("captains") ? "captain" : "user");
          setStatus("authenticated");
          return;
        } catch (error) {
          // Try the next endpoint. A 401 here just means this token doesn't match that role.
        }
      }

      if (isMounted) {
        setStatus("unauthenticated");
      }
    };

    verifyToken();

    return () => {
      isMounted = false;
    };
  }, [allowedRolesKey, setAuthRole, setProfileData]);

  if (status === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-sm text-gray-500">
        Verifying session...
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!allowedRoles.includes(authRole)) {
    return (
      <Navigate
        to={authRole === "captain" ? "/captain-home" : "/home"}
        replace
      />
    );
  }

  return children;
};

export default UserProtectWraper;
