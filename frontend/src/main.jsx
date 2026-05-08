import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { RootProvider } from "./context/RootProvider";

ReactDOM.createRoot(document.getElementById("root")).render(
  <RootProvider>
    <App />
  </RootProvider>
);