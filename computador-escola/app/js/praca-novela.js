// Praça Escola: o que cada prédio faz e a novela da cidade (só os textos e as respostas; as regras ficam em
// praca-regras.js e a tela em apps/praca.js).
// • Tarefa do dia: cada lugar aceso tem uma tarefinha rápida ligada ao curso (muda a cada dia). Cada aluno faz uma
//   por dia em cada lugar, e a turma tem um desafio da semana em cada um (metade da turma fazendo a tarefa).
// • Novela da cidade: capítulos com um mistério. As pistas ficam nos prédios (marcados com 🔎 no mapa) e cada pista é
//   uma tarefa no computador. A turma junta as pistas e o instrutor revela o final no coreto.
// Tipos de tarefa: "escolha" (uma das opções), "lista" (achar o item certo num papel: extrato, ficha, quadro de
// horários) e "digitar" (copiar igualzinho, ou responder um valor em reais quando "numero" for true).
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else { raiz.CE = raiz.CE || {}; raiz.CE.pracaNovela = fabrica(); }
})(typeof self !== 'undefined' ? self : this, function () {
  const escolha = (pergunta, opcoes, certa, explica) => ({ tipo: 'escolha', pergunta, opcoes, certa, explica });
  const lista = (pergunta, itens, certa, explica) => ({ tipo: 'lista', pergunta, itens, certa, explica });
  const copiar = (pergunta, modelo, explica) => ({ tipo: 'digitar', pergunta, modelo, explica });
  const valor = (pergunta, resposta, explica) => ({ tipo: 'digitar', numero: true, pergunta, resposta, explica });

  // ---------- Tarefa do dia de cada lugar (a cada dia, uma da lista) ----------
  const TAREFAS = {
    escola: { titulo: 'Leitura na biblioteca', tarefas: [
      escolha('Aviso da biblioteca: “Livros emprestados voltam em 7 dias.” A Ana pegou um livro na segunda-feira. Até quando ela devolve?',
        ['Na segunda-feira seguinte', 'No mesmo dia', 'Daqui a um mês'], 0, 'Sete dias depois de uma segunda-feira é a segunda-feira seguinte.'),
      escolha('Na estante, os livros ficam em ordem alfabética pelo sobrenome do autor. Qual vem primeiro?',
        ['Machado de Assis (Assis)', 'Jorge Amado (Amado)', 'Cecília Meireles (Meireles)'], 1, 'Amado vem antes de Assis porque, depois do “A”, o “m” vem antes do “s”.'),
      copiar('Copie a frase do cartaz da biblioteca, com a letra maiúscula e o ponto:', 'Ler abre portas.', 'Começou com maiúscula e terminou com ponto: frase completa!'),
    ] },
    horta: { titulo: 'Cuidar da horta', tarefas: [
      lista('Diário da horta: qual canteiro está há mais tempo sem água?',
        ['Alface: regado ontem', 'Cebolinha: regado há 4 dias', 'Couve: regado hoje', 'Tomate: regado há 2 dias'], 1, 'A cebolinha está há 4 dias sem água: é a primeira a regar.'),
      escolha('A turma colheu 12 pés de alface para dividir igualmente entre 4 famílias. Quantos pés cada família leva?',
        ['3', '4', '8'], 0, '12 dividido por 4 dá 3.'),
      escolha('Qual é a melhor hora para regar a horta no calor de Porto Velho?',
        ['Ao meio-dia, com sol forte', 'De manhã cedo ou no fim da tarde', 'Tanto faz'], 1, 'Com sol forte a água evapora rápido. De manhã cedo ou no fim da tarde a planta aproveita melhor.'),
    ] },
    estacao: { titulo: 'Telégrafo da estação', tarefas: [
      copiar('O telegrafista precisa mandar esta mensagem. Copie igualzinho:', 'Trem chega às 10h em Guajará-Mirim.', 'Mensagem enviada! Repare no acento de “às” e no hífen de Guajará-Mirim.'),
      copiar('Copie a placa histórica da estação:', 'A Madeira-Mamoré foi inaugurada em 1912.', 'Placa copiada, com o hífen de Madeira-Mamoré e o ano certinho.'),
      lista('Quadro de horários: qual horário está errado?',
        ['Porto Velho: saída às 08h00', 'Jaci-Paraná: chegada às 09h30', 'Abunã: chegada às 25h00', 'Guajará-Mirim: chegada às 15h00'], 2, 'Não existe 25h00: o dia vai até 23h59.'),
    ] },
    rio: { titulo: 'Pescaria de palavras', tarefas: [
      copiar('Pescaria de palavras: o peixe só fica com quem digita o nome dele certinho.', 'tambaqui', 'Pescou! O tambaqui é um dos peixes mais pescados no Rio Madeira.'),
      copiar('Pescaria de palavras: digite o nome do peixe gigante da Amazônia.', 'pirarucu', 'Pescou o pirarucu, que pode passar de 2 metros!'),
      escolha('O Seu Bené recebeu a mensagem: “Ganhe um barco novo! Responda com seu CPF e a senha do banco.” O que ele faz?',
        ['Responde com o CPF', 'Apaga e não responde', 'Manda para os amigos'], 1, 'Ninguém dá prêmio pedindo senha de banco: é golpe.'),
    ] },
    posto: { titulo: 'Balcão do posto', tarefas: [
      escolha('Chegou um SMS: “Seu cartão do SUS será bloqueado hoje. Clique: sus-atualiza.top”. É verdadeiro?',
        ['Sim, é preciso clicar logo', 'Não: é golpe, com pressa e endereço estranho'], 1, 'Pressa e endereço estranho são sinais de golpe. Na dúvida, pergunte no posto.'),
      lista('Carteira de vacinação do Seu Raimundo (estamos em 2026). O reforço do tétano é a cada 10 anos. O que está atrasado?',
        ['Febre amarela: dose única em 2010', 'Tétano: último reforço em 2012', 'Gripe: tomou em 2026'], 1, 'Desde 2012 já passaram mais de 10 anos: está na hora do reforço do tétano.'),
      escolha('Para agendar uma consulta pela internet, o que normalmente pedem?',
        ['O Cartão SUS ou o CPF', 'A senha do banco', 'Foto do cartão de crédito'], 0, 'Agendamento pede os seus dados de saúde (Cartão SUS ou CPF), nunca senha de banco.'),
    ] },
    correios: { titulo: 'Separar as cartas', tarefas: [
      escolha('Qual destes endereços de e-mail está escrito certo?',
        ['ana.souza@correio.escola', 'ana souza@correio', 'ana.souza.correio.escola'], 0, 'E-mail tem o nome, a @ e o endereço do provedor, sem espaços.'),
      lista('Qual envelope está sem o CEP?',
        ['Rua das Flores, 10 - Porto Velho/RO - 76800-000', 'Av. Sete de Setembro, 300 - Porto Velho/RO', 'Rua Rio Madeira, 52 - Ji-Paraná/RO - 76900-000'], 1, 'Sem o CEP a carta demora ou volta. O CEP tem 8 números (00000-000).'),
      escolha('Você vai mandar a mesma mensagem para a turma toda sem mostrar o e-mail de cada um. Qual campo usa?',
        ['Para', 'Cc (com cópia)', 'Cco (com cópia oculta)'], 2, 'No Cco ninguém vê o endereço dos outros.'),
    ] },
    banco: { titulo: 'Detetive do extrato', tarefas: [
      lista('Extrato da Dona Lúcia: qual lançamento ela não reconhece?',
        ['Pix recebido - Raimundo da feira - R$ 30,00', 'Conta de luz - R$ 89,90', 'Pix enviado - MEGA PRÊMIOS - R$ 150,00', 'Supermercado - R$ 62,40'], 2, 'Um Pix para “prêmios” que ela não fez é sinal de golpe: é avisar o banco na hora.'),
      escolha('Antes de confirmar um Pix, o que é mais importante conferir?',
        ['A cor do aplicativo', 'O nome de quem vai receber e o valor', 'A hora do celular'], 1, 'Confira sempre o nome de quem recebe e o valor antes de confirmar.'),
      escolha('Qual destas senhas é a mais segura?',
        ['123456', 'A data de nascimento', 'Tucuma#Rio83'], 2, 'Senha forte mistura letras maiúsculas e minúsculas, números e símbolos.'),
    ] },
    prefeitura: { titulo: 'Balcão da Prefeitura', tarefas: [
      lista('Formulário da Prefeitura: qual campo está preenchido errado?',
        ['Nome: Maria da Silva', 'CPF: 123.456.789', 'Telefone: (69) 99999-0000', 'Cidade: Porto Velho'], 1, 'O CPF tem 11 números (000.000.000-00): faltaram os 2 últimos.'),
      escolha('Para entrar nos serviços do governo pela internet (gov.br), você usa:',
        ['O CPF e a senha da sua conta gov.br', 'O telefone de um amigo', 'A senha do banco'], 0, 'A conta gov.br usa o seu CPF e uma senha só sua.'),
      escolha('Um site desconhecido cobra R$ 89,90 para “liberar o seu CPF bloqueado”. O que fazer?',
        ['Pagar logo', 'Desconfiar e consultar só no site oficial da Receita Federal'], 1, 'A situação do CPF se consulta de graça no site da Receita Federal. Site cobrando para “liberar” é golpe.'),
    ] },
    feira: { titulo: 'Caixa da feira', tarefas: [
      valor('Uma freguesa levou 2 kg de farinha d’água a R$ 8,50 o quilo e pagou com R$ 20,00. Qual é o troco (em reais)?', 3, '2 × 8,50 = 17,00. Depois, 20,00 − 17,00 = 3,00.'),
      valor('Um açaí de R$ 12,00 e 3 tucumãs de R$ 2,00 cada. Quanto deu a compra (em reais)?', 18, '3 × 2,00 = 6,00. Depois, 12,00 + 6,00 = 18,00.'),
      escolha('O Seu Raimundo vai vender pela internet. Qual anúncio está melhor?',
        ['“Vendo coisas”', '“Farinha d’água fina, 1 kg, R$ 8,50. Entrego no bairro.”', '“Preço a combinar, chama no privado”'], 1, 'Bom anúncio diz o que é, a quantidade, o preço e como entrega.'),
    ] },
    empregos: { titulo: 'Balcão de vagas', tarefas: [
      escolha('O que NÃO vai no currículo?',
        ['Experiência e cursos', 'Telefone e e-mail', 'A senha do e-mail'], 2, 'Senha nunca vai no currículo. Coloque contato, experiências e cursos.'),
      lista('O Seu Raimundo tem experiência em vender na feira. Qual vaga combina com ele?',
        ['Motorista com CNH D', 'Vendedor de loja: atendimento e caixa', 'Técnico de enfermagem com registro', 'Pedreiro com experiência'], 1, 'Quem vende na feira tem experiência com atendimento e caixa.'),
      escolha('Uma vaga pede R$ 50 de “taxa de inscrição” por Pix para marcar a entrevista. O que é isso?',
        ['Normal, toda vaga cobra', 'Golpe: empresa séria não cobra para entrevistar'], 1, 'Vaga de emprego de verdade não cobra taxa do candidato.'),
    ] },
  };

  // ---------- A novela da cidade ----------
  const pista = (id, lugar, titulo, tarefa) => ({ id, lugar, titulo, tarefa });
  const CAPITULOS = [
    {
      id: 'barco', emoji: '⛵', titulo: 'O barco do Seu Bené sumiu',
      abertura: 'Amanheceu e o barco do Seu Bené não estava no cais! Ele jura que amarrou bem na noite passada. Foi roubado? As pistas estão nos lugares marcados com 🔎.',
      pistas: [
        pista('barco-bilhete', 'rio', 'O bilhete no cais', escolha('Preso no poste do cais havia um bilhete: “Tio, levei o barco às 6h para arrumar o motor. Mandei e-mail. Zeca.” Quem levou o barco?',
          ['Um ladrão desconhecido', 'O Zeca, sobrinho do Seu Bené', 'A Dona Rosa'], 1, 'O bilhete é do Zeca, que chama o Seu Bené de tio.')),
        pista('barco-email', 'correios', 'O e-mail perdido', escolha('O Zeca diz que mandou e-mail, mas a Caixa de Entrada do Seu Bené está vazia. Onde procurar?',
          ['Na pasta Spam (lixo eletrônico)', 'Na Lixeira do computador', 'Em lugar nenhum: o e-mail não existe'], 0, 'E-mail de quem não está nos contatos às vezes cai no Spam. Vale conferir.')),
        pista('barco-telegrama', 'estacao', 'O telegrama da oficina', copiar('A oficina mandou um recado pela estação. Copie para o Seu Bené ler:', 'Motor pronto. Barco volta sexta.', 'Recado entregue ao Seu Bené.')),
      ],
      final: 'O barco não foi roubado: o Zeca levou para consertar o motor e avisou por e-mail, mas a mensagem caiu no Spam. Na sexta, o barco voltou com o motor novinho, e o Seu Bené levou a turma para um passeio no Rio Madeira.',
      moral: 'Confira a pasta Spam de vez em quando e combine as coisas por escrito.',
    },
    {
      id: 'feira', emoji: '🧺', titulo: 'O golpe na feira',
      abertura: 'Três feirantes perderam dinheiro esta semana. Todos falaram com um vendedor de “maquininha de cartão milagrosa”. A turma vai investigar antes que mais gente caia.',
      pistas: [
        pista('feira-caderno', 'feira', 'O caderno do Seu Raimundo', lista('Anotações do Seu Raimundo. Qual delas não bate?',
          ['Farinha: 2 kg × R$ 8,50 = R$ 17,00', 'Açaí: 1 × R$ 12,00 = R$ 12,00', 'Maquininha: “taxa de ativação” de R$ 150,00 por Pix a um desconhecido', 'Tucumã: 3 × R$ 2,00 = R$ 6,00'], 2, 'Maquininha de verdade não pede Pix adiantado para um desconhecido.')),
        pista('feira-pix', 'banco', 'O Pix suspeito', lista('Extrato da conta da feira. Qual lançamento mostra o golpe?',
          ['Pix recebido - cliente da feira - R$ 25,00', 'Pix enviado - pessoa desconhecida - R$ 150,00 - “taxa da maquininha”', 'Pagamento - fornecedor de farinha - R$ 80,00', 'Depósito em dinheiro - R$ 300,00'], 1, 'O dinheiro foi para uma pessoa desconhecida, com a desculpa de “taxa”.')),
        pista('feira-sms', 'posto', 'O aviso da Enfermeira Cida', escolha('O mesmo vendedor mandou SMS com link para os pacientes do posto. O que eles devem fazer?',
          ['Clicar no link para ganhar a maquininha', 'Não clicar, apagar e avisar os outros', 'Responder com os dados do cartão'], 1, 'Não clique em link de desconhecido: apague e avise as pessoas.')),
      ],
      final: 'Era o Moço da Oferta! Ele cobrava uma “taxa” por Pix e sumia sem entregar nada. Com as pistas da turma, a feira inteira foi avisada e ninguém mais caiu. O Seu Raimundo ganhou uma maquininha de verdade, do banco, sem taxa adiantada.',
      moral: 'Desconfie de pressa e de pagamento adiantado, e confira sempre o nome de quem recebe o Pix.',
    },
    {
      id: 'carta', emoji: '📮', titulo: 'A carta sem remetente',
      abertura: 'Chegou nos Correios uma carta caprichada, endereçada “À turma da Praça Escola”. Mas não tem remetente! Quem será que escreveu?',
      pistas: [
        pista('carta-envelope', 'correios', 'O envelope', escolha('No envelope tem o endereço da turma, o selo e o CEP. O que faltou para a carta poder voltar se algo desse errado?',
          ['O remetente (quem mandou)', 'O selo', 'O CEP da turma'], 0, 'O remetente fica no verso do envelope: sem ele, a carta não tem para onde voltar.')),
        pista('carta-letra', 'escola', 'A letra conhecida', escolha('Na biblioteca, a turma comparou a letra da carta com o livro de visitas. A letra é igual à de quem escreveu: “Obrigada por me ensinarem a mandar foto para o Pedro.” Quem é?',
          ['Dona Rosa', 'Seu Bené', 'Dona Lúcia'], 0, 'O Pedro é o neto da Dona Rosa, que aprendeu a mandar foto com a turma.')),
        pista('carta-ficha', 'prefeitura', 'A ficha na Prefeitura', lista('A ficha da Dona Rosa na Prefeitura tem um erro que faria a resposta se perder. Qual?',
          ['Nome: Rosa Maria de Souza', 'Rua: Rua dos Ipês, 45', 'CEP: 7680-000', 'Cidade: Porto Velho - RO'], 2, 'O CEP tem 8 números (00000-000): faltou um.')),
      ],
      final: 'Era a Dona Rosa! Ela escreveu para agradecer à turma que a ensinou a mandar foto para o neto Pedro, em Ji-Paraná, mas esqueceu o remetente. A turma respondeu com um cartão, desta vez com remetente, CEP certinho e um desenho da praça.',
      moral: 'Carta e e-mail precisam de remetente, endereço completo e assunto.',
    },
    {
      id: 'apagao', emoji: '🚂', titulo: 'O apagão na estação',
      abertura: 'Na quinta à noite, as luzes da estação apagaram e o painel de horários ficou maluco. O trem de passeio quase saiu na hora errada! O que aconteceu?',
      pistas: [
        pista('apagao-painel', 'estacao', 'O painel maluco', lista('Painel de horários depois do apagão. Qual horário é impossível?',
          ['Saída para Santo Antônio: 09h00', 'Chegada da excursão: 11h45', 'Saída do trem de passeio: 26h15', 'Última saída: 17h30'], 2, 'Não existe 26h15: o painel perdeu a hora com o apagão.')),
        pista('apagao-vaga', 'empregos', 'A vaga urgente', lista('A estação abriu uma vaga urgente na Agência de Empregos. Quem resolve o problema?',
          ['Cozinheiro', 'Eletricista com curso de segurança (NR-10)', 'Recepcionista', 'Motorista'], 1, 'Problema na fiação é com eletricista qualificado. A NR-10 é a norma de segurança de quem trabalha com eletricidade.')),
        pista('apagao-fio', 'horta', 'O fio roído', escolha('Perto da horta, a turma achou um fio roído e pegadas pequenas. O que causou o apagão?',
          ['Um rato que roeu o fio', 'A chuva de ontem', 'O trem'], 0, 'Fio roído e pegadas pequenas: foi um rato! Por isso a fiação fica protegida.')),
      ],
      final: 'Foi um rato que roeu o fio do painel, escondido perto da horta! O eletricista contratado pela Agência de Empregos trocou a fiação, protegeu os fios e acertou o relógio do painel. O trem de passeio saiu na hora certa, com a turma a bordo.',
      moral: 'Quando algo dá errado, investigue com calma: junte as pistas antes de concluir.',
    },
  ];
  // Sem protótipo: um pedido com um nome estranho ("__proto__", "constructor") não acha nada.
  const porCapitulo = Object.assign(Object.create(null), Object.fromEntries(CAPITULOS.map((c) => [c.id, c])));
  const porPista = Object.create(null);
  for (const c of CAPITULOS) for (const p of c.pistas) porPista[p.id] = { ...p, capitulo: c.id };
  const temTarefa = (lugar) => Object.prototype.hasOwnProperty.call(TAREFAS, lugar);

  // O dia (no relógio de quem guarda a praça) e a semana, que começa na segunda-feira.
  const dia = (agora) => Math.floor((agora - new Date(agora).getTimezoneOffset() * 60000) / 86400000);
  const semana = (agora) => Math.floor((dia(agora) + 3) / 7);
  const tarefaDoDia = (lugar, agora) => (temTarefa(lugar) ? TAREFAS[lugar].tarefas[dia(agora) % TAREFAS[lugar].tarefas.length] : null);
  // O que vai para a tela (sem a resposta: quem confere é o computador do instrutor).
  const publica = (t) => (t ? { tipo: t.tipo, pergunta: t.pergunta, opcoes: t.opcoes, itens: t.itens, modelo: t.modelo, numero: !!t.numero } : null);
  const limpo = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  const reais = (s) => { const v = parseFloat(String(s == null ? '' : s).replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')); return Number.isFinite(v) ? v : NaN; };
  function conferir(t, resposta) {
    if (!t) return false;
    if (t.tipo === 'escolha' || t.tipo === 'lista') return Number(resposta) === t.certa;
    if (t.tipo === 'digitar') return t.numero ? Math.abs(reais(resposta) - t.resposta) < 0.001 : limpo(resposta) === limpo(t.modelo);
    return false;
  }
  return { TAREFAS, CAPITULOS, porCapitulo, porPista, temTarefa, dia, semana, tarefaDoDia, publica, conferir };
});
