import fs from 'fs';
import { PDFDocument, PDFImage } from 'pdf-lib';
import { createCanvas, loadImage } from 'canvas';
import { Config } from './config';

async function fetchAndEmbedImage(
  pdfDoc: PDFDocument,
  imageBytes: ArrayBuffer,
  imageSize: number
): Promise<PDFImage> {
  if (imageSize <= 0) {
    throw new Error('Invalid image size parameter (must be an integer bigger than 0)');
  }
  console.log(imageSize);
  console.log(imageBytes);
  const image = await loadImage(Buffer.from(imageBytes));

  if (image.width !== image.height) {
    throw new Error('Image must be a square.');
  }

  const canvas = createCanvas(imageSize, imageSize);
  const ctx = canvas.getContext('2d');

  ctx.beginPath();
  ctx.arc(imageSize / 2, imageSize / 2, imageSize / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(image, 0, 0, imageSize, imageSize);

  // Always add a black outline for an easier cutting process
  ctx.beginPath();
  ctx.arc(imageSize / 2, imageSize / 2, (imageSize / 2) - 2, 0, Math.PI * 2);
  ctx.lineWidth = 4;
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
    paddingInches = 0.125,
    printableAreaSize = 0.875,
    outputFileName = 'output.pdf',
  } = config;

  if (!imageSize || !config.image) {
    throw new Error('Image size and image data must be provided');
  }

  const dpi = resolution;
  const pdfDoc = await PDFDocument.create();
  const pageWidth = pageSize.width * dpi;
  const pageHeight = pageSize.height * dpi;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  const imageSizeInPoints = imageSize * dpi;
  const padding = paddingInches * dpi;
  const totalImageSize = imageSizeInPoints + padding;

  const cols = Math.floor(pageWidth / totalImageSize);
  const rows = Math.floor(pageHeight / totalImageSize);

  const marginX = (pageWidth - (cols * totalImageSize) + padding) / 2;
  const marginY = (pageHeight - (rows * totalImageSize) + padding) / 2;

  try {
    const image = await fetchAndEmbedImage(pdfDoc, config.image, imageSizeInPoints);

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
