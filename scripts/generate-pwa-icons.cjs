const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateIcons() {
  const publicDir = path.resolve(__dirname, '../public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const svgPath = path.join(publicDir, 'icon.svg');
  if (!fs.existsSync(svgPath)) {
    console.error('icon.svg not found in public/');
    return;
  }

  const svgBuffer = fs.readFileSync(svgPath);

  // 1. pwa-192x192.png
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('✅ Generated pwa-192x192.png');

  // 2. pwa-512x512.png
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('✅ Generated pwa-512x512.png');

  // 3. pwa-maskable-512x512.png with safe padding (15%)
  const innerSize = Math.round(512 * 0.76); // 389px inner
  const innerBuffer = await sharp(svgBuffer).resize(innerSize, innerSize).png().toBuffer();
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 10, g: 10, b: 10, alpha: 1 }
    }
  })
  .composite([{ input: innerBuffer, gravity: 'center' }])
  .png()
  .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('✅ Generated pwa-maskable-512x512.png');

  // 4. apple-touch-icon.png (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✅ Generated apple-touch-icon.png');

  // 5. notification-icon.png (96x96 for Push Notifications)
  await sharp(svgBuffer)
    .resize(96, 96)
    .png()
    .toFile(path.join(publicDir, 'notification-icon.png'));
  console.log('✅ Generated notification-icon.png');

  // 6. badge-icon.png (72x72 for Mobile status bar)
  await sharp(svgBuffer)
    .resize(72, 72)
    .png()
    .toFile(path.join(publicDir, 'badge-icon.png'));
  console.log('✅ Generated badge-icon.png');

  // 7. favicon.ico
  await sharp(svgBuffer)
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('✅ Generated favicon.ico');

  console.log('🎉 All PWA & Notification assets generated successfully!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
});
