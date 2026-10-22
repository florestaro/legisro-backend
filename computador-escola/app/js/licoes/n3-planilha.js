// Nível 3 — Módulo 2: Planilha avançada.
(function () {
  const { info, quiz, esperar, naJanela, abrirExemplo, planilhaDe, celula, entrada, perto } = CE.L;
  const pl = (s) => naJanela('planilha', s);
  const td = (ref) => pl(`td[data-celula="${ref}"]`);
  const botao = (b) => pl(`[data-comando="${b}"]`);
  const editou = (texto, teste, extra = {}) => esperar(texto, ['planilha:editada', 'planilha:preenchida', 'planilha:autosoma', 'planilha:colada', 'planilha:classificada'], () => teste(), extra);
  const salvar = (nome) => esperar(`Salve a planilha: clique em "💾 Salvar"${nome ? ` (o nome é "${nome}")` : ''}.`, 'arquivo:salvo', (d) => d.tipo === 'planilha', { destacar: botao('salvar'), mouse: 'esquerdo' });

  const GASTOS = [['Data', 'Descrição', 'Categoria', 'Valor'],
    ['01/11', 'Supermercado', 'Mercado', '320'], ['02/11', 'Conta de luz', 'Contas', '145,80'], ['03/11', 'Ônibus', 'Transporte', '45'],
    ['05/11', 'Feira', 'Mercado', '86,50'], ['08/11', 'Cinema', 'Lazer', '60'], ['10/11', 'Conta de água', 'Contas', '92,30'],
    ['12/11', 'Açougue', 'Mercado', '134'], ['15/11', 'Gasolina', 'Transporte', '150'], ['18/11', 'Internet', 'Contas', '99,90'], ['20/11', 'Padaria', 'Mercado', '42,70']];
  const somaDe = (cat) => GASTOS.slice(1).filter((l) => l[2] === cat).reduce((s, l) => s + Number(l[3].replace(',', '.')), 0);
  const TURMA = [['Nome', 'Idade', 'Cidade'], ['Marcos', '34', 'Porto Velho'], ['Ana', '19', 'Ariquemes'], ['Rita', '58', 'Porto Velho'], ['Bento', '42', 'Ji-Paraná'], ['Clara', '27', 'Cacoal']];
  const NOTAS = [['Aluno', '1º bim', '2º bim', '3º bim', '4º bim', 'Média', 'Situação'],
    ['Ana', '7', '8', '6,5', '9'], ['Bruno', '5', '4,5', '6', '5'], ['Carla', '9', '9,5', '10', '8,5'], ['Diego', '6', '5', '7', '6'], ['Elisa', '4', '6', '5,5', '5']];
  const mediaDe = (l) => NOTAS[l].slice(1, 5).map((x) => Number(x.replace(',', '.'))).reduce((a, b) => a + b, 0) / 4;

  CE.adicionarModulo({
    id: 'n3-planilha', nivel: 'n3', titulo: 'Planilha avançada', icone: '📈',
    licoes: [
      {
        id: 'n3-pl-porcentagem', titulo: 'Porcentagem: descontos e aumentos', icone: '💯',
        descricao: 'Calcular desconto e preço final.',
        passos: [
          info('PORCENTAGEM é "quanto em cada 100". 10% de R$ 150 é R$ 15. Na planilha, o preço com desconto é: PREÇO menos PREÇO vezes DESCONTO.', {
            emoji: '💯', preparar: () => abrirExemplo('Promoção da loja', 'planilha', planilhaDe([['Produto', 'Preço', 'Desconto', 'Preço final'], ['Ventilador', '150', '10%'], ['Panela', '80', '25%'], ['Liquidificador', '120', '15%']]), true),
          }),
          editou('Clique na célula D2 e escreva:  =B2-B2*C2   e aperte Enter.', () => perto(celula('D2'), 135), { destacar: td('D2'), mouse: 'esquerdo', dica: 'O asterisco * é o "vezes". A planilha faz a multiplicação antes da subtração, como na escola.' }),
          editou('Use a alça (o quadradinho no canto da célula D2) e arraste até a D4 para copiar a conta.', () => perto(celula('D3'), 60) && perto(celula('D4'), 102), { destacar: td('D2'), mouse: 'arrastar' }),
          esperar('Selecione de D2 até D4 e clique no botão "R$" para mostrar em dinheiro.', 'planilha:formatada', (d) => d.comando === 'formato' && d.valor === 'moeda', { destacar: botao('moeda'), mouse: 'esquerdo' }),
          info('E para AUMENTAR um preço em 10%? Multiplique por 1,1 (que é 100% + 10%). Exemplo: =B2*1,1'),
          editou('Em E1 escreva  Com aumento  e em E2 calcule o preço do ventilador com 10% de aumento:  =B2*1,1', () => perto(celula('E2'), 165), { destacar: td('E2') }),
          quiz('Quanto é 20% de R$ 50,00?', ['R$ 10,00', 'R$ 20,00', 'R$ 2,50'], 0),
          quiz('Na planilha, para escrever 15%, eu posso digitar...', ['15%', '15', '0,15%'], 0),
        ],
        conclusao: 'Muito bem! Descontos e aumentos sem precisar de calculadora.',
      },
      {
        id: 'n3-pl-classificar', titulo: 'Colocar em ordem (classificar)', icone: '🔤',
        descricao: 'Organizar a tabela em ordem alfabética ou de números.',
        passos: [
          info('CLASSIFICAR é colocar a tabela em ordem: de A a Z, ou do menor para o maior. A linha inteira vai junto, então o nome nunca se separa da idade.', {
            emoji: '🔤', preparar: () => abrirExemplo('Lista da turma', 'planilha', planilhaDe(TURMA), true),
          }),
          esperar('Clique em qualquer nome da coluna A e clique no botão "🔤 A→Z".', 'planilha:classificada', (d) => d.coluna === 'A' && d.ordem === 'az', { destacar: botao('classificar-az'), mouse: 'esquerdo' }),
          info('Veja: Ana, Bento, Clara... E o título "Nome" ficou no lugar, porque o Editor percebe que é o título.'),
          esperar('Agora coloque do MAIS VELHO para o mais novo: clique numa idade (coluna B) e clique em "Z→A".', 'planilha:classificada', (d) => d.coluna === 'B' && d.ordem === 'za', { destacar: botao('classificar-za'), mouse: 'esquerdo' }),
          quiz('Para ver os maiores números primeiro, eu uso...', ['Z→A (decrescente)', 'A→Z (crescente)', 'Negrito'], 0),
          quiz('Quando eu classifico pela idade, o nome da pessoa...', ['Vai junto com a idade', 'Fica no lugar e mistura tudo', 'É apagado'], 0),
          salvar('Lista da turma'),
        ],
        conclusao: 'Ótimo! Tabelas organizadas ficam muito mais fáceis de consultar.',
      },
      {
        id: 'n3-pl-filtro', titulo: 'Filtro: mostrar só o que interessa', icone: '🔽',
        descricao: 'Esconder linhas e ver só uma categoria.',
        passos: [
          info('O FILTRO esconde as linhas que você não quer ver, sem apagar nada. Abri os "Gastos do mês". Vamos ver só os gastos com MERCADO.', {
            emoji: '🔽', preparar: () => abrirExemplo('Gastos do mês', 'planilha', planilhaDe(GASTOS), true),
          }),
          esperar('Clique numa célula da tabela e clique em "🔽 Filtro".', 'planilha:filtro', (d) => d.ligado, { destacar: botao('filtro'), mouse: 'esquerdo' }),
          esperar('Apareceram setinhas ▾ nos títulos. Clique na setinha do título "Categoria".', 'planilha:menu-filtro', (d) => d.coluna === 'C', { destacar: pl('.pl-filtro-botao[data-filtro="C"]'), mouse: 'esquerdo' }),
          esperar('Desmarque "(Selecionar tudo)", marque só "Mercado" e clique em OK.', 'planilha:filtrada', (d) => d.coluna === 'C' && d.mostrando.length === 1 && d.mostrando[0] === 'Mercado', { destacar: pl('.pl-filtro-menu'), mouse: 'esquerdo' }),
          info('Repare nos números das linhas: eles pulam (1, 2, 5, 8...). As outras linhas não sumiram, só estão escondidas.'),
          esperar('Para mostrar tudo de novo, clique em "🔽 Filtro" para desligar.', 'planilha:filtro', (d) => !d.ligado, { destacar: botao('filtro'), mouse: 'esquerdo' }),
          quiz('O filtro...', ['Esconde linhas sem apagar', 'Apaga as linhas para sempre', 'Muda os números'], 0),
        ],
        conclusao: 'Excelente! Com o filtro você acha a informação rapidinho.',
      },
      {
        id: 'n3-pl-somase', titulo: 'SOMASE e CONT.SE: contas por categoria', icone: '🧾',
        descricao: 'Somar e contar só o que atende a uma condição.',
        passos: [
          info('Quanto gastei com Mercado? O SOMASE soma só as linhas de uma categoria: =SOMASE(onde procurar; o que procurar; o que somar).', {
            emoji: '🧾', preparar: () => abrirExemplo('Gastos do mês', 'planilha', planilhaDe(GASTOS), true),
          }),
          editou('Em F1 escreva  Mercado . Em G1 escreva:  =SOMASE(C2:C11;F1;D2:D11)', () => perto(celula('G1'), somaDe('Mercado')), { destacar: td('G1'), dica: 'Atenção ao ponto e vírgula ( ; ) entre as partes.' }),
          editou('Em F2 escreva  Contas  e em G2 faça o mesmo:  =SOMASE(C2:C11;F2;D2:D11)', () => perto(celula('G2'), somaDe('Contas')), { destacar: td('G2') }),
          editou('Quantas vezes você foi ao mercado? Em H1 escreva:  =CONT.SE(C2:C11;"Mercado")', () => celula('H1') === 4, { destacar: td('H1'), dica: 'O texto fica entre aspas: "Mercado".' }),
          editou('Mude o valor da Feira (D5) para 100 e veja o total do Mercado mudar sozinho.', () => perto(celula('D5'), 100) && perto(celula('G1'), somaDe('Mercado') - 86.5 + 100), { destacar: td('D5') }),
          quiz('O SOMASE serve para...', ['Somar só as linhas que atendem a uma condição', 'Somar tudo', 'Contar letras'], 0),
          quiz('E o CONT.SE...', ['Conta quantas células atendem a uma condição', 'Soma os valores', 'Apaga as células'], 0),
          salvar('Gastos do mês'),
        ],
        conclusao: 'Agora você sabe exatamente para onde vai o seu dinheiro!',
      },
      {
        id: 'n3-pl-destacar', titulo: 'Destaque automático', icone: '🎨',
        descricao: 'Pintar sozinho as notas abaixo da média.',
        passos: [
          info('O DESTAQUE AUTOMÁTICO (formatação condicional) pinta as células que seguem uma regra. Por exemplo: notas abaixo de 6 ficam vermelhas. Se a nota mudar, a cor muda sozinha!', {
            emoji: '🎨', preparar: () => abrirExemplo('Notas da turma', 'planilha', planilhaDe(NOTAS, { F2: '=MÉDIA(B2:E2)', F3: '=MÉDIA(B3:E3)', F4: '=MÉDIA(B4:E4)', F5: '=MÉDIA(B5:E5)', F6: '=MÉDIA(B6:E6)' }), true),
          }),
          esperar('Selecione as médias: arraste de F2 até F6.', 'planilha:selecao', (d) => d.intervalo === 'F2:F6', { destacar: td('F2'), mouse: 'arrastar' }),
          esperar('Clique em "🎨 Destacar". Escolha "é menor que", escreva 6, deixe a cor Vermelho e clique em Aplicar.', 'planilha:condicional', (d) => d.regra === 'menor' && String(d.valor).replace(',', '.') === '6', { destacar: botao('destacar'), mouse: 'esquerdo' }),
          editou('Agora mude uma nota do Diego (linha 5) para 2 e veja a média dele ficar vermelha.', () => celula('F5') < 6 && CE.planilhaAtiva.destacada('F5'), { destacar: td('C5') }),
          quiz('O destaque automático...', ['Muda a cor sozinho quando o valor muda', 'Pinta só uma vez e nunca mais muda', 'Apaga as notas baixas'], 0),
          salvar('Notas da turma'),
        ],
        conclusao: 'Muito bem! Quem está precisando de ajuda aparece na hora.',
      },
      {
        id: 'n3-pl-grafico', titulo: 'Gráficos', icone: '📊',
        descricao: 'Transformar números em gráfico de colunas e de pizza.',
        passos: [
          info('Um GRÁFICO mostra os números em desenho: dá para ver de longe onde está o maior gasto. Abri a planilha "Gastos por categoria".', {
            emoji: '📊', preparar: () => abrirExemplo('Gastos por categoria', 'planilha', planilhaDe([['Categoria', 'Valor'], ['Mercado', '650'], ['Contas', '420'], ['Transporte', '180'], ['Lazer', '150']]), true),
          }),
          esperar('Selecione de A1 até B5 (os nomes e os valores).', 'planilha:selecao', (d) => d.intervalo === 'A1:B5', { destacar: td('A1'), mouse: 'arrastar' }),
          esperar('Clique em "📊 Gráfico", escolha "Colunas" e clique em "Inserir gráfico".', 'planilha:grafico', (d) => d.tipo === 'colunas', { destacar: botao('grafico'), mouse: 'esquerdo' }),
          esperar('Na caixinha de cima do gráfico, troque o tipo para "Pizza".', 'planilha:grafico-tipo', (d) => d.tipo === 'pizza', { destacar: pl('[data-grafico-tipo]'), mouse: 'esquerdo' }),
          esperar('Segure na barra de cima do gráfico (onde tem o ✥) e arraste para outro lugar.', 'planilha:grafico-movido', null, { destacar: pl('.pl-grafico-barra'), mouse: 'arrastar' }),
          editou('Mude o valor do Lazer (B5) para 300 e veja o gráfico mudar sozinho.', () => perto(celula('B5'), 300), { destacar: td('B5') }),
          quiz('Qual gráfico mostra melhor as PARTES de um total (como fatias)?', ['Pizza', 'Linhas', 'Nenhum'], 0),
          quiz('Se eu mudar um número da tabela, o gráfico...', ['Muda junto', 'Fica igual', 'Some'], 0),
          salvar('Gastos por categoria'),
        ],
        conclusao: 'Parabéns! Seus números agora contam uma história.',
      },
      {
        id: 'n3-pl-procv', titulo: 'PROCV: procurar numa tabela', icone: '🔍',
        descricao: 'Achar o preço de um produto pelo código.',
        passos: [
          info('O PROCV procura um valor na primeira coluna de uma tabela e traz uma informação da mesma linha. Como no caixa do mercado: digita o código e aparece o produto e o preço!', {
            emoji: '🔍', preparar: () => abrirExemplo('Tabela de preços', 'planilha', planilhaDe([['Código', 'Produto', 'Preço', '', 'Código', 'Produto', 'Preço'], ['101', 'Arroz', '25,90', '', '103'], ['102', 'Feijão', '8,49'], ['103', 'Café', '15,50'], ['104', 'Leite', '4,79']]), true),
          }),
          editou('Em F2 escreva:  =PROCV(E2;A2:C5;2;FALSO)   (procura o código de E2 e traz a 2ª coluna).', () => celula('F2') === 'Café', { destacar: td('F2'), dica: 'FALSO quer dizer "só o valor exato".' }),
          editou('Em G2, traga o preço (3ª coluna):  =PROCV(E2;A2:C5;3;FALSO)', () => perto(celula('G2'), 15.5), { destacar: td('G2') }),
          editou('Agora troque o código em E2 para 101 e veja o produto e o preço mudarem.', () => celula('F2') === 'Arroz' && perto(celula('G2'), 25.9), { destacar: td('E2') }),
          editou('E se o código não existir? Digite 999 em E2.', () => celula('F2') === '#N/D', { destacar: td('E2') }),
          info('#N/D quer dizer "Não Disponível": o código não está na tabela. Volte para um código que existe quando quiser.'),
          quiz('Em =PROCV(E2;A2:C5;3;FALSO), o número 3 quer dizer...', ['A 3ª coluna da tabela', 'Somar 3', 'A linha 3'], 0),
        ],
        conclusao: 'Excelente! O PROCV é uma das funções mais pedidas em vagas de emprego.',
      },
      {
        id: 'n3-pl-caixa', titulo: 'Projeto: controle de caixa', icone: '💰',
        descricao: 'Entradas, saídas e saldo de um pequeno negócio.',
        passos: [
          info('Vamos fazer o controle de caixa de quem vende bolos e salgados: ENTRADAS (o que entrou), SAÍDAS (o que saiu) e o SALDO (quanto tem no caixa).', {
            emoji: '💰', preparar: () => abrirExemplo('Controle de caixa', 'planilha', planilhaDe([['Data', 'Descrição', 'Entrada', 'Saída', 'Saldo'], ['01/11', 'Dinheiro inicial', '500'], ['03/11', 'Venda de bolos', '180'], ['05/11', 'Ingredientes', '', '95'], ['08/11', 'Venda de salgados', '240'], ['10/11', 'Conta de luz', '', '130']]), true),
          }),
          editou('Em E2 escreva:  =C2-D2   (entrada menos saída).', () => perto(celula('E2'), 500), { destacar: td('E2') }),
          editou('Em E3, o saldo é o ANTERIOR mais a entrada menos a saída:  =E2+C3-D3', () => perto(celula('E3'), 680), { destacar: td('E3') }),
          editou('Copie a fórmula da E3 com a alça até a E6.', () => perto(celula('E6'), 695), { destacar: td('E3'), mouse: 'arrastar' }),
          editou('Na linha 8: em B8 escreva  Totais , em C8  =SOMA(C2:C6)  e em D8  =SOMA(D2:D6)', () => perto(celula('C8'), 920) && perto(celula('D8'), 225), { destacar: td('C8') }),
          esperar('Selecione de C2 até E8 e clique em "R$".', 'planilha:formatada', (d) => d.comando === 'formato' && d.valor === 'moeda' && d.celulas >= 15, { destacar: botao('moeda'), mouse: 'esquerdo' }),
          quiz('O saldo de hoje é...', ['O saldo de ontem + entradas − saídas', 'Só as entradas', 'As saídas vezes 2'], 0),
          salvar('Controle de caixa'),
        ],
        conclusao: 'Parabéns! Você montou o controle de caixa de um negócio de verdade.',
      },
      {
        id: 'n3-pl-desafio', titulo: 'Desafio da Planilha avançada', icone: '🏅', desafio: true,
        descricao: 'Boletim completo, sem ajuda.',
        passos: [
          info('Desafio! Abri o "Boletim". Complete sozinho. Clique em "Continuar".', { preparar: () => abrirExemplo('Boletim', 'planilha', planilhaDe(NOTAS), true) }),
          editou('Calcule a MÉDIA de cada aluno na coluna F (F2 até F6).', () => [1, 2, 3, 4, 5].every((l) => perto(celula('F' + (l + 1)), mediaDe(l)))),
          editou('Na coluna G, mostre "Aprovado" se a média for 6 ou mais, ou "Recuperação" se for menor.', () => [1, 2, 3, 4, 5].every((l) => String(celula('G' + (l + 1))).toLowerCase() === (mediaDe(l) >= 6 ? 'aprovado' : 'recuperação')) && /^=SE\(/i.test(entrada('G2'))),
          esperar('Destaque em vermelho as médias menores que 6.', 'planilha:condicional', (d) => d.regra === 'menor'),
          esperar('Coloque a tabela em ordem da MAIOR média para a menor.', 'planilha:classificada', (d) => d.coluna === 'F' && d.ordem === 'za'),
          esperar('Salve a planilha.', 'arquivo:salvo', (d) => d.tipo === 'planilha'),
        ],
        conclusao: 'Desafio vencido! Você domina a planilha. 📈',
      },
    ],
  });
})();
