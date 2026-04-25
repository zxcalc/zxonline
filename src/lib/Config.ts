import { StyleData } from "./Data";
import Styles from "./Styles";

export default class Config {
    private _styles: Styles;
    private _config: { [key: string]: string };

    constructor() {
        this._config = {
            "axisColor": "#0000ff",
            "majorGridColor": "#9999ff",
            "minorGridColor": "#ddddff",
            "enableAnimations": "true",
        }

        this._styles = new Styles().addStyle(new StyleData());
        this._styles = this._styles.addStyle(new StyleData()
            .setName("z")
            .setProperty("shape", "circle")
            .setProperty("draw", "black")
            .setProperty("fill", "rgb,255: red,216; green,248; blue,216")
            .setProperty("minimum size", "4pt")
            .setProperty("inner sep", "0pt"));

        this._styles = this._styles.addStyle(new StyleData()
            .setName("x")
            .setProperty("shape", "circle")
            .setProperty("draw", "black")
            .setProperty("fill", "rgb,255: red,221; green,165; blue,165")
            .setProperty("minimum size", "4pt")
            .setProperty("inner sep", "0pt"));
    }

    public getConfig(key: string): string {
        if (key in this._config) {
            return this._config[key];
        } else {
            return "";
        }
    }

    public getConfigBool(key: string): boolean {
        return this.getConfig(key) === "true";
    }

    public styles(): Styles {
        return this._styles;
    }
}