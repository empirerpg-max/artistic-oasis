import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Mic2, Film, Disc3, Wallet, Trophy, Zap, Briefcase, Flame, HandHeart, X, Loader2 } from "lucide-react";
import { useTelegramUser } from "@/lib/telegram";
import { api, fmtEC, fmtMoney, driveImg, type Artist } from "@/lib/api";

export const Route = createFileRoute("/artistas/$nome")({
  component: ArtistDashboard,
});

function ArtistDashboard() {
  const { nome } = Route.useParams();
  const { user, ready } = useTelegramUser();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | "viral" | "filantropia">(null);

  useEffect(() => {
    if (!ready || !user) return;
    setLoading(true);
    api.meusArtistas(user.id).then((list) => {
      setArtist(list.find((a) => a.nome === nome) || null);
      setLoading(false);
    });
  }, [ready, user, nome]);

  if (loading) {
    return (
      <main className="flex-1 mx-auto w-full max-w-2xl px-4 pt-6">
        <div className="h-64 rounded-2xl bg-card animate-pulse" />
      </main>
    );
  }
  if (!artist) {
    return (
      <main className="flex-1 mx-auto w-full max-w-2xl px-4 pt-6">
        <Link to="/artistas" className="inline-flex items-center gap-1 text-muted-foreground mb-4">
          <ChevronLeft className="size-4" /> Voltar
        </Link>
        <p>Artista não encontrado.</p>
      </main>
    );
  }

  return (
    <main className="flex-1 mx-auto w-full max-w-2xl">
      {/* Hero */}
      <div className="relative px-4 pt-4 pb-6" style={{ background: "linear-gradient(180deg, oklch(0.32 0.16 145 / 0.55), transparent)" }}>
        <Link to="/artistas" className="inline-flex items-center gap-1 text-foreground/80 mb-4">
          <ChevronLeft className="size-5" />
        </Link>
        <div className="flex items-end gap-4">
          <img
            src={driveImg(artist.foto, 400)}
            alt={artist.nome}
            className="size-32 rounded-xl object-cover shadow-2xl bg-secondary"
            loading="eager"
          />
          <div className="flex-1 min-w-0 pb-2">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Artista</p>
            <h1 className="text-3xl font-black truncate">{artist.nome}</h1>
            <p className="text-xs text-muted-foreground mt-1">{artist.gravadora}</p>
          </div>
        </div>
        <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-xs font-bold">
          <span className={`size-2 rounded-full ${artist.status === "Livre" ? "bg-primary" : "bg-yellow-500"}`} />
          {artist.status === "Livre" ? "DISPONÍVEL" : artist.status.toUpperCase()}
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* Stats */}
        <section className="grid grid-cols-2 gap-3">
          <StatCard icon={<Wallet className="size-4" />} label="Saldo $EC" value={fmtEC(artist.saldo)} accent />
          <StatCard icon={<Briefcase className="size-4" />} label="Fortuna total" value={fmtMoney(artist.fortuna_total)} />
          <StatCard icon={<Trophy className="size-4" />} label="Prestígio" value={`${artist.prestigio}/1000`} bar={artist.prestigio / 10} />
          <StatCard icon={<Zap className="size-4" />} label="Fadiga" value={`${artist.fadiga}%`} bar={artist.fadiga} barColor="oklch(0.7 0.2 30)" />
        </section>

        {/* Ações principais */}
        <section>
          <h2 className="text-lg font-extrabold mb-3">Ações</h2>
          <div className="grid grid-cols-2 gap-3">
            <ActionLink to="/acoes/tour" params={{ nome: artist.nome }} icon={<Mic2 className="size-5" />} label="Comprar Tour" />
            <ActionLink to="/acoes/cinema" params={{ nome: artist.nome }} icon={<Film className="size-5" />} label="Cinema / TV" />
            <ActionLink to="/acoes/album" params={{ nome: artist.nome }} icon={<Disc3 className="size-5" />} label="Lançar Álbum" />
            <ActionButton onClick={() => setModal("viral")} icon={<Flame className="size-5" />} label="Viral" />
            <ActionButton onClick={() => setModal("filantropia")} icon={<HandHeart className="size-5" />} label="Filantropia" />
            <ProjectsLink nome={artist.nome} />
          </div>
        </section>
      </div>

      {modal === "viral" && <ViralModal nome={artist.nome} onClose={() => setModal(null)} />}
      {modal === "filantropia" && <FilantropiaModal nome={artist.nome} onClose={() => setModal(null)} />}
    </main>
  );
}

function StatCard({ icon, label, value, bar, barColor, accent }: {
  icon: React.ReactNode; label: string; value: string;
  bar?: number; barColor?: string; accent?: boolean;
}) {
  return (
    <div className={`p-4 rounded-xl ${accent ? "bg-primary/10 border border-primary/30" : "bg-card"}`}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
        {icon}{label}
      </div>
      <p className={`text-lg font-black mt-1 truncate ${accent ? "text-primary" : ""}`}>{value}</p>
      {bar !== undefined && (
        <div className="h-1.5 mt-2 rounded-full bg-secondary overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, bar)}%`, backgroundColor: barColor || "var(--primary)" }} />
        </div>
      )}
    </div>
  );
}

function ActionLink({ to, params, icon, label }: { to: string; params: { nome: string }; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to as any} search={params as any}
      className="flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-secondary transition-colors">
      <div className="size-10 rounded-lg bg-primary/15 text-primary grid place-items-center">{icon}</div>
      <span className="font-bold text-sm">{label}</span>
    </Link>
  );
}
function ActionButton({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-secondary transition-colors text-left">
      <div className="size-10 rounded-lg bg-primary/15 text-primary grid place-items-center">{icon}</div>
      <span className="font-bold text-sm">{label}</span>
    </button>
  );
}
function ProjectsLink({ nome }: { nome: string }) {
  return (
    <Link to="/artistas/$nome/projetos" params={{ nome }}
      className="flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-secondary transition-colors">
      <div className="size-10 rounded-lg bg-primary/15 text-primary grid place-items-center"><Briefcase className="size-5" /></div>
      <span className="font-bold text-sm">Projetos</span>
    </Link>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div onClick={onClose} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-end sm:place-items-center p-0 sm:p-4">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-card rounded-t-2xl sm:rounded-2xl p-5 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-extrabold">{title}</h3>
          <button onClick={onClose} className="size-8 rounded-full bg-secondary grid place-items-center"><X className="size-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ViralModal({ nome, onClose }: { nome: string; onClose: () => void }) {
  const [musica, setMusica] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  async function go() {
    if (!musica) return;
    setSubmitting(true); setResult(null);
    const r: any = await api.viral(nome, musica);
    setResult(typeof r === "string" ? r : (r.message || JSON.stringify(r)));
    setSubmitting(false);
  }
  return (
    <Modal title="Viralizar música" onClose={onClose}>
      <p className="text-xs text-muted-foreground mb-3">Coloca uma música pra viralizar. Aumenta visualizações, prestígio e fadiga.</p>
      <input value={musica} onChange={(e) => setMusica(e.target.value)} placeholder="Nome exato da música"
        className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm mb-3" />
      <button onClick={go} disabled={submitting || !musica}
        className="w-full py-3 rounded-full bg-primary text-primary-foreground font-extrabold uppercase tracking-wider text-sm disabled:opacity-50 inline-flex items-center justify-center gap-2">
        {submitting && <Loader2 className="size-4 animate-spin" />} Confirmar
      </button>
      {result && <p className="text-xs mt-3 whitespace-pre-wrap">{result}</p>}
    </Modal>
  );
}

function FilantropiaModal({ nome, onClose }: { nome: string; onClose: () => void }) {
  const [causa, setCausa] = useState("");
  const [valor, setValor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  async function go() {
    if (!causa || !valor) return;
    setSubmitting(true); setResult(null);
    const r: any = await api.filantropia(nome, causa, valor);
    setResult(typeof r === "string" ? r : (r.message || JSON.stringify(r)));
    setSubmitting(false);
  }
  return (
    <Modal title="Filantropia" onClose={onClose}>
      <p className="text-xs text-muted-foreground mb-3">Doe parte da fortuna por uma causa. Ganha prestígio.</p>
      <input value={causa} onChange={(e) => setCausa(e.target.value)} placeholder="Causa (ex: Educação)"
        className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm mb-2" />
      <input value={valor} onChange={(e) => setValor(e.target.value)} placeholder="Valor em $ (ex: 1000000)"
        className="w-full bg-background border border-border rounded-xl px-3 py-3 text-sm mb-3" />
      <button onClick={go} disabled={submitting || !causa || !valor}
        className="w-full py-3 rounded-full bg-primary text-primary-foreground font-extrabold uppercase tracking-wider text-sm disabled:opacity-50 inline-flex items-center justify-center gap-2">
        {submitting && <Loader2 className="size-4 animate-spin" />} Doar
      </button>
      {result && <p className="text-xs mt-3 whitespace-pre-wrap">{result}</p>}
    </Modal>
  );
}
