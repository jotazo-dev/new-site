export type Block =
  | { id: string; type: "header"; props: { logoUrl?: string; title: string; bg: string; color: string } }
  | { id: string; type: "text"; props: { html: string; align: "left" | "center" | "right"; color: string } }
  | { id: string; type: "image"; props: { url: string; alt: string; align: "left" | "center" | "right"; width: number } }
  | { id: string; type: "button"; props: { label: string; url: string; bg: string; color: string; align: "left" | "center" | "right" } }
  | { id: string; type: "divider"; props: { color: string } }
  | { id: string; type: "spacer"; props: { height: number } }
  | { id: string; type: "columns2"; props: { leftHtml: string; rightHtml: string } }
  | { id: string; type: "footer"; props: { text: string; color: string } };

export type BlockType = Block["type"];

export const BLOCK_LABELS: Record<BlockType, string> = {
  header: "Cabeçalho",
  text: "Texto",
  image: "Imagem",
  button: "Botão",
  divider: "Divisor",
  spacer: "Espaço",
  columns2: "2 Colunas",
  footer: "Rodapé",
};

let _id = 0;
export const newId = () => `b_${Date.now()}_${++_id}`;

export function makeBlock(type: BlockType): Block {
  switch (type) {
    case "header":
      return { id: newId(), type, props: { logoUrl: "", title: "Sua mensagem", bg: "#0F172A", color: "#FFFFFF" } };
    case "text":
      return { id: newId(), type, props: { html: "<p>Escreva seu texto aqui…</p>", align: "left", color: "#0F172A" } };
    case "image":
      return { id: newId(), type, props: { url: "https://placehold.co/600x300", alt: "", align: "center", width: 600 } };
    case "button":
      return { id: newId(), type, props: { label: "Saiba mais", url: "https://", bg: "#2563EB", color: "#FFFFFF", align: "center" } };
    case "divider":
      return { id: newId(), type, props: { color: "#E5E7EB" } };
    case "spacer":
      return { id: newId(), type, props: { height: 24 } };
    case "columns2":
      return { id: newId(), type, props: { leftHtml: "<p>Coluna esquerda</p>", rightHtml: "<p>Coluna direita</p>" } };
    case "footer":
      return { id: newId(), type, props: { text: "Você está recebendo este e-mail porque é cliente Jotazo.", color: "#94A3B8" } };
  }
}

export const TEMPLATES: { id: string; name: string; blocks: () => Block[] }[] = [
  { id: "blank", name: "Em branco", blocks: () => [makeBlock("text")] },
  {
    id: "newsletter",
    name: "Newsletter",
    blocks: () => [
      makeBlock("header"),
      makeBlock("text"),
      makeBlock("button"),
      makeBlock("divider"),
      makeBlock("footer"),
    ],
  },
  {
    id: "promo",
    name: "Promoção",
    blocks: () => [
      makeBlock("header"),
      makeBlock("image"),
      makeBlock("text"),
      makeBlock("button"),
      makeBlock("divider"),
      makeBlock("footer"),
    ],
  },
];
