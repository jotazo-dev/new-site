import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { WHATSAPP } from "@/config/site";

export const GAMER_FAQ: { q: string; a: string }[] = [
  {
    q: "Qual a diferença entre o plano gamer e o plano residencial?",
    a: "Os planos gamer da Jotazo priorizam baixa latência e estabilidade, com fibra simétrica de 1Gbps+, Wi-Fi 6 incluso e roteamento otimizado para os principais servidores de jogos do Brasil.",
  },
  {
    q: "O ping vai realmente ficar abaixo de 20ms?",
    a: "Na maior parte do Brasil sim, especialmente em jogos com servidores em São Paulo. O ping final depende da sua distância até o servidor do jogo e da carga da rede no momento.",
  },
  {
    q: "Wi-Fi ou cabo: qual é melhor pra jogar?",
    a: "Cabo é sempre superior em latência e jitter. Mas com o Wi-Fi 6 que entregamos, jogar sem fio passa a ser perfeitamente viável para a maioria dos títulos competitivos.",
  },
  {
    q: "Funciona em Xbox, PlayStation e Nintendo Switch?",
    a: "Sim. Nossa rede é compatível com NAT aberto e suporta todas as plataformas de console e PC, com suporte completo a IPv6.",
  },
  {
    q: "Tem fidelidade?",
    a: "Os planos seguem as mesmas condições padrão de fidelidade da Jotazo. Fale com nosso time pelo WhatsApp para conhecer todas as opções.",
  },
  {
    q: "Como faço pra contratar?",
    a: "Escolha um dos planos acima e siga o fluxo de checkout, ou fale direto com nosso time pelo WhatsApp para uma consultoria gamer personalizada.",
  },
];

const waLink = `https://api.whatsapp.com/send?phone=${WHATSAPP.number.replace(/\D/g, "")}&text=${encodeURIComponent(
  "🎮 Olá! Tenho dúvidas sobre a Internet Gamer da Jotazo.",
)}`;

export function GamerFAQ() {
  return (
    <section className="space-y-10">
      <div className="space-y-2 text-center">
        <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
          Perguntas frequentes
        </h2>
        <p className="mx-auto max-w-xl text-muted-foreground">
          Tudo o que você precisa saber antes de migrar pra Internet Gamer Jotazo.
        </p>
      </div>

      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-2 md:p-4">
        <Accordion type="single" collapsible className="w-full">
          {GAMER_FAQ.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-border">
              <AccordionTrigger className="px-4 text-left text-base font-semibold text-foreground hover:text-accent">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="px-4 text-sm leading-relaxed text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <div className="flex justify-center">
        <Button
          asChild
          size="lg"
          className="bg-[#25D366] text-white hover:bg-[#20bd5a] shadow-[0_0_60px_-12px_#25D366]"
        >
          <a href={waLink} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="mr-2 h-4 w-4" /> Falar com um especialista
          </a>
        </Button>
      </div>
    </section>
  );
}
