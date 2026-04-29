import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Mic2, Film, Music, Disc3, Wallet, Trophy, Zap, Briefcase } from "lucide-react";
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
            src={driveImg(artist.foto)}
            alt={artist.nome}
            className="size-32 rounded-xl object-cover shadow-2xl bg-secondary"
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

        {/* Ações */}
        <section>
          <h2 className="text-lg font-extrabold mb-3">Ações</h2>
          <div className="grid grid-cols-2 gap-3">
            <ActionLink to="/acoes/tour" params={{ nome: artist.nome }} icon={<Mic2 className="size-5" />} label="Comprar Tour" />
            <ActionLink to="/acoes/cinema" params={{ nome: artist.nome }} icon={<Film className="size-5" />} label="Cinema / TV" />
            <ActionLink to="/acoes/musica" params={{ nome: artist.nome }} icon={<Music className="size-5" />} label="Lançar Música" />
            <ActionLink to="/acoes/album" params={{ nome: artist.nome }} icon={<Disc3 className="size-5" />} label="Lançar Álbum" />
          </div>
        </section>
      </div>
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

function ActionLink({ to, params, icon, label }: { to: string; params: Record<string, string>; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to as any}
      search={params as any}
      className="flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-secondary transition-colors"
    >
      <div className="size-10 rounded-lg bg-primary/15 text-primary grid place-items-center">{icon}</div>
      <span className="font-bold text-sm">{label}</span>
    </Link>
  );
}