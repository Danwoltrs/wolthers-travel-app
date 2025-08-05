const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function convertSvgToPng() {
  try {
    const svgPath = path.join(__dirname, '../public/images/logos/wolthers-logo-green.svg');
    const pngPath = path.join(__dirname, '../public/images/logos/wolthers-logo-green.png');
    
    await sharp(svgPath)
      .resize(240, 64) // 2x size for retina displays
      .png()
      .toFile(pngPath);
    
    console.log('Logo converted successfully to PNG');
    console.log('PNG file created at:', pngPath);
  } catch (error) {
    console.error('Error converting logo:', error);
  }
}

convertSvgToPng();