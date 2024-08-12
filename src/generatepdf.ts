import fs from 'fs';
import { PDFDocument, PDFImage } from 'pdf-lib';
import { createCanvas, loadImage } from 'canvas';
import { Config, ImageOptions } from './config';

import sharp from 'sharp'; // Add sharp for image conversion

async function convertToPng(imageBytes: ArrayBuffer): Promise<Buffer> {
  return sharp(Buffer.from(imageBytes)).png().toBuffer();
}

async function fetchAndEmbedImage(
  pdfDoc: PDFDocument,
  imageData: ImageOptions,
  imageSize: number
): Promise<PDFImage> {
  if (imageSize <= 0) {
    throw new Error('Invalid image size parameter (must be an integer bigger than 0)');
  }

  console.log(imageData);
  // Always convert to PNG if necessary (for webp images, for example)
  const imageBuffer= await convertToPng(imageData.image);
  console.debug(imageBuffer);
  const image = await loadImage(imageBuffer);


  const ratio = imageSize/500; // 500 is the canvas size that was used for the offset and scale calculations
  const offsetX = imageData.offset.x * ratio;
  const offsetY = imageData.offset.y * ratio;
  const scale = imageData.scale * ratio;

  const canvas = createCanvas(imageSize, imageSize);
  const ctx = canvas.getContext('2d');

  // Clear the canvas and draw the background color
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, canvas.height / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = imageData.backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const imgWidth = image.width * scale;
  const imgHeight = image.height * scale;
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, canvas.height / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(image, 
    canvas.width/2-imgWidth/2+offsetX, 
    canvas.height/2-imgHeight/2+offsetY, 
    imgWidth, 
    imgHeight
  );
         
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

  const dpi = config.resolution;
  
  const pageWidth = config.pageSize.width * dpi;
  const pageHeight = config.pageSize.height * dpi;

  const imageSizeInPoints = config.imageSize * dpi;
  const paddingInPoints = config.padding * dpi;
  const totalImageSize = imageSizeInPoints + paddingInPoints;

  const cols = Math.floor(pageWidth / totalImageSize);
  const rows = Math.floor(pageHeight / totalImageSize);

  const marginX = (pageWidth - (cols * totalImageSize) + paddingInPoints) / 2;
  const marginY = (pageHeight - (rows * totalImageSize) + paddingInPoints) / 2;

  try {
    const pdfDoc = await PDFDocument.create();

    let page = createPage(pdfDoc);

    const pageQuantity = cols * rows;
    const totalQuantity = config.images.reduce((acc, image) => acc + image.quantity, 0);
    
    let image = await fetchAndEmbedImage(pdfDoc, config.images[0], imageSizeInPoints);  

    let remainingPins = Math.min(totalQuantity, pageQuantity); // @todo support more pages instead of limiting the pins quantity
    let currentRemainingPins = config.images[0].quantity;
    let numInPage = 0;

    let currentIndex = 0;

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
          currentRemainingPins--;
          numInPage++;

          if (currentRemainingPins <= 0) {
            currentIndex++;
            if (currentIndex >= config.images.length) {
              break;
            }
            currentRemainingPins = config.images[currentIndex].quantity;
            image = await fetchAndEmbedImage(pdfDoc, config.images[currentIndex], imageSizeInPoints);
          }

          if (numInPage >= pageQuantity) {
            numInPage = 0;
            page = createPage(pdfDoc);
          }
          if (remainingPins <= 0) {
            break;
          }
        }
        if (remainingPins <= 0) {
          break;
        }
      }
    }

    function createPage(pdfDoc: PDFDocument) {
      console.log('Creating new page');
      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      return page;
    }

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(config.outputFileName, pdfBytes);
    console.log(`PDF saved as ${config.outputFileName}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error generating PDF: ${error.message}`);
      console.error(error.stack);
    }
  }


}
