// Sites de treino do Navegador. Todos são inventados e funcionam sem internet.
// Cada site: { nome, icone, seguro, golpe?, abrir(ctx) -> { titulo, conteudo }, acao?(nome, elemento, ctx), enviar?(formulario, dados, ctx) }
// Nos textos, links usam data-link="endereço" e botões de ação usam data-site-acao="nome".
window.CE = window.CE || {};

(function () {
  const e = (t) => CE.escapar(String(t == null ? '' : t));
  const link = (url, texto, extra = '') => `<a href="#" data-link="${url}" ${extra}>${texto}</a>`;
  const real = (v) => 'R$ ' + v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const semAcento = (t) => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  CE.SITES = {};
  CE.INDICE_BUSCA = [];
  const site = (dominio, def) => { CE.SITES[dominio] = { dominio, ...def }; };
  const indexar = (url, titulo, descricao, palavras = '') => CE.INDICE_BUSCA.push({ url, titulo, descricao, palavras });

  // ================= Saber Livre (enciclopédia) =================
  const ARTIGOS = {
    brasil: ['Brasil', 'O maior país da América do Sul, com 27 unidades federativas e mais de 200 milhões de habitantes.', [
      'O Brasil é o maior país da América do Sul e o quinto maior do mundo. A capital é Brasília e a língua oficial é o português.',
      'O país é dividido em 26 estados e o Distrito Federal, agrupados em cinco regiões: Norte, Nordeste, Centro-Oeste, Sudeste e Sul.',
      'A cultura brasileira mistura influências indígenas, africanas e europeias, e aparece na música, na comida e nas festas populares.'], ['rondonia', 'amazonia'], 'pais america do sul brasilia capital estados'],
    rondonia: ['Rondônia', 'Estado da região Norte do Brasil. A capital é Porto Velho.', [
      'Rondônia é um estado da região Norte do Brasil. Faz fronteira com Mato Grosso, Amazonas, Acre e com a Bolívia.',
      'A capital é Porto Velho. Outras cidades importantes são Ji-Paraná, Ariquemes, Vilhena e Cacoal.',
      'O nome do estado homenageia o Marechal Rondon, que levou as linhas de telégrafo para a região no começo do século 20.'], ['porto-velho', 'amazonia', 'brasil'], 'estado norte capital porto velho ji-parana ariquemes vilhena cacoal rondon'],
    'porto-velho': ['Porto Velho', 'Capital do estado de Rondônia, às margens do rio Madeira.', [
      'Porto Velho é a capital do estado de Rondônia. A cidade fica às margens do rio Madeira, um dos maiores afluentes do rio Amazonas.',
      'A cidade nasceu com a construção da Estrada de Ferro Madeira-Mamoré, no início do século 20.'], ['rondonia'], 'capital rondonia rio madeira ferrovia madeira mamore'],
    amazonia: ['Floresta Amazônica', 'A maior floresta tropical do mundo, presente em nove países.', [
      'A Floresta Amazônica é a maior floresta tropical do mundo. Cerca de 60% dela fica no Brasil.',
      'Ela abriga milhares de espécies de plantas e animais, e o rio Amazonas é o maior do mundo em volume de água.',
      'Proteger a floresta é importante para o clima, para a água e para os povos que vivem nela.'], ['brasil', 'agua'], 'floresta rio amazonas natureza animais plantas'],
    computador: ['Computador', 'Máquina que processa informações: escreve, calcula, guarda e comunica.', [
      'O computador é uma máquina eletrônica que recebe informações (entrada), processa e mostra resultados (saída).',
      'As partes principais são o monitor, o gabinete, o teclado e o mouse. O "cérebro" é o processador, que fica dentro do gabinete.',
      'Hoje usamos computadores para estudar, trabalhar, conversar e resolver serviços sem sair de casa.'], ['internet'], 'maquina processador monitor teclado mouse gabinete'],
    internet: ['Internet', 'A rede mundial que liga computadores e celulares do mundo todo.', [
      'A internet é uma rede que liga milhões de computadores e celulares no mundo inteiro.',
      'Para visitar sites usamos um programa chamado navegador. Cada site tem um endereço, como saberlivre.org.',
      'Na internet tem muita coisa boa, mas também golpes. Desconfie de prêmios, pressa e pedidos de senha.'], ['computador'], 'rede navegador site endereco golpes online'],
    agua: ['Ciclo da água', 'Como a água evapora, forma nuvens, chove e volta aos rios.', [
      'O sol esquenta a água dos rios e mares, que evapora e sobe para o céu. Lá em cima ela esfria e forma as nuvens.',
      'Quando as gotas ficam pesadas, cai a chuva, que volta para os rios, para o mar e para debaixo da terra.',
      'Economizar água é importante: feche a torneira ao escovar os dentes e conserte vazamentos.'], ['amazonia'], 'chuva nuvem evaporacao rio economizar'],
    'sistema-solar': ['Sistema Solar', 'O Sol e os oito planetas que giram ao redor dele.', [
      'O Sistema Solar é formado pelo Sol e por tudo que gira ao redor dele: oito planetas, luas, asteroides e cometas.',
      'Os planetas, do mais perto ao mais longe do Sol, são: Mercúrio, Vênus, Terra, Marte, Júpiter, Saturno, Urano e Netuno.',
      'Júpiter é o maior planeta. A Terra é o único onde sabemos que existe vida.'], ['agua'], 'sol planetas terra lua marte jupiter saturno espaco'],
    dengue: ['Dengue', 'Doença transmitida pelo mosquito Aedes aegypti. Como prevenir.', [
      'A dengue é uma doença causada por um vírus e transmitida pela picada do mosquito Aedes aegypti.',
      'Os sintomas mais comuns são febre alta, dor no corpo, dor atrás dos olhos e manchas na pele. Procure o posto de saúde.',
      'Para prevenir, não deixe água parada: vire garrafas, tampe caixas-d\'água e limpe as calhas.'], ['agua'], 'saude mosquito aedes febre prevencao doenca agua parada'],
    alimentacao: ['Alimentação saudável', 'Dicas para comer bem no dia a dia.', [
      'Uma alimentação saudável tem frutas, verduras, legumes, arroz, feijão e pouca comida industrializada.',
      'Beba água durante o dia e evite exagerar no açúcar, no sal e nas frituras.'], ['dengue'], 'saude comida frutas verduras comer bem'],
  };

  site('saberlivre.org', {
    nome: 'Saber Livre', icone: '📚', seguro: true,
    abrir({ caminho }) {
      const cab = `<header class="sl-cabecalho">${link('saberlivre.org', '📚 <b>Saber Livre</b>')}<span>A enciclopédia de todos</span></header>`;
      const slug = caminho.startsWith('/artigo/') ? caminho.slice(8) : null;
      if (slug && ARTIGOS[slug]) {
        const [titulo, resumo, paragrafos, veja] = ARTIGOS[slug];
        return {
          titulo: `${titulo} – Saber Livre`,
          conteudo: `${cab}<article class="sl-artigo"><h1>${titulo}</h1><p class="sl-resumo">${resumo}</p>${paragrafos.map((p) => `<p>${p}</p>`).join('')}
            <h3>Veja também</h3><ul>${veja.map((v) => `<li>${link('saberlivre.org/artigo/' + v, ARTIGOS[v][0], `data-artigo="${v}"`)}</li>`).join('')}</ul></article>`,
        };
      }
      return {
        titulo: 'Saber Livre – a enciclopédia de todos',
        conteudo: `${cab}<div class="sl-inicio"><h1>Bem-vindo ao Saber Livre</h1><p>Escolha um artigo para ler:</p><ul class="sl-lista">
          ${Object.entries(ARTIGOS).map(([s, a]) => `<li>${link('saberlivre.org/artigo/' + s, a[0], `data-artigo="${s}"`)} — ${a[1]}</li>`).join('')}</ul></div>`,
      };
    },
  });
  Object.entries(ARTIGOS).forEach(([s, a]) => indexar('saberlivre.org/artigo/' + s, `${a[0]} – Saber Livre`, a[1], a[4]));

  // ================= Cozinha Fácil (receitas) =================
  const RECEITAS = {
    'bolo-de-cenoura': ['Bolo de cenoura com cobertura de chocolate', '50 min', '12 fatias',
      ['3 cenouras médias', '4 ovos', '1 xícara de óleo', '2 xícaras de açúcar', '2 e 1/2 xícaras de farinha de trigo', '1 colher (sopa) de fermento'],
      ['Bata no liquidificador a cenoura, os ovos e o óleo.', 'Numa tigela, misture o açúcar e a farinha. Junte o creme do liquidificador.', 'Por último, misture o fermento devagar.', 'Asse em forno médio (180 °C) por cerca de 40 minutos.', 'Para a cobertura, ferva 1 colher de manteiga, 3 de chocolate em pó, 1 xícara de açúcar e 1/2 de leite até engrossar.'],
      'Faça o teste do palito: se sair limpo, o bolo está pronto.', 'bolo cenoura chocolate sobremesa doce'],
    'pao-de-queijo': ['Pão de queijo mineiro', '40 min', '30 unidades',
      ['500 g de polvilho doce', '1 xícara de leite', '1/2 xícara de óleo', '1 colher (chá) de sal', '2 ovos', '200 g de queijo meia cura ralado'],
      ['Ferva o leite com o óleo e o sal.', 'Despeje sobre o polvilho e misture bem.', 'Quando amornar, junte os ovos e o queijo e sove até ficar uma massa lisa.', 'Faça bolinhas e coloque numa assadeira untada.', 'Asse em forno a 200 °C por 25 minutos, até dourar.'],
      'Unte as mãos com óleo para enrolar as bolinhas.', 'pao queijo mineiro lanche polvilho cafe'],
    brigadeiro: ['Brigadeiro de panela', '20 min', '25 unidades',
      ['1 lata de leite condensado', '1 colher (sopa) de manteiga', '4 colheres (sopa) de chocolate em pó', 'Chocolate granulado para enrolar'],
      ['Coloque o leite condensado, a manteiga e o chocolate numa panela.', 'Mexa em fogo baixo, sem parar, até desgrudar do fundo.', 'Deixe esfriar, faça bolinhas e passe no granulado.'],
      'Quer comer de colher? Desligue o fogo um pouco antes.', 'brigadeiro doce festa chocolate aniversario'],
    'arroz-carreteiro': ['Arroz carreteiro', '45 min', '6 porções',
      ['2 xícaras de arroz', '300 g de carne seca dessalgada e desfiada', '1 cebola picada', '2 dentes de alho', '1 tomate picado', 'Cheiro-verde a gosto'],
      ['Refogue o alho e a cebola num fio de óleo.', 'Junte a carne seca e deixe fritar um pouco.', 'Acrescente o arroz e o tomate e refogue.', 'Coloque 4 xícaras de água quente e cozinhe até secar.', 'Finalize com cheiro-verde.'],
      'Deixe a carne seca de molho na véspera, trocando a água algumas vezes.', 'arroz carne seca almoco prato principal'],
    tapioca: ['Tapioca recheada', '10 min', '2 unidades',
      ['4 colheres (sopa) de goma de tapioca', 'Recheio a gosto: queijo, coco, banana com canela'],
      ['Aqueça uma frigideira antiaderente, sem óleo.', 'Espalhe a goma peneirada, formando um disco.', 'Quando grudar, coloque o recheio e dobre ao meio.'],
      'Peneire a goma para a tapioca ficar lisinha.', 'tapioca cafe da manha lanche rapido'],
    'suco-verde': ['Suco verde refrescante', '5 min', '2 copos',
      ['1 folha de couve', 'Suco de 2 laranjas', '1 maçã', '1 pedaço de gengibre', 'Gelo a gosto'],
      ['Bata tudo no liquidificador.', 'Coe se preferir e sirva gelado.'],
      'Tome logo depois de preparar.', 'suco verde couve laranja saudavel bebida'],
  };
  const COMENTARIOS = [['Dona Maria', 'Fiz ontem e a família amou! Obrigada pela receita.'], ['Carlos', 'Ficou ótimo, só coloquei um pouco menos de açúcar.'],
    ['Joana', 'Receita fácil de verdade. Recomendo!'], ['Seu Antônio', 'Minha neta me ajudou a achar no computador. Deu certo!']];

  site('cozinhafacil.com.br', {
    nome: 'Cozinha Fácil', icone: '🍰', seguro: true,
    abrir({ caminho }) {
      const cab = `<header class="cf-cabecalho">${link('cozinhafacil.com.br', '🍰 Cozinha Fácil')}<nav>${link('cozinhafacil.com.br', 'Receitas')}</nav></header>`;
      const slug = caminho.startsWith('/receita/') ? caminho.slice(9) : null;
      if (slug && RECEITAS[slug]) {
        const [titulo, tempo, porcoes, ingredientes, preparo, dica] = RECEITAS[slug];
        return {
          titulo: `${titulo} – Cozinha Fácil`,
          conteudo: `${cab}<article class="cf-receita"><h1>${titulo}</h1><p class="cf-info">⏱️ ${tempo} · 🍽️ Rende ${porcoes}</p>
            <h2>Ingredientes</h2><ul>${ingredientes.map((i) => `<li>${i}</li>`).join('')}</ul>
            <h2>Modo de preparo</h2><ol>${preparo.map((i) => `<li>${i}</li>`).join('')}</ol>
            <p class="cf-dica">💡 Dica: ${dica}</p>
            <h2>Comentários</h2>${COMENTARIOS.map(([n, c]) => `<div class="cf-comentario"><b>${n}</b><p>${c}</p></div>`).join('')}
            <h2>Outras receitas</h2><ul>${Object.keys(RECEITAS).filter((s) => s !== slug).map((s) => `<li>${link('cozinhafacil.com.br/receita/' + s, RECEITAS[s][0], `data-receita="${s}"`)}</li>`).join('')}</ul>
            <p class="cf-fim">— Fim da receita —</p></article>`,
        };
      }
      return {
        titulo: 'Cozinha Fácil – receitas simples e gostosas',
        conteudo: `${cab}<div class="cf-inicio"><h1>Receitas simples e gostosas</h1><div class="cf-grade">
          ${Object.entries(RECEITAS).map(([s, r]) => `<a href="#" class="cf-cartao" data-link="cozinhafacil.com.br/receita/${s}" data-receita="${s}"><b>${r[0]}</b><span>⏱️ ${r[1]}</span></a>`).join('')}</div></div>`,
      };
    },
  });
  Object.entries(RECEITAS).forEach(([s, r]) => indexar('cozinhafacil.com.br/receita/' + s, `Receita de ${r[0].toLowerCase()} – Cozinha Fácil`, `Ingredientes: ${r[3].slice(0, 3).join(', ')}... Pronto em ${r[1]}.`, 'receita ' + r[6]));

  // ================= Jornal do Bairro (notícias) =================
  const NOTICIAS = {
    vacinacao: ['Saúde', 'Campanha de vacinação contra a gripe começa na segunda-feira', '12/05', [
      'A campanha de vacinação contra a gripe começa na próxima segunda-feira em todos os postos de saúde do município.',
      'Podem se vacinar idosos, crianças de 6 meses a 6 anos, gestantes e professores. Leve um documento com foto e o cartão de vacina.',
      'Os postos funcionam das 8h às 17h. A vacina é gratuita.']],
    'feira-livre': ['Cidade', 'Feira livre ganha novo horário aos sábados', '11/05', [
      'A feira livre do bairro passa a funcionar aos sábados das 6h às 13h, uma hora a mais do que antes.',
      'São mais de 40 barracas com frutas, verduras, queijos e artesanato local.']],
    'praca-nova': ['Cidade', 'Praça do bairro é reformada e ganha academia ao ar livre', '10/05', [
      'A praça central foi reformada e ganhou novos bancos, iluminação e uma academia ao ar livre.',
      'A inauguração será no sábado, com música e pipoca para as crianças.']],
    'curso-informatica': ['Educação', 'Curso gratuito de informática tem inscrições abertas', '09/05', [
      'O centro comunitário abriu inscrições para o curso gratuito de informática básica, para crianças e adultos.',
      'As aulas ensinam a usar o mouse, o teclado, o Editor de Texto e a internet com segurança.',
      'As inscrições podem ser feitas na secretaria do centro, com documento e comprovante de endereço.']],
    'video-falso': ['Segurança', 'Apresentador Carlos Mendes avisa: vídeo dele pedindo investimento é falso', '13/05', [
      'Circula na internet um vídeo em que o apresentador Carlos Mendes oferece um investimento que transformaria R$ 200 em R$ 5.000 em 7 dias.',
      'O vídeo é falso: foi montado com inteligência artificial, que imita o rosto e a voz das pessoas. O apresentador nunca fez esse anúncio.',
      'Desconfie de famosos pedindo dinheiro em anúncios, de promessas de lucro rápido e de pressa. Denuncie o anúncio e não clique no link.']],
    'golpe-pix': ['Segurança', 'Polícia alerta para golpe do falso parente pedindo Pix', '08/05', [
      'A polícia alerta moradores para um golpe comum: alguém manda mensagem dizendo que é um parente que trocou de número e pede um Pix urgente.',
      'Antes de qualquer transferência, ligue para o número antigo da pessoa e confirme. Na dúvida, não faça o Pix.']],
  };
  site('jornaldobairro.com.br', {
    nome: 'Jornal do Bairro', icone: '📰', seguro: true,
    abrir({ caminho }) {
      const cab = `<header class="jb-cabecalho">${link('jornaldobairro.com.br', '📰 JORNAL DO BAIRRO')}<span>Notícias da nossa comunidade</span></header>`;
      const anuncio = `<div class="jb-publicidade"><small>Publicidade</small>
        ${link('megaofertas-barato.net', '📱 CELULAR TOP DE LINHA POR APENAS R$ 99!!! Só hoje, clique aqui!', 'class="jb-anuncio" data-anuncio="megaofertas"')}
        ${link('ganhe-premio-agora.net', '🎁 Você foi sorteado! Resgate seu prêmio agora', 'class="jb-anuncio rosa" data-anuncio="premio"')}</div>`;
      const slug = caminho.startsWith('/noticia/') ? caminho.slice(9) : null;
      if (slug && NOTICIAS[slug]) {
        const [cat, titulo, data, texto] = NOTICIAS[slug];
        return { titulo: `${titulo} – Jornal do Bairro`, conteudo: `${cab}<div class="jb-corpo"><article class="jb-noticia"><span class="jb-cat">${cat}</span><h1>${titulo}</h1><p class="jb-data">Publicado em ${data}</p>${texto.map((t) => `<p>${t}</p>`).join('')}<p>${link('jornaldobairro.com.br', '← Voltar para as notícias')}</p></article>${anuncio}</div>` };
      }
      return {
        titulo: 'Jornal do Bairro – notícias da comunidade',
        conteudo: `${cab}<div class="jb-corpo"><div class="jb-lista">${Object.entries(NOTICIAS).map(([s, n]) => `<div class="jb-item"><span class="jb-cat">${n[0]}</span>${link('jornaldobairro.com.br/noticia/' + s, n[1], `data-noticia="${s}"`)}<small>${n[2]}</small></div>`).join('')}</div>${anuncio}</div>`,
      };
    },
  });
  Object.entries(NOTICIAS).forEach(([s, n]) => indexar('jornaldobairro.com.br/noticia/' + s, `${n[1]} – Jornal do Bairro`, n[3][0], 'noticia jornal ' + n[0]));

  // ================= Compra Certa (loja segura) =================
  const PRODUTOS = [
    ['panela', '🍲', 'Jogo de panelas antiaderente (5 peças)', 189.9], ['liquidificador', '🥤', 'Liquidificador 3 velocidades', 129.9],
    ['ventilador', '🌀', 'Ventilador de mesa 40 cm', 149.9], ['cadeira', '🪑', 'Cadeira de escritório', 349.0],
    ['fone', '🎧', 'Fone de ouvido com microfone', 59.9], ['livro', '📘', 'Livro "Informática para todos"', 39.9],
    ['mochila', '🎒', 'Mochila escolar', 89.9], ['celular', '📱', 'Celular 128 GB', 1299.0],
  ].map(([id, icone, nome, preco]) => ({ id, icone, nome, preco }));
  const totalCarrinho = (c) => c.reduce((s, id) => s + PRODUTOS.find((p) => p.id === id).preco, 0);

  site('compracerta.com.br', {
    nome: 'Compra Certa', icone: '🛍️', seguro: true,
    abrir({ caminho, busca, estado }) {
      const qtd = estado.carrinho.length;
      const cab = `<header class="cc-cabecalho">${link('compracerta.com.br', '🛍️ Compra Certa')}<span class="cc-confianca">🔒 Compra segura · Troca grátis em 7 dias</span>${link('compracerta.com.br/carrinho', `🛒 Carrinho (${qtd})`, 'class="cc-carrinho-link" data-carrinho')}</header>`;
      const rodape = '<footer class="cc-rodape">Compra Certa Comércio Ltda · CNPJ 00.000.000/0001-00 · Atendimento: (69) 3000-0000 · Política de privacidade · Site de TREINO do curso de informática</footer>';
      if (caminho.startsWith('/produto/')) {
        const p = PRODUTOS.find((x) => x.id === caminho.slice(9));
        if (p) return { titulo: `${p.nome} – Compra Certa`, conteudo: `${cab}<div class="cc-produto"><div class="cc-foto">${p.icone}</div><div><h1>${p.nome}</h1><p class="cc-preco">${real(p.preco)}</p><p>ou 3x de ${real(p.preco / 3)} sem juros</p><button class="cc-botao" data-site-acao="adicionar" data-id="${p.id}">Adicionar ao carrinho 🛒</button><p class="cc-entrega">🚚 Entrega em até 7 dias úteis</p></div></div>${rodape}` };
      }
      if (caminho === '/carrinho') {
        const itens = estado.carrinho.map((id, i) => { const p = PRODUTOS.find((x) => x.id === id); return `<tr><td>${p.icone} ${p.nome}</td><td>${real(p.preco)}</td><td><button class="cc-remover" data-site-acao="remover" data-indice="${i}">Remover</button></td></tr>`; }).join('');
        return {
          titulo: 'Seu carrinho – Compra Certa',
          conteudo: `${cab}<div class="cc-pagina"><h1>🛒 Seu carrinho</h1>${qtd ? `<table class="cc-tabela">${itens}</table><p class="cc-total">Total: <b>${real(totalCarrinho(estado.carrinho))}</b></p>${link('compracerta.com.br/finalizar', 'Finalizar compra →', 'class="cc-botao" data-finalizar')}` : `<p>Seu carrinho está vazio. ${link('compracerta.com.br', 'Ver produtos')}</p>`}</div>${rodape}`,
        };
      }
      if (caminho === '/finalizar') {
        if (!qtd) return { titulo: 'Carrinho vazio', conteudo: `${cab}<div class="cc-pagina"><p>Seu carrinho está vazio. ${link('compracerta.com.br', 'Ver produtos')}</p></div>` };
        return {
          titulo: 'Finalizar compra – Compra Certa',
          conteudo: `${cab}<div class="cc-pagina"><h1>Finalizar compra</h1><p class="cc-aviso">⚠️ Este é um site de TREINO. Use dados inventados, nunca os seus dados de verdade.</p>
            <form class="cc-form" data-formulario="pedido">
              <label>Nome completo <input name="nome" required></label>
              <label>Endereço de entrega <input name="endereco" required></label>
              <label>CEP <input name="cep" required placeholder="00000-000"></label>
              <fieldset><legend>Forma de pagamento</legend>
                <label><input type="radio" name="pagamento" value="Pix" required> Pix</label>
                <label><input type="radio" name="pagamento" value="Boleto"> Boleto bancário</label></fieldset>
              <p class="cc-total">Total: <b>${real(totalCarrinho(estado.carrinho))}</b></p>
              <button class="cc-botao" type="submit">Confirmar pedido ✅</button>
            </form></div>${rodape}`,
        };
      }
      if (caminho === '/pedido') {
        return { titulo: 'Pedido confirmado – Compra Certa', conteudo: `${cab}<div class="cc-pagina cc-confirmado"><h1>✅ Pedido nº ${e(busca.n || '')} confirmado!</h1><p>Forma de pagamento: <b>${e(busca.pg || '')}</b>.</p><p>Num site de verdade, você receberia a confirmação por e-mail.</p>${link('compracerta.com.br', 'Voltar para a loja')}</div>${rodape}` };
      }
      return {
        titulo: 'Compra Certa – loja online',
        conteudo: `${cab}<div class="cc-pagina"><h1>Ofertas da semana</h1><div class="cc-grade">${PRODUTOS.map((p) => `<a href="#" class="cc-cartao" data-link="compracerta.com.br/produto/${p.id}" data-produto="${p.id}"><span class="cc-foto pequena">${p.icone}</span><b>${p.nome}</b><span class="cc-preco">${real(p.preco)}</span></a>`).join('')}</div></div>${rodape}`,
      };
    },
    acao(nome, el, ctx) {
      if (nome === 'adicionar') {
        ctx.estado.carrinho.push(el.dataset.id);
        CE.emitir('loja:carrinho', { produto: el.dataset.id, itens: ctx.estado.carrinho.length });
        CE.avisar('🛒 Produto adicionado ao carrinho!');
        ctx.ir('compracerta.com.br/carrinho');
      }
      if (nome === 'remover') {
        ctx.estado.carrinho.splice(Number(el.dataset.indice), 1);
        CE.emitir('loja:removido', { itens: ctx.estado.carrinho.length });
        ctx.ir('compracerta.com.br/carrinho');
      }
    },
    enviar(formulario, dados, ctx) {
      if (formulario !== 'pedido') return;
      const total = totalCarrinho(ctx.estado.carrinho);
      const numero = String(Math.floor(10000 + Math.random() * 89999));
      ctx.estado.carrinho = [];
      CE.emitir('loja:compra', { total, pagamento: dados.pagamento, dados });
      ctx.ir(`compracerta.com.br/pedido?n=${numero}&pg=${encodeURIComponent(dados.pagamento)}`);
    },
  });
  indexar('compracerta.com.br', 'Compra Certa – loja online com compra segura', 'Panelas, eletrodomésticos, móveis, livros e celulares. Troca grátis em 7 dias.', 'loja comprar compra online panela liquidificador ventilador celular fone livro mochila oferta');

  // ================= Sinais de golpe (página de alerta compartilhada) =================
  const alerta = (oQue) => `<div class="golpe-alerta"><h1>⚠️ Cuidado! Isto era um GOLPE (de treino)</h1>
    <p>${oQue} Num site de verdade, seus dados e seu dinheiro teriam ido para os golpistas.</p>
    <h2>Sinais que mostravam que era golpe:</h2>
    <ul><li>🔓 A barra de endereço mostrava <b>"Não seguro"</b>, sem o cadeado.</li>
    <li>🌐 O endereço era estranho, cheio de palavras como "barato", "grátis", "prêmio".</li>
    <li>💸 Preço bom demais para ser verdade, ou prêmio sem você ter participado de sorteio.</li>
    <li>⏰ Pressa: "só hoje", "acaba em 5 minutos".</li>
    <li>🔑 Pedia senha do cartão ou código de segurança. Lojas sérias NUNCA pedem a senha do cartão.</li></ul>
    <p><b>Dica:</b> na dúvida, feche a página e pergunte para alguém de confiança.</p>
    ${link('inicio', '🏠 Voltar para a página inicial', 'class="golpe-voltar"')}</div>`;

  // ================= Mega Ofertas (loja falsa) =================
  const FALSOS = [['celular', '📱', 'Celular Top de Linha 512 GB', 99], ['tv', '📺', 'TV 65 polegadas 4K', 199], ['geladeira', '🧊', 'Geladeira duas portas', 149], ['notebook', '💻', 'Notebook gamer', 129]];
  site('megaofertas-barato.net', {
    nome: 'Mega Ofertas', icone: '💥', seguro: false, golpe: true,
    abrir({ caminho, busca }) {
      if (caminho === '/alerta') return { titulo: 'Atenção: golpe!', conteudo: alerta('Você digitou dados de cartão num site falso.') };
      const cab = '<header class="mo-cabecalho">💥 MEGA OFERTAS BARATO 💥<span>⏰ AS OFERTAS ACABAM EM 04:59!!!</span></header>';
      if (caminho === '/comprar') {
        const p = FALSOS.find((f) => f[0] === busca.id) || FALSOS[0];
        return {
          titulo: 'PAGAMENTO – Mega Ofertas',
          conteudo: `${cab}<div class="mo-pagina"><h1>Você está comprando: ${p[1]} ${p[2]} por R$ ${p[3]},00!!!</h1><p class="mo-pressa">Pague AGORA ou perde a promoção!</p>
            <form class="mo-form" data-formulario="cartao">
              <label>Número do cartão <input name="cartao"></label>
              <label>Senha do cartão <input name="senha" type="password"></label>
              <label>Código de segurança (atrás do cartão) <input name="cvv"></label>
              <button class="mo-botao" type="submit">PAGAR AGORA 💳</button></form></div>`,
        };
      }
      return {
        titulo: '💥 MEGA OFERTAS – TUDO QUASE DE GRAÇA',
        conteudo: `${cab}<div class="mo-pagina"><h1>🔥 PREÇOS IMPOSSÍVEIS SÓ HOJE 🔥</h1><div class="mo-grade">${FALSOS.map((p) => `<div class="mo-cartao"><span class="mo-foto">${p[1]}</span><b>${p[2]}</b><s>R$ ${(p[3] * 30).toLocaleString('pt-BR')},00</s><span class="mo-preco">R$ ${p[3]},00</span>${link('megaofertas-barato.net/comprar?id=' + p[0], 'COMPRAR JÁ!!!', `class="mo-botao" data-falso="${p[0]}"`)}</div>`).join('')}</div></div>`,
      };
    },
    enviar(formulario, dados, ctx) {
      if (formulario !== 'cartao') return;
      ctx.caiuNoGolpe();
      ctx.ir('megaofertas-barato.net/alerta');
    },
  });
  indexar('megaofertas-barato.net', 'MEGA OFERTAS – Celular por R$ 99 e TV por R$ 199', 'Preços impossíveis só hoje!!! Corra antes que acabe!!!', 'celular tv televisao barato oferta promocao notebook geladeira');

  // ================= Prêmio falso =================
  site('ganhe-premio-agora.net', {
    nome: 'Prêmio', icone: '🎁', seguro: false, golpe: true,
    abrir({ caminho }) {
      if (caminho === '/alerta') return { titulo: 'Atenção: golpe!', conteudo: alerta('Você clicou para "resgatar" um prêmio de um sorteio do qual nunca participou.') };
      return {
        titulo: '🎉 PARABÉNS!!! VOCÊ GANHOU!!!',
        conteudo: `<div class="pf-pagina"><div class="pf-confete">🎉🎁🎉</div><h1>PARABÉNS!!!</h1><p class="pf-grande">Você é o visitante número 1.000.000 e ganhou um <b>CELULAR NOVO</b>!</p>
          <p class="pf-pressa">⏰ Resgate em até 5 minutos ou o prêmio vai para outra pessoa!</p>
          <button class="pf-botao" data-site-acao="resgatar">RESGATAR MEU PRÊMIO AGORA</button>
          <p class="pf-pequeno">Para receber, basta pagar a taxa de entrega de R$ 19,90 e informar seus dados.</p>
          <p>${link('inicio', 'Não, obrigado', 'class="pf-nao" data-nao-obrigado')}</p></div>`,
      };
    },
    acao(nome, _el, ctx) {
      if (nome === 'resgatar') { ctx.caiuNoGolpe(); ctx.ir('ganhe-premio-agora.net/alerta'); }
    },
  });
  indexar('ganhe-premio-agora.net', 'Ganhe um celular grátis – resgate seu prêmio', 'Você foi sorteado! Resgate agora seu prêmio grátis.', 'premio gratis sorteio ganhar celular');

  // ================= Procura (buscador) =================
  const PARADAS = new Set(['de', 'da', 'do', 'das', 'dos', 'a', 'o', 'as', 'os', 'e', 'para', 'com', 'como', 'que', 'em', 'no', 'na', 'um', 'uma', 'qual', 'quem', 'fazer', 'receita']);
  function pesquisar(termo) {
    const palavras = semAcento(termo).split(/[^a-z0-9-]+/).filter((p) => p.length > 1);
    const uteis = palavras.filter((p) => !PARADAS.has(p));
    const busca = uteis.length ? uteis : palavras;
    return CE.INDICE_BUSCA.map((item) => {
      const t = semAcento(item.titulo), d = semAcento(item.descricao), k = semAcento(item.palavras);
      const pontos = busca.reduce((s, p) => s + (t.includes(p) ? 3 : 0) + (k.includes(p) ? 2 : 0) + (d.includes(p) ? 1 : 0), 0);
      return { item, pontos };
    }).filter((r) => r.pontos > 0).sort((a, b) => b.pontos - a.pontos).map((r) => r.item);
  }
  CE.pesquisarNaInternet = pesquisar;

  const formBusca = (valor = '') => `<form class="pr-form" data-formulario="busca"><input name="q" class="pr-campo" value="${e(valor)}" placeholder="Pesquisar no Procura" aria-label="Pesquisar" autocomplete="off"><button class="pr-botao" type="submit">🔍 Pesquisar</button></form>`;
  site('procura.com.br', {
    nome: 'Procura', icone: '🔍', seguro: true,
    abrir({ caminho, busca }) {
      if (caminho === '/busca' && busca.q) {
        const resultados = pesquisar(busca.q);
        const temAnuncio = /celular|tv|televis|oferta|promo|barat|comprar|loja|notebook/.test(semAcento(busca.q));
        const anuncio = temAnuncio ? `<div class="pr-resultado pr-anuncio"><small>Anúncio</small>${link('megaofertas-barato.net', 'MEGA OFERTAS – Celular por R$ 99!!!', 'class="pr-titulo" data-resultado="megaofertas-barato.net"')}<div class="pr-url">http://www.megaofertas-barato.net</div><p>Preços impossíveis só hoje. Corra!</p></div>` : '';
        return {
          titulo: `${busca.q} – Pesquisa Procura`,
          conteudo: `<div class="pr-topo"><span class="pr-logo pequeno">${link('procura.com.br', '<b>Procura</b>')}</span>${formBusca(busca.q)}</div>
            <div class="pr-resultados"><p class="pr-quantos">${resultados.length ? `Aproximadamente ${resultados.length} resultado${resultados.length > 1 ? 's' : ''}` : 'Nenhum resultado encontrado. Tente outras palavras, como "bolo", "Rondônia" ou "vacina".'}</p>
            ${anuncio}${resultados.map((r) => `<div class="pr-resultado">${link(r.url, e(r.titulo), `class="pr-titulo" data-resultado="${r.url}"`)}<div class="pr-url">${CE.navegadorUtil.exibir(r.url)}</div><p>${e(r.descricao)}</p></div>`).join('')}</div>`,
        };
      }
      return { titulo: 'Procura – pesquise na internet', conteudo: `<div class="pr-inicio"><div class="pr-logo">Procura</div>${formBusca()}<p class="pr-sugestoes">Experimente pesquisar: bolo de cenoura · capital de Rondônia · vacina · planetas</p></div>` };
    },
  });

  // ================= Página inicial e página de erro =================
  CE.paginaInicial = ({ favoritos }) => {
    const atalhos = Object.values(CE.SITES).filter((s) => !s.golpe);
    return {
      titulo: 'Nova aba',
      conteudo: `<div class="pi-pagina"><div class="pr-logo">Procura</div>${formBusca()}
        <div class="pi-atalhos">${atalhos.map((s) => `<a href="#" class="pi-atalho" data-link="${s.dominio}" data-atalho="${s.dominio}"><span>${s.icone}</span>${s.nome}</a>`).join('')}</div>
        <p class="pi-dica">Dica: clique na barra de endereço lá em cima e digite o endereço de um site, como <b>cozinhafacil.com.br</b>, e aperte Enter.</p></div>`,
    };
  };

  CE.paginaNaoEncontrada = ({ dominio, url }) => {
    // Sugere sites com o começo do nome parecido (ex.: "cozinhafacio" -> "cozinhafacil.com.br").
    const prefixo = (a, b) => { let i = 0; while (i < a.length && a[i] === b[i]) i++; return i; };
    const nome = dominio.split('.')[0];
    const parecidos = Object.keys(CE.SITES).filter((d) => !CE.SITES[d].golpe && (prefixo(d.split('.')[0], nome) >= Math.min(5, nome.length) || dominio.includes(d.split('.')[0])));
    return {
      titulo: 'Site não encontrado',
      conteudo: `<div class="erro-pagina"><div class="erro-icone">😕</div><h1>Não foi possível encontrar este site</h1>
        <p>Confira se o endereço <b>${e(url)}</b> foi digitado certinho, com os pontos no lugar certo.</p>
        ${parecidos.length ? `<p>Você quis dizer: ${parecidos.map((d) => link(d, d, `data-sugestao="${d}"`)).join(', ')}?</p>` : ''}
        <p>${link('procura.com.br/busca?q=' + encodeURIComponent(dominio), `🔍 Pesquisar "${e(dominio)}" no Procura`)}</p></div>`,
    };
  };
})();
