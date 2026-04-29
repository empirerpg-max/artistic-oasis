// Empire Hub — Apps Script API client
// Mantém Apps Script + Google Sheets como backend.

export const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwxbkUndhZPtFvtK1uIFTkPNN-m6WeiFVMU3IDzuahsC0oQp8Ba2GLQFOAPkWv8eiA3/exec";

export interface Artist {
  nome: string;
  foto: string;
  status: string;
  saldo: number;
  gravadora: string;
  fortuna_real: number;
  fortuna_bens: number;
  fortuna_total: number;
  prestigio: number;
  fadiga: number;
  telegram_id?: string;
  tour_info?: any;
}

export interface RadarItem {
  timestamp: string;
  nome: string;
  acao: string;
  foto: string;
}

function qs(params: Record<string, string | number | undefined>) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    u.set(k, String(v));
  }
  u.set("_t", String(Date.now()));
  return u.toString();
}

async function call<T = any>(params: Record<string, any>): Promise<T> {
  const res = await fetch(`${SCRIPT_URL}?${qs(params)}`, { method: "GET" });
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

function normalizeArtist(a: any): Artist {
  return {
    nome: (a.nome || "").trim(),
    foto: a.foto || "",
    status: a.status || "Livre",
    saldo: Number(a.saldo || 0),
    gravadora: a.gravadora || "Independent",
    fortuna_real: Number(a.fortuna_real || 0),
    fortuna_bens: Number(a.fortuna_bens || 0),
    fortuna_total: Number(a.fortuna_total || 0),
    prestigio: Number(a.prestigio || 0),
    fadiga: Number(a.fadiga || 0),
    telegram_id: a.telegram_id ? String(a.telegram_id) : undefined,
    tour_info: a.tour_info,
  };
}

export const api = {
  async meusArtistas(telegramId: string): Promise<Artist[]> {
    const data = await call<any[]>({ acao: "meus_artistas", telegram_id: telegramId });
    return Array.isArray(data) ? data.map(normalizeArtist) : [];
  },
  async listarTodos(): Promise<Artist[]> {
    const data = await call<any[]>({ acao: "listar_todos" });
    return Array.isArray(data) ? data.map(normalizeArtist) : [];
  },
  async radar(): Promise<RadarItem[]> {
    const data = await call<any[]>({ acao: "radar" });
    return Array.isArray(data) ? data : [];
  },
  async projetos(nome: string): Promise<any[]> {
    const data = await call<any[]>({ acao: "projetos", nome });
    return Array.isArray(data) ? data : [];
  },

  // Ações
  async comprarTour(p: {
    nome: string; tipo: string; titulo: string;
    dataInicio: string; qtd: number; continente: string;
  }) {
    return call({ acao: "compra_unificada_tour", nome: p.nome, tipo: p.tipo, titulo: p.titulo, dataInicio: p.dataInicio, qtd: p.qtd, continente: p.continente });
  },
  async comprarCinema(p: { nome: string; titulo: string; tipo: string; genero: string; dataInicio: string }) {
    return call({ acao: "compra_cinema", ...p });
  },
  async registrarMusica(p: { nome: string; musica: string; genero: string; data: string }) {
    return call({ acao: "registrar_musica", artista: p.nome, act_principal: p.nome, musica: p.musica, genero: p.genero, data: p.data });
  },
  async registrarAlbum(p: { nome: string; album: string; genero: string; data: string }) {
    return call({ acao: "registrar_album", artista: p.nome, act_principal: p.nome, album: p.album, genero: p.genero, data: p.data });
  },
  async viral(nome: string, musica: string) {
    return call({ acao: "viral", artista: nome, musica });
  },
  async filantropia(nome: string, causa: string, valor: string) {
    return call({ acao: "filantropia", artista: nome, causa, valor });
  },
};

export function fmtEC(n: number) {
  return `EC ${(n || 0).toLocaleString("pt-BR")}`;
}
export function fmtMoney(n: number) {
  return `$${(n || 0).toLocaleString("pt-BR")}`;
}

// Converte link do Drive em URL de imagem visualizável
export function driveImg(url: string): string {
  if (!url) return "";
  const m = url.match(/[-\w]{25,}/);
  if (!m) return url;
  return `https://drive.google.com/uc?export=view&id=${m[0]}`;
}