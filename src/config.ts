export interface ImageOptions {
  image: ArrayBuffer,
  scale: number,
  backgroundColor: string,
  offset: {
    x: number,
    y: number
  }
  quantity: number
}


export interface Config {
    images: Array<ImageOptions>;
    pageSize: { 
      width: number; 
      height: number 
    };
    padding: number;
    resolution: number;
    imageSize: number;
    pinSize: number;
    outputFileName: string;
  }