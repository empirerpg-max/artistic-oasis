import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Building2, Sparkles, Briefcase, Loader2 } from "lucide-react";
import { api, fmtEC, fmtMoney, type BemItem } from "@/lib/api";

export const Route = createFileRoute("/artistas/$nome/bens")({
  component: BensPage,
});

const CAT_ICON: Record<string, React.ReactNode> = {
  IMOVEIS: <Building2 className="size-5" />,
  MARKET: <Sparkles className="size-5" />,
  CARREIRA: <Briefcase className="size-5" />,
};

function BensPage() {
  const { nome } = Route.useParams();
  const [bens, setBens] = useState<BemItem[] | null>(null);
  const [selling, setSelling] = useState<string | null>(null);

  useEffect(() => { api.meusBens(nome).then(setBens); }, [nome]);

  async function vender(id: string) {
    if (!confirm("Vender este bem? Você recebe ~70% do valor de compra.")) return;
    setSelling(id);
    await api.venderBem({ nome, id });
    setSelling(null);
    api.meusBens(nome).then(setBens);
  }

  const total = bens?.reduce((s, b) => s + (b.status === "Vendido" ? 0 : b.valor), 0) || 0;

  return (
    <main className="flex-1 mx-auto w-full max-w-2xl px-4 pt-4">
      <Link to="/artistas/$nome" params={{ nome }} className="inline-flex items-center gap-1 text-muted-foreground mb-4">
        <ChevronLeft className="size-5" /> {nome}
      </Link>
      <h1 className="text-2xl font-black">Meus Bens</h1>
      <p className="text-sm text-muted-foreground">Patrimônio total: <span className="font-bold text-foreground">{fmtMoney(total)}</span></p>

      <div className="mt-6 space-y-3">
        {bens === null ? (
          <div className="rounded-xl bg-card animate-pulse h-32" />
        ) : bens.length === 0 ? (
          <div className="rounded-xl bg-card p-6 text-center text-sm text-muted-foreground">
            Nenhum bem ainda. Vá ao <Link to="/market" className="text-primary font-bold">Empire Market</Link>.
          </div>
        ) : (
          bens.map((b, i) => {
            const id = b.id || String(i);
            const ativo = b.status !== "Vendido";
            return (
              <div key={id} className={`p-4 rounded-xl bg-card flex items-center gap-3 ${!ativo ? "opacity-50" : ""}`}>
                <div className="size-12 rounded-lg bg-primary/15 text-primary grid place-items-center shrink-0">
                  {CAT_ICON[b.categoria] || <Sparkles className="size-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-sm truncate">{b.item}</p>
                  <p className="text-xs text-muted-foreground">{b.categoria} • {b.data?.split("T")[0] || ""}</p>
                  <p className="text-sm font-bold text-primary">{fmtEC(b.valor)}</p>
                </div>
                {ativo && b.id && (
                  <button onClick={() => vender(b.id!)} disabled={selling === b.id}
                    className="px-3 py-2 rounded-full bg-secondary text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-50">
                    {selling === b.id ? <Loader2 className="size-3 animate-spin" /> : null} Vender
                  </button>
                )}
                {!ativo && <span className="text-[10px] uppercase font-bold text-muted-foreground">Vendido</span>}
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}