import { Routes, Route } from "react-router-dom";
import "./index.css"; 
import Inv from "./components/invitation";
import Portal from "./components/Wedding";
import Gate from "./components/gardenGate";
import Port from "./components/weddingPortal";


function App() {
  return (
    <Routes>
      <Route path="/" element={<Inv />} />
      <Route path="/Wedding" element={<Portal />} />
      <Route path="/gardenGate" element={<Gate />} />
      <Route path="/weddingPortal" element={<Port />} />
    </Routes>
  );
}

export default App;