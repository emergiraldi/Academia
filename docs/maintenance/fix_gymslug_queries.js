import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

// Encontrar todos os arquivos .tsx em client/src/pages
const files = glob.sync('client/src/pages/**/*.tsx');

let totalFixed = 0;

files.forEach(file => {
  let content = readFileSync(file, 'utf-8');
  const original = content;

  // Padrão: .useQuery({ gymSlug }, { enabled: !!gymSlug })
  // Substituir por: .useQuery({ gymSlug: gymSlug || '' }, { enabled: !!gymSlug })
  content = content.replace(
    /\.useQuery\(\{\s*gymSlug\s*\},\s*\{\s*enabled:\s*!!gymSlug/g,
    `.useQuery({ gymSlug: gymSlug || '' }, { enabled: !!gymSlug`
  );

  if (content !== original) {
    writeFileSync(file, content, 'utf-8');
    totalFixed++;
    console.log(`✅ Fixed: ${file}`);
  }
});

console.log(`\n🎉 Total files fixed: ${totalFixed}`);
