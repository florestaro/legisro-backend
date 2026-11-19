// Sites de treino para os trabalhos da escola.
// • Mundo Escolar: o site de pesquisa que todo aluno acha primeiro, com o texto bom no meio e propagandas piscando em
//   volta (jogo grátis, prêmio, "seu computador está com vírus", o botão BAIXAR falso). Clicou numa propaganda: "pegou
//   um vírus" de mentira, e a página explica por quê. Fechar o aviso falso pelo X e ler o texto até o fim contam
//   para as aulas (escola:popup-fechado e escola:texto-lido).
// • Na enciclopédia Saber Livre (sites.js), os mesmos temas aparecem sem propaganda.
window.CE = window.CE || {};

(function () {
  const link = (url, texto, extra = '') => `<a href="#" data-link="${url}" ${extra}>${texto}</a>`;
  const site = (dominio, def) => { CE.SITES[dominio] = { dominio, ...def }; };
  const indexar = (url, titulo, descricao, palavras = '') => CE.INDICE_BUSCA.push({ url, titulo, descricao, palavras });

  // Os temas dos trabalhos: título, linha fina, parágrafos e palavras para a busca.
  const TEMAS = {
    'dinossauros-voadores': ['Dinossauros voadores: os pterossauros', 'Eles voavam no tempo dos dinossauros, mas não eram dinossauros!', [
      'Os pterossauros foram répteis que voavam no tempo dos dinossauros, há mais de 66 milhões de anos. Muita gente chama de "dinossauros voadores", mas eles eram primos dos dinossauros.',
      'As asas eram feitas de pele, presas a um dedo muito comprido da mão. Os ossos eram ocos e leves, o que ajudava no voo.',
      'Existiam pterossauros pequenos como um pardal e gigantes como o Quetzalcoatlus, com asas de mais de 10 metros, do tamanho de um avião pequeno.',
      'Muitos comiam peixes, que pegavam voando baixo sobre a água. O Brasil tem fósseis famosos de pterossauros, encontrados na Chapada do Araripe, no Ceará.',
      'Eles desapareceram junto com os dinossauros, provavelmente depois que um grande asteroide caiu na Terra.'],
      'dinossauros voadores pterossauro pterossauros reptil voador asas fosseis quetzalcoatlus pre-historia'],
    dengue: ['Dengue: como combater o mosquito', 'O mosquito Aedes aegypti nasce na água parada.', [
      'A dengue é uma doença transmitida pela picada do mosquito Aedes aegypti, que tem listras brancas nas pernas.',
      'O mosquito coloca os ovos em água parada: pneus, garrafas, vasos de planta, calhas e caixas-d\'água destampadas.',
      'Para combater: vire as garrafas de boca para baixo, ponha areia nos pratinhos das plantas, tampe a caixa-d\'água e jogue fora o que junta água.',
      'Febre alta, dor no corpo e dor atrás dos olhos podem ser dengue. Procure o posto de saúde e beba bastante água.'],
      'dengue mosquito aedes aegypti agua parada combater prevencao saude cartaz'],
    amazonia: ['Floresta Amazônica para crianças', 'A maior floresta tropical do mundo, e uma parte dela fica em Rondônia.', [
      'A Floresta Amazônica é a maior floresta tropical do mundo. Ela fica em nove países, e a maior parte está no Brasil.',
      'Lá vivem milhares de animais, como a onça-pintada, o boto-cor-de-rosa, a arara e o macaco-prego, e muitas árvores, como a castanheira e a seringueira.',
      'A floresta ajuda a fazer chover em várias partes do Brasil: as árvores soltam vapor de água que vira nuvem.',
      'As queimadas e o desmatamento são os maiores perigos. Cuidar da floresta é cuidar da água e do ar que respiramos.'],
      'floresta amazonica amazonia animais arvores rondonia natureza queimadas desmatamento'],
    'sistema-solar': ['Sistema Solar: o Sol e os 8 planetas', 'A nossa casa no espaço: a Terra é o terceiro planeta a partir do Sol.', [
      'O Sistema Solar é formado pelo Sol, que é uma estrela, e por tudo que gira em volta dele: planetas, luas, asteroides e cometas.',
      'São 8 planetas. Do mais perto ao mais longe do Sol: Mercúrio, Vênus, Terra, Marte, Júpiter, Saturno, Urano e Netuno.',
      'Júpiter é o maior de todos: caberiam mais de mil Terras dentro dele. Saturno é famoso pelos anéis de gelo e pedra.',
      'A Terra é o único planeta onde sabemos que existe vida, porque tem água líquida e ar para respirar. A Lua gira em volta da Terra.',
      'A Terra dá uma volta em torno de si mesma em um dia (é por isso que existe dia e noite) e uma volta em torno do Sol em um ano.'],
      'sistema solar planetas sol terra lua jupiter saturno marte mercurio venus urano netuno espaco astronomia'],
    'historia-rondonia': ['História de Rondônia', 'Do telégrafo do Marechal Rondon à ferrovia Madeira-Mamoré.', [
      'Antes da chegada dos europeus, a região já era a casa de muitos povos indígenas, que vivem lá até hoje.',
      'No começo do século 20 foi construída a Estrada de Ferro Madeira-Mamoré, para levar a borracha. Milhares de trabalhadores de vários países vieram trabalhar nela, e muitos morreram de doenças.',
      'Na mesma época, o Marechal Cândido Rondon levou as linhas do telégrafo pela floresta, fazendo amizade com os povos indígenas. O estado tem o nome dele.',
      'Em 1943 foi criado o Território Federal do Guaporé, que em 1956 passou a se chamar Território de Rondônia.',
      'Em 1981 Rondônia virou estado, e Porto Velho, às margens do rio Madeira, é a capital.'],
      'historia de rondonia rondon marechal madeira mamore ferrovia telegrafo porto velho territorio guapore 1981 estado'],
    'ciclo-agua': ['O ciclo da água', 'A água da chuva é a mesma que estava no rio: ela anda em círculo!', [
      'A água do planeta está sempre mudando de lugar, num caminho que não acaba: é o ciclo da água.',
      '1. EVAPORAÇÃO: o sol esquenta a água dos rios, lagos e mares, e ela vira vapor, que sobe para o céu. As plantas também soltam vapor pelas folhas.',
      '2. CONDENSAÇÃO: lá no alto é frio, e o vapor vira gotinhas, que juntas formam as nuvens.',
      '3. PRECIPITAÇÃO: quando as gotinhas ficam pesadas, cai a chuva (ou neve e granizo, em lugares frios).',
      '4. INFILTRAÇÃO E ESCOAMENTO: a água da chuva entra na terra ou corre para os rios, e o ciclo começa de novo.',
      'Na Amazônia, a floresta solta tanto vapor que forma "rios voadores": nuvens que levam chuva para outras partes do Brasil.'],
      'ciclo da agua chuva evaporacao condensacao precipitacao infiltracao nuvem vapor rios voadores'],
  };

  // As propagandas que piscam em volta do texto (todas levam ao "vírus").
  const ANUNCIOS = [
    ['🎮', 'GANHE 10.000 MOEDAS NO SEU JOGO!', 'Clique e receba agora, é grátis!!!'],
    ['🦄', 'Qual unicórnio é você?', 'Faça o teste e descubra! 😱'],
    ['🎁', 'PARABÉNS! VOCÊ GANHOU UM CELULAR!', 'Toque aqui para buscar seu prêmio'],
    ['🍬', 'Doces grátis para quem clicar!', 'Só hoje, corre!!!'],
  ];
  const anuncio = ([ic, t, s], k) => `<button class="me-anuncio a${k}" data-site-acao="anuncio" data-anuncio="${k}"><span class="me-ic">${ic}</span><b>${t}</b><small>${s}</small><em>Anúncio</em></button>`;

  site('mundoescolar.com.br', {
    nome: 'Mundo Escolar', icone: '🎒', seguro: true,
    abrir({ caminho, busca }) {
      const cab = `<header class="me-cabecalho">${link('mundoescolar.com.br', '🎒 <b>Mundo Escolar</b>')}<span>Pesquisas para a escola</span></header>`;
      if (caminho === '/virus') {
        return { titulo: '💀 Ops! Vírus!', conteudo: `<div class="me-virus"><div class="me-virus-ic">💀</div><h1>Ops! Você pegou um vírus!</h1>
          <p class="me-virus-mentira">(De mentira: aqui é só treino. Nada aconteceu com o computador.)</p>
          <p>Você clicou numa <b>propaganda que piscava</b>. Na internet de verdade, propagandas assim podem:</p>
          <ul><li>instalar um <b>vírus</b> que estraga o computador;</li><li>abrir páginas que pedem seus dados ou os da sua família;</li><li>encher a tela de mais propagandas.</li></ul>
          <p class="me-regra">📌 Regra de ouro: <b>o que pisca, promete prêmio ou diz "clique aqui" a gente NÃO clica.</b> Pesquise só no texto.</p>
          <p>${link('mundoescolar.com.br/pesquisa/' + (busca && TEMAS[busca.de] ? busca.de : 'dinossauros-voadores'), '⬅️ Voltar para o texto', 'class="me-voltar" data-voltar-texto')}</p></div>` };
      }
      const tema = caminho.startsWith('/pesquisa/') ? caminho.slice(10) : null;
      if (tema && TEMAS[tema]) {
        const [titulo, fina, paragrafos] = TEMAS[tema];
        return {
          titulo: `${titulo} – Mundo Escolar`,
          conteudo: `${cab}<div class="me-pagina">
            <aside class="me-lado">${anuncio(ANUNCIOS[0], 0)}${anuncio(ANUNCIOS[1], 1)}</aside>
            <article class="me-artigo" data-tema="${tema}"><h1>${titulo}</h1><p class="me-fina">${fina}</p>
              ${paragrafos.slice(0, 2).map((p) => `<p>${p}</p>`).join('')}
              <button class="me-baixar" data-site-acao="anuncio" data-anuncio="baixar">⬇️ BAIXAR O TRABALHO PRONTO</button>
              ${paragrafos.slice(2).map((p) => `<p>${p}</p>`).join('')}
              <p class="me-fonte">Fonte: Mundo Escolar · mundoescolar.com.br</p>
              <button class="me-li" data-site-acao="li-texto" data-li-texto="${tema}">✅ Terminei de ler</button></article>
            <aside class="me-lado">${anuncio(ANUNCIOS[2], 2)}${anuncio(ANUNCIOS[3], 3)}</aside>
            <div class="me-popup" role="dialog" aria-label="Aviso"><button class="me-popup-x" data-site-acao="fechar-popup" aria-label="Fechar o aviso">✕</button>
              <div class="me-popup-ic">⚠️</div><b>SEU COMPUTADOR ESTÁ COM 3 VÍRUS!</b><p>Clique no botão para limpar agora!!!</p>
              <button class="me-popup-botao" data-site-acao="anuncio" data-anuncio="limpar">🧹 LIMPAR AGORA</button></div>
          </div>`,
        };
      }
      return {
        titulo: 'Mundo Escolar – pesquisas para a escola',
        conteudo: `${cab}<div class="me-inicio"><h1>Pesquisas para a escola</h1>${anuncio(ANUNCIOS[0], 0)}<ul class="me-lista">
          ${Object.entries(TEMAS).map(([s, t]) => `<li>${link('mundoescolar.com.br/pesquisa/' + s, t[0], `data-tema="${s}"`)} — ${t[1]}</li>`).join('')}</ul></div>`,
      };
    },
    acao(nome, el, ctx) {
      if (nome === 'anuncio') { CE.emitir('escola:anuncio', { anuncio: el.dataset.anuncio }); ctx.caiuNoGolpe(); const t = el.closest('[data-tema]') || document.querySelector('.me-artigo[data-tema]'); ctx.ir('mundoescolar.com.br/virus' + (t ? '?de=' + t.dataset.tema : '')); }
      if (nome === 'fechar-popup') { const p = el.closest('.me-popup'); if (p) p.remove(); CE.emitir('escola:popup-fechado', {}); }
      if (nome === 'li-texto') { el.textContent = '✅ Leitura feita!'; el.disabled = true; CE.emitir('escola:texto-lido', { tema: el.dataset.liTexto }); }
    },
  });
  Object.entries(TEMAS).forEach(([s, t]) => indexar('mundoescolar.com.br/pesquisa/' + s, `${t[0]} – Mundo Escolar`, t[1], t[3]));
  CE.TEMAS_ESCOLA = TEMAS;
})();
