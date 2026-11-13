// Curso de Digitação: 4 níveis (Iniciante, Intermediário, Avançado e Profissional), cada um com módulos, exercícios e uma prova.
// Cada exercício tem uma meta de velocidade (palavras por minuto) e de acertos (%). O aluno só libera o
// próximo exercício quando bate as duas metas. Para crianças as metas são menores (veja CE.metaDigitacao).
//
// Tipos de exercício:
//   texto  - digitar o texto inteiro (é preciso corrigir cada erro para seguir)
//   tempo  - digitar o máximo possível até o tempo acabar (provas e treinos de ritmo)
//   ditado - o professor fala a frase e o aluno digita sem ver
//   ficha  - passar uma ficha de papel para o "sistema", campo por campo, pulando com o Tab (entrada de dados)
//   narrada - o professor narra pedaço por pedaço e o aluno digita sem ver o texto; vai de uma fala pausada e
//            repetida (esperando o aluno) até uma fala contínua e rápida, sem repetição e sem esperar
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

  // Fichas de cadastro (dados inventados): o trabalho de recepção, caixa, RH e escritório.
  // Cada uma: [título, [rótulo, valor]..., meta de velocidade]. A meta de acertos é alta: dado errado dá problema.
  const FICHAS = [
    ['Ficha do posto de saúde', [['Nome completo', 'Maria Aparecida dos Santos'], ['Data de nascimento', '14/03/1958'], ['CPF', '234.567.891-20'],
      ['Cartão do SUS', '700 1234 5678 9012'], ['Telefone', '(69) 99876-5432'], ['Endereço', 'Rua das Seringueiras, 245'], ['Bairro', 'Nova Porto Velho']], 20],
    ['Cadastro de cliente da loja', [['Nome completo', 'José Ribamar Ferreira'], ['CPF', '345.678.912-30'], ['Celular', '(69) 98123-4567'],
      ['E-mail', 'jose.ribamar@correio.escola'], ['Endereço', 'Avenida Brasil, 1020'], ['Cidade', 'Ji-Paraná - RO'], ['CEP', '76900-000']], 22],
    ['Matrícula na escola', [['Nome do aluno', 'Lucas Gabriel Pereira'], ['Data de nascimento', '22/07/2015'], ['Nome da mãe', 'Francisca Pereira da Silva'],
      ['Telefone do responsável', '(69) 99234-1100'], ['Ano escolar', '5'], ['Turma', 'B'], ['Turno', 'Manhã']], 24],
    ['Ficha de admissão (RH)', [['Nome completo', 'Antônia Lima de Souza'], ['CPF', '456.789.123-40'], ['PIS', '123.45678.90-1'],
      ['Cargo', 'Auxiliar administrativo'], ['Data de admissão', '03/02/2025'], ['Salário', 'R$ 1.850,00']], 26],
    ['Pedido de entrega', [['Cliente', 'Raimundo Nonato Costa'], ['Telefone', '(69) 99345-6789'], ['Endereço', 'Rua Dom Pedro II, 88 - Centro'],
      ['Produto', '2 botijões de gás 13 kg'], ['Valor', 'R$ 230,00'], ['Pagamento', 'Pix']], 27],
    ['Nota de serviço', [['Prestador', 'Oficina do Tião'], ['CNPJ', '12.345.678/0001-90'], ['Cliente', 'Clínica Bem Viver'],
      ['Serviço', 'Troca de óleo e filtro'], ['Data', '15/04/2025'], ['Valor', 'R$ 185,50']], 28],
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

  // Digitação narrada: do mais fácil ao mais difícil. O "|" separa os pedaços que o professor fala de cada vez.
  //   velocidade: da fala (1 = normal) · vezes: quantas vezes cada pedaço é falado · repetir: quantas vezes o aluno
  //   pode pedir "Repetir" em cada pedaço (null = à vontade) · espera: "aluno" (o próximo pedaço só vem quando o
  //   aluno terminou de digitar o atual) ou "ritmo" (o professor segue sozinho, no ritmo de alvoPpm palavras por
  //   minuto) · pontuacao: o professor fala a pontuação ("vírgula", "ponto") · precisao: meta de acertos (%).
  const NARRADAS = [
    { titulo: 'Palavra por palavra, bem devagar', unidade: 'palavra', velocidade: 0.7, vezes: 2, repetir: null, espera: 'aluno', pontuacao: true, precisao: 85,
      texto: 'casa|bola|mesa|pato|dado|fita|sapo|vela' },
    { titulo: 'Palavras com acento, devagar', unidade: 'palavra', velocidade: 0.75, vezes: 2, repetir: null, espera: 'aluno', pontuacao: true, precisao: 85,
      texto: 'mãe|café|avó|pão|você|maçã|ônibus|lição' },
    { titulo: 'Pedaços de frase, com pausas', unidade: 'pedaço', velocidade: 0.8, vezes: 2, repetir: null, espera: 'aluno', pontuacao: true, precisao: 88,
      texto: 'O sol|nasceu cedo.|A feira|abre às sete.|Eu levo|a sacola.' },
    { titulo: 'Frases inteiras, devagar', unidade: 'frase', velocidade: 0.9, vezes: 2, repetir: null, espera: 'aluno', pontuacao: true, precisao: 88,
      texto: 'Hoje é dia de aula.|Eu gosto de aprender.|O computador ajuda muito.|Vamos digitar com calma.' },
    { titulo: 'Frases faladas uma vez (pode repetir uma)', unidade: 'frase', velocidade: 1, vezes: 1, repetir: 1, espera: 'aluno', pontuacao: true, precisao: 90,
      texto: 'Bom dia, tudo bem com você?|A reunião começa às nove horas.|Traga o documento e a carteira.|Obrigado pela atenção!' },
    { titulo: 'Fala normal, sem repetição', unidade: 'frase', velocidade: 1.1, vezes: 1, repetir: 0, espera: 'aluno', pontuacao: false, precisao: 90,
      texto: 'O posto de saúde abre às sete horas.|Leve o cartão do SUS e um documento com foto.|A vacina é gratuita para toda a família.|Chegue cedo para pegar a senha.' },
    { titulo: 'Fala contínua: o professor não espera', unidade: 'frase', velocidade: 1.2, vezes: 1, repetir: 0, espera: 'ritmo', alvoPpm: 18, pontuacao: false, precisao: 85,
      texto: 'Porto Velho fica às margens do rio Madeira.|A cidade nasceu com a Estrada de Ferro Madeira-Mamoré.|Hoje ela é a capital de Rondônia.|Muita gente visita o Mercado Cultural.' },
    { titulo: 'Fala contínua e rápida', unidade: 'frase', velocidade: 1.35, vezes: 1, repetir: 0, espera: 'ritmo', alvoPpm: 25, pontuacao: false, precisao: 85,
      texto: 'Prezados clientes, a loja vai funcionar em horário especial.|No sábado, abriremos às oito horas e fecharemos ao meio-dia.|Na segunda-feira, o atendimento volta ao normal.|Agradecemos a compreensão e desejamos uma ótima semana.' },
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

  // Textos da nossa terra: Rondônia (Intermediário).
  const TEXTOS_TERRA = [
    ['Porto Velho', 'Porto Velho, a capital de Rondônia, fica às margens do rio Madeira. A cidade nasceu no começo do século vinte, junto com a construção da Estrada de Ferro Madeira-Mamoré.'],
    ['A Madeira-Mamoré', 'A Estrada de Ferro Madeira-Mamoré ligava Porto Velho a Guajará-Mirim. Trabalhadores de muitos países ajudaram a construir a ferrovia no meio da floresta, enfrentando chuva, calor e doenças.'],
    ['O tacacá', 'O tacacá é servido bem quente, na cuia. Leva tucupi, goma de mandioca, jambu e camarão seco. O jambu deixa a boca tremendo, e muita gente adora essa sensação no fim da tarde.'],
    ['O rio Madeira', 'O rio Madeira é um dos maiores afluentes do rio Amazonas. Nele ficam as usinas de Santo Antônio e de Jirau, que produzem energia elétrica para muitos estados do Brasil.'],
    ['O Forte Príncipe da Beira', 'O Real Forte Príncipe da Beira fica em Costa Marques, às margens do rio Guaporé. Foi construído pelos portugueses no século dezoito, para proteger a fronteira com as terras da Espanha.'],
    ['O nome Rondônia', 'O nome Rondônia é uma homenagem ao Marechal Cândido Rondon, que levou as linhas do telégrafo pelo interior do Brasil e defendeu os povos indígenas. A frase dele era: morrer, se preciso for; matar, nunca.'],
    ['Arraial Flor do Maracujá', 'O Arraial Flor do Maracujá é a grande festa junina de Porto Velho. Tem quadrilhas, bois-bumbás, música e comidas típicas, como pamonha, canjica, milho cozido e quentão.'],
    ['O café de Rondônia', 'Rondônia é um dos maiores produtores de café do Brasil. Em cidades como Cacoal, Ji-Paraná e Alta Floresta, muitas famílias vivem da lavoura e capricham na colheita para ter um café especial.'],
  ];
  // Caixa de supermercado (teclado numérico): os preços, o total, o valor pago e o troco.
  const COMPRAS_CAIXA = [[[4.99, 7.5, 12.9, 3.25], 50], [[2.49, 2.49, 18.9, 6.75, 1.99], 50], [[32.9, 5.49, 9.99], 100], [[1.25, 3.8, 15.6, 22.45, 4.3], 50], [[89.9, 12.5, 7.99, 3.49], 200]];
  const reais = (v) => (Math.round(v * 100) / 100).toFixed(2).replace('.', ',');
  const textoCaixa = ([itens, pago]) => { const total = itens.reduce((a, b) => a + b, 0); return `${itens.map(reais).join(' + ')} = ${reais(total)} pago ${reais(pago)} troco ${reais(pago - total)}`; };
  // Simulado de concurso: textos formais, como os das provas de digitação dos concursos.
  const TEXTOS_CONCURSO = [
    'O candidato deverá comparecer ao local de prova com uma hora de antecedência, munido de documento oficial com foto e caneta esferográfica de tinta preta, fabricada em material transparente. Não será permitida a entrada após o fechamento dos portões.',
    'A prova prática de digitação terá duração de cinco minutos. Será considerado o número de toques líquidos, que corresponde ao total de toques digitados menos os toques descontados por erro. Cada erro cometido desconta cinco toques do total.',
    'Compete ao assistente administrativo atender o público, receber e encaminhar documentos, organizar arquivos, redigir ofícios e memorandos, controlar o material de expediente e apoiar as atividades das demais áreas do órgão.',
    'O servidor público deve tratar os cidadãos com cortesia, prestar informações de forma clara e guardar sigilo sobre os assuntos do serviço. A pontualidade, a assiduidade e o zelo com o patrimônio público são deveres de todos.',
  ];

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
    const exTerra = TEXTOS_TERRA.map(([titulo, texto], i) => ({ id: `m-terra-${i + 1}`, titulo, texto, dica: 'Textos da nossa terra: capriche nos acentos e na pontuação.' }));
    const exRitmo = Array.from({ length: 4 }, (_, i) => ({
      id: `m-ritmo-${i + 1}`, titulo: `Ritmo: 1 minuto ${i + 1}`, tipo: 'tempo', duracao: 60,
      texto: sortearPalavras(`m-ritmo-${i + 1}`, PALAVRAS_COMUNS.concat(PALAVRAS_ACENTO), 80),
      dica: 'Mantenha um ritmo constante, como uma música.',
    }));
    const exTrava = TRAVA_LINGUAS.map((texto, i) => ({ id: `m-trava-${i + 1}`, titulo: `Trava-língua ${i + 1}`, texto }));
    const exNarrada = NARRADAS.map((n, i) => {
      const pedacos = n.texto.split('|');
      return {
        ...n, id: `m-narr-${i + 1}`, tipo: 'narrada', pedacos, texto: pedacos.join(' '), metaPrecisao: n.precisao,
        dica: n.espera === 'ritmo'
          ? `O professor fala sem parar, no ritmo de ${n.alvoPpm} palavras por minuto, e não repete. Digite enquanto escuta!`
          : 'Escute e digite o que o professor falar. Quando terminar um pedaço, aperte Espaço: aí ele fala o próximo.',
      };
    });

    return {
      id: 'intermediario', nome: 'Intermediário', icone: '🌿',
      metas: { ppmInicio: 22, ppmFim: 35, precisao: 94 },
      modulos: [
        { titulo: 'Números', exercicios: exNumeros },
        { titulo: 'Pontuação', exercicios: exPontuacao },
        { titulo: 'Frases do dia a dia', exercicios: exFrases },
        { titulo: 'Textos curtos', exercicios: exTextos },
        { titulo: 'Textos da nossa terra (Rondônia)', exercicios: exTerra },
        { titulo: 'Ritmo', exercicios: exRitmo },
        { titulo: 'Trava-línguas', exercicios: exTrava },
        { titulo: 'Digitação narrada (o professor fala)', exercicios: exNarrada },
      ],
      prova: { id: 'prova-intermediario', titulo: 'Prova do nível Intermediário', tipo: 'tempo', duracao: 300, meta: { ppm: 35, precisao: 95 }, texto: TEXTOS_CURTOS.map((t) => t[1]).join(' ') },
    };
  }

  function nivelAvancado() {
    const exSimbolos = SIMBOLOS.map(([titulo, texto], i) => ({ id: `a-simb-${i + 1}`, titulo: `Símbolos: ${titulo}`, texto }));
    const exDados = DADOS.map(([titulo, texto], i) => ({ id: `a-dados-${i + 1}`, titulo, texto }));
    const exFichas = FICHAS.map(([titulo, campos, ppm], i) => ({
      id: `a-ficha-${i + 1}`, titulo, tipo: 'ficha', campos, metaFixa: { ppm, precisao: 98 },
      dica: 'Digite cada dado igualzinho ao papel (com pontos, traços e acentos) e aperte Tab para ir ao próximo campo.',
    }));
    const exNumerico = NUMEROS_TECLADO.map(([titulo, texto], i) => ({
      id: `a-numerico-${i + 1}`, titulo: `Teclado numérico: ${titulo}`, texto,
      dica: 'Use o teclado numérico, à direita do teclado. O dedo médio fica no 5, que tem um risquinho. Ligue o Num Lock.',
    }));
    const exCaixa = COMPRAS_CAIXA.map((compra, i) => ({
      id: `a-caixa-${i + 1}`, titulo: `Caixa do mercado: compra ${i + 1}`, texto: textoCaixa(compra),
      dica: 'Como no caixa do mercado: os números, a vírgula e o "+" ficam no teclado numérico. Confira o total e o troco!',
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
        { titulo: 'Fichas de cadastro (trabalho)', exercicios: exFichas },
        { titulo: 'Teclado numérico', exercicios: exNumerico },
        { titulo: 'Caixa de supermercado (teclado numérico)', exercicios: exCaixa },
        { titulo: 'Textos longos', exercicios: exLongos },
        { titulo: 'Ditado (ouvir e digitar)', exercicios: exDitado },
        { titulo: 'Velocidade', exercicios: exVelocidade },
      ],
      prova: { id: 'prova-avancado', titulo: 'Prova do nível Avançado', tipo: 'tempo', duracao: 300, meta: { ppm: 45, precisao: 97 }, texto: TEXTOS_LONGOS.map((t) => t[1]).join(' ') },
    };
  }

  // ---------- Nível 4: Profissional (digitação para o trabalho e para testes de seleção) ----------
  const TEXTOS_ESCRITORIO = [
    ['E-mail formal', 'Prezado Senhor Carlos, conforme combinado por telefone, encaminho em anexo o orçamento solicitado, com validade de 15 dias. Fico à disposição para qualquer esclarecimento. Atenciosamente, Ana Paula Ribeiro, Setor de Compras.'],
    ['Ofício', 'Ofício nº 027/2025. Ao Senhor Diretor da Escola Estadual Rio Madeira. Assunto: Solicitação de uso do auditório. Senhor Diretor, solicitamos o uso do auditório no dia 12 de junho, das 14h às 17h, para a formatura do curso de informática.'],
    ['Ata de reunião', 'Aos dez dias do mês de março de 2025, às 9h, reuniram-se na sala de reuniões os funcionários do setor administrativo. Foram tratados os seguintes assuntos: horário de atendimento, escala de férias e compra de material de escritório.'],
    ['Atendimento ao cliente', 'Bom dia! Agradecemos o seu contato. Informamos que o seu pedido nº 45.871 foi enviado hoje e deve chegar em até cinco dias úteis. Para acompanhar a entrega, use o código de rastreio BR123456789 no site dos Correios.'],
    ['Comunicado interno', 'Comunicado aos colaboradores: a partir de segunda-feira, o expediente será das 7h30 às 17h30, com intervalo de uma hora para o almoço. O ponto deve ser registrado na entrada, na saída e no intervalo. Dúvidas, procurar o RH.'],
    ['Relatório', 'Relatório mensal de vendas: em abril, a loja vendeu R$ 128.450,00, um aumento de 12% em relação a março. Os produtos mais vendidos foram ventiladores, panelas e liquidificadores. A meta para maio é de R$ 135.000,00.'],
  ];
  const DADOS_TRABALHO = [
    ['Códigos de produtos', 'COD-1045 Arroz 5 kg R$ 25,90; COD-2210 Feijão 1 kg R$ 8,49; COD-3307 Óleo 900 ml R$ 7,99; COD-4120 Café 500 g R$ 15,50.'],
    ['Nota fiscal', 'NF-e 000.123.456 Série 1. CNPJ 12.345.678/0001-90. Emissão 03/04/2025. Valor total R$ 2.347,80. ICMS R$ 281,74. Natureza: venda de mercadoria.'],
    ['Agenda de atendimentos', '08h00 Sr. João (retorno); 08h30 Dona Lúcia (exame); 09h15 Clínica Vida (entrega); 10h00 Reunião da equipe; 14h00 Fornecedor ABC Ltda.'],
    ['Planilha de estoque', 'Item 001: 120 unidades, mínimo 50. Item 002: 35 unidades, mínimo 40 (repor). Item 003: 0 unidade (em falta). Item 004: 87 unidades, mínimo 30.'],
  ];
  const FICHAS_SELECAO = [
    ['Cadastro de fornecedor', [['Razão social', 'Distribuidora Norte Ltda.'], ['CNPJ', '23.456.789/0001-12'], ['Telefone', '(69) 3224-5566'],
      ['E-mail', 'vendas@distnorte.com.br'], ['Endereço', 'Avenida Jorge Teixeira, 3200'], ['Cidade', 'Porto Velho - RO'], ['Prazo de pagamento', '30 dias']], 30],
    ['Ficha de paciente', [['Nome completo', 'Benedita Alves Rocha'], ['Nascimento', '09/11/1967'], ['CPF', '567.891.234-50'], ['Cartão do SUS', '898 0012 3456 7890'],
      ['Convênio', 'Particular'], ['Alergias', 'Dipirona'], ['Contato de emergência', 'Paulo Rocha (69) 99456-1122']], 32],
    ['Ordem de serviço', [['Número da OS', '2025-0457'], ['Cliente', 'Mercadinho Boa Vista'], ['Equipamento', 'Computador do caixa 2'],
      ['Defeito', 'Não liga; luz da fonte apagada'], ['Técnico', 'Rafael Moura'], ['Previsão', '18/04/2025'], ['Valor', 'R$ 150,00']], 33],
    ['Registro de entrega', [['Remetente', 'Loja Casa Bonita'], ['Destinatário', 'Joana Darc Figueiredo'], ['Endereço', 'Rua Rio Branco, 1550, apto 302'],
      ['CEP', '76804-120'], ['Volumes', '3'], ['Peso total', '12,5 kg'], ['Rastreio', 'BR987654321']], 34],
  ];
  const DITADOS_TRABALHO = [
    ['Recado ao telefone', ['O senhor Marcos ligou às dez horas.', 'Ele pediu o orçamento das cadeiras.', 'O telefone dele é nove nove oito um dois, três quatro cinco seis.', 'Retornar ainda hoje, por favor.']],
    ['Pedido do cliente', ['A cliente quer duas caixas de papel A4.', 'Também quer cinco canetas azuis.', 'A entrega deve ser na sexta-feira.', 'O pagamento será no Pix.']],
    ['Anotação da reunião', ['A reunião foi adiada para quinta-feira.', 'Todos devem trazer o relatório do mês.', 'A sala será a número três.', 'Não se esqueçam do crachá.']],
  ];
  const SELECAO = [
    'Para concorrer à vaga de assistente administrativo, o candidato deverá ter ensino médio completo, conhecimentos de informática e boa comunicação. As inscrições vão de 1º a 15 de maio, pelo site da empresa ou presencialmente, das 8h às 17h.',
    'A digitação é uma das habilidades mais pedidas em vagas de escritório, recepção, caixa e atendimento. Nos testes de seleção, o candidato digita um texto por alguns minutos, e são avaliadas a velocidade e, principalmente, a quantidade de erros.',
    'Cuidar bem dos documentos da empresa é responsabilidade de todos. Arquivos importantes devem ser salvos com nomes claros, em pastas organizadas, e ter uma cópia de segurança. Senhas não devem ser anotadas em papéis colados no monitor.',
    'O bom atendimento começa com um cumprimento educado e termina com a certeza de que o cliente foi ajudado. Anote os dados com atenção, confirme o nome, o telefone e o e-mail, e nunca prometa um prazo que não pode cumprir.',
  ];
  function nivelProfissional() {
    const exEscritorio = TEXTOS_ESCRITORIO.map(([titulo, texto], i) => ({ id: `p-escrit-${i + 1}`, titulo, texto }));
    const exDados = DADOS_TRABALHO.map(([titulo, texto], i) => ({ id: `p-dados-${i + 1}`, titulo, texto, dica: 'Atenção a cada número, ponto e vírgula: num documento de trabalho, um dígito errado muda tudo.' }));
    const exFichas = FICHAS_SELECAO.map(([titulo, campos, ppm], i) => ({
      id: `p-ficha-${i + 1}`, titulo, tipo: 'ficha', campos, metaFixa: { ppm, precisao: 99 },
      dica: 'Entrada de dados de verdade: rápido e sem erro. Copie igualzinho ao papel e use o Tab para pular de campo.',
    }));
    const exDitado = DITADOS_TRABALHO.map(([titulo, frases], i) => ({ id: `p-ditado-${i + 1}`, titulo: `Ditado: ${titulo}`, tipo: 'ditado', frases, metaPrecisao: 93 }));
    const exSelecao = SELECAO.map((t, i) => ({
      id: `p-selecao-${i + 1}`, titulo: `Simulado de seleção ${i + 1} (${i < 2 ? 2 : 3} minutos)`, tipo: 'tempo', duracao: i < 2 ? 120 : 180,
      texto: SELECAO.slice(i).concat(SELECAO.slice(0, i)).join(' '),
      dica: 'Como num teste de emprego: o cronômetro corre e cada erro conta. Mantenha o ritmo, sem correr demais.',
    }));
    // Concurso: 5 e 10 minutos, e a nota em "toques líquidos" (cada erro desconta 5 toques).
    const exConcurso = [5, 5, 10, 10].map((min, i) => ({
      id: `p-concurso-${i + 1}`, titulo: `Simulado de concurso ${i + 1} (${min} minutos)`, tipo: 'tempo', duracao: min * 60, concurso: { desconto: 5 },
      texto: TEXTOS_CONCURSO.slice(i).concat(TEXTOS_CONCURSO.slice(0, i), SELECAO, TEXTOS_ESCRITORIO.map((t) => t[1])).join(' '),
      dica: 'Como na prova prática dos concursos: a nota é em TOQUES LÍQUIDOS (o que você digitou menos 5 toques por erro). Errar custa caro!',
    }));
    return {
      id: 'profissional', nome: 'Profissional', icone: '💼', semNivelamento: true,
      metas: { ppmInicio: 55, ppmFim: 65, precisao: 97 },
      modulos: [
        { titulo: 'Textos de escritório', exercicios: exEscritorio },
        { titulo: 'Números e códigos do trabalho', exercicios: exDados },
        { titulo: 'Entrada de dados rápida', exercicios: exFichas },
        { titulo: 'Ditado do trabalho (recados e pedidos)', exercicios: exDitado },
        { titulo: 'Simulados de teste de seleção', exercicios: exSelecao },
        { titulo: 'Simulado de concurso (5 e 10 minutos)', exercicios: exConcurso },
      ],
      prova: { id: 'prova-profissional', titulo: 'Prova do nível Profissional (teste de seleção, 5 minutos)', tipo: 'tempo', duracao: 300, meta: { ppm: 55, precisao: 97 }, texto: TEXTOS_ESCRITORIO.map((t) => t[1]).concat(SELECAO).join(' ') },
    };
  }

  const NIVEIS = [nivelIniciante(), nivelIntermediario(), nivelAvancado(), nivelProfissional()];

  // Distribui as metas: a velocidade exigida sobe aos poucos dentro de cada nível.
  const LISTA = [];
  NIVEIS.forEach((nivel) => {
    const exercicios = nivel.modulos.flatMap((m) => m.exercicios.map((e) => Object.assign(e, { modulo: m.titulo })));
    exercicios.forEach((e, i) => {
      e.nivel = nivel.id;
      e.tipo = e.tipo || 'texto';
      const ppm = Math.round(nivel.metas.ppmInicio + ((nivel.metas.ppmFim - nivel.metas.ppmInicio) * i) / Math.max(1, exercicios.length - 1));
      e.meta = e.tipo === 'ditado' || e.tipo === 'narrada' ? { ppm: 0, precisao: e.metaPrecisao } : e.metaFixa ? { ...e.metaFixa } : { ppm, precisao: nivel.metas.precisao };
      LISTA.push(e);
    });
    Object.assign(nivel.prova, { nivel: nivel.id, modulo: 'Prova', prova: true });
    LISTA.push(nivel.prova);
  });

  // Metas ajustadas para o aluno (crianças até 12 anos têm metas menores; no modo desafio, a velocidade sobe 20%,
  // veja ritmo.js).
  CE.metaDigitacao = function (exercicio, usuario) {
    const meta = { ...exercicio.meta };
    if (usuario && usuario.crianca) {
      meta.ppm = Math.round(meta.ppm * 0.7);
      meta.precisao = Math.max(80, meta.precisao - 5);
    }
    return CE.ritmo ? CE.ritmo.ajustarMeta(meta, exercicio) : meta;
  };

  // Palavras para os jogos e para o treino das teclas difíceis.
  CE.palavrasDigitacao = { comuns: PALAVRAS_COMUNS, acento: PALAVRAS_ACENTO, todas: [...new Set(PALAVRAS)] };

  // Teste de nivelamento: 1 minuto digitando frases do dia a dia (com acentos e pontuação).
  const NIVELAMENTO = {
    id: 'nivelamento-digitacao', titulo: 'Teste de nivelamento', modulo: 'Nivelamento', nivel: 'iniciante', tipo: 'tempo', duracao: 60, nivelamento: true,
    meta: { ppm: 0, precisao: 0 }, texto: FRASES_SIMPLES.slice(0, 8).concat(FRASES_DIA_A_DIA).join(' '),
    dica: 'Digite com calma e atenção, no seu ritmo normal. O resultado mostra em que nível você começa.',
  };

  // Textos para a corrida da turma (até ~600 letras, cortados no fim de uma palavra).
  const cortar = (t, n = 600) => (t.length <= n ? t : t.slice(0, t.lastIndexOf(' ', n)));
  const TEXTOS_CORRIDA = {
    facil: ['🌱 Fácil (frases simples)', cortar(FRASES_SIMPLES.join(' '))],
    medio: ['🌿 Médio (frases do dia a dia)', cortar(FRASES_DIA_A_DIA.join(' '))],
    dificil: ['🌳 Difícil (texto com pontuação)', cortar(TEXTOS_LONGOS.map((t) => t[1]).join(' '))],
  };

  CE.DIGITACAO = { niveis: NIVEIS, lista: LISTA, nivelamento: NIVELAMENTO, textosCorrida: TEXTOS_CORRIDA };
})();
