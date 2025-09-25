import './App.css';
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./lib/routes/Home";
import TestSimulator from "./lib/routes/TestSimulator";
import AnkiMethod from "./lib/routes/AnkiMethod";
import DgtRepository from './lib/db/DgtRepository';
import UserStatistics from "./lib/routes/UserStatistics";
import UserSettings from './lib/routes/UserSettings';

const repo = new DgtRepository();


function App() {
  return (
     <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <Router basename="/dgt-test-trainer">
            <nav style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
              <Link to="/">Inicio</Link>
              <Link to="/test">Simulador Test</Link>
              <Link to="/anki">Método Anki</Link>
              <Link to="/user-statistics">Estadísticas del usuario</Link>
              <Link to="/user-settings" style={{marginLeft: "auto"}}>X</Link>
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
