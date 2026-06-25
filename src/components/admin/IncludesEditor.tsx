import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AVAILABLE_ICONS, PlanIncludeIcon } from "@/components/shop/PlanIncludeIcon";
import { Plus, Trash2, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export type IncludeItem = { icon: string; text: string };

type InternalItem = IncludeItem & { _id: string };

let _nextId = 1;
const uid = () => `inc_${_nextId++}_${Math.random().toString(36).slice(2, 6)}`;

interface IncludesEditorProps {
  value: IncludeItem[];
  onChange: (items: IncludeItem[]) => void;
}

function SortableIncludeItem({
  id,
  item,
  onUpdate,
  onRemove,
}: {
  id: string;
  item: IncludeItem;
  onUpdate: (patch: Partial<IncludeItem>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2">
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground touch-none"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Select value={item.icon} onValueChange={(v) => onUpdate({ icon: v })}>
        <SelectTrigger className="w-[120px] shrink-0">
          <div className="flex items-center gap-1.5">
            <PlanIncludeIcon icon={item.icon} className="h-3.5 w-3.5" />
            <span className="truncate text-xs">{item.icon}</span>
          </div>
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {AVAILABLE_ICONS.map((ic) => (
            <SelectItem key={ic} value={ic}>
              <div className="flex items-center gap-2">
                <PlanIncludeIcon icon={ic} className="h-3.5 w-3.5" />
                <span className="text-xs">{ic}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        className="flex-1"
        value={item.text}
        onChange={(e) => onUpdate({ text: e.target.value })}
        placeholder="Ex: Wi-Fi de alta performance"
      />
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 hover:bg-destructive/10" onClick={onRemove}>
        <Trash2 className="h-3.5 w-3.5 text-destructive" />
      </Button>
    </div>
  );
}

export function IncludesEditor({ value, onChange }: IncludesEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  // Maintain stable internal items with persistent _id
  const internalsRef = React.useRef<InternalItem[]>([]);

  const internals = React.useMemo(() => {
    const prev = internalsRef.current;
    // If lengths match and data matches, reuse prev ids
    if (prev.length === value.length && value.every((v, i) => prev[i].icon === v.icon && prev[i].text === v.text)) {
      return prev;
    }
    // Try to match by keeping existing ids for unchanged positions, assign new for extras
    const result: InternalItem[] = value.map((v, i) => {
      if (i < prev.length) {
        return { ...v, _id: prev[i]._id };
      }
      return { ...v, _id: uid() };
    });
    internalsRef.current = result;
    return result;
  }, [value]);

  const ids = React.useMemo(() => internals.map((it) => it._id), [internals]);

  const addItem = () => {
    const newItem: InternalItem = { icon: "check", text: "", _id: uid() };
    internalsRef.current = [...internals, newItem];
    onChange([...value, { icon: "check", text: "" }]);
  };

  const updateItem = (idx: number, patch: Partial<IncludeItem>) => {
    const next = value.map((item, i) => (i === idx ? { ...item, ...patch } : item));
    // Update internals ref to keep _id stable
    internalsRef.current = internalsRef.current.map((item, i) => (i === idx ? { ...item, ...patch } : item));
    onChange(next);
  };

  const removeItem = (idx: number) => {
    internalsRef.current = internalsRef.current.filter((_, i) => i !== idx);
    onChange(value.filter((_, i) => i !== idx));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    internalsRef.current = arrayMove(internalsRef.current, oldIndex, newIndex);
    onChange(arrayMove(value, oldIndex, newIndex));
  };

  return (
    <div className="space-y-2">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {internals.map((item, idx) => (
            <SortableIncludeItem
              key={item._id}
              id={item._id}
              item={item}
              onUpdate={(patch) => updateItem(idx, patch)}
              onRemove={() => removeItem(idx)}
            />
          ))}
        </SortableContext>
      </DndContext>
      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addItem}>
        <Plus className="h-3.5 w-3.5" /> Adicionar item
      </Button>
    </div>
  );
}
