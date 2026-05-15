import UserDataContext from "./UserDataContext";
import { useEffect, useState } from "react";

const UserContext = ({ children }) => {
  const [userData, setUserData] = useState({
    name: "",
    email: "",
  });
  const [authRole, setAuthRole] = useState(() => localStorage.getItem("authRole") || "");
  const [profileData, setProfileData] = useState(null);

  const clearSession = () => {
    setUserData({ name: "", email: "" });
    setProfileData(null);
    setAuthRole("");
  };

  useEffect(() => {
    if (authRole) {
      localStorage.setItem("authRole", authRole);
    } else {
      localStorage.removeItem("authRole");
    }
  }, [authRole]);

  return (
    <UserDataContext.Provider
      value={{
        userData,
        setUserData,
        authRole,
        setAuthRole,
        profileData,
        setProfileData,
        clearSession,
      }}
    >
      {children}
    </UserDataContext.Provider>
  );
};

export default UserContext;
