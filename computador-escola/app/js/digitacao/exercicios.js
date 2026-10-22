// Curso de Digitação: 3 níveis (Iniciante, Intermediário, Avançado), cada um com módulos, exercícios e uma prova.
// Cada exercício tem uma meta de velocidade (palavras por minuto) e de acertos (%). O aluno só libera o
// próximo exercício quando bate as duas metas. Para crianças as metas são menores (veja CE.metaDigitacao).
//
// Tipos de exercício:
//   texto  - digitar o texto inteiro (é preciso corrigir cada erro para seguir)
//   tempo  - digitar o máximo possível até o tempo acabar (provas e treinos de ritmo)
//   ditado - o professor fala a frase e o aluno digita sem ver
window.CE = window.CE || {};

(function () {
  // Sorteio com "semente": o mesmo exercício sempre gera o mesmo texto.
  function sorteador(semente) {
    let h = 2166136261;
    for (const c of semente) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    return () => {
      h += 0x6d2b79f5;
      let t = h;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const PALAVRAS = (
    'a o e de da do que um uma para com não por mais como mas foi ele ela seu sua tem já eu também só ' +
    'casa sala mesa cama porta janela rua cidade bairro escola aula livro caderno lápis caneta papel folha ' +
    'amigo amiga mãe pai filho filha avó avô irmão irmã tio tia família vizinho povo gente pessoa criança ' +
    'água café leite pão arroz feijão carne frango peixe ovo fruta banana maçã laranja uva limão salada sopa bolo ' +
    'dia noite tarde manhã hoje ontem amanhã semana mês ano hora minuto tempo sol lua chuva vento frio calor ' +
    'trabalho emprego salário dinheiro conta banco loja mercado feira preço troco compra venda nota recibo ' +
    'computador teclado mouse tela monitor janela arquivo pasta documento texto letra palavra frase página ' +
    'internet site email senha usuário programa botão ícone menu imagem foto vídeo música jogo celular ' +
    'saúde médico remédio hospital posto vacina consulta exame dente olho mão pé cabeça braço perna ' +
    'bom boa bonito bonita grande pequeno novo nova velho feliz alegre forte rápido devagar fácil difícil ' +
    'fazer ir vir ver ler escrever falar ouvir comer beber dormir andar correr pular estudar trabalhar ' +
    'jogar brincar cantar dançar pintar desenhar abrir fechar ligar desligar salvar clicar digitar apagar ' +
    'verde azul amarelo vermelho branco preto rosa roxo cinza laranja marrom ' +
    'gato cachorro pássaro cavalo vaca galinha peixe sapo leão macaco borboleta formiga abelha ' +
    'flor árvore jardim praia rio mar lago morro campo sítio fazenda estrada ponte carro ônibus bicicleta ' +
    'futebol bola time gol jogo festa aniversário presente parabéns obrigado obrigada desculpa licença ' +
    'sala sal sapo dado fada falsa salsa lado gala jaca saga asa lasca hall ' +
    'dela dele leite pelo pela fila filé sede selo tela teto tia tio rede pipa papo pote poeira quero quilo ' +
    'tropa trio tudo tatu estrela pirulito piloto pato prato porta perto roupa time ' +
    'cava cama vaca boca bom navio nuvem vez xale zero zebra baixo bacia brava nave cinema camisa'
  ).split(/\s+/).filter(Boolean);

  const MEIO = 'asdfghjklç';
  const CIMA = 'qwertyuiop';
  const BAIXO = 'zxcvbnm';

  function palavrasCom(letras) {
    const ok = new Set(letras);
    return [...new Set(PALAVRAS)].filter((p) => [...p].every((c) => ok.has(c)));
  }

  // Monta um treino: grupos de letras repetidas ("fff jjj fjf") misturados com palavras que usam só as letras permitidas.
  function treino(id, foco, permitidas, tamanho = 70) {
    const r = sorteador(id);
    const escolher = (lista) => lista[Math.floor(r() * lista.length)];
    const palavras = palavrasCom(permitidas);
    const partes = [];
    let total = 0;
    while (total < tamanho) {
      let parte;
      // Sem palavras suficientes (começo do curso), só grupos de letras.
      const sorte = palavras.length < 3 ? r() * 0.6 : r();
      if (sorte < 0.3) {
        const c = escolher([...foco]);
        parte = c.repeat(2 + Math.floor(r() * 2));
      } else if (sorte < 0.6) {
        parte = Array.from({ length: 3 + Math.floor(r() * 2) }, () => escolher([...foco])).join('');
      } else {
        parte = escolher(palavras);
      }
      partes.push(parte);
      total += parte.length + 1;
    }
    return partes.join(' ');
  }

  function sortearPalavras(id, lista, quantidade) {
    const r = sorteador(id);
    return Array.from({ length: quantidade }, () => lista[Math.floor(r() * lista.length)]).join(' ');
  }

  const PALAVRAS_COMUNS = [...new Set(PALAVRAS)].filter((p) => p.length >= 3 && !/[áàâãéêíóôõúç]/.test(p));
  const PALAVRAS_ACENTO = [...new Set(PALAVRAS)].filter((p) => /[áàâãéêíóôõúç]/.test(p))
    .concat(['ação', 'lição', 'avião', 'canção', 'coração', 'ônibus', 'você', 'até', 'já', 'só', 'é', 'está', 'três', 'pé', 'chá', 'cipó', 'açúcar', 'música', 'lâmpada', 'pêssego', 'órfão', 'à', 'às']);

  const FRASES_SIMPLES = [
    'Eu gosto de estudar.', 'A casa é bonita.', 'O gato dorme na cama.', 'Hoje faz sol.', 'Minha mãe faz bolo.',
    'O ônibus passou cedo.', 'Vou ao mercado amanhã.', 'A escola fica perto.', 'O café está quente.', 'Ela lê um livro.',
    'Nós jogamos bola.', 'O computador é útil.', 'A chuva molhou a rua.', 'Meu avô planta flores.', 'O pão saiu do forno.',
    'A aula começa cedo.', 'O cachorro late alto.', 'Eu bebo água todo dia.', 'A feira tem frutas.', 'O sol nasceu.',
  ];

  const FRASES_DIA_A_DIA = [
    'Bom dia! Como você está hoje?', 'Preciso comprar arroz, feijão e óleo.', 'A consulta está marcada para terça-feira.',
    'Por favor, feche a porta ao sair.', 'O ônibus das sete horas está atrasado.', 'Não esqueça de tomar o remédio.',
    'Vamos almoçar juntos no domingo?', 'A reunião da escola será na sexta.', 'Obrigado pela ajuda de ontem!',
    'O mercado abre às oito da manhã.', 'Guarde o recibo da compra.', 'Meu celular está sem bateria.',
    'A conta de luz vence dia dez.', 'Hoje é aniversário da minha prima.', 'Leve um casaco, pois vai esfriar.',
    'O médico pediu exames de sangue.', 'Estou aprendendo a usar o computador.', 'Desligue a televisão antes de dormir.',
  ];

  const TEXTOS_CURTOS = [
    ['Receita de bolo', 'Bata três ovos com duas xícaras de açúcar. Junte uma xícara de leite e três de farinha. Por último, coloque uma colher de fermento. Asse por quarenta minutos.'],
    ['Bilhete', 'Maria, fui ao posto de saúde e volto às onze. O almoço está na geladeira. Por favor, dê comida ao gato. Beijos, mãe.'],
    ['Aviso da escola', 'Senhores pais, na próxima sexta-feira não haverá aula por causa da reunião dos professores. As aulas voltam normalmente na segunda.'],
    ['Notícia do bairro', 'A praça do bairro ganhou novos bancos e uma área de brinquedos. A inauguração será no sábado, com música e pipoca para as crianças.'],
    ['Carta para um amigo', 'Querido João, estou com saudade. Aqui está tudo bem. Comecei um curso de informática e já sei escrever no computador. Mande notícias!'],
    ['Lista de tarefas', 'Hoje preciso pagar a conta de água, buscar o pão, levar o cachorro para passear e estudar digitação por vinte minutos.'],
    ['Previsão do tempo', 'Amanhã o dia será de sol com poucas nuvens. À tarde pode chover em alguns bairros. A temperatura máxima será de trinta graus.'],
    ['Convite', 'Você está convidado para a festa de aniversário da Ana. Será no domingo, às três da tarde, no salão da igreja. Traga sua alegria!'],
  ];

  const TRAVA_LINGUAS = [
    'O rato roeu a roupa do rei de Roma.', 'Três pratos de trigo para três tigres tristes.',
    'O sabiá não sabia que o sábio sabia que o sabiá não sabia assobiar.', 'A aranha arranha a rã, a rã arranha a aranha.',
    'Num ninho de mafagafos há sete mafagafinhos.', 'O tempo perguntou ao tempo quanto tempo o tempo tem.',
  ];

  const TEXTOS_LONGOS = [
    ['Canção do Exílio (Gonçalves Dias)', 'Minha terra tem palmeiras, onde canta o sabiá; as aves, que aqui gorjeiam, não gorjeiam como lá. Nosso céu tem mais estrelas, nossas várzeas têm mais flores, nossos bosques têm mais vida, nossa vida mais amores.'],
    ['Dom Casmurro (Machado de Assis)', 'Uma noite destas, vindo da cidade para o Engenho Novo, encontrei no trem da Central um rapaz aqui do bairro, que eu conheço de vista e de chapéu. Cumprimentou-me, sentou-se ao pé de mim, falou da lua e dos ministros, e acabou recitando-me versos.'],
    ['Ouvir Estrelas (Olavo Bilac)', 'Ora (direis) ouvir estrelas! Certo perdeste o senso! E eu vos direi, no entanto, que, para ouvi-las, muita vez desperto e abro as janelas, pálido de espanto. E conversamos toda a noite, enquanto a via láctea, como um pálio aberto, cintila.'],
    ['O computador no dia a dia', 'Hoje o computador está presente em quase tudo: no banco, no mercado, na escola e no posto de saúde. Saber usá-lo abre portas para estudar, trabalhar e resolver a vida sem sair de casa. Com calma e prática, qualquer pessoa aprende.'],
    ['Cuidados com a saúde', 'Beber água, dormir bem e fazer exercícios são hábitos simples que fazem diferença. Quem passa muito tempo no computador deve fazer pausas, alongar os braços, piscar os olhos e manter as costas apoiadas na cadeira.'],
    ['O Brasil', 'O Brasil é o maior país da América do Sul. Tem florestas, praias, montanhas e rios enormes, como o Amazonas. Sua gente é alegre e trabalhadora, e sua cultura mistura influências indígenas, africanas e europeias.'],
  ];

  const SIMBOLOS = [
    ['@ e #', 'maria@email.com joao@escola.br #aula #computador @professor ana@casa.com #digitação'],
    ['$ e R$', 'O pão custa R$ 1,50. O café custa R$ 12,90. Paguei R$ 50,00 e recebi R$ 35,60 de troco.'],
    ['% e +', 'Desconto de 10% à vista. Juros de 2% ao mês. 5 + 5 = 10. Aumento de 15% no salário.'],
    ['/ e -', 'Data: 15/03/2025. Telefone: 3222-4455. Ônibus 101-A. Turma 3/B. Horário 8h-12h.'],
    ['( ) e "', 'Ela disse: "Volto logo." (Ligue depois.) O nome do livro é "Dom Casmurro" (Machado de Assis).'],
    ['& * e =', 'Silva & Filhos Ltda. Nota: *importante* 3 * 4 = 12 e 20 = 4 * 5. Souza & Cia.'],
  ];

  const DADOS = [
    ['E-mails', 'ana.souza@email.com, pedro123@escola.edu.br, contato@mercadobom.com.br, rh@empresa.com'],
    ['Telefones', '(69) 3222-1100, (11) 98765-4321, (21) 2555-0199, (69) 99911-2233'],
    ['Endereços', 'Rua das Flores, 123, Centro. Avenida Brasil, 4500, apto 12. Travessa São José, 7, bairro Novo.'],
    ['Datas e horas', 'Segunda, 03/02/2025, às 14h30. Retorno em 10/02/2025, às 9h. Prazo final: 28/02/2025.'],
    ['Valores', 'Arroz R$ 25,90; feijão R$ 8,49; óleo R$ 7,99; café R$ 15,50. Total: R$ 57,88.'],
    ['CEP e documentos', 'CEP 76801-000. Protocolo 2025/00123. Pedido nº 45871. Matrícula 2024-0315.'],
  ];

  const NUMEROS_TECLADO = [
    ['Números 4 5 6', '456 654 445 556 664 465 546 645 456 555 444 666'],
    ['Números 1 2 3', '123 321 112 223 331 132 213 231 312 111 222 333'],
    ['Números 7 8 9 e 0', '789 987 707 808 909 790 890 970 100 200 900 789'],
    ['Contas e valores', '150 2390 45 1200 37 980 1500 65 4200 310 77 2025'],
  ];

  const DITADOS = [
    ['Frases curtas', ['O gato subiu no telhado.', 'Hoje é um ótimo dia.', 'A água está gelada.']],
    ['Recados', ['Ligar para o dentista amanhã.', 'Comprar pão e leite.', 'A reunião foi adiada.']],
    ['Com acentos', ['Você já tomou café?', 'A lição de português é fácil.', 'Meu avô mora no sítio.']],
    ['Com números', ['Comprei 3 quilos de arroz.', 'A consulta é às 10 horas.', 'Moro na casa número 25.']],
    ['Frases longas', ['O curso de informática acontece duas vezes por semana.', 'Antes de desligar o computador, salve os seus documentos.']],
  ];

  // ---------------- Montagem dos níveis ----------------

  function nivelIniciante() {
    const meio = [
      ['f j', 'fj'], ['d k', 'dk'], ['s l', 'sl'], ['a ç', 'aç'], ['g h', 'gh'],
    ];
    let acumulado = '';
    const exMeio = meio.map(([titulo, foco], i) => {
      acumulado += foco;
      return { id: `i-meio-${i + 1}`, titulo: `Teclas ${titulo.toUpperCase()}`, texto: treino(`i-meio-${i + 1}`, foco, acumulado + ' '), dica: 'Os indicadores ficam no F e no J.' };
    });
    exMeio.push({ id: 'i-meio-6', titulo: 'Fileira do meio completa', texto: treino('i-meio-6', MEIO, MEIO, 90) });
    exMeio.push({ id: 'i-meio-7', titulo: 'Palavras da fileira do meio', texto: sortearPalavras('i-meio-7', palavrasCom(MEIO), 14) });

    const cima = [['e i', 'ei'], ['r u', 'ru'], ['t y', 'ty'], ['w o', 'wo'], ['q p', 'qp']];
    acumulado = MEIO;
    const exCima = cima.map(([titulo, foco], i) => {
      acumulado += foco;
      return { id: `i-cima-${i + 1}`, titulo: `Teclas ${titulo.toUpperCase()}`, texto: treino(`i-cima-${i + 1}`, foco, acumulado), dica: 'Suba o dedo e volte sempre para a fileira do meio.' };
    });
    exCima.push({ id: 'i-cima-6', titulo: 'Palavras com a fileira de cima', texto: sortearPalavras('i-cima-6', palavrasCom(MEIO + CIMA), 14) });
    exCima.push({ id: 'i-cima-7', titulo: 'Mais palavras', texto: sortearPalavras('i-cima-7', palavrasCom(MEIO + CIMA), 16) });

    const baixo = [['v m', 'vm'], ['c ,', 'c,'], ['b n', 'bn'], ['x .', 'x.'], ['z', 'z']];
    acumulado = MEIO + CIMA;
    const exBaixo = baixo.map(([titulo, foco], i) => {
      acumulado += foco;
      return { id: `i-baixo-${i + 1}`, titulo: `Teclas ${titulo.toUpperCase()}`, texto: treino(`i-baixo-${i + 1}`, foco, acumulado), dica: 'Desça o dedo e volte para a fileira do meio.' };
    });
    exBaixo.push({ id: 'i-baixo-6', titulo: 'Todas as letras', texto: sortearPalavras('i-baixo-6', PALAVRAS_COMUNS, 14) });

    const exShift = [
      { id: 'i-shift-1', titulo: 'Nomes com letra maiúscula', texto: 'Ana Pedro Maria José Lucas Rosa Paulo Carla Brasil Rondônia Porto Velho' },
      { id: 'i-shift-2', titulo: 'Começo de frase', texto: 'Bom dia. Boa tarde. Boa noite. Tudo bem. Muito obrigado. Até logo.' },
      { id: 'i-shift-3', titulo: 'Cidades e estados', texto: 'Ji-Paraná Ariquemes Cacoal Vilhena Manaus Belém Cuiabá Goiânia Brasília Recife' },
    ];

    const exAcento = [
      { id: 'i-acento-1', titulo: 'Acento agudo: á é í ó ú', texto: 'já pé aí só último café avó até lápis cipó água fácil' },
      { id: 'i-acento-2', titulo: 'Til: ã õ', texto: 'mãe pão mão irmã maçã limões lições botões canção avião' },
      { id: 'i-acento-3', titulo: 'Circunflexo: â ê ô', texto: 'você três avô lâmpada pêssego ônibus câmera ângulo bebê' },
      { id: 'i-acento-4', titulo: 'Cedilha: ç', texto: 'açúcar maçã praça cabeça moça laço caça poço lição ação' },
      { id: 'i-acento-5', titulo: 'Crase: à', texto: 'vou à escola, à feira, à praia e à casa da avó às duas' },
      { id: 'i-acento-6', titulo: 'Misturando acentos', texto: sortearPalavras('i-acento-6', PALAVRAS_ACENTO, 14) },
    ];

    const exPalavras = Array.from({ length: 5 }, (_, i) => ({
      id: `i-palavras-${i + 1}`, titulo: `Palavras do dia a dia ${i + 1}`, texto: sortearPalavras(`i-palavras-${i + 1}`, PALAVRAS_COMUNS, 14 + i * 2),
    }));

    const exFrases = Array.from({ length: 5 }, (_, i) => ({
      id: `i-frases-${i + 1}`, titulo: `Frases simples ${i + 1}`, texto: FRASES_SIMPLES.slice(i * 4, i * 4 + 4).join(' '),
    }));

    return {
      id: 'iniciante', nome: 'Iniciante', icone: '🌱',
      metas: { ppmInicio: 8, ppmFim: 20, precisao: 90 },
      modulos: [
        { titulo: 'Fileira do meio', exercicios: exMeio },
        { titulo: 'Fileira de cima', exercicios: exCima },
        { titulo: 'Fileira de baixo', exercicios: exBaixo },
        { titulo: 'Letras maiúsculas (Shift)', exercicios: exShift },
        { titulo: 'Acentos e cedilha', exercicios: exAcento },
        { titulo: 'Palavras', exercicios: exPalavras },
        { titulo: 'Frases', exercicios: exFrases },
      ],
      prova: { id: 'prova-iniciante', titulo: 'Prova do nível Iniciante', tipo: 'tempo', duracao: 180, meta: { ppm: 20, precisao: 92 }, texto: FRASES_SIMPLES.concat(FRASES_DIA_A_DIA.slice(0, 6)).join(' ') },
    };
  }

  function nivelIntermediario() {
    const exNumeros = [
      { id: 'm-num-1', titulo: 'Números 1 2 3 4 5', texto: '1 2 3 4 5 12 23 34 45 15 21 32 43 54 51 123 345 512' },
      { id: 'm-num-2', titulo: 'Números 6 7 8 9 0', texto: '6 7 8 9 0 67 78 89 90 60 76 87 98 09 678 890 706' },
      { id: 'm-num-3', titulo: 'Todos os números', texto: '10 25 38 47 59 60 72 81 93 100 250 1990 2025 365 24' },
      { id: 'm-num-4', titulo: 'Números em frases', texto: 'Tenho 2 filhos e 1 neto. A rua tem 45 casas. O ano tem 12 meses e 365 dias.' },
      { id: 'm-num-5', titulo: 'Horas e datas', texto: 'Acordo às 6 horas. A aula é das 19 às 21. Nasci em 1985. Hoje é dia 15 do mês 8.' },
    ];
    const exPontuacao = [
      { id: 'm-pont-1', titulo: 'Vírgula e ponto', texto: 'Comprei arroz, feijão, café e açúcar. Depois, fui para casa. Cheguei cedo.' },
      { id: 'm-pont-2', titulo: 'Interrogação e exclamação', texto: 'Tudo bem? Que bom! Você vem amanhã? Claro! Que horas são? Já é tarde!' },
      { id: 'm-pont-3', titulo: 'Dois-pontos e ponto e vírgula', texto: 'Lista: pão, leite e ovos. Ana estuda de manhã; Pedro, à tarde; Rosa, à noite.' },
      { id: 'm-pont-4', titulo: 'Hífen', texto: 'segunda-feira guarda-chuva beija-flor bem-vindo couve-flor arco-íris pé-de-moleque' },
      { id: 'm-pont-5', titulo: 'Parênteses e aspas', texto: 'O curso (de informática) começou. Ela disse: "Adorei a aula!" (E eu também.)' },
      { id: 'm-pont-6', titulo: 'Tudo junto', texto: 'Atenção: a aula de hoje (quarta-feira) começa às 19h. Traga caderno, lápis e borracha. Não se atrase!' },
    ];
    const exFrases = Array.from({ length: 6 }, (_, i) => ({
      id: `m-frases-${i + 1}`, titulo: `Frases do dia a dia ${i + 1}`, texto: FRASES_DIA_A_DIA.slice(i * 3, i * 3 + 3).join(' '),
    }));
    const exTextos = TEXTOS_CURTOS.map(([titulo, texto], i) => ({ id: `m-texto-${i + 1}`, titulo, texto }));
    const exRitmo = Array.from({ length: 4 }, (_, i) => ({
      id: `m-ritmo-${i + 1}`, titulo: `Ritmo: 1 minuto ${i + 1}`, tipo: 'tempo', duracao: 60,
      texto: sortearPalavras(`m-ritmo-${i + 1}`, PALAVRAS_COMUNS.concat(PALAVRAS_ACENTO), 80),
      dica: 'Mantenha um ritmo constante, como uma música.',
    }));
    const exTrava = TRAVA_LINGUAS.map((texto, i) => ({ id: `m-trava-${i + 1}`, titulo: `Trava-língua ${i + 1}`, texto }));

    return {
      id: 'intermediario', nome: 'Intermediário', icone: '🌿',
      metas: { ppmInicio: 22, ppmFim: 35, precisao: 94 },
      modulos: [
        { titulo: 'Números', exercicios: exNumeros },
        { titulo: 'Pontuação', exercicios: exPontuacao },
        { titulo: 'Frases do dia a dia', exercicios: exFrases },
        { titulo: 'Textos curtos', exercicios: exTextos },
        { titulo: 'Ritmo', exercicios: exRitmo },
        { titulo: 'Trava-línguas', exercicios: exTrava },
      ],
      prova: { id: 'prova-intermediario', titulo: 'Prova do nível Intermediário', tipo: 'tempo', duracao: 300, meta: { ppm: 35, precisao: 95 }, texto: TEXTOS_CURTOS.map((t) => t[1]).join(' ') },
    };
  }

  function nivelAvancado() {
    const exSimbolos = SIMBOLOS.map(([titulo, texto], i) => ({ id: `a-simb-${i + 1}`, titulo: `Símbolos: ${titulo}`, texto }));
    const exDados = DADOS.map(([titulo, texto], i) => ({ id: `a-dados-${i + 1}`, titulo, texto }));
    const exNumerico = NUMEROS_TECLADO.map(([titulo, texto], i) => ({
      id: `a-numerico-${i + 1}`, titulo: `Teclado numérico: ${titulo}`, texto,
      dica: 'Use o teclado numérico, à direita do teclado. O dedo médio fica no 5, que tem um risquinho. Ligue o Num Lock.',
    }));
    const exLongos = TEXTOS_LONGOS.map(([titulo, texto], i) => ({ id: `a-longo-${i + 1}`, titulo, texto }));
    const exDitado = DITADOS.map(([titulo, frases], i) => ({
      id: `a-ditado-${i + 1}`, titulo: `Ditado: ${titulo}`, tipo: 'ditado', frases, metaPrecisao: 90,
    }));
    const exVelocidade = Array.from({ length: 4 }, (_, i) => ({
      id: `a-veloc-${i + 1}`, titulo: `Teste de velocidade ${i + 1}`, tipo: 'tempo', duracao: 60,
      texto: TEXTOS_LONGOS.map((t) => t[1]).slice(i).concat(TEXTOS_LONGOS.map((t) => t[1]).slice(0, i)).join(' '),
    }));

    return {
      id: 'avancado', nome: 'Avançado', icone: '🌳',
      metas: { ppmInicio: 38, ppmFim: 50, precisao: 96 },
      modulos: [
        { titulo: 'Símbolos', exercicios: exSimbolos },
        { titulo: 'Dados do dia a dia', exercicios: exDados },
        { titulo: 'Teclado numérico', exercicios: exNumerico },
        { titulo: 'Textos longos', exercicios: exLongos },
        { titulo: 'Ditado (ouvir e digitar)', exercicios: exDitado },
        { titulo: 'Velocidade', exercicios: exVelocidade },
      ],
      prova: { id: 'prova-avancado', titulo: 'Prova do nível Avançado', tipo: 'tempo', duracao: 300, meta: { ppm: 45, precisao: 97 }, texto: TEXTOS_LONGOS.map((t) => t[1]).join(' ') },
    };
  }

  const NIVEIS = [nivelIniciante(), nivelIntermediario(), nivelAvancado()];

  // Distribui as metas: a velocidade exigida sobe aos poucos dentro de cada nível.
  const LISTA = [];
  NIVEIS.forEach((nivel) => {
    const exercicios = nivel.modulos.flatMap((m) => m.exercicios.map((e) => Object.assign(e, { modulo: m.titulo })));
    exercicios.forEach((e, i) => {
      e.nivel = nivel.id;
      e.tipo = e.tipo || 'texto';
      const ppm = Math.round(nivel.metas.ppmInicio + ((nivel.metas.ppmFim - nivel.metas.ppmInicio) * i) / Math.max(1, exercicios.length - 1));
      e.meta = e.tipo === 'ditado' ? { ppm: 0, precisao: e.metaPrecisao } : { ppm, precisao: nivel.metas.precisao };
      LISTA.push(e);
    });
    Object.assign(nivel.prova, { nivel: nivel.id, modulo: 'Prova', prova: true });
    LISTA.push(nivel.prova);
  });

  // Metas ajustadas para o aluno (crianças até 12 anos têm metas menores).
  CE.metaDigitacao = function (exercicio, usuario) {
    const meta = { ...exercicio.meta };
    if (usuario && usuario.crianca) {
      meta.ppm = Math.round(meta.ppm * 0.7);
      meta.precisao = Math.max(80, meta.precisao - 5);
    }
    return meta;
  };

  // Palavras para os jogos e para o treino das teclas difíceis.
  CE.palavrasDigitacao = { comuns: PALAVRAS_COMUNS, acento: PALAVRAS_ACENTO, todas: [...new Set(PALAVRAS)] };

  CE.DIGITACAO = { niveis: NIVEIS, lista: LISTA };
})();
