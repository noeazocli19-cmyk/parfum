// Convertit les logos (données JPEG) en vrais fichiers PNG + vérifie les images produits.
import sharp from 'sharp'

async function convert(input: string, output: string) {
  await sharp(input).png().toFile(output)
  console.log('converti:', output)
}

await convert('public/images/logo-embleme.png', 'public/images/logo-embleme.real.png')
await convert('public/images/logo-embleme-fonce.png', 'public/images/logo-embleme-fonce.real.png')
console.log('OK')
