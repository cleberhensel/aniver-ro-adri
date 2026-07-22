#!/usr/bin/env node
/** Regenera midi/o-que-sera-melodia-dm.mid a partir de js/o-que-sera-melodia.js */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const jsPath = path.join(root, 'js/o-que-sera-melodia.js');
const outPath = path.join(root, 'midi/o-que-sera-melodia-dm.mid');

const code = fs.readFileSync(jsPath, 'utf8');
// eslint-disable-next-line no-new-func
new Function(code)();
const m = globalThis.OQueSeraMelodia;
const events = m.flattenEvents(m.STANZAS);
const bytes = m.buildMidiBytes(events, 120);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, Buffer.from(bytes));
console.log(`OK ${outPath} — ${bytes.length} bytes, ${events.length} notas`);
