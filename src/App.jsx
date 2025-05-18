import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Catalogue from "./components/Catalogue";
import FishDetails from "./components/FishDetails";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Species from "./components/Species";
import About from "./components/About";
import Home from "./components/Home";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import "./styles/App.css";

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="app-container">
        <Navbar />
        <main className="content-container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/catalogue" element={<Catalogue />} />
            <Route path="/species" element={<Species />} />
            <Route path="/about" element={<About />} />
            <Route path="/fish/:id" element={<FishDetails />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
