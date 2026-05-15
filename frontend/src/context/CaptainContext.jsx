import { useState } from "react";
import CaptainDataContext from "./CaptainDataContext";

const CaptainContext = ({ children }) => {
  const [captainData, setCaptainData] = useState({
    name: "",
    email: "",
  });
  const [captainProfileData, setCaptainProfileData] = useState(null);

  const clearCaptainSession = () => {
    setCaptainData({ name: "", email: "" });
    setCaptainProfileData(null);
  };

  return (
    <CaptainDataContext.Provider
      value={{
        captainData,
        setCaptainData,
        captainProfileData,
        setCaptainProfileData,
        clearCaptainSession,
      }}
    >
      {children}
    </CaptainDataContext.Provider>
  );
};

export default CaptainContext;
