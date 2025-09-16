
import './App.css'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Pages
import Home from "./Pages/Home";
import Organizer from './Pages/Organizer';


function App() {

  return (
    
    
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/organizer" element={<Organizer/>} />
          {/* <Route path="/claimer" element={<Claimer />} /> */}
        </Routes>
      </Router>
 
  )
}

export default App
