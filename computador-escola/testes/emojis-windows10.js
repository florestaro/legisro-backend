// Confere que o programa só usa emojis que o Windows 10 desenha direito.
// A fonte de emojis do Windows 10 (Segoe UI Emoji) vai até o Emoji 12.0: um emoji mais novo aparece como um
// quadradinho, e as sequências novas com 🧑 (como 🧑‍🏫, "professor") aparecem separadas: 🧑 e 🏫, lado a lado.
// Uso: node testes/emojis-windows10.js   (ou npm run teste:emojis)
const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
// Sequências com junção (ZWJ) que o Windows 10 desenha como um desenho só. Antes de usar outra, confira no Windows 10.
const SEQUENCIAS_OK = new Set(['👨‍🏫', '👩‍🏫', '👨‍🎓', '👩‍🎓', '👨‍💼', '👩‍💼', '👨‍💻', '👩‍💻', '👨‍🌾', '👩‍🌾', '👨‍⚕️', '👩‍⚕️', '👨‍👩‍👧', '🏴‍☠️']
  .map((s) => s.replace(/\uFE0F/g, '')));
// A troca do avatar antigo (gravado nos dados até a fase 3) precisa citar o emoji antigo.
const CITACAO_PERMITIDA = { 'src/armazenamento.js': '🧑‍🏫', 'app/js/api.js': '🧑‍🏫' };

// Emojis do Emoji 13.0 em diante (o Windows 10 não tem).
function novoDemais(cp) {
  if (cp >= 0x1fa70 && cp <= 0x1faff) {
    const doEmoji12 = (cp >= 0x1fa70 && cp <= 0x1fa73) || (cp >= 0x1fa78 && cp <= 0x1fa7a)
      || (cp >= 0x1fa80 && cp <= 0x1fa82) || (cp >= 0x1fa90 && cp <= 0x1fa95);
    return !doEmoji12;
  }
  return [0x1f6d6, 0x1f6d7, 0x1f6dc, 0x1f6dd, 0x1f6de, 0x1f6df, 0x1f6fb, 0x1f6fc, 0x1f7f0, 0x1f90c, 0x1f972, 0x1f977,
    0x1f978, 0x1f979, 0x1f9a3, 0x1f9a4, 0x1f9ab, 0x1f9ac, 0x1f9ad, 0x1f9cb, 0x1f9cc, 0x26a7].includes(cp);
}

function arquivos(pasta) {
  return fs.readdirSync(pasta, { withFileTypes: true }).flatMap((d) => {
    const c = path.join(pasta, d.name);
    if (d.isDirectory()) return arquivos(c);
    return /\.(js|html|css)$/.test(d.name) ? [c] : [];
  });
}

const SEQUENCIA = /\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier})*(?:‍\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier})*)+/gu;
const problemas = [];
let total = 0;
for (const arquivo of [...arquivos(path.join(raiz, 'app')), ...arquivos(path.join(raiz, 'src'))]) {
  const nome = path.relative(raiz, arquivo).split(path.sep).join('/');
  fs.readFileSync(arquivo, 'utf8').split('\n').forEach((linha, i) => {
    for (const m of linha.matchAll(SEQUENCIA)) {
      total++;
      const s = m[0].replace(/\uFE0F/g, '');
      if (!SEQUENCIAS_OK.has(s) && CITACAO_PERMITIDA[nome] !== m[0]) problemas.push(`${nome}:${i + 1}  ${m[0]}  (sequência que o Windows 10 pode mostrar separada)`);
    }
    for (const ch of linha) {
      if (novoDemais(ch.codePointAt(0))) problemas.push(`${nome}:${i + 1}  ${ch}  (emoji novo demais: no Windows 10 vira um quadradinho)`);
    }
  });
}

if (problemas.length) {
  console.log(`✘ ${problemas.length} emoji(s) que o Windows 10 não desenha direito:\n  ${problemas.join('\n  ')}`);
  process.exitCode = 1;
} else {
  console.log(`✔ Todos os emojis do programa aparecem direito no Windows 10 (${total} sequências com junção conferidas).`);
}
