import React from "react";
import "./App.css";
import { AttributesSection } from "./components/AttributesSection";
import { TagsSection } from "./components/TagsSection";
import { StatusEffectsSection } from "./components/StatusEffectSection";
import { WeaponSection } from "./components/WeaponSection";
import { CyberModsSection } from "./components/CyberModsSection";
import { InfoAndResultSection } from "./components/InfoandResultSection";

function App() {
  return (
    <div className="app-root">
      <div className="app-layout">
        {/* LEFT: main controls */}
        <div className="main-column">
          <div className="app-row">
            <AttributesSection />
            <TagsSection />
            <StatusEffectsSection />
            <WeaponSection />
          </div>

          <CyberModsSection />
        </div>

        {/* RIGHT: info + dice + result */}
        <div className="side-column">
          <InfoAndResultSection />
        </div>
      </div>
    </div>
  );
}

export default App;
