import express, { Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import { Config, ImageOptions } from './config';
import { generatePDF } from './generatepdf';

const app = express();
const upload = multer();

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/generate-pdf', upload.array('images[]'), async (req: Request, res: Response) => {
  const { padding, outputFileName, pageWidth, pageHeight, resolution, imageSize, pinSize, imageOptions} = req.body;

  const files = req.files as Express.Multer.File[];

  const config: Config = {
    images: [],
    pageSize: { 
      width: parseFloat(pageWidth), 
      height: parseFloat(pageHeight) 
    },
    padding: parseFloat(padding),
    resolution: parseInt(resolution, 10),
    imageSize: parseFloat(imageSize),
    pinSize: parseFloat(pinSize),
    outputFileName,
  };

  files.map((file, index) => {
    config.images.push({
      image: file.buffer,
      scale: parseFloat(imageOptions[index].scale),
      backgroundColor: imageOptions[index].backgroundColor,
      offset: {
        x: parseFloat(imageOptions[index].offsetX),
        y: parseFloat(imageOptions[index].offsetY)
      },
      quantity: parseInt(imageOptions[index].quantity)
    });
  });

  console.log(config);

  try {
    await generatePDF(config);
    res.download(config.outputFileName, errorMessage => {
      if (errorMessage) {
        console.error(errorMessage);
      }
      fs.unlinkSync(config.outputFileName);
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error generating PDF: ${error.message}`);
      console.error(error.stack);
    }
    res.status(500).send('An error occurred while generating the PDF.');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Pin generator server is running on port ${PORT}`);
});
