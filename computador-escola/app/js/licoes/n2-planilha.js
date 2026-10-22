// Nível 2 — Módulo 4: Planilha básica.
(function () {
  const { info, quiz, esperar, abrir, naJanela, abrirExemplo, planilhaDe, celula, entrada, perto } = CE.L;
  const pl = (s) => naJanela('planilha', s);
  const td = (ref) => pl(`td[data-celula="${ref}"]`);
  const editou = (texto, teste, extra = {}) => esperar(texto, ['planilha:editada', 'planilha:preenchida', 'planilha:autosoma', 'planilha:colada'], () => teste(), extra);

  const COMPRAS = [['Produto', 'Quantidade', 'Preço', 'Total'], ['Arroz', '2', '25,90'], ['Feijão', '3', '8,49'], ['Leite', '6', '4,79'], ['Café', '1', '15,50']];
  const TOTAL_COMPRAS = 2 * 25.9 + 3 * 8.49 + 6 * 4.79 + 15.5;
  const COMPRAS_COM_TOTAIS = { D2: '=B2*C2', D3: '=B3*C3', D4: '=B4*C4', D5: '=B5*C5' };
  const NOTAS = [['Aluno', '1º bim', '2º bim', '3º bim', '4º bim', 'Média', 'Situação'],
    ['Ana', '7', '8', '6,5', '9'], ['Bruno', '5', '4,5', '6', '5'], ['Carla', '9', '9,5', '10', '8,5'], ['Diego', '6', '5', '7', '6'], ['Elisa', '4', '6', '5,5', '5']];
  const media = (l) => { const n = NOTAS[l].slice(1, 5).map((x) => Number(x.replace(',', '.'))); return n.reduce((a, b) => a + b, 0) / 4; };

  CE.adicionarModulo({
    id: 'n2-planilha', nivel: 'n2', titulo: 'Planilha', icone: '📊',
    licoes: [
      {
        id: 'n2-pl-conhecer', titulo: 'Conhecendo a planilha', icone: '📊',
        descricao: 'Colunas, linhas e células.',
        passos: [
          info('A PLANILHA (parecida com o Excel) é uma grande tabela que faz contas sozinha. Serve para orçamento, lista de compras, controle de vendas, notas da escola...', { emoji: '📊' }),
          abrir('planilha', 'Planilha'),
          info('As COLUNAS são identificadas por LETRAS (A, B, C...), lá em cima. As LINHAS, por NÚMEROS (1, 2, 3...), do lado esquerdo.', { destacar: pl('.pl-cab-col[data-coluna="C"]') }),
          esperar('Cada quadradinho é uma CÉLULA, e o nome dela junta a letra da coluna com o número da linha. Clique na célula C3 (coluna C, linha 3).', 'planilha:celula', (d) => d.celula === 'C3', { destacar: td('C3'), mouse: 'esquerdo' }),
          info('Veja: o nome da célula escolhida aparece na caixinha da esquerda, em cima da planilha.', { destacar: pl('.pl-nome') }),
          esperar('Agora clique na célula B2, escreva o seu nome e aperte Enter.', 'planilha:editada', (d) => d.celula === 'B2' && String(d.valor).length >= 2, { destacar: td('B2'), mouse: 'esquerdo' }),
          quiz('Qual o nome da célula que fica na coluna D e na linha 5?', ['5D', 'D5', 'DD'], 1),
          quiz('Na planilha, as colunas são identificadas por...', ['Letras', 'Números', 'Cores'], 0),
        ],
        conclusao: 'Muito bem! Você já sabe se localizar numa planilha.',
      },
      {
        id: 'n2-pl-dados', titulo: 'Digitando dados', icone: '⌨️',
        descricao: 'Preencher células usando Enter, Tab e as setas.',
        passos: [
          info('Para digitar numa célula, clique nela e escreva. O ENTER confirma e desce para a célula de baixo. O TAB confirma e vai para a direita. As SETAS andam pela planilha.', { emoji: '⌨️' }),
          abrir('planilha', 'Planilha'),
          esperar('Clique na célula A1, escreva: Fruta   e aperte Tab.', 'planilha:editada', (d) => d.celula === 'A1' && /fruta/i.test(d.valor), { destacar: td('A1'), mouse: 'esquerdo' }),
          esperar('Agora você está na B1. Escreva: Preço   e aperte Enter.', 'planilha:editada', (d) => d.celula === 'B1' && /pre/i.test(d.valor), { destacar: td('B1') }),
          editou('Agora preencha 3 frutas nas células A2, A3 e A4, e os preços delas em B2, B3 e B4 (ex.: 5,99). Use Enter, Tab ou as setas.',
            () => ['A2', 'A3', 'A4'].every((r) => typeof celula(r) === 'string' && celula(r)) && ['B2', 'B3', 'B4'].every((r) => typeof celula(r) === 'number'),
            { destacar: td('A2'), dica: 'Os preços precisam ser só números, com vírgula: 5,99. A planilha alinha os números à direita.' }),
          info('Repare: os textos ficam à esquerda e os NÚMEROS ficam à direita. Assim você sabe que a planilha entendeu que é número.'),
          esperar('Esqueceu uma fruta no meio da lista? Clique com o botão DIREITO no número 3, à esquerda da planilha (o cabeçalho da linha 3), e escolha "Inserir". Aparece uma linha vazia ali.', 'planilha:inserida', (d) => d.tipo === 'linha' && d.linha === 3, {
            destacar: ['.mc-menu [data-opcao="inserir"]', pl('tbody tr:nth-child(3) th.pl-cab-lin')], mouse: 'direito', dica: 'É o número 3 cinza, do lado esquerdo das células. Clique nele com o botão da DIREITA.',
          }),
          editou('Na linha nova, escreva mais uma fruta em A3 e o preço dela em B3.', () => typeof celula('A3') === 'string' && celula('A3') && typeof celula('B3') === 'number', { destacar: td('A3') }),
          quiz('Depois de digitar numa célula, a tecla Enter...', ['Confirma e desce para a célula de baixo', 'Apaga a célula', 'Fecha a planilha'], 0),
          quiz('Para colocar uma linha nova no meio da tabela, eu...', ['Clico com o botão direito no número da linha e escolho "Inserir"', 'Apago tudo e começo de novo', 'Aperto o F5'], 0),
          quiz('Para escrever um número com centavos na planilha, eu uso...', ['Vírgula, como 5,99', 'A palavra "reais"', 'Ponto e vírgula'], 0),
        ],
        conclusao: 'Ótimo! Você preencheu a sua primeira tabela de dados.',
      },
      {
        id: 'n2-pl-contas', titulo: 'Fazendo contas com fórmulas', icone: '🧮',
        descricao: 'Multiplicar quantidade por preço com uma fórmula.',
        passos: [
          info('Abri a planilha "Compras da semana". Vamos calcular o total de cada produto: QUANTIDADE vezes PREÇO. Toda conta na planilha começa com o sinal de igual ( = ).', {
            emoji: '🧮', preparar: () => abrirExemplo('Compras da semana', 'planilha', planilhaDe(COMPRAS), true),
          }),
          editou('Clique na célula D2 e escreva:  =B2*C2   e aperte Enter. (O asterisco * é o sinal de vezes.)', () => perto(celula('D2'), 51.8), { destacar: td('D2'), mouse: 'esquerdo' }),
          info('A célula mostra o RESULTADO (51,8), mas a fórmula continua lá: veja na barra "fx" lá em cima quando a célula estiver selecionada.', { destacar: pl('.pl-formula') }),
          editou('Também dá para montar a fórmula CLICANDO nas células. Em D3, digite = , clique na célula B3, digite * , clique na C3 e aperte Enter.', () => /^=B3\*C3$/i.test(entrada('D3')), { destacar: td('D3'), mouse: 'esquerdo' }),
          editou('Faça o mesmo em D4 e D5.', () => perto(celula('D4'), 6 * 4.79) && perto(celula('D5'), 15.5), { destacar: td('D4') }),
          editou('A mágica: mude a quantidade de Arroz (B2) para 4. Veja o total mudar sozinho!', () => celula('B2') === 4, { destacar: td('B2') }),
          quiz('Toda fórmula na planilha começa com...', ['=', '+', '#'], 0),
          quiz('Na planilha, o sinal de vezes (multiplicar) é...', ['*', 'x', '%'], 0),
        ],
        conclusao: 'Parabéns! A planilha agora faz as contas por você.',
      },
      {
        id: 'n2-pl-soma', titulo: 'SOMA e AutoSoma', icone: 'Σ',
        descricao: 'Somar uma coluna inteira de uma vez.',
        passos: [
          info('Para somar muitos números de uma vez usamos a função SOMA. Exemplo: =SOMA(D2:D5) soma de D2 até D5. Os dois-pontos ( : ) querem dizer "até".', {
            emoji: 'Σ', preparar: () => abrirExemplo('Compras da semana', 'planilha', planilhaDe(COMPRAS, COMPRAS_COM_TOTAIS), true),
          }),
          editou('Clique na célula D6, escreva  =SOMA(D2:D5)  e aperte Enter.', () => perto(celula('D6'), TOTAL_COMPRAS), { destacar: td('D6'), mouse: 'esquerdo' }),
          editou('Agora o jeito mais rápido, para somar as quantidades: clique na célula B6 e aperte o botão "Σ AutoSoma".', () => celula('B6') === 12, {
            destacar: [pl('[data-comando="autosoma"]')], mouse: 'esquerdo', dica: 'O AutoSoma soma os números que estão em cima da célula escolhida.',
          }),
          editou('Escreva "Total" na célula A6.', () => /total/i.test(String(celula('A6'))), { destacar: td('A6') }),
          quiz('Em =SOMA(D2:D5), os dois-pontos querem dizer...', ['"até": de D2 até D5', '"e": só D2 e D5', '"vezes"'], 0),
          quiz('O botão Σ AutoSoma...', ['Soma sozinho os números de cima', 'Apaga a coluna', 'Muda a cor'], 0),
        ],
        conclusao: 'Muito bem! Você sabe somar listas inteiras.',
      },
      {
        id: 'n2-pl-alca', titulo: 'Copiar fórmulas arrastando', icone: '↘️',
        descricao: 'Usar o quadradinho azul (alça de preenchimento).',
        passos: [
          info('Escrever a mesma fórmula em várias linhas cansa. A ALÇA DE PREENCHIMENTO resolve: é o quadradinho azul no canto da célula escolhida. Arrastando ele, a fórmula é copiada e ajustada para cada linha.', {
            emoji: '↘️', preparar: () => abrirExemplo('Compras da semana', 'planilha', planilhaDe(COMPRAS, { D2: '=B2*C2' }), true),
          }),
          esperar('Clique na célula D2 (ela já tem a fórmula).', 'planilha:celula', (d) => d.celula === 'D2', { destacar: td('D2'), mouse: 'esquerdo' }),
          editou('Agora segure o quadradinho azul, no canto de baixo à direita da D2, e arraste até a D5. Solte o botão.', () => /^=B5\*C5$/i.test(entrada('D5')), { destacar: pl('.pl-alca'), mouse: 'arrastar', dica: 'O quadradinho é bem pequeno: quando a setinha virar uma cruz (+), pode segurar.' }),
          info('Clique na D5 e veja na barra fx: a fórmula virou =B5*C5. A planilha ajustou sozinha para cada linha!'),
          editou('A alça também continua sequências: escreva 1 em F2 e 2 em F3, selecione as duas (arraste de F2 até F3) e puxe a alça até F8.', () => celula('F8') === 7, { destacar: td('F2') }),
          quiz('Arrastando a alça de uma célula com =B2*C2 para a linha de baixo, a fórmula vira...', ['=B3*C3', '=B2*C2', '=C2*D2'], 0),
        ],
        conclusao: 'Excelente! A alça é um dos recursos que mais economizam tempo na planilha.',
      },
      {
        id: 'n2-pl-formatar', titulo: 'Deixando a planilha bonita', icone: '🎨',
        descricao: 'Negrito, cores, R$ e largura das colunas.',
        passos: [
          info('Uma planilha bem formatada é fácil de ler. Vamos arrumar a "Compras da semana".', {
            emoji: '🎨', preparar: () => abrirExemplo('Compras da semana', 'planilha', planilhaDe(COMPRAS, { ...COMPRAS_COM_TOTAIS, D6: '=SOMA(D2:D5)', A6: 'Total' }), true),
          }),
          esperar('Selecione o cabeçalho: clique em A1, segure e arraste até D1. Depois clique no quadradinho amarelo de COR DE FUNDO e escolha uma cor clarinha.', 'planilha:formatada', (d) => d.comando === 'fundo' && d.celulas >= 4, {
            destacar: [pl('[data-comando="fundo"]')], mouse: 'arrastar', dica: 'Depois de escolher a cor, clique fora da janelinha de cores para aplicar.',
          }),
          esperar('Agora selecione os preços e totais (de C2 até D6) e clique em "R$" para mostrar como dinheiro.', 'planilha:formatada', (d) => d.comando === 'formato' && d.valor === 'moeda' && d.celulas >= 8, { destacar: pl('[data-comando="moeda"]'), mouse: 'arrastar' }),
          esperar('A coluna A está estreita? Coloque a setinha na divisa entre as letras A e B lá em cima (a setinha vira ↔), segure e arraste para a direita.', 'planilha:largura', (d) => d.coluna === 'A', { destacar: pl('[data-redim="0"]'), mouse: 'arrastar' }),
          esperar('Por último, deixe a linha do Total (A6 até D6) em negrito: selecione e clique em "N".', 'planilha:formatada', (d) => d.comando === 'negrito' && d.valor === true, { destacar: pl('[data-comando="negrito"]') }),
          esperar('Ficou ótima! Salve com Ctrl+S.', 'arquivo:salvo', (d) => d.tipo === 'planilha'),
          quiz('O botão R$ serve para...', ['Mostrar os números como dinheiro', 'Somar a coluna', 'Apagar os números'], 0),
        ],
        conclusao: 'Sua planilha está linda e fácil de ler! 🎨',
      },
      {
        id: 'n2-pl-notas', titulo: 'Notas da escola: MÉDIA, MÁXIMO, MÍNIMO e SE', icone: '🎒',
        descricao: 'Calcular médias e a situação de cada aluno.',
        passos: [
          info('Abri a planilha de NOTAS de uma turma. Vamos calcular a média de cada aluno e dizer quem foi aprovado.', {
            emoji: '🎒', preparar: () => abrirExemplo('Notas da turma', 'planilha', planilhaDe(NOTAS), true),
          }),
          editou('Na célula F2, escreva  =MÉDIA(B2:E2)  e aperte Enter.', () => perto(celula('F2'), media(1)), { destacar: td('F2'), mouse: 'esquerdo' }),
          editou('Use a alça (quadradinho azul) da F2 para copiar a fórmula até a F6.', () => perto(celula('F6'), media(5)), { destacar: pl('.pl-alca'), mouse: 'arrastar' }),
          editou('Qual a maior média da turma? Em F8 escreva  =MÁXIMO(F2:F6)', () => perto(celula('F8'), Math.max(...[1, 2, 3, 4, 5].map(media))), { destacar: td('F8') }),
          editou('E a menor? Em F9 escreva  =MÍNIMO(F2:F6)', () => perto(celula('F9'), Math.min(...[1, 2, 3, 4, 5].map(media))), { destacar: td('F9') }),
          editou('Agora a situação. Em G2 escreva:  =SE(F2>=6;"Aprovado";"Recuperação")   (o ponto e vírgula separa as partes).', () => celula('G2') === 'Aprovado', { destacar: td('G2'), dica: 'Lê-se: SE a média for maior ou igual a 6, então "Aprovado", senão "Recuperação".' }),
          editou('Copie a fórmula de G2 até G6 com a alça.', () => celula('G6') === 'Recuperação', { destacar: pl('.pl-alca'), mouse: 'arrastar' }),
          quiz('A função MÉDIA...', ['Soma e divide pela quantidade de números', 'Mostra o maior número', 'Conta as células'], 0),
          quiz('Em =SE(F2>=6;"Aprovado";"Recuperação"), se F2 for 5, aparece...', ['Aprovado', 'Recuperação', '5'], 1),
        ],
        conclusao: 'Parabéns! Você usou funções que muita gente no trabalho não sabe usar.',
      },
      {
        id: 'n2-pl-orcamento', titulo: 'Projeto: orçamento doméstico', icone: '🏠',
        descricao: 'Planilha de ganhos e gastos do mês.',
        passos: [
          info('O ORÇAMENTO DOMÉSTICO mostra quanto entra e quanto sai de dinheiro no mês. Assim dá para ver se sobra ou se falta. Vamos fazer um do zero!', { emoji: '🏠' }),
          abrir('planilha', 'Planilha'),
          esperar('Clique em "📄 Nova" para começar uma planilha em branco. Se perguntar, clique em "Não".', 'planilha:nova', null, { destacar: pl('[data-comando="novo"]'), mouse: 'esquerdo' }),
          editou('Em A1 escreva: Orçamento do mês. Em A3 escreva: Salário   e em B3 o valor do salário (ex.: 2000).', () => typeof celula('B3') === 'number' && /sal/i.test(String(celula('A3'))), { destacar: td('A1') }),
          editou('Agora os GASTOS: de A5 até A8 escreva Aluguel, Luz, Água e Mercado. Em B5 até B8, os valores de cada um.', () => ['B5', 'B6', 'B7', 'B8'].every((r) => typeof celula(r) === 'number') && ['A5', 'A6', 'A7', 'A8'].every((r) => typeof celula(r) === 'string' && celula(r)), { destacar: td('A5') }),
          editou('Em A10 escreva: Total de gastos   e em B10 some os gastos:  =SOMA(B5:B8)', () => /^=SOMA\(B5:B8\)$/i.test(entrada('B10')), { destacar: td('B10') }),
          editou('Em A11 escreva: Sobra   e em B11 faça o salário menos os gastos:  =B3-B10', () => perto(celula('B11'), celula('B3') - celula('B10')), { destacar: td('B11') }),
          esperar('Selecione os valores (de B3 até B11) e clique em "R$".', 'planilha:formatada', (d) => d.comando === 'formato' && d.valor === 'moeda', { destacar: pl('[data-comando="moeda"]'), mouse: 'arrastar' }),
          esperar('Salve com o nome: Orçamento', 'arquivo:salvo', (d) => d.tipo === 'planilha' && /or[cç]amento/i.test(d.nome), { destacar: pl('[data-comando="salvar"]') }),
          quiz('Se a "Sobra" der um número negativo, quer dizer que...', ['Os gastos foram maiores que o salário', 'Sobrou muito dinheiro', 'A planilha quebrou'], 0),
        ],
        conclusao: 'Excelente! Agora você controla o seu dinheiro com a planilha. 🏠',
      },
      {
        id: 'n2-pl-desafio', titulo: 'Desafio: lista de compras', icone: '🏅', desafio: true,
        descricao: 'Planilha completa com fórmulas, SOMA e formato R$.',
        passos: [
          info('Desafio! Faça uma planilha sozinho. Clique em "Continuar".'),
          esperar('Crie uma planilha com pelo menos 3 produtos: nome na coluna A, quantidade na B, preço na C e o TOTAL de cada um na D (com fórmula). Embaixo, o total geral com SOMA, e os valores em R$. Salve como: Lista de compras', 'arquivo:salvo', (d) => {
            if (d.tipo !== 'planilha' || !/lista de compras/i.test(d.nome)) return false;
            const c = JSON.parse(d.conteudo).celulas || {};
            const formulasVezes = Object.values(c).filter((x) => /^=.*\*/.test(x.v || '')).length;
            const temSoma = Object.values(c).some((x) => /^=SOMA\(/i.test(x.v || ''));
            const temMoeda = Object.values(c).some((x) => x.f && x.f.formato === 'moeda');
            return formulasVezes >= 3 && temSoma && temMoeda;
          }),
          quiz('Para copiar uma fórmula para as linhas de baixo, o mais rápido é...', ['Arrastar a alça de preenchimento', 'Digitar tudo de novo', 'Imprimir'], 0),
        ],
        conclusao: 'Desafio vencido! Você domina o básico da planilha. 📊',
      },
    ],
  });
})();
