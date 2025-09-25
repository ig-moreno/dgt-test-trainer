import './App.css';
import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import Home from "./lib/routes/Home";
import TestSimulator from "./lib/routes/TestSimulator";
import AnkiMethod from "./lib/routes/AnkiMethod";
import UserStatistics from "./lib/routes/UserStatistics";
import UserSettings from './lib/routes/UserSettings';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCar, faUser } from '@fortawesome/free-solid-svg-icons'


function App() {
  return (
<div className="min-h-screen bg-gray-100 text-gray-900 pt-0 xl:pt-32">
  <div className="max-w-7xl mx-auto px-4 py-4 bg-gray-50 
                  rounded-none xl:rounded-xl  
                  min-h-[100vh] xl:min-h-[min(80vh,992px)]">
        <Router basename="/dgt-test-trainer">
            <nav style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
              <NavLink to="/" className={({ isActive }) => isActive ? "nav-active" : ""}>Inicio</NavLink>
              <NavLink to="/test" className={({ isActive }) => isActive ? "nav-active" : ""}>Simulador Test</NavLink>
              <NavLink to="/anki" className={({ isActive }) => isActive ? "nav-active" : ""}>Método Anki</NavLink>
              <NavLink to="/user-statistics" className={({ isActive }) => isActive ? "nav-active" : ""}>Estadísticas del usuario</NavLink>
              <NavLink to="/user-settings" className={({ isActive }) => isActive ? "nav-active" : ""} style={{marginLeft: "auto"}}>      
                <FontAwesomeIcon icon={faUser} className="ml-4 text-green-500 text-3xl" />
              </NavLink>
            </nav>


          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/test" element={<TestSimulator />} />
            <Route path="/anki" element={<AnkiMethod />} />
            <Route path="/user-statistics" element={<UserStatistics />} />
            <Route path="/user-settings" element={<UserSettings />} />


          </Routes>
        </Router>
        </div>
    </div>
  );
}

export default App;
