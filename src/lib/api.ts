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

export interface Projeto {
  tipo: string;
  titulo: string;
  status: string;
  data?: string;
  detalhe?: string;
  [k: string]: any;
}

export interface AlbumFaixa {
  numero: number;
  titulo: string;
  artistas: string;        // ex: "YAN feat. Matthew"
  duracao?: string;        // "3:24"
  drive_url: string;       // link público do Drive (mp3)
  letra?: string;
}

export interface AlbumPayload {
  id?: string;
  artista: string;
  titulo: string;
  genero: string;
  data: string;            // YYYY-MM-DD
  capa_url: string;        // link Drive da capa
  contracapa_url?: string;
  encarte: string[];       // links Drive (N imagens)
  faixas: AlbumFaixa[];
  descricao?: string;
  telegram_id?: string;
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

// --- Cache em memória com SWR (stale-while-revalidate) ---
const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 30_000; // 30s
const inflight = new Map<string, Promise<any>>();

async function rawCall<T = any>(params: Record<string, any>): Promise<T> {
  const res = await fetch(`${SCRIPT_URL}?${qs(params)}`, { method: "GET" });
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

async function call<T = any>(params: Record<string, any>, opts: { cache?: boolean } = {}): Promise<T> {
  if (!opts.cache) return rawCall<T>(params);
  const key = JSON.stringify(params);
  const hit = cache.get(key);
  const fresh = hit && Date.now() - hit.ts < CACHE_TTL;
  if (fresh) return hit.data as T;
  if (inflight.has(key)) return inflight.get(key)! as Promise<T>;
  const p = rawCall<T>(params).then((data) => {
    cache.set(key, { data, ts: Date.now() });
    inflight.delete(key);
    return data;
  }).catch((e) => { inflight.delete(key); throw e; });
  inflight.set(key, p);
  return p;
}

export function invalidateCache() { cache.clear(); }

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
    const data = await call<any[]>({ acao: "meus_artistas", telegram_id: telegramId }, { cache: true });
    return Array.isArray(data) ? data.map(normalizeArtist) : [];
  },
  async listarTodos(): Promise<Artist[]> {
    const data = await call<any[]>({ acao: "listar_todos" }, { cache: true });
    return Array.isArray(data) ? data.map(normalizeArtist) : [];
  },
  async radar(): Promise<RadarItem[]> {
    const data = await call<any[]>({ acao: "radar" }, { cache: true });
    return Array.isArray(data) ? data : [];
  },
  async projetos(nome: string): Promise<Projeto[]> {
    const data = await call<any[]>({ acao: "projetos", nome }, { cache: true });
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
  async viral(nome: string, musica: string) {
    return call({ acao: "viral", artista: nome, musica });
  },
  async filantropia(nome: string, causa: string, valor: string) {
    return call({ acao: "filantropia", artista: nome, causa, valor });
  },

  // ---- Álbuns (novos endpoints — código pra colar no Apps Script) ----
  async lancarAlbum(payload: AlbumPayload): Promise<{ ok: boolean; id?: string; message?: string }> {
    invalidateCache();
    return call({ acao: "lancar_album", payload: JSON.stringify(payload) });
  },
  async getAlbum(id: string): Promise<AlbumPayload | null> {
    const r = await call<any>({ acao: "get_album", id }, { cache: true });
    if (!r || r.error) return null;
    return r as AlbumPayload;
  },
  async listarAlbuns(nome?: string): Promise<AlbumPayload[]> {
    const r = await call<any[]>({ acao: "listar_albuns", nome: nome || "" }, { cache: true });
    return Array.isArray(r) ? r : [];
  },
};

export function fmtEC(n: number) {
  return `EC ${(n || 0).toLocaleString("pt-BR")}`;
}
export function fmtMoney(n: number) {
  return `$${(n || 0).toLocaleString("pt-BR")}`;
}

// Converte link do Drive em URL de imagem visualizável.
// O endpoint `uc?export=view` não funciona mais (bloqueio CORS desde 2024).
// Usamos o thumbnail endpoint, que serve direto e aceita parâmetro de tamanho.
export function driveImg(url: string, size: number = 400): string {
  if (!url) return "";
  const m = String(url).match(/[-\w]{25,}/);
  if (!m) return url;
  return `https://lh3.googleusercontent.com/d/${m[0]}=w${size}-h${size}`;
}

// Para áudio: extrai ID e retorna URL do player do Drive (iframe-able).
export function driveAudioSrc(url: string): string {
  if (!url) return "";
  const m = String(url).match(/[-\w]{25,}/);
  if (!m) return url;
  return `https://drive.google.com/file/d/${m[0]}/preview`;
}

// Tenta gerar URL direto do mp3 (pode não funcionar para todos os arquivos).
export function driveDirectAudio(url: string): string {
  if (!url) return "";
  const m = String(url).match(/[-\w]{25,}/);
  if (!m) return url;
  return `https://drive.google.com/uc?export=download&id=${m[0]}`;
}