// Nível 3 — Dinheiro e dívidas (cartão e rotativo, à vista ou parcelado, empréstimo e CET, golpe do empréstimo) e
// Vender pela internet e MEI (anúncio com foto, golpe do comprovante falso, controle de vendas e lucro, abrir o MEI e
// pagar o DAS). Entram antes do projeto final e da prova; para quem já tinha passado na prova antes, ficam opcionais.
(function () {
  const { info, quiz, esperar, abrir, naJanela, abrirExemplo, planilhaDe, celula, perto } = CE.L;
  const NOVO_EM = '2026-11-13';
  const BANCO = 'bancoescola.com.br', FEIRA = 'feiraonline.com.br', MEI = 'empreendedor.org.br', GOLPE = 'creditojaaprovado.com';
  const nav = (s) => naJanela('navegador', s);
  const pl = (s) => naJanela('planilha', s);
  const td = (ref) => pl(`td[data-celula="${ref}"]`);
  const editou = (texto, teste, extra = {}) => esperar(texto, ['planilha:editada', 'planilha:preenchida', 'planilha:colada'], () => teste(), { jaFeito: () => !!CE.planilhaAtiva && teste(), ...extra });
  const abrirEm = (url) => () => { if (CE.janelas.estaAberta('navegador')) CE.janelas.abrir('navegador', { url }); };
  const irAo = (url, extra = {}) => abrir('navegador', 'Navegador', { preparar: abrirEm(url), ...extra });
  let ultima = {};
  CE.ouvir('navegador:visitou', (d) => { ultima = d || {}; });
  const naPagina = (dominio, caminho) => ultima.dominio === dominio && (caminho == null || ultima.caminho === caminho);
  const visitar = (texto, dominio, caminho, extra = {}) => esperar(texto, 'navegador:visitou', (d) => d.dominio === dominio && (caminho == null || d.caminho === caminho), { mouse: 'esquerdo', jaFeito: () => naPagina(dominio, caminho), ...extra });
  const bancoLogado = () => !!(CE.navegadorEstado && CE.navegadorEstado.banco && CE.navegadorEstado.banco.logado);
  const entrarNoBanco = () => esperar('Entre no banco com a conta de treino: agência 0001, conta 12345-6 e senha 1234.', 'banco:login', null, { destacar: nav('.bc-form'), mouse: 'esquerdo', jaFeito: bancoLogado });

  // A dívida de R$ 850 no rotativo, a 14,5% ao mês, mês a mês.
  const DIVIDA = (m) => 850 * 1.145 ** m;
  const ROTATIVO = planilhaDe([['Mês', 'Dívida no rotativo'], ['0', '850'], ...Array.from({ length: 12 }, (_, i) => [String(i + 1)])]);
  const TV = planilhaDe([['Forma de pagamento', 'Parcelas', 'Valor da parcela', 'Total'], ['À vista (10% de desconto)', '1', '1800'], ['10x sem juros', '10', '200'], ['12x no carnê', '12', '199']]);
  const VENDAS = [['Dia', 'Produto', 'Quantidade', 'Preço', 'Custo', 'Total', 'Lucro'], ['Segunda', 'Bolo de pote', '8', '12', '5'], ['Terça', 'Bolo de pote', '10', '12', '5'],
    ['Quarta', 'Brigadeiro (cento)', '2', '90', '40'], ['Quinta', 'Bolo de pote', '12', '12', '5'], ['Sexta', 'Brigadeiro (cento)', '3', '90', '40']];
  const num = (t) => Number(String(t).replace(',', '.'));
  const totalDe = (l) => num(VENDAS[l][2]) * num(VENDAS[l][3]);
  const lucroDe = (l) => num(VENDAS[l][2]) * (num(VENDAS[l][3]) - num(VENDAS[l][4]));
  const fotoDoBolo = () => CE.L.garantirArquivo('Foto do bolo de pote', CE.celular.imagemDe({ cena: 'bolo' }), 'imagem');

  // ======================= 💰 Dinheiro e dívidas =======================
  CE.adicionarModulo({
    id: 'n3-dinheiro', nivel: 'n3', titulo: 'Dinheiro e dívidas', icone: '💰', antes: 'n3-projeto', novoEm: NOVO_EM,
    licoes: [
      {
        id: 'n3-din-cartao', titulo: 'Cartão de crédito: a fatura e o rotativo', icone: '💳',
        descricao: 'Pagar o total da fatura e ver quanto cresce a dívida do rotativo.',
        passos: [
          info('No cartão de crédito você compra hoje e paga tudo junto no mês seguinte, na FATURA. Ela mostra o TOTAL e um "pagamento mínimo". Pagar só o mínimo parece alívio, mas o resto vira dívida no ROTATIVO, um dos juros mais caros do Brasil.', { emoji: '💳', preparar: () => CE.negocios.novaFatura() }),
          irAo(BANCO),
          visitar('Na barra de endereço, digite  bancoescola.com.br  e aperte Enter.', BANCO, null, { destacar: nav('.nav-endereco-caixa') }),
          entrarNoBanco(),
          visitar('Clique em "💳 Cartão" para ver a fatura.', BANCO, '/cartao', { destacar: nav('[data-banco="cartao"]') }),
          quiz('Se eu pagar só o mínimo da fatura, o que falta...', ['Vira dívida no rotativo, com juros altíssimos', 'Some: o banco perdoa', 'Fica para o ano que vem, sem juros'], 0),
          esperar('Pague do jeito certo: clique em "Pagar o total".', 'banco:fatura', (d) => d.opcao === 'total', { destacar: nav('[data-site-acao="fatura-total"]'), mouse: 'esquerdo' }),
          info('Agora veja na planilha o que acontece com quem paga só o mínimo: sobram R$ 850, com juros de 14,5% AO MÊS.', { emoji: '📈', preparar: () => abrirExemplo('Rotativo do cartão', 'planilha', ROTATIVO, true) }),
          editou('Clique em B3 e escreva  =B2*1,145  (a dívida do mês anterior com 14,5% a mais). Aperte Enter.', () => perto(celula('B3'), DIVIDA(1)), { destacar: td('B3'), mouse: 'esquerdo', dica: '1,145 é o mesmo que 100% + 14,5%.' }),
          editou('Arraste a alça (o quadradinho no canto da B3) até a B14, para ver os 12 meses.', () => Math.abs((celula('B14') || 0) - DIVIDA(12)) < 0.01, { destacar: td('B3'), mouse: 'arrastar' }),
          quiz('Em 12 meses, a dívida de R$ 850 no rotativo virou...', ['Mais de R$ 4.000 (cinco vezes!)', 'R$ 900', 'R$ 1.000'], 0),
        ],
        conclusao: 'Agora você sabe: fatura do cartão se paga INTEIRA. 💳',
      },
      {
        id: 'n3-din-parcelado', titulo: 'À vista ou parcelado?', icone: '🧾',
        descricao: 'Comparar o total de cada forma de pagar na planilha.',
        passos: [
          info('A TV custa R$ 2.000. A loja oferece: à vista com 10% de desconto, 10x "sem juros" ou 12x no carnê. Qual sai mais barato? A planilha responde.', { emoji: '📺', preparar: () => abrirExemplo('Comprar a TV', 'planilha', TV, true) }),
          editou('Em D2, calcule o total (parcelas vezes o valor):  =B2*C2  e aperte Enter.', () => perto(celula('D2'), 1800), { destacar: td('D2'), mouse: 'esquerdo' }),
          editou('Arraste a alça da D2 até a D4.', () => perto(celula('D3'), 2000) && perto(celula('D4'), 2388), { destacar: td('D2'), mouse: 'arrastar' }),
          quiz('Qual forma de pagar sai mais barato?', ['À vista com desconto (R$ 1.800)', '10x sem juros (R$ 2.000)', '12x no carnê (R$ 2.388)'], 0),
          quiz('"10x sem juros" sai mais caro quando...', ['A loja dá desconto para quem paga à vista', 'A TV é grande', 'Nunca sai mais caro'], 0),
        ],
        conclusao: 'Antes de parcelar, compare o TOTAL. 🧾',
      },
      {
        id: 'n3-din-emprestimo', titulo: 'Empréstimo: compare o CET', icone: '💸',
        descricao: 'Simular crédito pessoal, consignado e cheque especial.',
        passos: [
          info('Antes de pegar empréstimo, pergunte: preciso mesmo? A parcela cabe no orçamento TODO mês? E compare o CET (Custo Efetivo Total): ele junta juros, tarifas e seguros. É o número certo para comparar.', { emoji: '💸' }),
          irAo(BANCO),
          visitar('Vá ao bancoescola.com.br.', BANCO, null, { destacar: nav('.nav-endereco-caixa') }),
          entrarNoBanco(),
          visitar('Clique em "💸 Empréstimo".', BANCO, '/emprestimo', { destacar: nav('[data-banco="emprestimo"]') }),
          esperar('Simule R$ 1.000,00 em 12 parcelas, no "Crédito pessoal", e clique em "Simular".', 'banco:emprestimo-simulado', (d) => d.tipo === 'pessoal' && d.valor === 1000 && d.parcelas === 12, { destacar: nav('.bc-form'), mouse: 'esquerdo' }),
          info('Veja a tabela: os mesmos R$ 1.000 custam bem diferente em cada tipo de crédito.', { destacar: nav('.ng-credito') }),
          quiz('Qual tipo de crédito tem o MENOR CET?', ['Consignado', 'Crédito pessoal', 'Cheque especial'], 0),
          quiz('O cheque especial é...', ['O mais caro: só para emergência, por poucos dias', 'Dinheiro extra que o banco dá de presente', 'O mais barato'], 0),
          quiz('Para comparar empréstimos, eu olho...', ['O CET (Custo Efetivo Total)', 'Só o valor da parcela', 'A cor do site'], 0),
        ],
        conclusao: 'Comparar o CET evita pagar muito mais pelo mesmo dinheiro! 💸',
      },
      {
        id: 'n3-din-golpe', titulo: 'Golpe do empréstimo fácil', icone: '🚨',
        descricao: 'Reconhecer o golpe da taxa antecipada.',
        passos: [
          info('Chegou uma mensagem no WhatsApp: "EMPRÉSTIMO APROVADO NA HORA, sem consulta ao SPC! Acesse creditojaaprovado.com". Vamos olhar o site com olho de detetive, SEM digitar nada.', { emoji: '🚨' }),
          irAo(GOLPE),
          visitar('Digite  creditojaaprovado.com  na barra de endereço e aperte Enter.', GOLPE, null, { destacar: nav('.nav-endereco-caixa') }),
          quiz('Qual destes é o maior sinal de golpe nesta página?', ['Pedir uma taxa ANTES de liberar o dinheiro', 'Ter letras grandes', 'Ter a cor amarela'], 0),
          quiz('"Sem consulta ao SPC", "negativado pode" e "só hoje" querem dizer...', ['Promessa boa demais e pressa: cuidado', 'Que é um banco sério', 'Que é do governo'], 0),
          esperar('NÃO preencha nada! Saia do site: clique em ← (Voltar) ou digite  bancoescola.com.br  na barra de endereço.', 'golpe:evitado', null, { destacar: [nav('[data-acao="voltar"]'), nav('.nav-endereco-caixa')], mouse: 'esquerdo' }),
          quiz('Pediram taxa, depósito ou "seguro" para liberar um empréstimo. É...', ['Golpe: banco de verdade nunca pede antes', 'Normal', 'Garantia de que vai dar certo'], 0),
        ],
        conclusao: 'Você escapou do golpe do empréstimo! 🚨',
      },
      {
        id: 'n3-din-desafio', titulo: 'Desafio do dinheiro', icone: '🏅', desafio: true,
        descricao: 'Fatura sem juros e o crédito mais barato.',
        passos: [
          info('Desafio! No Banco Escola, faça sozinho. Clique em "Continuar".', { preparar: () => { CE.negocios.novaFatura(); CE.janelas.abrir('navegador', { url: BANCO }); } }),
          esperar('Pague a fatura do cartão do jeito que NÃO cobra juros.', 'banco:fatura', (d) => d.opcao === 'total'),
          esperar('Simule R$ 2.000,00 em 24 parcelas no tipo de crédito com o MENOR CET.', 'banco:emprestimo-simulado', (d) => d.tipo === 'consignado' && d.valor === 2000 && d.parcelas === 24),
        ],
        conclusao: 'Desafio vencido: bolso no azul! 🏅',
      },
    ],
  });

  // ======================= 🛒 Vender pela internet e MEI =======================
  CE.adicionarModulo({
    id: 'n3-vendas', nivel: 'n3', titulo: 'Vender pela internet e MEI', icone: '🛒', antes: 'n3-projeto', novoEm: NOVO_EM,
    licoes: [
      {
        id: 'n3-ven-anuncio', titulo: 'Anunciar na internet com foto', icone: '📢',
        descricao: 'Publicar um anúncio com foto, preço e descrição.',
        passos: [
          info('Dá para vender bolo, artesanato, roupa ou serviço pela internet, em sites de classificados (como a OLX ou o Marketplace do Facebook). Aqui treinamos na "Feira Online". A foto do bolo de pote já está em Meus Documentos.', { emoji: '📢', preparar: fotoDoBolo }),
          irAo(FEIRA),
          visitar('Digite  feiraonline.com.br  na barra de endereço e aperte Enter.', FEIRA, null, { destacar: nav('.nav-endereco-caixa') }),
          visitar('Clique em "📢 Anunciar".', FEIRA, '/anunciar', { destacar: nav('[data-feira="anunciar"]') }),
          esperar('Clique em "📷 Escolher foto" e escolha "Foto do bolo de pote".', 'feira:foto', null, { destacar: [nav('[data-site-acao="escolher-foto"]'), '.escolher-arquivo [data-escolher="Foto do bolo de pote"]'], mouse: 'esquerdo' }),
          esperar('Escreva o título (ex.: Bolo de pote de chocolate), o preço (12,00), escolha a categoria "Comida", escreva a descrição (sabor, tamanho, como entrega) e clique em "Publicar anúncio".', 'feira:anuncio', (d) => d.foto && d.preco > 0, {
            destacar: nav('.fo-form'), mouse: 'esquerdo', dica: 'A descrição precisa de pelo menos 15 letras. Exemplo: "Bolo de chocolate com brigadeiro, 250 ml. Entrego no bairro."',
          }),
          quiz('Num anúncio, eu NÃO devo colocar...', ['O meu endereço e o meu documento', 'Uma foto boa do produto', 'O preço'], 0),
        ],
        conclusao: 'Anúncio no ar! 📢',
      },
      {
        id: 'n3-ven-comprovante', titulo: 'Golpe do comprovante falso', icone: '🧾',
        descricao: 'Conferir no extrato antes de entregar o produto.',
        passos: [
          info('Chegou mensagem de um comprador no seu anúncio. Atenção a um golpe muito comum: o "comprador" manda um COMPROVANTE de Pix falso (feito em aplicativo de montagem) e pede para entregar na hora.', {
            emoji: '🧾', preparar: async () => { await CE.negocios.garantirAnuncio(); CE.negocios.reiniciarConversa(); CE.janelas.abrir('navegador', { url: `${FEIRA}/mensagens` }); },
          }),
          abrir('navegador', 'Navegador'),
          visitar('Na Feira Online, clique em "💬 Mensagens".', FEIRA, '/mensagens', { destacar: nav('[data-feira="mensagens"]') }),
          info('Repare: ele mandou um "comprovante" e está com MUITA pressa. Pressa é a arma do golpista.', { destacar: nav('[data-comprovante-falso]') }),
          esperar('Clique em "🏦 Vou conferir no meu banco".', 'feira:conferir', null, { destacar: nav('[data-site-acao="feira-conferir"]'), mouse: 'esquerdo' }),
          entrarNoBanco(),
          visitar('Abra o "📄 Extrato" e procure o Pix do comprador.', BANCO, '/extrato', { destacar: nav('[data-banco="extrato"]') }),
          quiz('O Pix do comprador apareceu no seu extrato?', ['Não: o dinheiro NÃO caiu', 'Sim, está lá'], 0),
          visitar('Volte para a conversa: digite  feiraonline.com.br/mensagens  (ou clique em ← Voltar até chegar lá).', FEIRA, '/mensagens', { destacar: nav('.nav-endereco-caixa') }),
          esperar('Responda: "❌ O dinheiro ainda não caiu: só envio depois que cair".', 'feira:golpe-evitado', null, { destacar: nav('[data-site-acao="feira-recusar"]'), mouse: 'esquerdo' }),
          quiz('Para vender pela internet com segurança...', ['Só entrego depois que o dinheiro cair na MINHA conta', 'Confio no comprovante que mandaram', 'Entrego primeiro para não perder a venda'], 0),
        ],
        conclusao: 'O golpista foi embora de mãos vazias! 🧾',
      },
      {
        id: 'n3-ven-controle', titulo: 'Controle de vendas e lucro', icone: '📊',
        descricao: 'Total, lucro e soma da semana na planilha.',
        passos: [
          info('Quem vende precisa saber se está ganhando dinheiro. Faturamento é tudo o que entrou. LUCRO é o que sobra depois de pagar o custo (ingredientes, embalagem...). Abrimos a planilha das vendas da semana.', { emoji: '📊', preparar: () => abrirExemplo('Vendas da semana', 'planilha', planilhaDe(VENDAS), true) }),
          editou('Em F2, calcule o total da venda (quantidade vezes preço):  =C2*D2', () => perto(celula('F2'), totalDe(1)), { destacar: td('F2'), mouse: 'esquerdo' }),
          editou('Em G2, calcule o lucro (quantidade vezes preço menos custo):  =C2*(D2-E2)', () => perto(celula('G2'), lucroDe(1)), { destacar: td('G2'), mouse: 'esquerdo', dica: 'Os parênteses fazem a planilha calcular primeiro o preço menos o custo.' }),
          editou('Selecione F2 e G2 juntas e arraste a alça até a linha 6.', () => [2, 3, 4, 5].every((i) => perto(celula(`F${i + 1}`), totalDe(i)) && perto(celula(`G${i + 1}`), lucroDe(i))), { destacar: td('G2'), mouse: 'arrastar' }),
          editou('Em G7, some o lucro da semana:  =SOMA(G2:G6)', () => perto(celula('G7'), [1, 2, 3, 4, 5].reduce((s, i) => s + lucroDe(i), 0)), { destacar: td('G7'), mouse: 'esquerdo' }),
          quiz('Vendi R$ 810 na semana, mas o lucro foi R$ 460. Por quê?', ['Porque os ingredientes (o custo) também custam dinheiro', 'Porque a planilha errou', 'Porque o lucro é sempre a metade'], 0),
        ],
        conclusao: 'Agora você sabe quanto realmente ganha! 📊',
      },
      {
        id: 'n3-ven-mei', titulo: 'MEI: abrir de graça e pagar o DAS', icone: '🏪',
        descricao: 'Formalizar o MEI e pagar o imposto do mês no banco.',
        passos: [
          info('Com o MEI (Microempreendedor Individual) quem trabalha por conta própria ganha CNPJ, pode emitir nota fiscal e contribui para o INSS (aposentadoria e auxílio-doença), pagando só um imposto pequeno por mês, o DAS. Abrir é GRÁTIS, pela internet.', { emoji: '🏪' }),
          irAo(MEI),
          visitar('Digite  empreendedor.org.br  na barra de endereço e aperte Enter.', MEI, null, { destacar: nav('.nav-endereco-caixa') }),
          esperar('Clique em "📝 Formalize-se" e preencha: seu nome, o CPF de treino 123.456.789-09, a ocupação (ex.: Doceira / confeiteira), o bairro e marque a declaração. Clique em "Abrir o MEI".', 'mei:aberto', null, {
            destacar: [nav('[data-mei="formalizar"]'), nav('.cd-form')], mouse: 'esquerdo', jaFeito: () => !!CE.negocios.mei(),
          }),
          quiz('Quanto custa abrir o MEI?', ['Nada: é grátis', 'R$ 500 de taxa', 'Um salário mínimo'], 0),
          visitar('Vá para o painel do MEI (se não estiver nele, clique em "🧾 Já sou MEI: pagar o DAS").', MEI, null, { jaFeito: () => naPagina(MEI, '/painel') || naPagina(MEI, '/das') }),
          esperar('Clique em "🧾 Gerar o DAS de 10/2025".', 'mei:das-gerado', null, { destacar: nav('[data-site-acao="gerar-das"]'), mouse: 'esquerdo' }),
          esperar('Selecione o código de barras e copie (Ctrl+C). Vá ao bancoescola.com.br, entre e cole o código em "🧾 Pagar boleto" (Ctrl+V). Confira o beneficiário (Receita Federal — DAS do MEI) e pague com a senha 1234.', 'banco:boleto', (d) => /DAS/.test(d.beneficiario), {
            destacar: [nav('[data-codigo-das]'), nav('[data-banco="boleto"]'), nav('.bc-form')], mouse: 'esquerdo', dica: 'Copiar e colar evita errar um número. Banco: agência 0001, conta 12345-6, senha 1234.',
          }),
          quiz('Chegou pelo correio um boleto de "taxa anual do MEI". O que faço?', ['Não pago: o DAS só se gera no Portal, isso é golpe', 'Pago correndo', 'Mando para a família pagar'], 0),
        ],
        conclusao: 'MEI aberto e DAS em dia! 🏪',
      },
      {
        id: 'n3-ven-desafio', titulo: 'Desafio da vendedora', icone: '🏅', desafio: true,
        descricao: 'Outro anúncio e outro comprador apressado.',
        passos: [
          info('Desafio! Clique em "Continuar".', { preparar: async () => { await fotoDoBolo(); CE.negocios.reiniciarConversa(); CE.janelas.abrir('navegador', { url: FEIRA }); } }),
          esperar('Anuncie OUTRO produto na Feira Online, com foto, preço e descrição.', 'feira:anuncio', (d) => d.foto && d.preco > 0),
          esperar('Um comprador mandou mensagem. Responda sem cair no golpe do comprovante.', 'feira:golpe-evitado'),
        ],
        conclusao: 'Desafio vencido: vendedora esperta! 🏅',
      },
    ],
  });
})();
