/**
 * Script para gerar ícones PWA
 * Execute: node generate-pwa-icons.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Criar pasta de ícones
const iconsDir = path.join(__dirname, 'client', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// SVG base - Logo SysFit Pro (gradiente azul com ícone de academia)
const createSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e40af;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background com gradiente -->
  <rect width="512" height="512" rx="110" fill="url(#grad1)"/>

  <!-- Ícone de haltere estilizado -->
  <g transform="translate(256, 256)">
    <!-- Barra central -->
    <rect x="-140" y="-12" width="280" height="24" rx="12" fill="white" opacity="0.95"/>

    <!-- Peso esquerdo -->
    <g transform="translate(-140, 0)">
      <rect x="-30" y="-50" width="30" height="100" rx="8" fill="white" opacity="0.95"/>
      <rect x="-50" y="-40" width="20" height="80" rx="6" fill="white" opacity="0.85"/>
      <rect x="-70" y="-35" width="20" height="70" rx="6" fill="white" opacity="0.75"/>
    </g>

    <!-- Peso direito -->
    <g transform="translate(140, 0)">
      <rect x="0" y="-50" width="30" height="100" rx="8" fill="white" opacity="0.95"/>
      <rect x="30" y="-40" width="20" height="80" rx="6" fill="white" opacity="0.85"/>
      <rect x="50" y="-35" width="20" height="70" rx="6" fill="white" opacity="0.75"/>
    </g>

    <!-- Texto SF (SysFit) -->
    <text x="0" y="120" text-anchor="middle" font-family="Arial, sans-serif" font-size="80" font-weight="bold" fill="white" opacity="0.95">SF</text>
  </g>
</svg>
`;

// Tamanhos necessários para PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

console.log('📱 Gerando ícones PWA...\n');

sizes.forEach(size => {
  const svgContent = createSVG(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);

  fs.writeFileSync(filepath, svgContent);
  console.log(`✅ Criado: ${filename}`);
});

// Criar também favicon.ico (versão SVG)
const faviconPath = path.join(__dirname, 'client', 'public', 'favicon.svg');
fs.writeFileSync(faviconPath, createSVG(32));
console.log(`✅ Criado: favicon.svg`);

console.log('\n✨ Ícones PWA gerados com sucesso!');
console.log('\n📋 Próximos passos:');
console.log('1. Execute: npm run build');
console.log('2. Deploy no servidor');
console.log('3. Acesse pelo celular: https://www.sysfitpro.com.br');
console.log('4. No Chrome/Safari: Menu > Adicionar à tela inicial\n');
