// Tela de entrada: escolher o próprio nome e digitar a senha.
window.CE = window.CE || {};

(function () {
  const tela = () => document.getElementById('tela-login');

  function relogio() {
    const agora = new Date();
    const data = agora.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    return CE.el('div', { class: 'login-relogio' },
      CE.el('div', { class: 'login-hora' }, agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })),
      CE.el('div', { class: 'login-data' }, data.charAt(0).toUpperCase() + data.slice(1)),
    );
  }

  function rodape() {
    return CE.el('div', { class: 'login-rodape' },
      CE.el('button', { class: 'botao-desligar', title: 'Desligar', onclick: () => CE.api.chamar('app:sair') }, '⏻ Desligar'),
    );
  }

  async function primeiroAcesso() {
    const nome = CE.el('input', { class: 'campo', placeholder: 'Seu nome (instrutor)', autofocus: true });
    const senha = CE.el('input', { class: 'campo', type: 'password', placeholder: 'Crie uma senha' });
    const senha2 = CE.el('input', { class: 'campo', type: 'password', placeholder: 'Repita a senha' });
    const erro = CE.el('p', { class: 'login-erro' });
    const enviar = async () => {
      erro.textContent = '';
      if (senha.value !== senha2.value) { erro.textContent = 'As senhas não são iguais.'; return; }
      try {
        const usuario = await CE.api.chamar('usuarios:primeiro-instrutor', { nome: nome.value, segredo: senha.value });
        CE.entrarNoSistema(usuario);
      } catch (e) { erro.textContent = e.message; }
    };
    senha2.addEventListener('keydown', (e) => e.key === 'Enter' && enviar());
    tela().replaceChildren(relogio(), CE.el('div', { class: 'login-caixa' },
      CE.el('h1', {}, 'Bem-vindo ao Computador Escola!'),
      CE.el('p', {}, 'Este é o primeiro uso. Cadastre a conta do instrutor — com ela você cria as contas dos alunos.'),
      nome, senha, senha2, erro,
      CE.el('button', { class: 'botao grande', onclick: enviar }, 'Cadastrar e entrar'),
    ), rodape());
    nome.focus();
  }

  function pedirSenha(usuario, voltar) {
    const senha = CE.el('input', { class: 'campo grande', type: 'password', placeholder: usuario.papel === 'instrutor' ? 'Senha' : 'Sua senha', 'aria-label': 'Senha' });
    const erro = CE.el('p', { class: 'login-erro' });
    const enviar = async () => {
      try {
        CE.entrarNoSistema(await CE.api.chamar('sessao:entrar', usuario.id, senha.value));
      } catch (e) {
        erro.textContent = e.message;
        senha.value = '';
        senha.focus();
      }
    };
    senha.addEventListener('keydown', (e) => e.key === 'Enter' && enviar());
    tela().replaceChildren(relogio(), CE.el('div', { class: 'login-caixa' },
      CE.el('div', { class: 'login-avatar grande' }, usuario.avatar),
      CE.el('h1', {}, usuario.nome),
      senha, erro,
      CE.el('div', { class: 'login-acoes' },
        CE.el('button', { class: 'botao secundario', onclick: voltar }, '← Voltar'),
        CE.el('button', { class: 'botao grande', onclick: enviar }, 'Entrar'),
      ),
      CE.el('p', { class: 'login-dica' }, 'Digite sua senha e aperte a tecla Enter. Esqueceu? Peça ajuda ao instrutor.'),
    ), rodape());
    senha.focus();
  }

  async function escolherUsuario() {
    const usuarios = await CE.api.chamar('usuarios:listar');
    const turmas = [...new Set(usuarios.map((u) => u.turma).filter(Boolean))].sort();
    let turmaEscolhida = '';
    const grade = CE.el('div', { class: 'login-usuarios' });
    const desenhar = () => {
      grade.replaceChildren(...usuarios
        .filter((u) => !turmaEscolhida || u.turma === turmaEscolhida || u.papel === 'instrutor')
        .sort((a, b) => (a.papel === b.papel ? a.nome.localeCompare(b.nome) : a.papel === 'instrutor' ? 1 : -1))
        .map((u) => CE.el('button', { class: 'login-usuario' + (u.papel === 'instrutor' ? ' instrutor' : ''), onclick: () => pedirSenha(u, escolherUsuario) },
          CE.el('span', { class: 'login-avatar' }, u.avatar),
          CE.el('span', { class: 'login-nome' }, u.nome),
          CE.el('span', { class: 'login-turma' }, u.papel === 'instrutor' ? 'Instrutor' : u.turma),
        )));
    };
    const filtro = turmas.length
      ? CE.el('div', { class: 'login-turmas' },
          ...['', ...turmas].map((t) => CE.el('button', {
            class: 'chip' + (t === turmaEscolhida ? ' ativo' : ''),
            onclick: (e) => {
              turmaEscolhida = t;
              e.currentTarget.parentElement.querySelectorAll('.chip').forEach((c) => c.classList.remove('ativo'));
              e.currentTarget.classList.add('ativo');
              desenhar();
            },
          }, t || 'Todas as turmas')))
      : null;
    desenhar();
    tela().replaceChildren(relogio(), CE.el('div', { class: 'login-caixa larga' },
      CE.el('h1', {}, 'Quem vai usar o computador?'),
      CE.el('p', {}, 'Clique no seu nome.'),
      filtro, grade,
    ), rodape());
  }

  CE.mostrarLogin = async function () {
    document.getElementById('area-de-trabalho').hidden = true;
    tela().hidden = false;
    if (await CE.api.chamar('usuarios:existe-instrutor')) escolherUsuario();
    else primeiroAcesso();
  };
})();
