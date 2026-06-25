// Parser para o campo "description" das OS da RBX.
// O texto vem com blocos delimitados por "### TITULO ###" e linhas
// no formato "/# chave:valor #/" ou "/# texto livre #/".

export type ParsedAuth = {
  login?: string;
  senha?: string;
  nas?: string;
  porta?: string;
  mac?: string;
  obs?: string;
};

export type ParsedContrato = {
  contrato?: string;
  plano?: string;
  qos?: string;
  assinatura?: string;
  inicio?: string;
  leituraVenc?: string;
};

export type ParsedEquipamento = {
  origem?: string;
  equipamento?: string;
};

export type ParsedIp = {
  ip?: string;
  gateway?: string;
  mac?: string;
  obs?: string;
};

export type ParsedDocumento = {
  numero?: string;
  vencimento?: string;
  valor?: string;
  origem?: string;
};

export type ParsedDescription = {
  intro?: string;          // texto antes do primeiro bloco
  observacoes?: string;    // bloco "OBSERVAÇÕES" (texto livre)
  auths: ParsedAuth[];
  contratos: ParsedContrato[];
  equipamentos: ParsedEquipamento[];
  ips: ParsedIp[];
  documentos: ParsedDocumento[];
  documentosResumo?: string; // ex.: "6 documento(s) em aberto totalizando R$ 600,00"
};

const SECTION_RE = /\/#\s*###\s*([^#]+?)\s*###\s*#\//g;

function splitBlocks(raw: string): { intro: string; sections: { title: string; body: string }[] } {
  const matches: { title: string; idx: number; len: number }[] = [];
  let m: RegExpExecArray | null;
  SECTION_RE.lastIndex = 0;
  while ((m = SECTION_RE.exec(raw)) !== null) {
    matches.push({ title: m[1].trim().toUpperCase(), idx: m.index, len: m[0].length });
  }
  if (matches.length === 0) return { intro: raw.trim(), sections: [] };
  const intro = raw.slice(0, matches[0].idx).trim();
  const sections = matches.map((cur, i) => {
    const start = cur.idx + cur.len;
    const end = i + 1 < matches.length ? matches[i + 1].idx : raw.length;
    return { title: cur.title, body: raw.slice(start, end).trim() };
  });
  return { intro, sections };
}

// Pega todas as ocorrências entre /# ... #/ dentro de um bloco.
function extractEntries(body: string): string[] {
  const re = /\/#\s*([\s\S]*?)\s*#\//g;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    const t = m[1].trim();
    if (t) out.push(t);
  }
  return out;
}

// Quebra "Login:foo Senha:bar" em pares chave/valor.
function parseKV(line: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /([\wÀ-ÿ.\/]+)\s*:\s*([^]*?)(?=(?:\s+[\wÀ-ÿ.\/]+\s*:)|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    const k = m[1].trim();
    const v = m[2].trim();
    if (k) out[k.toLowerCase()] = v;
  }
  return out;
}

function groupAuths(entries: string[]): ParsedAuth[] {
  // Cada auth = sequência consecutiva começando em "Login:" até a próxima "Login:".
  const groups: string[][] = [];
  let cur: string[] = [];
  for (const e of entries) {
    if (/^login\s*:/i.test(e)) {
      if (cur.length) groups.push(cur);
      cur = [e];
    } else if (cur.length) {
      cur.push(e);
    }
  }
  if (cur.length) groups.push(cur);

  return groups.map((g) => {
    const kv: Record<string, string> = {};
    for (const line of g) Object.assign(kv, parseKV(line));
    return {
      login: kv["login"],
      senha: kv["senha"],
      nas: kv["nas"],
      porta: kv["porta"],
      mac: kv["mac"],
      obs: kv["obs"],
    };
  });
}

function parseContratos(entries: string[]): ParsedContrato[] {
  const groups: string[][] = [];
  let cur: string[] = [];
  for (const e of entries) {
    if (/^contrato\s*:/i.test(e)) {
      if (cur.length) groups.push(cur);
      cur = [e];
    } else if (cur.length) {
      cur.push(e);
    }
  }
  if (cur.length) groups.push(cur);

  return groups.map((g) => {
    const kv: Record<string, string> = {};
    for (const line of g) Object.assign(kv, parseKV(line));
    return {
      contrato: kv["contrato"],
      plano: kv["plano"],
      qos: kv["qos"],
      assinatura: kv["assin."] || kv["assin"] || kv["assinatura"],
      inicio: kv["início"] || kv["inicio"],
      leituraVenc: kv["leitura/venc."] || kv["leitura/venc"],
    };
  });
}

function parseEquipamentos(entries: string[]): ParsedEquipamento[] {
  return entries
    .filter((e) => /(^|\s)(ori|equip)\s*:/i.test(e))
    .map((e) => {
      const kv = parseKV(e);
      return { origem: kv["ori"], equipamento: kv["equip"] };
    });
}

function parseIps(entries: string[]): ParsedIp[] {
  const groups: string[][] = [];
  let cur: string[] = [];
  for (const e of entries) {
    if (/^ip\s*:/i.test(e)) {
      if (cur.length) groups.push(cur);
      cur = [e];
    } else if (cur.length) {
      cur.push(e);
    }
  }
  if (cur.length) groups.push(cur);
  return groups.map((g) => {
    const kv: Record<string, string> = {};
    for (const line of g) Object.assign(kv, parseKV(line));
    return { ip: kv["ip"], gateway: kv["gw"], mac: kv["mac"], obs: kv["obs"] };
  });
}

function parseDocumentos(entries: string[]): { docs: ParsedDocumento[]; resumo?: string } {
  const docs: ParsedDocumento[] = [];
  let resumo: string | undefined;
  let pending: ParsedDocumento | null = null;
  for (const e of entries) {
    if (/^doc\s*:/i.test(e)) {
      if (pending) docs.push(pending);
      const kv = parseKV(e);
      pending = { numero: kv["doc"], vencimento: kv["vcto"] };
    } else if (pending && /valor\s*:/i.test(e)) {
      const kv = parseKV(e);
      pending.valor = kv["valor"];
      pending.origem = kv["ori"];
      docs.push(pending);
      pending = null;
    } else if (/documento\(s\)/i.test(e)) {
      resumo = e;
    }
  }
  if (pending) docs.push(pending);
  return { docs, resumo };
}

export function parseRbxDescription(raw: string | undefined | null): ParsedDescription {
  const empty: ParsedDescription = {
    auths: [], contratos: [], equipamentos: [], ips: [], documentos: [],
  };
  if (!raw) return empty;
  const { intro, sections } = splitBlocks(raw);

  const result: ParsedDescription = { ...empty, intro: intro || undefined };

  for (const sec of sections) {
    const entries = extractEntries(sec.body);
    if (sec.title.includes("AUTENTIC")) {
      result.auths = groupAuths(entries);
    } else if (sec.title.includes("CONTRATO") || sec.title.includes("PLANO")) {
      result.contratos = parseContratos(entries);
    } else if (sec.title.includes("EQUIP")) {
      result.equipamentos = parseEquipamentos(entries);
    } else if (sec.title.includes("IP")) {
      result.ips = parseIps(entries);
    } else if (sec.title.includes("OBSERV")) {
      // texto livre: junta entradas com quebra de linha
      result.observacoes = entries.join("\n\n").trim() || undefined;
    } else if (sec.title.includes("DOCUMENTO")) {
      const { docs, resumo } = parseDocumentos(entries);
      result.documentos = docs;
      result.documentosResumo = resumo;
    }
  }
  return result;
}
