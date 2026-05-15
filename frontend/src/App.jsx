
import { Route, Routes } from "react-router-dom";
import Start from "./pages/Start";
import UserLogin from "./pages/UserLogin";
import UserSignup from "./pages/UserSignup";
import CaptainLogin from "./pages/CaptainLogin";
import CaptainSignup from "./pages/CaptainSignup";
import Home from "./pages/Home";
import UserProtectWraper from "./pages/UserProtectWraper";
import Profile from "./pages/Profile";
import CaptainHome from "./pages/CaptainHome";

const App = () => {
  return (
    <div>
      <Routes>
        {/* Define your routes here */}
        <Route path="/" element={<Start />} />
        <Route
          path="/home"
          element={
            <UserProtectWraper allowedRoles={["user"]}>
              <Home />
            </UserProtectWraper>
          }
        />
        <Route
          path="/captain-home"
          element={
            <UserProtectWraper allowedRoles={["captain"]}>
              <CaptainHome />
            </UserProtectWraper>
          }
        />
        <Route
          path="/profile"
          element={
            <UserProtectWraper allowedRoles={["user", "captain"]}>
              <Profile />
            </UserProtectWraper>
          }
        />
        <Route path="/login" element={<UserLogin />} />
        <Route path="/signup" element={<UserSignup />} />
        <Route path="/captain-login" element={<CaptainLogin />} />
        <Route path="/captain-signup" element={<CaptainSignup />} />
      </Routes>
    </div>
  );
};

export default App;
