// Gera uma versão de demonstração em um único arquivo HTML, para abrir no navegador.
// Nela os dados ficam no navegador e o professor usa só as respostas prontas (sem IA).
// Uso: node scripts/gerar-demo-web.js [arquivo-de-saida.html]
const fs = require('fs');
const path = require('path');

const pastaApp = path.join(__dirname, '..', 'app');
const saida = process.argv[2] || path.join(__dirname, '..', 'demo-web.html');
const html = fs.readFileSync(path.join(pastaApp, 'index.html'), 'utf8');

const corpo = html.slice(html.indexOf('<body>') + 6, html.indexOf('</body>'));
const marcacao = corpo.replace(/\s*<script src="[^"]+"><\/script>/g, '');
const scripts = [...corpo.matchAll(/<script src="([^"]+)"><\/script>/g)]
  .map(([, arquivo]) => `<script>\n${fs.readFileSync(path.join(pastaApp, arquivo), 'utf8')}\n</script>`);
const estilo = fs.readFileSync(path.join(pastaApp, 'estilo.css'), 'utf8');
// Publicada no Claude, a demo baixa arquivos (planilha e versão para imprimir) pelo próprio Claude.
scripts.push(`<script>\n${fs.readFileSync(path.join(__dirname, 'demo-artifact.js'), 'utf8')}\n</script>`);

fs.writeFileSync(saida, [
  '<title>Computador Escola</title>',
  `<style>\n${estilo}\n</style>`,
  marcacao.trim(),
  ...scripts,
].join('\n'));
console.log('Demonstração gerada em', saida);
