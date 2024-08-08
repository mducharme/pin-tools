export interface Config {
    image: ArrayBuffer;
    paddingInches: number;
    outputFileName: string;
    pageSize: { width: number; height: number };
    resolution: number;
    imageSize: number;
    printableAreaSize: number;
  }