import fs from 'fs';
import { PDFDocument, PDFImage } from 'pdf-lib';
import { createCanvas, loadImage } from 'canvas';
import { Config, ImageOptions } from './config';
import sharp from 'sharp';

async function convertToPng(imageBytes: ArrayBuffer): Promise<Buffer> {
  return sharp(Buffer.from(imageBytes)).png().toBuffer();
}

async function fetchAndEmbedImage(
  pdfDoc: PDFDocument,
  imageOptions: ImageOptions,
  imageSizeInPoints: number
): Promise<PDFImage> {
  if (imageSizeInPoints <= 0) {
    throw new Error('Invalid image size parameter (must be an integer bigger than 0)');
  }

  // Always convert to PNG if necessary (for webp images, for example)
  const imageBuffer= await convertToPng(imageOptions.image);
  const image = await loadImage(imageBuffer);

  const ratio = imageSizeInPoints/500; // 500 is the canvas size that was used for the offset and scale calculations
  const offsetX = imageOptions.offset.x * ratio;
  const offsetY = imageOptions.offset.y * ratio;
  const scale = imageOptions.scale * ratio;

  const canvas = createCanvas(imageSizeInPoints, imageSizeInPoints);
  const ctx = canvas.getContext('2d');

  // Clear the canvas and draw the background color
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, canvas.height / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = imageOptions.backgroundColor;
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
  ctx.arc(imageSizeInPoints / 2, imageSizeInPoints / 2, (imageSizeInPoints / 2) - (outlineLineWidth/2), 0, Math.PI * 2);
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

  const pageQuantity = cols * rows;

  const marginX = (pageWidth - (cols * totalImageSize) + paddingInPoints) / 2;
  const marginY = (pageHeight - (rows * totalImageSize) + paddingInPoints) / 2;

  const pdfDoc = await PDFDocument.create();
  let currentPage = await pdfDoc.addPage([pageWidth, pageHeight]);
  let currentImage = await fetchAndEmbedImage(pdfDoc, config.images[0], imageSizeInPoints);  
 
  let totalRemaining = config.images.reduce((acc, image) => acc + image.quantity, 0);
  let currentImageRemaining = config.images[0].quantity;
  let currentPageRemaining = pageQuantity;

  let currentImageIndex = 0;
    
  while (totalRemaining > 0) {

    for (let row = 0; row < rows && totalRemaining > 0; row++) {
      for (let col = 0; col < cols && totalRemaining > 0; col++) {

        const x = marginX + col * totalImageSize;
        const y = marginY + row * totalImageSize;

        currentPage.drawImage(currentImage, {
          x: x,
          y: currentPage.getHeight() - y - imageSizeInPoints,
          width: imageSizeInPoints,
          height: imageSizeInPoints,
        });

        totalRemaining--;
        currentImageRemaining--;
        currentPageRemaining--;

        if (currentImageRemaining <= 0) {
          currentImageIndex++;
          if (currentImageIndex >= config.images.length) {
            break;
          }
          currentImageRemaining = config.images[currentImageIndex].quantity;
          currentImage = await fetchAndEmbedImage(pdfDoc, config.images[currentImageIndex], imageSizeInPoints);
        }

        if (currentPageRemaining <= 0) {
          currentPageRemaining = pageQuantity;
          currentPage = await pdfDoc.addPage([pageWidth, pageHeight]);
        }
      }
    }
  }

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(config.outputFileName, pdfBytes);
  console.log(`PDF saved as ${config.outputFileName}`);
}
