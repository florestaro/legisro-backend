// Teste de nivelamento de informática: oferecido no primeiro acesso do aluno.
// Quem já sabe o básico faz tarefas sozinho e responde perguntas. Com 80% e sem pular nenhuma tarefa,
// as aulas do nível Iniciante ficam dispensadas (o aluno ainda pode revisá-las quando quiser).
window.CE = window.CE || {};

(function () {
  const { info, quiz, esperar } = CE.L;
  const NOTA_PARA_DISPENSAR = 80;
  const semAcento = (t) => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  CE.LICOES_ESPECIAIS = CE.LICOES_ESPECIAIS || {};

  CE.LICOES_ESPECIAIS.nivelamento = {
    id: 'nivelamento', titulo: 'Teste de nivelamento', icone: '🧭', nivel: 'n1',
    especial: true, prova: true, desafio: true, permitePular: true,
    descricao: 'Descubra em que nível você começa.',
    passos: [
      info('Este teste mostra se você já sabe o básico do computador. Faça as tarefas sozinho. Se não souber fazer alguma, clique em "Não sei fazer" — sem problema nenhum! Clique em "Continuar".', { emoji: '🧭' }),
      esperar('Tarefa 1: abra a Calculadora e faça a conta 15 + 27.', 'calculadora:resultado', (d) => d.a === 15 && d.b === 27 && d.operacao === '+'),
      esperar('Tarefa 2: maximize a janela da Calculadora e depois feche ela.', 'janela:fechada', (d) => d.app === 'calculadora'),
      esperar('Tarefa 3: abra o Editor de Texto, escreva o seu nome em NEGRITO e salve com o nome: Nivelamento', 'arquivo:salvo',
        (d) => d.tipo === 'documento' && d.nome.trim().toLowerCase() === 'nivelamento' && /<b>|<strong>|font-weight/i.test(d.conteudo)),
      esperar('Tarefa 4: no programa Arquivos, mande o documento "Nivelamento" para a lixeira.', 'arquivo:removido', (d) => d.nome.trim().toLowerCase() === 'nivelamento'),
      esperar('Tarefa 5: abra o Navegador e pesquise: receita de bolo', 'navegador:pesquisa', (d) => /bolo/.test(semAcento(d.termo))),
      quiz('Para abrir um programa pelo ícone da área de trabalho, eu dou...', ['Um clique duplo', 'Um clique com o botão direito', 'Um giro na rodinha'], 0),
      quiz('A tecla que apaga a letra ANTES do cursor é...', ['Delete', 'Backspace', 'Enter'], 1),
      quiz('Para fazer uma letra maiúscula, eu...', ['Seguro o Shift e aperto a letra', 'Aperto o Tab', 'Aperto o Esc'], 0),
      quiz('A impressora é um aparelho de...', ['Entrada', 'Saída'], 1),
      quiz('Excluí um arquivo sem querer. Onde recupero?', ['Na Lixeira', 'Na Calculadora', 'Não dá para recuperar'], 0),
      quiz('Qual destes é sinal de site seguro?', ['Cadeado 🔒 na barra de endereço', '"Não seguro" na barra de endereço', 'Preço bom demais'], 0),
      quiz('Alguém pede por mensagem o código que chegou no seu SMS. Você...', ['Passa o código', 'Não passa: é golpe'], 1),
      quiz('Qual destas senhas é mais forte?', ['123456', 'maria', 'Rio#Azul!2025'], 2),
    ],
    async aoConcluir({ nota, pulados }) {
      const dispensa = pulados === 0 && nota >= NOTA_PARA_DISPENSAR;
      await CE.sessao.atualizarProgresso((p) => {
        p.nivelamento = { em: Date.now(), nota, pulados, resultado: dispensa ? 'n1-dispensado' : 'comecar-do-inicio' };
        if (dispensa) {
          p.licoes = p.licoes || {};
          CE.LICOES.filter((l) => l.nivel === 'n1').forEach((l) => {
            if (!(p.licoes[l.id] && p.licoes[l.id].concluida)) p.licoes[l.id] = { concluida: true, dispensada: true, nota: null, vezes: 0, em: Date.now() };
          });
        }
      });
      CE.emitir('nivelamento:concluido', { nota, pulados, dispensa });
      return dispensa
        ? { titulo: '🌟 Você já sabe o básico!', texto: `Sua nota foi ${nota}%. As aulas do nível Iniciante foram dispensadas: elas continuam abertas para você revisar quando quiser. O nível Intermediário chega em breve. Agora faça o teste de nivelamento de DIGITAÇÃO para saber em que nível começar!`, digitacao: true, comemorar: true }
        : { titulo: '🧭 Vamos começar do começo', texto: `Sua nota foi ${nota}%${pulados ? ` e você pulou ${pulados} tarefa${pulados > 1 ? 's' : ''}` : ''}. Para dispensar o nível Iniciante era preciso ${NOTA_PARA_DISPENSAR}% sem pular tarefas. Não tem problema: vamos aprender juntos, passo a passo!` };
    },
  };
})();
