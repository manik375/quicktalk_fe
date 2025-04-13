// src/main.jsx
// We're using our own WebRTC implementation now, so we don't need the polyfills
// Just import the app dependencies directly

import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux"; // Import Provider
import { store } from "./app/store"; // Import your store
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
