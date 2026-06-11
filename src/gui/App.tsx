// Main entry point for ZX Online

import { render } from "preact";
import ZXEditor from "./ZXEditor";
import ConfigContext from "./ConfigContext";
import Config from "../lib/Config";
import "./defaultvars.css";
import "./gui.css";

const App = () => {
  const params = new URLSearchParams(window.location.search);
  const embedMode = params.get("embed") === "1";
  const lessonId = params.get("lesson") ?? undefined;

  return (
    <ConfigContext value={new Config()}>
      <ZXEditor embedMode={embedMode} lessonId={lessonId} />
    </ConfigContext>
  );
};

export function renderApp(container: HTMLElement) {
  try {
    render(<App />, container);
  } catch (error) {
    console.error("Error rendering App:", error);
    container.innerHTML = `<div style="padding: 20px; color: red;">${error}</div>`;
  }
}

export default App;
