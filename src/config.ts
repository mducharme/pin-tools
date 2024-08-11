export interface Config {
    image: ArrayBuffer;
    imageOptions: {
      scale: number,
      backgroundColor: string,
      panX: number,
      panY: number,
      quantity: number
    };
    pageSize: { width: number; height: number };
    padding: number;
    resolution: number;
    imageSize: number;
    pinSize: number;
    outputFileName: string;
  }