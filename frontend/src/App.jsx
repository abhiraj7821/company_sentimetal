import React from "react";
import LandingPage from "./landing/LandingPage";
import { Link, Route, Routes } from "react-router";
import StartNewResearch from "./Agent/StartNewResearch";
import SwarmInAction from "./Agent/SwarmInAction";
import ResearchComplete from "./Agent/ResearchComplete";
import ResearchFlow from "./Agent/Researchflow";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/agent" element={<ResearchFlow />} />
    </Routes>
  );
}

export default App;
