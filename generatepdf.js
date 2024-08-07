import fs from 'fs';
import { PDFDocument, rgb } from 'pdf-lib';
import { createCanvas, loadImage } from 'canvas';
import fetch from 'node-fetch';

// Function to fetch and embed image
async function fetchAndEmbedImage(pdfDoc, imageBytes, imageSize, printableAreaSize, debugMode) {
  try {
    if (imageSize <= 0) {
      throw new Error('Invalid image size parameter (must be an integer bigger than 0');
    }
    const image = await loadImage(Buffer.from(imageBytes));
    
    // Ensure the image is a square
    if (image.width !== image.height) {
      throw new Error('Image must be a square.');
    }

    console.log(imageSize + "<== size of the image");
    const canvas = createCanvas(imageSize, imageSize);
    const ctx = canvas.getContext('2d');

    // Draw the circular image (clipped to a circle)
    ctx.beginPath();
    ctx.arc(imageSize / 2, imageSize / 2, imageSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(image, 0, 0, imageSize, imageSize);

    // Add a 2px border around the circle
    ctx.beginPath();
    ctx.arc(imageSize / 2, imageSize / 2, (imageSize / 2) - 2, 0, Math.PI * 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'black';
    ctx.stroke();

    // Add a 2px border around the circle
    if (debugMode == true) {
      ctx.beginPath();
      ctx.arc(imageSize / 2, imageSize / 2, (printableAreaSize / 2) - 0.5, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'green';
      ctx.stroke();
    }


    const circularImageBuffer = canvas.toBuffer();
    const circularImage = await pdfDoc.embedPng(circularImageBuffer);

    return circularImage;
  } catch (error) {
    console.error(`Error embedding image: ${error.message}`);
    throw error;
  }
}

// Function to generate PDF
export async function generatePDF(config) {
  try {
    const dpi = config.resolution;
    const pdfDoc = await PDFDocument.create();
    const pageWidth = config.pageSize.width * dpi; // Page width in points (dpi)
    const pageHeight = config.pageSize.height * dpi; // Page height in points (dpi)
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    const imageSize = config.imageSize * dpi; // Image width and height in points (dpi)
    const padding = config.paddingInches * dpi; // Padding in points (dpi)
    const printableAreaSize = config.printableAreaSize * dpi;
    const totalImageSize = imageSize + padding;

    const cols = Math.floor(pageWidth / (imageSize + padding));
    const rows = Math.floor(pageHeight / (imageSize + padding));

    const marginX = (pageWidth - (cols * totalImageSize) + padding) / 2; // Center grid horizontally
    const marginY = (pageHeight - (rows * totalImageSize) + padding) / 2; // Center grid vertically

    const image = await fetchAndEmbedImage(pdfDoc, config.image, imageSize, printableAreaSize, config.debugMode);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = marginX + col * totalImageSize;
        const y = marginY + row * totalImageSize;
        page.drawImage(image, {
          x: x,
          y: page.getHeight() - y - imageSize,
          width: imageSize,
          height: imageSize,
        });

      }
    }

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(config.outputFileName, pdfBytes);
    console.log(`PDF saved as ${config.outputFileName}`);
  } catch (error) {
    console.error(`Error generating PDF: ${error.message}`);
  }
}
