import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, HashRouter, Link, Outlet, Route, Routes } from "react-router-dom";
import App from "./App";
import Embedding from "./Embedding";
import Detection from "./Detection";
import Hands from "./Hands";
import DetectionVideo from "./DetectionVideo";
import Gen from "./Gen";

// Render your React component instead
const root = createRoot(document.getElementById("root") as Element);
root.render(
  <HashRouter>
    <h1>Example</h1>
    <Routes>
        <Route path="/" element={<Layout />}>
          {/* <Route index element={<Gen />} /> */}
          <Route index element={<Hands />} />
          <Route path="detectvideo" element={<DetectionVideo />} />
          <Route path="detection" element={<Detection />} />
          <Route path="seg" element={<App />} />
          <Route path="embedding" element={<Embedding />} />
          <Route path="*" element={<App />} />
        </Route>
    </Routes>
  </HashRouter>
);

function Layout() {
  return (
    <div>
      {/* A "layout route" is a good place to put markup you want to
          share across all the pages on your site, like navigation. */}
      <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/hands">Detect Gestures</Link>
          </li>
          <li>
            <Link to="/detectvideo">Detect Live</Link>
          </li>
          <li>
            <Link to="/detection">Detection</Link>
          </li>
          <li>
            <Link to="/seg">Segmenter</Link>
          </li>
          <li>
            <Link to="/embedding">TextEmbedding</Link>
          </li>
          <li>
            <Link to="/nothing-here">Nothing Here</Link>
          </li>
        </ul>
      </nav>

      <hr />
      <Outlet />
    </div>
  );
}


