const {createWorker} = require('tesseract.js');
const screenshot = require('screenshot-desktop');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const recognizeTextFromImage = async imagePath => {
  const worker = await createWorker('eng');
  const ret = await worker.recognize(imagePath);
  await worker.terminate();
  return ret;
};

const convertToGrayscale = async (inputPath, outputPath) => {
  try {
    await sharp(inputPath)
      .metadata()
      .then(async ({width}) => {
        await sharp(inputPath)
          .resize({
            width: Math.round(width * 0.5),
            fit: 'contain',
          })
          .clahe({width: 4, height: 4})
          .threshold(128)
          .toFile(outputPath);
      })
  } catch (error) {
    console.error('Error converting image to grayscale:', error);
  }
};

const outputPath = path.join(__dirname, 'desktopScreenshot.jpg');
const greyOutputPath = path.join(__dirname, 'desktopScreenshot-grey.jpg');

const takeScreenshot = async () => {
  const img = await screenshot();
  fs.writeFile(outputPath, img, async (err) => {
    if (err) throw err;
    await convertToGrayscale(outputPath, greyOutputPath);
    const { data } = await recognizeTextFromImage(greyOutputPath);
    data.lines.map(line => {
      if(line.confidence > 50) {
        console.log(`[${line.confidence}] ${line.text}`)
      }
    })
  });
};

takeScreenshot();
