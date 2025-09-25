import './App.css';
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./routes/Home";
import TestSimulator from "./routes/TestSimulator";
import AnkiMethod from "./routes/AnkiMethod";


function App() {
  return (
    <Router basename="/dgt-test-trainer">
      <nav style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        <Link to="/">Inicio</Link>
        <Link to="/test">Simulador Test</Link>
        <Link to="/anki">Método Anki</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/test" element={<TestSimulator />} />
        <Route path="/anki" element={<AnkiMethod />} />
      </Routes>
    </Router>
  );
}

export default App;
