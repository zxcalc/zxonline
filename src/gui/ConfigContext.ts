import { createContext } from "preact";
import Config from "../lib/Config";

const ConfigContext = createContext<Config>(new Config());
export default ConfigContext;
