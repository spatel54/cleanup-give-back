declare module 'staticmaps' {
  type StaticMapsOptions = {
    width: number;
    height: number;
    paddingX?: number;
    paddingY?: number;
    tileUrl?: string;
    tileSubdomains?: string[];
  };

  type LineOptions = {
    coords: [number, number][];
    color?: string;
    width?: number;
  };

  export default class StaticMaps {
    constructor(options: StaticMapsOptions);
    addLine(options: LineOptions): void;
    render(center?: [number, number] | number[], zoom?: number): Promise<void>;
    image: {
      buffer(mime?: string): Promise<Buffer>;
    };
  }
}
