import { Route, Routes } from "react-router-dom";
import MenuTop from "./components/Menus/MenuTop";
import Home from "./pages/home";
import Attendance from "./pages/attendance";
import Footer from "./components/Footer/Footer";

function App() {
  return (
    <MenuTop>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/pages/attendance" element={<Attendance />} />
        <Route path="/pages/attendance/*" element={<Attendance />} />
        <Route path="*" element={<Home />} />
      </Routes>
      <Footer />
    </MenuTop>
  );
}

export default App;
