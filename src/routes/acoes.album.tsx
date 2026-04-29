import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, Disc3, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { Field, Input, ResultBanner } from "./acoes.tour";

export const Route = createFileRoute("/acoes/album")({
  validateSearch: (s: Record<string, unknown>) => ({ nome: String(s.nome || "") }),
  component: AlbumForm,
});

function AlbumForm() {
  const { nome } = Route.useSearch();
  const [album, setAlbum] = useState("");
  const [genero, setGenero] = useState("Pop");
  const [data, setData] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!album || !data) return;
    setSubmitting(true); setResult(null);
    const r: any = await api.registrarAlbum({ nome, album, genero, data });
    setResult(typeof r === "string" ? r : (r.message || JSON.stringify(r)));
    setSubmitting(false);
  }

  return (
    <main className="flex-1 mx-auto w-full max-w-2xl px-4 pt-6">
      <Link to="/artistas/$nome" params={{ nome }} className="inline-flex items-center gap-1 text-muted-foreground mb-4">
        <ChevronLeft className="size-4" /> Voltar
      </Link>
      <header className="mb-6 flex items-center gap-3">
        <div className="size-12 rounded-xl bg-primary/15 text-primary grid place-items-center"><Disc3 className="size-6" /></div>
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">{nome}</p>
          <h1 className="text-2xl font-extrabold">Lançar Álbum</h1>
        </div>
      </header>
      <form onSubmit={submit} className="space-y-5">
        <Field label="Nome do álbum"><Input value={album} onChange={(e) => setAlbum(e.target.value)} required /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Gênero">
            <select value={genero} onChange={(e) => setGenero(e.target.value)} className="w-full bg-card border border-border rounded-xl px-3 py-3 text-sm">
              <option>Pop</option><option>Rock</option><option>Hip-Hop</option><option>R&B</option><option>Eletrônica</option><option>Country</option><option>Latina</option>
            </select>
          </Field>
          <Field label="Data de lançamento"><Input type="date" value={data} onChange={(e) => setData(e.target.value)} required /></Field>
        </div>
        <button type="submit" disabled={submitting}
          className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-extrabold uppercase tracking-wider text-sm disabled:opacity-50 flex items-center justify-center gap-2">
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {submitting ? "Lançando..." : "Lançar"}
        </button>
        {result && <ResultBanner text={result} />}
      </form>
    </main>
  );
}