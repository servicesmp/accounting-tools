/**
 * Le module accounting-tools/document est importé par la webapp (navigateur) :
 * il ne doit dépendre ni de pdf-lib, ni de fs/path, ni de Buffer, ni du cœur XML.
 */
import fs from 'fs';
import path from 'path';

const DIR = path.join(__dirname, '../../document');

it.each(fs.readdirSync(DIR).filter((f) => f.endsWith('.ts')))('%s est navigateur-compatible', (file) => {
  const src = fs.readFileSync(path.join(DIR, file), 'utf8');
  const imports = [...src.matchAll(/^\s*import\s+(type\s+)?[^'"]*from\s+['"]([^'"]+)['"]/gm)];
  for (const [, isType, mod] of imports) {
    if (isType) continue;
    expect(mod.startsWith('./')).toBe(true);
  }
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  expect(code).not.toMatch(/\bBuffer\b|require\(|process\./);
});
