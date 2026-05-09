import { render } from "preact";
import { App } from "./app";
import "./app.css";

const root = document.getElementById("root");
if (root) render(<App />, root);
