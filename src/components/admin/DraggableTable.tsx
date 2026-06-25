import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableSkeleton } from "@/components/admin/TableSkeleton";
import { GripVertical, PackageOpen } from "lucide-react";
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

export function SortableRow({ id, justDropped, children }: { id: string; justDropped?: boolean; children: (props: { dragHandle: React.ReactNode; style: React.CSSProperties; ref: (node: HTMLElement | null) => void }) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative",
    zIndex: isDragging ? 10 : undefined,
  };
  const dragHandle = (
    <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground touch-none">
      <GripVertical className="h-4 w-4" />
    </button>
  );
  return <>{children({ dragHandle, style, ref: setNodeRef })}</>;
}

export function DraggableTable({
  data,
  isLoading,
  columns,
  renderRow,
  colSpan,
  onReorder,
  emptyMessage = "Nenhum item cadastrado.",
  emptyIcon: EmptyIcon,
}: {
  data: any[];
  isLoading: boolean;
  columns: string[];
  renderRow: (item: any, dragHandle: React.ReactNode) => React.ReactNode;
  colSpan: number;
  onReorder: (items: { id: string; sort_order: number }[]) => void;
  emptyMessage?: string;
  emptyIcon?: React.ComponentType<{ className?: string }>;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const [droppedId, setDroppedId] = React.useState<string | null>(null);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = data.findIndex((d) => d.id === active.id);
    const newIndex = data.findIndex((d) => d.id === over.id);
    const reordered = arrayMove(data, oldIndex, newIndex);
    const updates = reordered.map((item, i) => ({ id: item.id, sort_order: i }));
    setDroppedId(active.id as string);
    setTimeout(() => setDroppedId(null), 600);
    onReorder(updates);
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-10"></TableHead>
            {columns.map((c) => <TableHead key={c} className="font-semibold">{c}</TableHead>)}
            <TableHead className="w-24 font-semibold">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={data.map((d) => d.id)} strategy={verticalListSortingStrategy}>
            <TableBody>
              {isLoading ? (
                <TableSkeleton columns={colSpan + 2} />
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colSpan + 2} className="h-40">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground animate-fade-in">
                      {EmptyIcon ? <EmptyIcon className="h-10 w-10 opacity-30" /> : <PackageOpen className="h-10 w-10 opacity-30" />}
                      <p className="text-sm font-medium">{emptyMessage}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.map((item) => (
                <SortableRow key={item.id} id={item.id} justDropped={droppedId === item.id}>
                  {({ dragHandle, style, ref }) => (
                    <TableRow
                      ref={ref}
                      style={style}
                      className={`hover:bg-muted/30 transition-all duration-300 ${droppedId === item.id ? "bg-primary/10 ring-1 ring-primary/30 animate-scale-in" : ""}`}
                    >
                      <TableCell className="w-10">{dragHandle}</TableCell>
                      {renderRow(item, dragHandle)}
                    </TableRow>
                  )}
                </SortableRow>
              ))}
            </TableBody>
          </SortableContext>
        </DndContext>
      </Table>
    </div>
  );
}
