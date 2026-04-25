const config: { [key: string]: string } = {
    "axisColor": "#0000ff",
    "majorGridColor": "#9999ff",
    "minorGridColor": "#ddddff",
    "enableAnimations": "true",
}

export default class Config {
    public getConfig(key: string): string {
        if (key in config) {
            return config[key];
        } else {
            return "";
        }
    }

    public getConfigBool(key: string): boolean {
        return this.getConfig(key) === "true";
    }
}