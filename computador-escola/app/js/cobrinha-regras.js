// "Cobrinha da Turma": o jogo das cobrinhas da Praça Escola (o prédio da Cobrinha, entre a horta e a estação). Cada
// aluno é uma cobrinha que vai para onde o mouse aponta: come as bolinhas do chão e fica mais comprida. Quem bate a
// cabeça no corpo de outra cobrinha morre e vira comida para os outros; por isso a jogada é passar na frente de
// alguém. Segurando o Espaço (ou o botão do mouse), a cobrinha acelera, mas vai ficando menor.
//
// As regras ficam aqui, num lugar só: o computador do instrutor usa no servidor da sala (src/canais.js) e o modo de
// teste no navegador usa em app/js/api.js. A arena anda no computador do instrutor, em passos de 40 ms, sempre que
// alguém manda o mouse (a janela manda 10 vezes por segundo). Cada turma tem a sua arena; com pouca gente, robôs
// (bichos da Amazônia, fracos de propósito) completam até 8 cobrinhas. Quem fecha a janela (ou fica 15 s sem dar
// sinal) sai; a arena sem ninguém some depois de 1 minuto. Funciona igual ao Agar da Turma (agar-regras.js).
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else { raiz.CE = raiz.CE || {}; raiz.CE.cobrinhaRegras = fabrica(); }
})(typeof self !== 'undefined' ? self : this, function () {
  const MUNDO = 3000;            // a arena: 3000 x 3000 pontos
  const PASSO = 40, PASSOS_MAX = 25;
  const COMIDA = 700;
  const MASSA_INICIAL = 20;
  const ESPACO = 7;              // distância entre os gomos do corpo
  const VELOCIDADE = 150, TURBO = 320; // pontos por segundo (normal e acelerando)
  const CUSTO_TURBO = 6;         // massa por segundo que a cobrinha perde acelerando
  const LOTACAO = 8;
  const SUMIU = 15000, VAZIA = 60000, RENASCER_ROBO = 3000;
  // Os robôs: bichos da Amazônia (só emojis que o Windows 10 desenha).
  const ROBOS = [['Sucuri', '🐍'], ['Jiboia', '🐍'], ['Minhocão', '🐛'], ['Enguia', '🐟'], ['Jacaré', '🐊'], ['Caramujo', '🐌'],
    ['Boto', '🐬'], ['Arara', '🦜'], ['Tucano', '🐦'], ['Jabuti', '🐢']];

  // Largura e comprimento crescem com a massa (a largura bem devagar).
  const raio = (m) => 7 + Math.sqrt(Math.max(1, m)) * 0.6;
  const gomosDe = (m) => Math.round(8 + Math.sqrt(Math.max(1, m)) * 5);
  const limitar = (v, a, b) => Math.max(a, Math.min(b, v));
  const anguloEntre = (a, b) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };

  return function criarCobrinha(relogio = () => Date.now(), acaso = Math.random) {
    const config = { aberta: true, robos: true };
    const salas = new Map();     // turma -> arena
    const ondeEsta = new Map();  // id do usuário -> turma
    let ultimoId = 0;
    const novoId = () => ++ultimoId;
    const sorteio = (a, b) => a + acaso() * (b - a);
    const ehInstrutor = (u) => !!u && u.papel === 'instrutor';
    const turmaDe = (u) => String((u && u.turma) || '').trim().slice(0, 40);
    const exigir = (u) => { if (!u || !u.id) throw new Error('Entre no sistema primeiro.'); };
    const apelido = (nome) => String(nome || '').trim().split(/\s+/)[0].slice(0, 14) || 'Aluno';
    const corDe = (id) => { let h = 11; for (const ch of String(id)) h = (h * 31 + ch.codePointAt(0)) % 3600; return Math.floor(h / 10); };
    const comidaNova = (x, y, m = 1, c = Math.floor(acaso() * 12)) => ({ x: x ?? sorteio(20, MUNDO - 20), y: y ?? sorteio(20, MUNDO - 20), m, c });
    const humanos = (s) => [...s.jogadores.values()].filter((p) => !p.robo);
    const jogando = (s) => humanos(s).filter((p) => !p.espectador);

    function novaSala(turma) {
      const s = { turma, jogadores: new Map(), comida: [], ultimo: relogio(), vazioDesde: null, recorde: null };
      for (let i = 0; i < COMIDA; i++) s.comida.push(comidaNova());
      salas.set(turma, s);
      return s;
    }
    const jogadorNovo = (dados) => ({
      corpo: [], vivo: false, espectador: false, ang: 0, alvoAng: 0, massa: MASSA_INICIAL, acelerar: false, soltouEm: 0,
      melhor: 0, abates: 0, mortoPor: null, ultimoX: MUNDO / 2, ultimoY: MUNDO / 2, vw: 900, vh: 600, pensarEm: 0, renascerEm: 0, ...dados,
    });
    function jogadorHumano(s, u, agora) {
      const id = 'u:' + u.id;
      let p = s.jogadores.get(id);
      if (!p) {
        p = jogadorNovo({ id, usuarioId: u.id, nome: apelido(u.nome), avatar: String(u.avatar || '🙂').slice(0, 8), cor: corDe(u.id), robo: false, instrutor: ehInstrutor(u), vistoEm: agora });
        s.jogadores.set(id, p);
      }
      return p;
    }
    // Nasce longe dos corpos das outras cobrinhas, virada para o meio da arena.
    function nascer(s, p) {
      let melhor = null;
      for (let i = 0; i < 12; i++) {
        const x = sorteio(250, MUNDO - 250), y = sorteio(250, MUNDO - 250);
        let perto = Infinity;
        for (const q of s.jogadores.values()) if (q.vivo) for (let j = 0; j < q.corpo.length; j += 4) perto = Math.min(perto, Math.hypot(q.corpo[j][0] - x, q.corpo[j][1] - y));
        if (!melhor || perto > melhor.perto) melhor = { x, y, perto };
        if (perto > 400) break;
      }
      const ang = Math.atan2(MUNDO / 2 - melhor.y, MUNDO / 2 - melhor.x);
      p.massa = MASSA_INICIAL;
      p.corpo = Array.from({ length: gomosDe(MASSA_INICIAL) }, (_, i) => [melhor.x - Math.cos(ang) * ESPACO * i, melhor.y - Math.sin(ang) * ESPACO * i]);
      Object.assign(p, { vivo: true, ang, alvoAng: ang, acelerar: false, melhor: MASSA_INICIAL, abates: 0, mortoPor: null, ultimoX: melhor.x, ultimoY: melhor.y });
    }
    function tirar(s, p) {
      s.jogadores.delete(p.id);
      if (p.robo) return;
      if (ondeEsta.get(p.usuarioId) === s.turma) ondeEsta.delete(p.usuarioId);
      if (!humanos(s).length && s.vazioDesde == null) s.vazioDesde = relogio();
    }

    // ---------- Os robôs: fracos de propósito ----------
    // Viram antes de bater (olham um pouco à frente), fogem da parede e vão na comida. Nunca correm atrás de aluno e
    // quase nunca aceleram; são mais lentos para virar.
    function completarRobos(s, agora) {
      const querem = config.robos ? Math.max(0, LOTACAO - jogando(s).length) : 0;
      const robos = [...s.jogadores.values()].filter((p) => p.robo);
      if (robos.length > querem) {
        robos.sort((a, b) => (a.vivo - b.vivo) || (a.massa - b.massa)).slice(0, robos.length - querem).forEach((r) => tirar(s, r));
        return;
      }
      for (let i = robos.length; i < querem; i++) {
        const usados = new Set([...s.jogadores.values()].filter((p) => p.robo).map((p) => p.nome));
        const [nome, avatar] = ROBOS.find(([n]) => !usados.has(n)) || ROBOS[i % ROBOS.length];
        const id = 'r:' + novoId();
        s.jogadores.set(id, jogadorNovo({ id, nome, avatar, cor: Math.floor(acaso() * 360), robo: true, renascerEm: agora + 300 * i }));
      }
    }
    function perigoEm(s, p, x, y) {
      const r = raio(p.massa);
      if (x < r + 40 || y < r + 40 || x > MUNDO - r - 40 || y > MUNDO - r - 40) return true;
      for (const q of s.jogadores.values()) {
        if (q === p || !q.vivo) continue;
        const rq = raio(q.massa);
        for (let j = 0; j < q.corpo.length; j += 2) if (Math.hypot(q.corpo[j][0] - x, q.corpo[j][1] - y) < r + rq + 18) return true;
      }
      return false;
    }
    function pensar(s, p, agora) {
      if (agora < p.pensarEm || !p.vivo) return;
      p.pensarEm = agora + sorteio(250, 450);
      const [hx, hy] = p.corpo[0];
      const olha = (a, d) => perigoEm(s, p, hx + Math.cos(a) * d, hy + Math.sin(a) * d);
      if (olha(p.ang, 45) || olha(p.ang, 90)) {
        // Vai bater: vira para o lado mais livre.
        const esq = p.ang - Math.PI / 2, dir = p.ang + Math.PI / 2;
        p.alvoAng = !olha(esq, 70) ? esq : !olha(dir, 70) ? dir : p.ang + Math.PI;
        return;
      }
      let alvo = null, dAlvo = Infinity;
      for (let i = 0; i < s.comida.length; i += 3) { const f = s.comida[i]; const d = (f.x - hx) ** 2 + (f.y - hy) ** 2; if (d < dAlvo) { dAlvo = d; alvo = f; } }
      if (alvo && acaso() < 0.7) p.alvoAng = Math.atan2(alvo.y - hy, alvo.x - hx);
      else p.alvoAng = p.ang + sorteio(-1, 1);
    }

    // ---------- Um passo da arena (40 ms) ----------
    function morrer(s, p, quem, agora) {
      p.vivo = false; p.morreuEm = agora;
      p.mortoPor = quem ? { nome: quem.nome, avatar: quem.avatar, robo: !!quem.robo } : null;
      if (quem) quem.abates++;
      // O corpo vira comida (uma bolinha a cada 3 gomos, com a cor da cobrinha).
      const n = Math.max(1, Math.floor(p.corpo.length / 3));
      const cada = limitar((p.massa * 0.7) / n, 1, 10);
      for (let j = 0; j < p.corpo.length; j += 3) s.comida.push(comidaNova(limitar(p.corpo[j][0] + sorteio(-6, 6), 5, MUNDO - 5), limitar(p.corpo[j][1] + sorteio(-6, 6), 5, MUNDO - 5), cada, -1 - p.cor));
      p.ultimoX = p.corpo[0][0]; p.ultimoY = p.corpo[0][1];
      p.corpo = [];
      if (p.robo) p.renascerEm = agora + RENASCER_ROBO;
    }
    function passo(s, agora) {
      const dt = PASSO / 1000;
      const vivas = [];
      for (const p of s.jogadores.values()) {
        if (!p.vivo) { if (p.robo && agora >= p.renascerEm) nascer(s, p); continue; }
        if (p.robo) pensar(s, p, agora);
        const r = raio(p.massa);
        // Vira para o alvo (as grandes viram mais devagar; os robôs, mais devagar ainda).
        const giro = (4.2 / (1 + (r - 9) / 25)) * (p.robo ? 0.75 : 1) * dt;
        p.ang += limitar(anguloEntre(p.ang, p.alvoAng), -giro, giro);
        const turbo = p.acelerar && p.massa > 25;
        const v = (turbo ? TURBO : VELOCIDADE) * dt;
        const cabeca = p.corpo[0];
        cabeca[0] = limitar(cabeca[0] + Math.cos(p.ang) * v, r, MUNDO - r);
        cabeca[1] = limitar(cabeca[1] + Math.sin(p.ang) * v, r, MUNDO - r);
        // O corpo segue a cabeça, gomo por gomo.
        for (let i = 1; i < p.corpo.length; i++) {
          const a = p.corpo[i - 1], b = p.corpo[i], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy);
          if (d > ESPACO) { b[0] = a[0] + (dx / d) * ESPACO; b[1] = a[1] + (dy / d) * ESPACO; }
        }
        if (turbo) {
          // Acelerando, perde massa: a cada 0,3 s cai uma bolinha do rabo.
          p.massa -= CUSTO_TURBO * dt;
          if (agora - p.soltouEm >= 300) { p.soltouEm = agora; const rabo = p.corpo[p.corpo.length - 1]; s.comida.push(comidaNova(rabo[0], rabo[1], CUSTO_TURBO * 0.3 * 0.8, -1 - p.cor)); }
        }
        vivas.push(p);
      }

      // Comer a comida perto da cabeça.
      for (const p of vivas) {
        const [hx, hy] = p.corpo[0], alcance = raio(p.massa) + 8;
        for (let i = s.comida.length - 1; i >= 0; i--) {
          const f = s.comida[i];
          if (Math.abs(f.x - hx) > alcance || Math.abs(f.y - hy) > alcance) continue;
          if ((f.x - hx) ** 2 + (f.y - hy) ** 2 < alcance * alcance) { p.massa += f.m; s.comida[i] = s.comida[s.comida.length - 1]; s.comida.pop(); }
        }
      }

      // Bateu a cabeça no corpo de outra: morre. Cabeça com cabeça: a menor morre (do mesmo tamanho, as duas).
      const caixas = new Map(vivas.map((q) => {
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (const [x, y] of q.corpo) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        return [q, [x0, y0, x1, y1]];
      }));
      const mortes = new Map(); // quem morre -> quem matou
      for (const p of vivas) {
        const [hx, hy] = p.corpo[0], rp = raio(p.massa);
        for (const q of vivas) {
          if (q === p || mortes.has(p)) continue;
          const rq = raio(q.massa), [x0, y0, x1, y1] = caixas.get(q), folga = rp + rq;
          if (hx < x0 - folga || hx > x1 + folga || hy < y0 - folga || hy > y1 + folga) continue;
          for (let j = 0; j < q.corpo.length; j++) {
            const [x, y] = q.corpo[j];
            if ((x - hx) ** 2 + (y - hy) ** 2 >= (rp * 0.8 + rq) ** 2) continue;
            if (j < 3) { // cabeça com cabeça
              if (p.massa < q.massa * 0.95) mortes.set(p, q);
              else if (q.massa < p.massa * 0.95) { if (!mortes.has(q)) mortes.set(q, p); }
              else { mortes.set(p, q); if (!mortes.has(q)) mortes.set(q, p); }
            } else mortes.set(p, q);
            break;
          }
        }
      }
      for (const [p, q] of mortes) morrer(s, p, q, agora);

      for (const p of vivas) {
        if (!p.vivo) continue;
        // O comprimento acompanha a massa.
        const n = gomosDe(p.massa);
        while (p.corpo.length < n) { const r = p.corpo[p.corpo.length - 1]; p.corpo.push([r[0], r[1]]); }
        while (p.corpo.length > n) p.corpo.pop();
        if (p.massa > p.melhor) p.melhor = p.massa;
        p.ultimoX = p.corpo[0][0]; p.ultimoY = p.corpo[0][1];
        if (!p.robo && (!s.recorde || p.massa > s.recorde.massa)) s.recorde = { nome: p.nome, avatar: p.avatar, massa: Math.round(p.massa) };
      }
      while (s.comida.length < COMIDA) s.comida.push(comidaNova());
      if (s.comida.length > COMIDA + 900) s.comida.splice(0, s.comida.length - (COMIDA + 900));
    }
    function avancar(s, agora) {
      completarRobos(s, agora);
      let n = Math.floor((agora - s.ultimo) / PASSO);
      if (n <= 0) return;
      if (n > PASSOS_MAX) { s.ultimo = agora - PASSOS_MAX * PASSO; n = PASSOS_MAX; }
      for (let i = 0; i < n; i++) { s.ultimo += PASSO; passo(s, s.ultimo); }
    }
    function limpar(agora) {
      for (const [turma, s] of salas) {
        for (const p of [...s.jogadores.values()]) if (!p.robo && agora - p.vistoEm > SUMIU) tirar(s, p);
        if (humanos(s).length) s.vazioDesde = null;
        else if (s.vazioDesde == null) s.vazioDesde = agora;
        else if (agora - s.vazioDesde > VAZIA) salas.delete(turma);
      }
    }

    // ---------- O que cada computador recebe: só o pedaço da arena que aparece na tela dele ----------
    function visao(s, p, agora) {
      const esp = p.espectador;
      const cx = esp ? MUNDO / 2 : p.vivo ? p.corpo[0][0] : p.ultimoX, cy = esp ? MUNDO / 2 : p.vivo ? p.corpo[0][1] : p.ultimoY;
      const hx = esp ? MUNDO / 2 + 60 : limitar(Number(p.vw) || 900, 300, 2200);
      const hy = esp ? MUNDO / 2 + 60 : limitar(Number(p.vh) || 600, 250, 2200);
      const cobras = [];
      for (const q of s.jogadores.values()) {
        if (!q.vivo) continue;
        const r = raio(q.massa);
        let ve = false;
        for (let j = 0; j < q.corpo.length && !ve; j += 4) ve = Math.abs(q.corpo[j][0] - cx) < hx + r && Math.abs(q.corpo[j][1] - cy) < hy + r;
        if (!ve) continue;
        // De dois em dois gomos (de três nas grandes): a tela desenha um tubo liso por cima deles.
        const pulo = q.corpo.length > 120 ? 3 : 2, pts = [];
        for (let j = 0; j < q.corpo.length; j += pulo) pts.push(Math.round(q.corpo[j][0]), Math.round(q.corpo[j][1]));
        const ult = q.corpo[q.corpo.length - 1];
        if ((q.corpo.length - 1) % pulo) pts.push(Math.round(ult[0]), Math.round(ult[1]));
        cobras.push([q.id, q.nome, q.avatar, q.cor, q.robo ? 1 : 0, Math.round(r * 10) / 10, (q.acelerar && q.massa > 25) ? 1 : 0, pts]);
      }
      const comida = [];
      for (const f of s.comida) if (Math.abs(f.x - cx) < hx + 10 && Math.abs(f.y - cy) < hy + 10) comida.push([Math.round(f.x), Math.round(f.y), Math.round((3 + Math.sqrt(f.m) * 2) * 10) / 10, f.c]);
      const lista = [...s.jogadores.values()].filter((q) => q.vivo).sort((a, b) => b.massa - a.massa);
      const pos = lista.indexOf(p);
      return {
        agora, mundo: MUNDO, aberta: config.aberta, robos: config.robos, turma: s.turma, euId: p.id,
        eu: { vivo: p.vivo, espectador: esp, massa: Math.round(p.massa), melhor: Math.round(p.melhor), abates: p.abates, mortoPor: p.mortoPor, x: Math.round(cx), y: Math.round(cy) },
        c: cobras, f: comida,
        rk: lista.slice(0, 10).map((q) => [q.nome, q.avatar, Math.round(q.massa), q.robo ? 1 : 0, q === p ? 1 : 0]),
        pos: pos >= 0 ? pos + 1 : null, total: lista.length, gente: jogando(s).length, robosVivos: lista.filter((q) => q.robo).length, recorde: s.recorde,
      };
    }

    const api = {
      MUNDO,
      estado(usuario) {
        exigir(usuario);
        const agora = relogio();
        limpar(agora);
        const turma = ondeEsta.has(usuario.id) ? ondeEsta.get(usuario.id) : turmaDe(usuario);
        const s = salas.get(turma);
        return {
          aberta: config.aberta, robos: config.robos, mundo: MUNDO, turma, dentro: ondeEsta.has(usuario.id),
          gente: s ? jogando(s).map((p) => ({ nome: p.nome, avatar: p.avatar })) : [],
          robosNaArena: s ? [...s.jogadores.values()].filter((p) => p.robo).length : 0,
          recorde: s ? s.recorde : null,
          salas: ehInstrutor(usuario)
            ? [...salas.values()].map((x) => ({ turma: x.turma, gente: jogando(x).length, robos: [...x.jogadores.values()].filter((p) => p.robo).length, recorde: x.recorde }))
            : undefined,
        };
      },
      entrar(usuario, d = {}) {
        exigir(usuario);
        const agora = relogio();
        limpar(agora);
        const instrutor = ehInstrutor(usuario);
        if (!config.aberta && !instrutor) throw new Error('A arena está fechada agora. Quando o professor abrir, é só voltar aqui.');
        const turma = instrutor && typeof d.turma === 'string' ? d.turma.trim().slice(0, 40) : turmaDe(usuario);
        const antes = ondeEsta.get(usuario.id);
        if (antes !== undefined && antes !== turma && salas.get(antes)) { const velha = salas.get(antes); const q = velha.jogadores.get('u:' + usuario.id); if (q) tirar(velha, q); }
        const s = salas.get(turma) || novaSala(turma);
        avancar(s, agora);
        const p = jogadorHumano(s, usuario, agora);
        ondeEsta.set(usuario.id, turma);
        p.vistoEm = agora;
        p.espectador = instrutor && !!d.assistir;
        if (p.espectador) { p.corpo = []; p.vivo = false; p.mortoPor = null; } else if (!p.vivo) nascer(s, p);
        completarRobos(s, agora);
        return visao(s, p, agora);
      },
      // A janela manda para onde o mouse aponta, se está acelerando e o tamanho da tela; recebe a arena.
      jogar(usuario, d = {}) {
        exigir(usuario);
        const agora = relogio();
        limpar(agora);
        const turma = ondeEsta.get(usuario.id);
        const s = turma === undefined ? null : salas.get(turma);
        const p = s && s.jogadores.get('u:' + usuario.id);
        if (!s || !p) return { fora: true, aberta: config.aberta, fechada: !config.aberta && !ehInstrutor(usuario) };
        p.vistoEm = agora;
        if (p.vivo && Number.isFinite(d.x) && Number.isFinite(d.y)) {
          const [hx, hy] = p.corpo[0];
          if (Math.hypot(d.x - hx, d.y - hy) > 4) p.alvoAng = Math.atan2(d.y - hy, d.x - hx);
        }
        p.acelerar = !!d.acelerar && p.vivo;
        if (Number.isFinite(d.vw)) p.vw = d.vw;
        if (Number.isFinite(d.vh)) p.vh = d.vh;
        avancar(s, agora);
        return visao(s, p, agora);
      },
      sair(usuario) {
        if (!usuario) return true;
        const turma = ondeEsta.get(usuario.id);
        const s = turma === undefined ? null : salas.get(turma);
        const p = s && s.jogadores.get('u:' + usuario.id);
        if (p) tirar(s, p);
        ondeEsta.delete(usuario.id);
        return true;
      },
      configurar(usuario, d = {}) {
        exigir(usuario);
        if (!ehInstrutor(usuario)) throw new Error('Apenas o instrutor pode fazer isso.');
        if (typeof d.aberta === 'boolean') {
          config.aberta = d.aberta;
          if (!d.aberta) for (const s of salas.values()) for (const p of [...s.jogadores.values()]) if (!p.robo && !p.instrutor) tirar(s, p);
        }
        if (typeof d.robos === 'boolean') { config.robos = d.robos; for (const s of salas.values()) completarRobos(s, relogio()); }
        return api.estado(usuario);
      },
      // Para os testes: a arena de uma turma, por dentro.
      _arena: (turma) => salas.get(String(turma || '')) || null,
      _gomosDe: gomosDe, _raio: raio,
    };
    return api;
  };
});
