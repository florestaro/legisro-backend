"""Leitor e gravador mínimo de SWF: lê as etiquetas (tags), desenha as formas (DefineShape) em SVG para
identificar e troca uma forma por outra (mesmo id). Só o necessário para trocar o logotipo que sobrou."""
import struct
import zlib


class Bits:
    def __init__(self, dados, pos=0):
        self.d = dados
        self.p = pos * 8

    def ub(self, n):
        v = 0
        for _ in range(n):
            v = (v << 1) | ((self.d[self.p >> 3] >> (7 - (self.p & 7))) & 1)
            self.p += 1
        return v

    def sb(self, n):
        v = self.ub(n)
        if n and v & (1 << (n - 1)):
            v -= 1 << n
        return v

    def alinhar(self):
        self.p = (self.p + 7) // 8 * 8

    def u8(self):
        self.alinhar()
        v = self.d[self.p // 8]
        self.p += 8
        return v

    def u16(self):
        self.alinhar()
        v = struct.unpack_from('<H', self.d, self.p // 8)[0]
        self.p += 16
        return v

    def rect(self):
        self.alinhar()
        n = self.ub(5)
        r = [self.sb(n) for _ in range(4)]
        self.alinhar()
        return r  # xmin, xmax, ymin, ymax (twips)


def abrir(caminho):
    b = open(caminho, 'rb').read()
    assinatura, versao = b[:3], b[3]
    corpo = zlib.decompress(b[8:]) if assinatura == b'CWS' else b[8:]
    bits = Bits(corpo)
    bits.rect()
    bits.alinhar()
    inicio_tags = bits.p // 8 + 4
    cabeca = corpo[:inicio_tags]
    tags = []
    longos = set()
    i = inicio_tags
    while i < len(corpo):
        cl = struct.unpack_from('<H', corpo, i)[0]
        codigo, tam = cl >> 6, cl & 0x3F
        i += 2
        if tam == 0x3F:
            tam = struct.unpack_from('<I', corpo, i)[0]
            i += 4
            longos.add(len(tags))
        tags.append([codigo, corpo[i:i + tam]])
        i += tam
        if codigo == 0:
            break
    return {'versao': versao, 'cabeca': cabeca, 'tags': tags, 'longos': longos}


def salvar(swf, caminho):
    partes = [swf['cabeca']]
    for k, (codigo, dados) in enumerate(swf['tags']):
        if len(dados) < 0x3F and k not in swf.get('longos', ()) and codigo not in (2, 22, 32, 83):
            partes.append(struct.pack('<H', (codigo << 6) | len(dados)))
        else:
            partes.append(struct.pack('<HI', (codigo << 6) | 0x3F, len(dados)))
        partes.append(dados)
    corpo = b''.join(partes)
    total = 8 + len(corpo)
    open(caminho, 'wb').write(b'CWS' + bytes([swf['versao']]) + struct.pack('<I', total) + zlib.compress(corpo, 9))


VERSAO_FORMA = {2: 1, 22: 2, 32: 3, 83: 4}


def _cor(bits, rgba):
    r, g, b = bits.u8(), bits.u8(), bits.u8()
    a = bits.u8() if rgba else 255
    return (r, g, b, a)


def _matriz(bits):
    bits.alinhar()
    if bits.ub(1):
        n = bits.ub(5)
        bits.sb(n), bits.sb(n)
    if bits.ub(1):
        n = bits.ub(5)
        bits.sb(n), bits.sb(n)
    n = bits.ub(5)
    bits.sb(n), bits.sb(n)
    bits.alinhar()


def _preenchimentos(bits, v):
    n = bits.u8()
    if n == 0xFF and v >= 2:
        n = bits.u16()
    lista = []
    for _ in range(n):
        tipo = bits.u8()
        if tipo == 0x00:
            lista.append(('cor', _cor(bits, v >= 3)))
        elif tipo in (0x10, 0x12, 0x13):
            _matriz(bits)
            bits.alinhar()
            bits.ub(4)
            ng = bits.ub(4)
            cores = []
            for _ in range(ng):
                bits.u8()
                cores.append(_cor(bits, v >= 3))
            if tipo == 0x13:
                bits.u16()
            lista.append(('gradiente', cores[0] if cores else (0, 0, 0, 255)))
        elif tipo in (0x40, 0x41, 0x42, 0x43):
            bits.u16()
            _matriz(bits)
            lista.append(('bitmap', (128, 128, 128, 255)))
        else:
            raise ValueError('preenchimento desconhecido %x' % tipo)
    return lista


def _linhas(bits, v):
    n = bits.u8()
    if n == 0xFF:
        n = bits.u16()
    lista = []
    for _ in range(n):
        larg = bits.u16()
        if v == 4:
            bits.ub(2)
            junta = bits.ub(2)
            tem_preench = bits.ub(1)
            bits.ub(1), bits.ub(1), bits.ub(1), bits.ub(5), bits.ub(1), bits.ub(2)
            if junta == 2:
                bits.u16()
            if tem_preench:
                cor = _preenchimentos_um(bits, v)
            else:
                cor = _cor(bits, True)
        else:
            cor = _cor(bits, v >= 3)
        lista.append((larg, cor))
    return lista


def _preenchimentos_um(bits, v):
    tipo = bits.u8()
    if tipo == 0x00:
        return _cor(bits, True)
    if tipo in (0x10, 0x12, 0x13):
        _matriz(bits)
        bits.alinhar()
        bits.ub(4)
        ng = bits.ub(4)
        cores = []
        for _ in range(ng):
            bits.u8()
            cores.append(_cor(bits, True))
        if tipo == 0x13:
            bits.u16()
        return cores[0] if cores else (0, 0, 0, 255)
    bits.u16()
    _matriz(bits)
    return (128, 128, 128, 255)


def ler_forma(codigo, dados):
    """Devolve id, limites (twips), cores de preenchimento e as arestas (para desenhar em SVG)."""
    v = VERSAO_FORMA[codigo]
    bits = Bits(dados)
    ident = bits.u16()
    limites = bits.rect()
    if v == 4:
        bits.rect()
        bits.u8()
    preench = _preenchimentos(bits, v)
    linhas = _linhas(bits, v)
    bits.alinhar()
    nf, nl = bits.ub(4), bits.ub(4)
    x = y = 0
    caminhos = []  # lista de (estilo_preench_0, estilo_preench_1, estilo_linha, [comandos])
    atual = None
    est = [0, 0, 0]
    base_p, base_l = 0, 0  # deslocamento dos estilos novos (NewStyles)
    todas_p, todas_l = list(preench), list(linhas)
    while True:
        if bits.ub(1) == 0:
            flags = bits.ub(5)
            if flags == 0:
                break
            if flags & 1:
                n = bits.ub(5)
                x, y = bits.sb(n), bits.sb(n)
            if flags & 2:
                est[0] = bits.ub(nf)
            if flags & 4:
                est[1] = bits.ub(nf)
            if flags & 8:
                est[2] = bits.ub(nl)
            if flags & 16:
                bits.alinhar()
                novos_p = _preenchimentos(bits, v)
                novos_l = _linhas(bits, v)
                base_p, base_l = len(todas_p), len(todas_l)
                todas_p += novos_p
                todas_l += novos_l
                bits.alinhar()
                nf, nl = bits.ub(4), bits.ub(4)
            atual = [base_p + est[0] if est[0] else 0, base_p + est[1] if est[1] else 0, base_l + est[2] if est[2] else 0, [('M', x, y)]]
            caminhos.append(atual)
        else:
            if atual is None:
                atual = [0, 0, 0, [('M', x, y)]]
                caminhos.append(atual)
            if bits.ub(1):
                n = bits.ub(4) + 2
                if bits.ub(1):
                    dx, dy = bits.sb(n), bits.sb(n)
                elif bits.ub(1):
                    dx, dy = 0, bits.sb(n)
                else:
                    dx, dy = bits.sb(n), 0
                x, y = x + dx, y + dy
                atual[3].append(('L', x, y))
            else:
                n = bits.ub(4) + 2
                cx, cy, ax, ay = bits.sb(n), bits.sb(n), bits.sb(n), bits.sb(n)
                qx, qy = x + cx, y + cy
                x, y = qx + ax, qy + ay
                atual[3].append(('Q', qx, qy, x, y))
    return {'id': ident, 'versao': v, 'limites': limites, 'preench': todas_p, 'linhas': todas_l, 'caminhos': caminhos}


def svg_da_forma(f, tam=120):
    x0, x1, y0, y1 = f['limites']
    w, h = max(1, x1 - x0), max(1, y1 - y0)
    partes = []
    for p0, p1, ln, cmds in f['caminhos']:
        d = ' '.join(('%s%d %d' % (c[0], c[1], c[2])) if c[0] in 'ML' else ('Q%d %d %d %d' % c[1:]) for c in cmds)
        estilo = p1 or p0
        cor = f['preench'][estilo - 1][1] if estilo and estilo - 1 < len(f['preench']) else None
        linha = f['linhas'][ln - 1][1] if ln and ln - 1 < len(f['linhas']) else None
        fill = 'rgb(%d,%d,%d)' % cor[:3] if cor else 'none'
        stroke = 'rgb(%d,%d,%d)' % linha[:3] if linha else ('#00000055' if not cor else 'none')
        partes.append('<path d="%s" fill="%s" fill-opacity="0.85" stroke="%s" stroke-width="%d" fill-rule="evenodd"/>' % (d, fill, stroke, max(10, w // 80)))
    return '<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="%d %d %d %d">%s</svg>' % (tam, tam, x0, y0, w, h, ''.join(partes))


# ---------- Gravação de uma forma nova (DefineShape3) ----------
class Escrita:
    def __init__(self):
        self.bits = []

    def ub(self, v, n):
        for i in range(n - 1, -1, -1):
            self.bits.append((v >> i) & 1)

    def sb(self, v, n):
        self.ub(v & ((1 << n) - 1), n)

    def alinhar(self):
        while len(self.bits) % 8:
            self.bits.append(0)

    def u8(self, v):
        self.alinhar()
        self.ub(v, 8)

    def u16(self, v):
        self.alinhar()
        self.ub(v & 0xFF, 8)
        self.ub((v >> 8) & 0xFF, 8)

    def bytes(self):
        self.alinhar()
        return bytes(int(''.join(map(str, self.bits[i:i + 8])), 2) for i in range(0, len(self.bits), 8))


def bits_com_sinal(*vals):
    return max([1] + [(abs(v) if v >= 0 else abs(v) - 1).bit_length() + 1 for v in vals])


def forma3(ident, contornos, preencher, linha, larg_linha):
    """contornos: lista de (lista de comandos [('M',x,y), ('L',x,y), ('Q',cx,cy,x,y)], buraco?) em twips (inteiros).
    preencher/linha: (r,g,b,a). O contorno de fora é desenhado no sentido horário (o preenchimento fica à direita: FillStyle1);
    o buraco também no sentido horário, com o preenchimento do outro lado (FillStyle0)."""
    xs = [c[i] for cs, _ in contornos for c in cs for i in range(1, len(c), 2)]
    ys = [c[i] for cs, _ in contornos for c in cs for i in range(2, len(c), 2)]
    meia = larg_linha // 2 + 1
    lim = [min(xs) - meia, max(xs) + meia, min(ys) - meia, max(ys) + meia]
    e = Escrita()
    e.u16(ident)
    n = bits_com_sinal(*lim)
    e.alinhar()
    e.ub(n, 5)
    for v in lim:
        e.sb(v, n)
    e.alinhar()
    e.u8(1)
    e.u8(0x00)
    for c in preencher:
        e.u8(c)
    e.u8(1)
    e.u16(larg_linha)
    for c in linha:
        e.u8(c)
    e.alinhar()
    e.ub(1, 4)  # NumFillBits
    e.ub(1, 4)  # NumLineBits
    x = y = 0
    for cmds, buraco in contornos:
        for c in cmds:
            if c[0] == 'M':
                x, y = c[1], c[2]
                e.ub(0, 1)
                e.ub(1 | 2 | 4 | 8, 5)  # MoveTo + FillStyle0 + FillStyle1 + LineStyle
                nm = bits_com_sinal(x, y)
                e.ub(nm, 5)
                e.sb(x, nm)
                e.sb(y, nm)
                e.ub(1 if buraco else 0, 1)  # FillStyle0
                e.ub(0 if buraco else 1, 1)  # FillStyle1
                e.ub(1, 1)  # LineStyle
            elif c[0] == 'L':
                dx, dy = c[1] - x, c[2] - y
                nb = max(2, bits_com_sinal(dx, dy))
                e.ub(1, 1)
                e.ub(1, 1)
                e.ub(nb - 2, 4)
                e.ub(1, 1)  # linha geral
                e.sb(dx, nb)
                e.sb(dy, nb)
                x, y = c[1], c[2]
            elif c[0] == 'Q':
                cdx, cdy = c[1] - x, c[2] - y
                adx, ady = c[3] - c[1], c[4] - c[2]
                nb = max(2, bits_com_sinal(cdx, cdy, adx, ady))
                e.ub(1, 1)
                e.ub(0, 1)
                e.ub(nb - 2, 4)
                for v in (cdx, cdy, adx, ady):
                    e.sb(v, nb)
                x, y = c[3], c[4]
    e.ub(0, 1)
    e.ub(0, 5)  # EndShapeRecord
    return e.bytes()
