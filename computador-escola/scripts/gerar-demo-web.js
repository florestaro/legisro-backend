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
  '<meta charset="utf-8">',
  '<title>Computador Escola</title>',
  `<style>\n${estilo}\n</style>`,
  marcacao.trim(),
  ...scripts,
].join('\n'));
// Os jogos grandes (o Restaurante do Digão: o Flash e o Ruffle) não cabem dentro do HTML: vão numa pasta "jogos" ao
// lado dele, no mesmo caminho que o programa usa (publique os dois juntos).
const pastaJogos = path.join(path.dirname(path.resolve(saida)), 'jogos');
fs.cpSync(path.join(pastaApp, 'jogos'), pastaJogos, { recursive: true });
// O site da demonstração não serve .swf: o jogo vai embutido num .js, carregado antes do jogo.js.
const rd = path.join(pastaJogos, 'restaurante-do-digao');
if (fs.existsSync(path.join(rd, 'restaurante-do-digao.swf'))) {
  fs.writeFileSync(path.join(rd, 'restaurante-do-digao-swf.js'), `window.RD_SWF_BASE64 = "${fs.readFileSync(path.join(rd, 'restaurante-do-digao.swf')).toString('base64')}";\n`);
  fs.rmSync(path.join(rd, 'restaurante-do-digao.swf'));
  const pagina = path.join(rd, 'index.html');
  fs.writeFileSync(pagina, fs.readFileSync(pagina, 'utf8').replace('<script src="jogo.js"></script>', '<script src="restaurante-do-digao-swf.js"></script>\n  <script src="jogo.js"></script>'));
}
console.log('Demonstração gerada em', saida, '(com a pasta jogos ao lado)');
