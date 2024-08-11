import fs from 'fs';
import { PDFDocument, PDFImage, setLineWidth } from 'pdf-lib';
import { createCanvas, loadImage } from 'canvas';
import { Config } from './config';

import sharp from 'sharp'; // Add sharp for image conversion

async function convertToPng(imageBytes: ArrayBuffer): Promise<Buffer> {
  return sharp(Buffer.from(imageBytes)).png().toBuffer();
}

async function fetchAndEmbedImage(
  pdfDoc: PDFDocument,
  imageBytes: ArrayBuffer,
  imageSize: number,
  scale: number,
  backgroundColor: string,
  panX: number,
  panY: number
): Promise<PDFImage> {
  if (imageSize <= 0) {
    throw new Error('Invalid image size parameter (must be an integer bigger than 0)');
  }

  // Convert to PNG if necessary (for webp images, for example)
  const imageBuffer= await convertToPng(imageBytes);

  const image = await loadImage(imageBuffer);
  const ratio = imageSize/500; // 500 is the canvas size that was used for the pan and scale calculations
  const realPanX = panX * ratio;
  const realPanY = panY * ratio;
  const realScale = scale * ratio;

  const canvas = createCanvas(imageSize, imageSize);
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the background color
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, canvas.height / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const imgWidth = image.width * realScale;
  const imgHeight = image.height * realScale;
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, canvas.height / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(image, canvas.width/2-imgWidth/2+realPanX, canvas.height/2-imgHeight/2+realPanY, imgWidth, imgHeight);
         

  // Always add a black outline for an easier cutting process
  const outlineLineWidth = 4;
  ctx.beginPath();
  ctx.arc(imageSize / 2, imageSize / 2, (imageSize / 2) - (outlineLineWidth/2), 0, Math.PI * 2);
  ctx.lineWidth = outlineLineWidth;
  ctx.strokeStyle = 'black';
  ctx.stroke();

  const circularImageBuffer = canvas.toBuffer();
  return pdfDoc.embedPng(circularImageBuffer);
  
}

export async function generatePDF(config: Config): Promise<void> {
  const {
    resolution = 600,
    pageSize = { width: 8.5, height: 11 },
    imageSize = 1.1313,
    padding = 0.125,
    pinSize = 0.875,
    outputFileName = 'output.pdf',
  } = config;

  console.log(config);

  if (!imageSize || !config.image) {
    throw new Error('Image size and image data must be provided');
  }

  const dpi = resolution;
  const pdfDoc = await PDFDocument.create();
  const pageWidth = pageSize.width * dpi;
  const pageHeight = pageSize.height * dpi;
  
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  const imageSizeInPoints = imageSize * dpi;
  const paddingInPoints = padding * dpi;
  const totalImageSize = imageSizeInPoints + paddingInPoints;

  const cols = Math.floor(pageWidth / totalImageSize);
  const rows = Math.floor(pageHeight / totalImageSize);

  const marginX = (pageWidth - (cols * totalImageSize) + paddingInPoints) / 2;
  const marginY = (pageHeight - (rows * totalImageSize) + paddingInPoints) / 2;

  try {
    const image = await fetchAndEmbedImage(pdfDoc, config.image, imageSizeInPoints, config.imageOptions.scale, config.imageOptions.backgroundColor, config.imageOptions.panX, config.imageOptions.panY);  

    let remainingPins = config.imageOptions.quantity;

    while (remainingPins > 0) {
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = marginX + col * totalImageSize;
          const y = marginY + row * totalImageSize;
          page.drawImage(image, {
            x: x,
            y: page.getHeight() - y - imageSizeInPoints,
            width: imageSizeInPoints,
            height: imageSizeInPoints,
          });
          remainingPins--;
          if (remainingPins <= 0) break;
        }
        if (remainingPins <= 0) break;
      }
    }

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputFileName, pdfBytes);
    console.log(`PDF saved as ${outputFileName}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error generating PDF: ${error.message}`);
    }
  }
}
