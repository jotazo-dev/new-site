import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Heart, Sparkles, RefreshCw, Star } from "lucide-react";

/**
 * Cart context passed by the parent to allow personalized retention copy.
 * All fields optional — if absent the dialog falls back to purely emotional copy.
 */
export type FiberRemoveCartContext = {
  hasTv?: boolean;
  hasMobile?: boolean;
  mobileQty?: number;
  hasBlackChip?: boolean;
  /** Names of SVA add-ons in cart, e.g. ["Globoplay", "Premiere"]. */
  svaNames?: string[];
  /** Fiber plan name, e.g. "Fibra 1 GIGA". */
  fiberSpeedLabel?: string;
  /** Pretty-formatted current monthly total, e.g. "R$ 219,80". */
  totalMonthlyBRL?: string;
};

interface FiberRemoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  /** Optional handler to switch fiber plan instead of removing it. */
  onChangePlan?: () => void;
  fiberName?: string;
  /** Optional cart snapshot for personalized loss bullets. */
  cartContext?: FiberRemoveCartContext;
}

/**
 * 20 emotional retention titles + intros — empathetic, non-judgmental.
 */
const TITLE_VARIATIONS: Array<{ title: string; intro: string }> = [
  { title: "A gente preparou seu combo com muito carinho 💙", intro: "Olha tudo o que faz parte da experiência Jotazo no seu dia a dia:" },
  { title: "Que tal dar uma última olhada no que é seu?", intro: "Esse combo foi pensado pra te entregar muito mais do que internet:" },
  { title: "Antes de mudar, lembra do que te conquistou?", intro: "Tem coisas no seu combo que fazem diferença de verdade:" },
  { title: "Você está cercado de coisas boas por aqui ✨", intro: "Tudo isso já está reservado pra você:" },
  { title: "Seu combo Jotazo é mais do que parece", intro: "Veja o que está incluído na sua experiência:" },
  { title: "A gente quer continuar cuidando de você 💙", intro: "Tudo isso é o que torna o seu combo especial:" },
  { title: "Que tal explorar outro plano antes de decidir?", intro: "Você pode trocar de plano e continuar tendo:" },
  { title: "Sua experiência Jotazo é feita destes detalhes", intro: "Olha o que faz parte do combo que escolheu:" },
  { title: "A Jotazo é feita pra estar perto de você", intro: "Tudo isso continua com você no seu combo:" },
  { title: "Tem muita coisa boa esperando por você aqui", intro: "Seu combo inclui benefícios pensados pra facilitar sua vida:" },
  { title: "Que tal repensar com calma? Sem pressa.", intro: "Antes de qualquer mudança, dá uma olhada no que é seu:" },
  { title: "Seu combo está completo, do jeitinho ideal", intro: "Tudo isso compõe a experiência Jotazo que você escolheu:" },
  { title: "A gente fez questão de incluir cada detalhe 💙", intro: "Veja o cuidado que colocamos no seu combo:" },
  { title: "Aqui você é mais do que um cliente", intro: "Seu combo Jotazo entrega muito além da internet:" },
  { title: "Que tal dar uma olhada no que tem dentro? 👀", intro: "Tudo isso já está esperando por você:" },
  { title: "A Jotazo está pertinho de você, sempre", intro: "Seu combo inclui o que importa de verdade:" },
  { title: "Olha só o que faz seu combo ser único", intro: "Cada item foi pensado pra entregar mais valor:" },
  { title: "Talvez exista um plano ainda melhor pra você", intro: "Antes de remover, veja o que faz parte do seu combo hoje:" },
  { title: "Seu combo é cheio de coisas boas 💙", intro: "Tudo isso continua com você se mantiver o combo:" },
  { title: "Dá só mais um minutinho — vale a pena", intro: "Olha a experiência completa que preparamos pra você:" },
];

/**
 * Emotional reasons grouped in 5 axes — sortear 1 por eixo garante variedade
 * temática (não 3 frases sobre "filme em família").
 */
const EMOTIONAL_AXES = {
  familia: [
    "Você vai abrir mão de momentos em família com internet que nunca trava",
    "Vai perder aqueles domingos de filme em 4K, sem buffer no melhor da cena",
    "Vai deixar a casa toda conectada ao mesmo tempo, sem ninguém brigar pelo Wi-Fi",
    "Vai abrir mão da chamada de vídeo nítida com quem mora longe",
    "Vai perder a tranquilidade de chegar em casa e tudo simplesmente funcionar",
    "Vai deixar pra trás as noites de série em família, sem travamento",
    "Vai abrir mão dos jogos online das crianças rodando lisinho",
  ],
  confianca: [
    "Você vai perder a segurança de uma marca consolidada na sua região",
    "Vai abrir mão da garantia de quem está aqui há anos e não some amanhã",
    "Vai deixar pra trás a confiança construída no boca a boca da vizinhança",
    "Vai perder a tranquilidade de saber que, se der problema, tem solução rápida",
    "Vai abrir mão de uma empresa que assume o compromisso e cumpre",
    "Vai deixar uma marca que tem a confiança de milhares de famílias da região",
    "Vai perder o respaldo de quem cuida da sua conexão como se fosse a própria",
  ],
  proximidade: [
    "Você vai perder o atendimento de quem te conhece pelo nome",
    "Vai abrir mão de uma equipe que mora na sua cidade e entende sua realidade",
    "Vai deixar pra trás o suporte humano, sem precisar gritar 'atendente' no telefone",
    "Vai perder a proximidade de quem resolve sem fila de espera",
    "Vai abrir mão do carinho de uma empresa da região que se importa com você",
    "Vai deixar um atendimento que te trata como pessoa, não como protocolo",
    "Vai perder a facilidade de falar com alguém que realmente escuta",
  ],
  agilidade: [
    "Você vai perder a agilidade de resolver tudo pelo WhatsApp, sem URA infinita",
    "Vai abrir mão do suporte que responde rápido e resolve no primeiro contato",
    "Vai deixar pra trás o técnico que aparece no horário combinado",
    "Vai perder a leveza de não precisar repetir sua história a cada ligação",
    "Vai abrir mão da praticidade de ter tudo na palma da mão, sem burocracia",
    "Vai deixar um atendimento que age na hora, não em 'até 5 dias úteis'",
    "Vai perder a facilidade de quem cuida de tudo pra você, do jeito simples",
  ],
  preco: [
    "Você vai perder o preço de combo, que é mais vantajoso que contratar separado",
    "Vai abrir mão da economia que cabe no orçamento da família todo mês",
    "Vai deixar pra trás a previsibilidade de uma conta certinha, sem surpresa",
    "Vai perder a vantagem de pagar tudo numa só fatura, organizada",
    "Vai abrir mão de mais serviço pelo mesmo dinheiro — combo sempre vale mais",
    "Vai deixar um plano sem letra miúda e sem pegadinha no boleto",
    "Vai perder o desconto exclusivo que só quem tem combo Jotazo aproveita",
  ],
  cuidado: [
    "Você vai perder o cuidado de uma equipe que trata você como família",
    "Vai abrir mão de ser ouvido, entendido e respeitado em cada contato",
    "Vai deixar pra trás a atenção aos detalhes que faz toda a diferença",
    "Vai perder a sensação de ser bem cuidado, do jeito que cliente merece",
    "Vai abrir mão de uma marca que entrega mais do que prometeu",
    "Vai deixar de ser parte da família Jotazo, e virar só mais um contrato em outra operadora",
    "Vai perder o carinho de quem faz o simples bem feito, todo dia",
  ],
};

type AxisKey = keyof typeof EMOTIONAL_AXES;
const AXIS_ORDER: AxisKey[] = ["familia", "proximidade", "confianca", "agilidade", "cuidado", "preco"];

/**
 * Build personalized "what you have" bullets from the cart snapshot.
 * Encanta o cliente com o que ele JÁ TEM no combo — tom afirmativo, sem perdas.
 */
function buildPersonalizedLosses(ctx: FiberRemoveCartContext | undefined): string[] {
  if (!ctx) return [];
  const out: string[] = [];

  if (ctx.hasTv) {
    out.push("Sua TV inclusa, integrada à fibra Jotazo — entretenimento que já é seu");
  }

  const qty = ctx.mobileQty ?? 0;
  if (ctx.hasBlackChip) {
    out.push("Black Chip 5G com Dual Channel, exclusivo de quem tem o combo");
  } else if (qty >= 2) {
    out.push(`Os ${qty} Chips 5G da família com preço especial de combo`);
  } else if (ctx.hasMobile) {
    out.push("Seu Chip 5G com o preço especial que só o combo oferece");
  }

  if (ctx.svaNames && ctx.svaNames.length > 0) {
    const list = ctx.svaNames.length === 1
      ? ctx.svaNames[0]
      : `${ctx.svaNames.slice(0, -1).join(", ")} e ${ctx.svaNames[ctx.svaNames.length - 1]}`;
    out.push(`${list} no seu pacote, tudo numa única fatura`);
  }

  if (ctx.fiberSpeedLabel && out.length < 3) {
    out.push(`Velocidade de ${ctx.fiberSpeedLabel} já reservada pro seu endereço`);
  }

  if (ctx.totalMonthlyBRL && out.length < 3) {
    out.push(`Combo fechado em ${ctx.totalMonthlyBRL}/mês, com economia real`);
  }

  return out.slice(0, 3);
}

/** Pick N emotional reasons across distinct axes, fully randomized. */
function pickEmotionalAcrossAxes(n: number): string[] {
  if (n <= 0) return [];
  // Embaralha a ordem dos eixos e pega N primeiros — variedade temática garantida.
  const shuffledAxes = [...AXIS_ORDER].sort(() => Math.random() - 0.5);
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const axis = shuffledAxes[i % shuffledAxes.length];
    const pool = EMOTIONAL_AXES[axis];
    const idx = Math.floor(Math.random() * pool.length);
    out.push(pool[idx]);
  }
  return out;
}

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) hash = (hash * 31 + input.charCodeAt(i)) | 0;
  return hash;
}

function ctxFingerprint(ctx: FiberRemoveCartContext | undefined): string {
  if (!ctx) return "";
  return [
    ctx.hasTv ? "tv" : "",
    ctx.hasMobile ? "m" : "",
    ctx.mobileQty ?? 0,
    ctx.hasBlackChip ? "b" : "",
    (ctx.svaNames ?? []).join("|"),
    ctx.fiberSpeedLabel ?? "",
  ].join("/");
}

export function FiberRemoveDialog({
  open,
  onOpenChange,
  onConfirm,
  onChangePlan,
  fiberName,
  cartContext,
}: FiberRemoveDialogProps) {
  // Build full content (title + intro + losses) when the dialog opens.
  // Re-shuffles only when the cart fingerprint changes or on re-open — gives
  // variety without flickering during a single session.
  const fingerprint = ctxFingerprint(cartContext) + "|" + (fiberName ?? "");

  const [content, setContent] = React.useState(() => buildContent(cartContext, fingerprint, true));

  React.useEffect(() => {
    if (open) setContent(buildContent(cartContext, fingerprint, true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fingerprint]);

  // Padrão fixo: 3 bullets com estrela + 1 com bolinha (último).
  const STAR_COUNT = 3;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-xl p-7 sm:p-8">
        <AlertDialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Heart className="h-8 w-8" />
          </div>
          <AlertDialogTitle className="text-2xl leading-tight">{content.title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 text-base">
              <p className="text-base leading-relaxed">{content.intro}</p>

              <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-left text-foreground">
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-primary">
                  <Sparkles className="h-4 w-4" />
                  O que faz parte do seu combo:
                </div>
                <ul className="space-y-2.5 text-base">
                  {content.losses.map((loss, i) => (
                    <li key={i} className="flex items-start gap-2.5 leading-snug">
                      <span className="mt-2 inline-block h-2 w-2 shrink-0 rounded-full bg-primary" />
                      <span>{loss}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-3 flex-col gap-2.5 sm:flex-col sm:space-x-0">
          <AlertDialogCancel className="m-0 h-12 w-full border-primary bg-primary text-base font-semibold text-primary-foreground shadow-md hover:bg-primary/90 hover:text-primary-foreground">
            ✅ Manter meu combo
          </AlertDialogCancel>
          {onChangePlan && (
            <AlertDialogCancel
              onClick={onChangePlan}
              className="m-0 h-12 w-full border-primary/40 bg-background text-base font-semibold text-primary hover:bg-primary/5 hover:text-primary"
            >
              <RefreshCw className="mr-1.5 h-4 w-4" />
              Trocar de plano
            </AlertDialogCancel>
          )}
          <AlertDialogAction
            onClick={onConfirm}
            className="m-0 h-10 w-full border-none bg-transparent text-sm font-normal text-muted-foreground underline-offset-2 shadow-none hover:bg-transparent hover:text-destructive hover:underline"
          >
            Remover fibra e limpar pedido
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function buildContent(
  ctx: FiberRemoveCartContext | undefined,
  fingerprint: string,
  randomizeTitle: boolean,
): { title: string; intro: string; losses: string[] } {
  // Sempre randomiza no abrir — variedade total de título e bullets.
  const seed = Math.floor(Math.random() * 1_000_000);
  const titleIdx = seed % TITLE_VARIATIONS.length;
  const { title, intro } = TITLE_VARIATIONS[titleIdx];

  // Sempre 4 bullets emocionais aleatórios, 1 por eixo (variedade temática).
  const losses = pickEmotionalAcrossAxes(4);
  return { title, intro, losses };
}

