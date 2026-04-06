import React from "react";
import ReactDOM from "react-dom/client";

import HooksLensPage from "../app/hookslens/page";

// Import event simulator to auto-start in development
import "./simulate-events";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HooksLensPage />
  </React.StrictMode>,
);
