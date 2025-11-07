// App.js
import React from "react";
import OffersList from "./components/OffersList";

// Root component
function App() {
  return (
    <div>
      <h1>Welcome to The Hive Frontend</h1>
      <p>This React app will soon talk to your Django backend.</p>

      <OffersList />
    </div>
  );
}

export default App;
