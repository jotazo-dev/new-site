import { useState } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Plus, Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { type Block, type BlockType, BLOCK_LABELS, makeBlock, TEMPLATES } from "./templates";
import { renderBlocksToHtml } from "./renderBlocksToHtml";

interface Props {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
}

const BLOCK_TYPES: BlockType[] = ["header", "text", "image", "button", "divider", "spacer", "columns2", "footer"];

export default function BlockBuilder({ blocks, onChange }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const selected = blocks.find((b) => b.id === selectedId) || null;

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = blocks.findIndex((b) => b.id === active.id);
    const newIdx = blocks.findIndex((b) => b.id === over.id);
    onChange(arrayMove(blocks, oldIdx, newIdx));
  }

  function addBlock(t: BlockType) {
    const b = makeBlock(t);
    onChange([...blocks, b]);
    setSelectedId(b.id);
  }

  function removeBlock(id: string) {
    onChange(blocks.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function updateBlock(id: string, patch: any) {
    onChange(blocks.map((b) => (b.id === id ? { ...b, props: { ...b.props, ...patch } } : b)));
  }

  function applyTemplate(id: string) {
    const tpl = TEMPLATES.find((t) => t.id === id);
    if (!tpl) return;
    if (blocks.length > 0 && !confirm("Substituir o conteúdo atual pelo template?")) return;
    const next = tpl.blocks();
    onChange(next);
    setSelectedId(next[0]?.id || null);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_280px] gap-3 min-h-[500px]">
      {/* Esquerda: lista de blocos */}
      <div className="border rounded-md bg-card p-2 flex flex-col gap-2">
        <div className="flex items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline" className="w-full gap-1"><Plus className="w-3 h-3" /> Bloco</Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-1" align="start">
              {BLOCK_TYPES.map((t) => (
                <button key={t} onClick={() => addBlock(t)} className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent">
                  {BLOCK_LABELS[t]}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button size="sm" variant="ghost" className="w-full">Templates</Button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-1" align="start">
            {TEMPLATES.map((t) => (
              <button key={t.id} onClick={() => applyTemplate(t.id)} className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent">
                {t.name}
              </button>
            ))}
          </PopoverContent>
        </Popover>
        <div className="border-t my-1" />
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-1 overflow-auto max-h-[480px] pr-1">
              {blocks.map((b) => (
                <SortableItem
                  key={b.id}
                  id={b.id}
                  label={BLOCK_LABELS[b.type]}
                  selected={b.id === selectedId}
                  onSelect={() => setSelectedId(b.id)}
                  onRemove={() => removeBlock(b.id)}
                />
              ))}
              {blocks.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-6">Adicione blocos ou um template.</div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Centro: preview */}
      <div className="border rounded-md bg-muted/30 flex flex-col">
        <div className="flex items-center justify-end gap-1 p-2 border-b">
          <Button size="sm" variant={device === "desktop" ? "secondary" : "ghost"} onClick={() => setDevice("desktop")}><Monitor className="w-4 h-4" /></Button>
          <Button size="sm" variant={device === "mobile" ? "secondary" : "ghost"} onClick={() => setDevice("mobile")}><Smartphone className="w-4 h-4" /></Button>
        </div>
        <div className="flex-1 overflow-auto p-4 flex justify-center">
          <iframe
            title="preview"
            srcDoc={renderBlocksToHtml(blocks)}
            style={{ width: device === "mobile" ? 375 : 640, height: 600, border: "0", background: "#fff", borderRadius: 8 }}
          />
        </div>
      </div>

      {/* Direita: inspetor */}
      <div className="border rounded-md bg-card p-3 overflow-auto max-h-[640px]">
        {!selected ? (
          <div className="text-xs text-muted-foreground">Selecione um bloco para editar.</div>
        ) : (
          <Inspector block={selected} onUpdate={(p) => updateBlock(selected.id, p)} />
        )}
      </div>
    </div>
  );
}

function SortableItem({ id, label, selected, onSelect, onRemove }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className={`flex items-center gap-1 rounded-md px-1.5 py-1 text-sm cursor-pointer ${selected ? "bg-primary/10 ring-1 ring-primary" : "hover:bg-accent"}`}
      onClick={onSelect}
    >
      <button {...attributes} {...listeners} className="cursor-grab touch-none p-0.5 text-muted-foreground" onClick={(e) => e.stopPropagation()}>
        <GripVertical className="w-3.5 h-3.5" />
      </button>
      <span className="flex-1 truncate">{label}</span>
      <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="p-0.5 text-muted-foreground hover:text-destructive">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function Field({ label, children }: any) {
  return (
    <label className="block mb-2">
      <span className="text-xs text-muted-foreground mb-1 block">{label}</span>
      {children}
    </label>
  );
}

function Inspector({ block, onUpdate }: { block: Block; onUpdate: (p: any) => void }) {
  const p: any = block.props;
  const color = (k: string) => (
    <input type="color" value={p[k]} onChange={(e) => onUpdate({ [k]: e.target.value })} className="w-full h-9 rounded border bg-background" />
  );
  switch (block.type) {
    case "header":
      return (<>
        <Field label="Título"><Input value={p.title} onChange={(e) => onUpdate({ title: e.target.value })} /></Field>
        <Field label="URL do logo"><Input value={p.logoUrl} onChange={(e) => onUpdate({ logoUrl: e.target.value })} /></Field>
        <Field label="Fundo">{color("bg")}</Field>
        <Field label="Cor do texto">{color("color")}</Field>
      </>);
    case "text":
      return (<>
        <Field label="Conteúdo (HTML)"><Textarea rows={6} value={p.html} onChange={(e) => onUpdate({ html: e.target.value })} /></Field>
        <Field label="Alinhamento">
          <select className="w-full h-9 rounded border bg-background px-2 text-sm" value={p.align} onChange={(e) => onUpdate({ align: e.target.value })}>
            <option value="left">Esquerda</option><option value="center">Centro</option><option value="right">Direita</option>
          </select>
        </Field>
        <Field label="Cor">{color("color")}</Field>
      </>);
    case "image":
      return (<>
        <Field label="URL"><Input value={p.url} onChange={(e) => onUpdate({ url: e.target.value })} /></Field>
        <Field label="Texto alternativo"><Input value={p.alt} onChange={(e) => onUpdate({ alt: e.target.value })} /></Field>
        <Field label="Largura (px)"><Input type="number" value={p.width} onChange={(e) => onUpdate({ width: Number(e.target.value) })} /></Field>
        <Field label="Alinhamento">
          <select className="w-full h-9 rounded border bg-background px-2 text-sm" value={p.align} onChange={(e) => onUpdate({ align: e.target.value })}>
            <option value="left">Esquerda</option><option value="center">Centro</option><option value="right">Direita</option>
          </select>
        </Field>
      </>);
    case "button":
      return (<>
        <Field label="Texto"><Input value={p.label} onChange={(e) => onUpdate({ label: e.target.value })} /></Field>
        <Field label="URL"><Input value={p.url} onChange={(e) => onUpdate({ url: e.target.value })} /></Field>
        <Field label="Fundo">{color("bg")}</Field>
        <Field label="Cor">{color("color")}</Field>
        <Field label="Alinhamento">
          <select className="w-full h-9 rounded border bg-background px-2 text-sm" value={p.align} onChange={(e) => onUpdate({ align: e.target.value })}>
            <option value="left">Esquerda</option><option value="center">Centro</option><option value="right">Direita</option>
          </select>
        </Field>
      </>);
    case "divider":
      return (<Field label="Cor">{color("color")}</Field>);
    case "spacer":
      return (<Field label="Altura (px)"><Input type="number" value={p.height} onChange={(e) => onUpdate({ height: Number(e.target.value) })} /></Field>);
    case "columns2":
      return (<>
        <Field label="Coluna esquerda (HTML)"><Textarea rows={4} value={p.leftHtml} onChange={(e) => onUpdate({ leftHtml: e.target.value })} /></Field>
        <Field label="Coluna direita (HTML)"><Textarea rows={4} value={p.rightHtml} onChange={(e) => onUpdate({ rightHtml: e.target.value })} /></Field>
      </>);
    case "footer":
      return (<>
        <Field label="Texto"><Textarea rows={3} value={p.text} onChange={(e) => onUpdate({ text: e.target.value })} /></Field>
        <Field label="Cor">{color("color")}</Field>
      </>);
  }
}
