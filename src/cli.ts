import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { generatePDF } from './generatepdf';
import { Config } from './config';
import fetch from 'node-fetch';

const argv = yargs(hideBin(process.argv))
  .option('imageUrl', {
    alias: 'i',
    description: 'URL of the image to be embedded',
    type: 'string',
    demandOption: true,
  })
  .option('paddingInches', {
    alias: 'p',
    description: 'Spacing between images in inches',
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
    default: [8.5, 11],
    coerce: (arg: any) => ({ width: parseFloat(arg[0]), height: parseFloat(arg[1]) })
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
    type: 'number',
    default: 1.1875
  })
  .parseSync();

async function main() {
  try {
    const imageBytes = await fetch(argv.imageUrl).then(res => {
      if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
      return res.arrayBuffer();
    });

    const config: Config = {
      image: imageBytes,
      paddingInches: argv.paddingInches,
      outputFileName: argv.outputFileName,
      pageSize: argv.pageSize,
      resolution: argv.resolution,
      imageSize: argv.imageSize,
      printableAreaSize: 0.875
    };

    await generatePDF(config);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    }
  }
}

main();
