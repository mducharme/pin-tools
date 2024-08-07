import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generatePDF } from './generatepdf.js'; // Import your PDF generation script

const app = express();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage })

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/generate-pdf', upload.single('image'), async (req, res) => {
  const { paddingInches, outputFileName, pageWidth, pageHeight, resolution, imageSize } = req.body;
  const image = req.file.buffer;

  const config = {
    image,
    paddingInches: parseFloat(paddingInches),
    outputFileName,
    pageSize: { width: parseFloat(pageWidth), height: parseFloat(pageHeight) },
    resolution: parseInt(resolution, 10),
    imageSize: { width: parseFloat(imageSize), height: parseFloat(imageSize) }
  };

  try {
    await generatePDF(config);
    res.download(config.outputFileName, err => {
      if (err) {
        console.error(err);
      }
      fs.unlinkSync(config.outputFileName); // Delete the output file after sending it
      //fs.unlinkSync(imageUrl); // Delete the uploaded image after processing
    });
  } catch (error) {
    console.error(`Error generating PDF: ${error.message}`);
    res.status(500).send('An error occurred while generating the PDF.');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
