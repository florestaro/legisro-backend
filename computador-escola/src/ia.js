// Professor Virtual: IA local via node-llama-cpp (sem internet).
// Se não houver modelo .gguf na pasta "modelos", ou se ele não carregar,
// o professor responde com as respostas prontas de app/js/respostas-prontas.js.
const fs = require('fs');
const path = require('path');
const { responderSemIA } = require('../app/js/respostas-prontas');

const PROMPT_SISTEMA = `Você é o "Professor Virtual" de um curso de informática básica.
Seus alunos são crianças e adultos que estão aprendendo a usar o computador pela primeira vez.
Regras:
- Responda sempre em português do Brasil, com frases curtas e palavras simples.
- No máximo 4 frases por resposta. Seja gentil e incentive o aluno.
- Explique passo a passo quando o aluno perguntar "como faço".
- O aluno está usando um computador de treino que imita o Windows. Os programas dele se chamam:
  "Editor de Texto" (parecido com o Word), "Digitação" (curso de digitação), "Arquivos" (pastas e documentos),
  "Calculadora", "Desenho" (parecido com o Paint), "Navegador" (internet de treino, com o buscador "Procura"),
  "Jogos do Mouse", "Treino do Teclado", "Lixeira" e "Aulas" (lista de lições). Os programas são abertos com clique duplo no ícone da área de trabalho
  ou pelo botão "Iniciar" no canto de baixo à esquerda.
- Se a pergunta não tiver nada a ver com computador ou com a aula, responda com educação e traga o aluno de volta para a aula.
- Se a tarefa atual for responder uma pergunta da aula, NÃO diga qual é a resposta certa: dê só uma pista.
- Nunca peça dados pessoais reais (documentos, senhas de banco, endereço).`;

let estado = 'desligada'; // desligada | carregando | pronta | sem-modelo | erro
let detalhe = '';
let modelo = null;
let contexto = null;
let sessao = null;
let LlamaChatSession = null;

function procurarModelo(pastas) {
  for (const pasta of pastas) {
    try {
      const arquivo = fs.readdirSync(pasta).find((f) => f.toLowerCase().endsWith('.gguf'));
      if (arquivo) return path.join(pasta, arquivo);
    } catch { /* pasta não existe */ }
  }
  return null;
}

async function iniciar(pastasModelo) {
  const caminhoModelo = procurarModelo(pastasModelo);
  if (!caminhoModelo) {
    estado = 'sem-modelo';
    detalhe = 'Nenhum arquivo .gguf encontrado na pasta "modelos".';
    return status();
  }
  estado = 'carregando';
  detalhe = path.basename(caminhoModelo);
  try {
    const llamaCpp = await import('node-llama-cpp');
    LlamaChatSession = llamaCpp.LlamaChatSession;
    const llama = await llamaCpp.getLlama({ gpu: false });
    modelo = await llama.loadModel({ modelPath: caminhoModelo });
    // Contexto pequeno para caber em computadores com 4 GB de RAM.
    contexto = await modelo.createContext({ contextSize: 2048 });
    novaConversa();
    estado = 'pronta';
  } catch (erro) {
    estado = 'erro';
    detalhe = String(erro && erro.message ? erro.message : erro);
  }
  return status();
}

function novaConversa() {
  if (!contexto) return;
  if (sessao) {
    try { sessao.dispose({ disposeSequence: true }); } catch { /* ignora */ }
  }
  sessao = new LlamaChatSession({ contextSequence: contexto.getSequence(), systemPrompt: PROMPT_SISTEMA });
}

function status() {
  return { estado, detalhe };
}

// situacao: { app, licao, passo } — o que o aluno está fazendo agora, para a IA ajudar no contexto certo.
// aoReceberTrecho: chamado com pedaços do texto conforme a IA vai gerando (deixa a resposta "aparecer").
async function perguntar(pergunta, situacao = {}, aoReceberTrecho = () => {}) {
  if (estado !== 'pronta') {
    const resposta = responderSemIA(pergunta, situacao);
    aoReceberTrecho(resposta);
    return resposta;
  }
  const partes = [];
  if (situacao.nome) partes.push(`O nome do aluno é ${situacao.nome}.`);
  if (situacao.app) partes.push(`Programa aberto agora: ${situacao.app}.`);
  if (situacao.licao) partes.push(`Lição atual: "${situacao.licao}".`);
  if (situacao.passo) partes.push(`Tarefa atual da lição: "${situacao.passo}".`);
  const mensagem = (partes.length ? `[Situação: ${partes.join(' ')}]\n` : '') + pergunta;
  try {
    return await sessao.prompt(mensagem, {
      maxTokens: 220,
      temperature: 0.4,
      onTextChunk: aoReceberTrecho,
    });
  } catch (erro) {
    // Contexto cheio ou outro problema: começa uma conversa nova e responde sem IA desta vez.
    novaConversa();
    const resposta = responderSemIA(pergunta, situacao);
    aoReceberTrecho(resposta);
    return resposta;
  }
}

module.exports = { iniciar, status, perguntar, novaConversa };
