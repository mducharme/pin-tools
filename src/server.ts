import express, { Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import { Config } from './config';
import { generatePDF } from './generatepdf'; // Import your PDF generation script

const app = express();
//const storage = multer.memoryStorage();
const upload = multer();

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.post('/generate-pdf', upload.single('image'), async (req: Request, res: Response) => {
  const { padding, outputFileName, pageWidth, pageHeight, resolution, imageSize, pinSize, imageScale,  imageBackgroundColor, imagePanX, imagePanY, quantity} = req.body;
  const image = req.file?.buffer;

  if (!image) {
    return res.status(400).send('No image file uploaded.');
  }

  const config: Config = {
    image,
    imageOptions: {
      scale:parseFloat(imageScale), 
      backgroundColor: imageBackgroundColor, 
      panX: parseFloat(imagePanX), 
      panY: parseFloat(imagePanY),
      quantity: parseInt(quantity)
    },
    pageSize: { width: parseFloat(pageWidth), height: parseFloat(pageHeight) },
    padding: parseFloat(padding),
    resolution: parseInt(resolution, 10),
    imageSize: imageSize,
    pinSize: pinSize,
    outputFileName,
  };

  try {
    await generatePDF(config);
    res.download(config.outputFileName, err => {
      if (err) {
        console.error(err);
      }
      fs.unlinkSync(config.outputFileName); // Delete the output file after sending it
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error generating PDF: ${error.message}`);
    }
    res.status(500).send('An error occurred while generating the PDF.');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
