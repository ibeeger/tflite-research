import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, HashRouter, Link, Outlet, Route, Routes } from "react-router-dom";
import Cartoon from "./Cartoon";

// Render your React component instead
const root = createRoot(document.getElementById("root") as Element);
root.render(
  <Cartoon />
);

