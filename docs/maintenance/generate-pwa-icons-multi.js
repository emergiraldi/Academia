/**
 * Script para gerar ícones PWA para Aluno, Professor e Admin
 * Execute: node generate-pwa-icons-multi.js
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

// SVG para ALUNO (azul com pessoa + haltere)
const createStudentSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradStudent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e40af;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" rx="110" fill="url(#gradStudent)"/>

  <!-- Pessoa estilizada -->
  <g transform="translate(256, 180)">
    <!-- Cabeça -->
    <circle cx="0" cy="0" r="45" fill="white" opacity="0.95"/>

    <!-- Corpo -->
    <ellipse cx="0" cy="90" rx="60" ry="70" fill="white" opacity="0.95"/>

    <!-- Braços -->
    <ellipse cx="-50" cy="70" rx="18" ry="50" fill="white" opacity="0.9" transform="rotate(-20 -50 70)"/>
    <ellipse cx="50" cy="70" rx="18" ry="50" fill="white" opacity="0.9" transform="rotate(20 50 70)"/>
  </g>

  <!-- Haltere pequeno -->
  <g transform="translate(256, 360)">
    <rect x="-50" y="-6" width="100" height="12" rx="6" fill="white" opacity="0.85"/>
    <rect x="-60" y="-20" width="15" height="40" rx="4" fill="white" opacity="0.85"/>
    <rect x="45" y="-20" width="15" height="40" rx="4" fill="white" opacity="0.85"/>
  </g>
</svg>
`;

// SVG para PROFESSOR (verde com pessoa + prancheta)
const createProfessorSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradProf" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#059669;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#10b981;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" rx="110" fill="url(#gradProf)"/>

  <!-- Pessoa estilizada -->
  <g transform="translate(220, 180)">
    <!-- Cabeça -->
    <circle cx="0" cy="0" r="40" fill="white" opacity="0.95"/>

    <!-- Corpo -->
    <ellipse cx="0" cy="80" rx="55" ry="65" fill="white" opacity="0.95"/>

    <!-- Braços -->
    <ellipse cx="-45" cy="60" rx="16" ry="45" fill="white" opacity="0.9" transform="rotate(-15 -45 60)"/>
    <ellipse cx="45" cy="60" rx="16" ry="45" fill="white" opacity="0.9" transform="rotate(15 45 60)"/>
  </g>

  <!-- Prancheta -->
  <g transform="translate(330, 250)">
    <rect x="0" y="0" width="80" height="110" rx="8" fill="white" opacity="0.95"/>
    <rect x="10" y="15" width="60" height="8" rx="4" fill="#10b981" opacity="0.7"/>
    <rect x="10" y="35" width="60" height="8" rx="4" fill="#10b981" opacity="0.7"/>
    <rect x="10" y="55" width="40" height="8" rx="4" fill="#10b981" opacity="0.7"/>
  </g>
</svg>
`;

// SVG para ADMIN (roxo com engrenagens)
const createAdminSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradAdmin" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6d28d9;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" rx="110" fill="url(#gradAdmin)"/>

  <!-- Engrenagem grande -->
  <g transform="translate(256, 220)">
    <circle cx="0" cy="0" r="80" fill="white" opacity="0.95"/>
    <circle cx="0" cy="0" r="40" fill="url(#gradAdmin)"/>

    <!-- Dentes da engrenagem -->
    <rect x="-15" y="-95" width="30" height="30" rx="5" fill="white" opacity="0.95"/>
    <rect x="-15" y="65" width="30" height="30" rx="5" fill="white" opacity="0.95"/>
    <rect x="-95" y="-15" width="30" height="30" rx="5" fill="white" opacity="0.95"/>
    <rect x="65" y="-15" width="30" height="30" rx="5" fill="white" opacity="0.95"/>

    <rect x="-70" y="-70" width="25" height="25" rx="5" fill="white" opacity="0.9" transform="rotate(45 -70 -70)"/>
    <rect x="70" y="-70" width="25" height="25" rx="5" fill="white" opacity="0.9" transform="rotate(-45 70 -70)"/>
    <rect x="-70" y="70" width="25" height="25" rx="5" fill="white" opacity="0.9" transform="rotate(-45 -70 70)"/>
    <rect x="70" y="70" width="25" height="25" rx="5" fill="white" opacity="0.9" transform="rotate(45 70 70)"/>
  </g>

  <!-- Engrenagem pequena -->
  <g transform="translate(360, 340)">
    <circle cx="0" cy="0" r="45" fill="white" opacity="0.9"/>
    <circle cx="0" cy="0" r="22" fill="url(#gradAdmin)"/>

    <rect x="-8" y="-50" width="16" height="16" rx="3" fill="white" opacity="0.9"/>
    <rect x="-8" y="34" width="16" height="16" rx="3" fill="white" opacity="0.9"/>
    <rect x="-50" y="-8" width="16" height="16" rx="3" fill="white" opacity="0.9"/>
    <rect x="34" y="-8" width="16" height="16" rx="3" fill="white" opacity="0.9"/>
  </g>
</svg>
`;

// Tamanhos necessários para PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

console.log('📱 Gerando ícones PWA para 3 perfis...\n');

// Gerar ícones do ALUNO
console.log('👨‍🎓 Aluno (Azul):');
sizes.forEach(size => {
  const svgContent = createStudentSVG(size);
  const filename = `student-icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);
  fs.writeFileSync(filepath, svgContent);
  console.log(`  ✅ ${filename}`);
});

// Gerar ícones do PROFESSOR
console.log('\n👨‍🏫 Professor (Verde):');
sizes.forEach(size => {
  const svgContent = createProfessorSVG(size);
  const filename = `professor-icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);
  fs.writeFileSync(filepath, svgContent);
  console.log(`  ✅ ${filename}`);
});

// Gerar ícones do ADMIN
console.log('\n⚙️  Admin (Roxo):');
sizes.forEach(size => {
  const svgContent = createAdminSVG(size);
  const filename = `admin-icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);
  fs.writeFileSync(filepath, svgContent);
  console.log(`  ✅ ${filename}`);
});

console.log('\n✨ Todos os ícones PWA gerados com sucesso!');
console.log('\n📋 Como funciona:');
console.log('1. Aluno acessa /student/login → Instala PWA AZUL');
console.log('2. Professor acessa /professor/login → Instala PWA VERDE');
console.log('3. Admin acessa /admin/login → Instala PWA ROXO');
console.log('\n🎨 Cada um terá um ícone diferente na tela inicial!\n');
