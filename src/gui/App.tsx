// Main entry point for the browser version of TikZiT

import { render } from "preact";
import ZXEditor, { TikzEditorContent } from "./ZXEditor";
import ConfigContext from "./ConfigContext";
import Config from "../lib/Config";
import "./defaultvars.css";
import "./gui.css";

interface AppProps {
  initialContent: TikzEditorContent;
}

const App = ({ initialContent }: AppProps) => {
  return (
    <ConfigContext value={new Config()}>
      <ZXEditor initialContent={initialContent} />
    </ConfigContext>
  );
};

export function renderApp(container: HTMLElement, initialContent: TikzEditorContent) {
  try {
    render(<App initialContent={initialContent} />, container);
  } catch (error) {
    console.error("Error rendering App:", error);
    container.innerHTML = `<div style="padding: 20px; color: red;">${error}</div>`;
  }
}

export default App;
