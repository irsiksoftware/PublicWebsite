import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PICTURES_DIR = path.join(__dirname, '..', 'pictures');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images');

// Responsive image sizes to generate
const SIZES = {
  small: 480,
  medium: 768,
  large: 1024,
  xlarge: 1920
};

async function ensureDir(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function optimizeImage(inputPath, filename) {
  const name = path.parse(filename).name;
  const image = sharp(inputPath);
  const metadata = await image.metadata();

  console.log(`Processing: ${filename}`);

  // Generate WebP versions at different sizes
  for (const [sizeName, width] of Object.entries(SIZES)) {
    if (width <= metadata.width) {
      const outputPath = path.join(OUTPUT_DIR, `${name}-${sizeName}.webp`);
      await image
        .clone()
        .resize(width, null, { withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(outputPath);
      console.log(`  Generated: ${name}-${sizeName}.webp`);
    }
  }

  // Generate fallback PNG/JPG at original size
  const originalExt = path.extname(filename).toLowerCase();
  const outputFormat = originalExt === '.png' ? 'png' : 'jpeg';
  const outputPath = path.join(OUTPUT_DIR, `${name}.${outputFormat === 'png' ? 'png' : 'jpg'}`);

  if (outputFormat === 'png') {
    await image.clone().png({ quality: 85 }).toFile(outputPath);
  } else {
    await image.clone().jpeg({ quality: 85 }).toFile(outputPath);
  }
  console.log(`  Generated: ${name}.${outputFormat === 'png' ? 'png' : 'jpg'}`);

  // Generate tiny placeholder (blur-up)
  const placeholderPath = path.join(OUTPUT_DIR, `${name}-placeholder.webp`);
  await image
    .clone()
    .resize(20, null, { withoutEnlargement: true })
    .webp({ quality: 50 })
    .blur(10)
    .toFile(placeholderPath);
  console.log(`  Generated: ${name}-placeholder.webp`);
}

async function processAllImages() {
  console.log('Starting image optimization...\n');

  await ensureDir(OUTPUT_DIR);

  const files = await fs.readdir(PICTURES_DIR);
  const imageFiles = files.filter(file =>
    /\.(jpg|jpeg|png)$/i.test(file) && file !== 'placeholder.png'
  );

  for (const file of imageFiles) {
    const inputPath = path.join(PICTURES_DIR, file);
    await optimizeImage(inputPath, file);
  }

  console.log('\nImage optimization complete!');
}

processAllImages().catch(console.error);
