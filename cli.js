import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { generatePDF } from './generatepdf.js'; // Import your PDF generation script
import fetch from 'node-fetch';

// Command-line arguments
const argv = yargs(hideBin(process.argv))
  .option('imageUrl', {
    alias: 'i',
    description: 'URL of the image to be embedded',
    type: 'string',
    demandOption: true
  })
  .option('paddingInches', {
    alias: 'p',
    description: 'Padding between images in inches',
    type: 'number',
    default: 0.25
  })
  .option('outputFileName', {
    alias: 'o',
    description: 'Name of the output PDF file',
    type: 'string',
    default: 'pins.pdf'
  })
  .option('pageSize', {
    alias: 's',
    description: 'Page size in inches (width and height)',
    type: 'array',
    default: [8.5, 11]
  })
  .option('resolution', {
    alias: 'r',
    description: 'Resolution in dpi',
    type: 'number',
    default: 600
  })
  .option('imageSize', {
    alias: 'z',
    description: 'Image size in inches (width and height)',
    type: 'array',
    default: [1.1875, 1.1875]
  })
  .argv;

// Convert pageSize and imageSize to objects
const pageSize = { width: argv.pageSize[0], height: argv.pageSize[1] };
const imageSize = { width: argv.imageSize[0], height: argv.imageSize[1] };


const imageBytes = await fetch(argv.imageUrl).then(res => {
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
    return res.arrayBuffer();
});

// Configuration object
const config = {
  image: imageBytes,
  paddingInches: argv.paddingInches,
  outputFileName: argv.outputFileName,
  pageSize: pageSize,
  resolution: argv.resolution,
  imageSize: imageSize,
  printableAreaSize: 0.875,
  debugMode: false
};

// Generate PDF with the specified configuration
generatePDF(config);