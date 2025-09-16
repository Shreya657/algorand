import './App.css'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from './contexts/ThemeContext.jsx';

// Pages
import Home from "./Pages/Home";
import Organizer from './Pages/Organizer';
import Claim from './Pages/Claim';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/organizer" element={<Organizer/>} />
          <Route path="/claim" element={<Claim />} />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App
