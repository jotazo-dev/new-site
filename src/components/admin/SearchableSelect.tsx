import { useState, type ReactNode } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type SearchableOption = {
  value: string;
  label: string;
  hint?: string;
  searchText?: string;
};

interface Props {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  options: SearchableOption[];
  placeholder?: string;
  emptyText?: string;
  searchPlaceholder?: string;
  className?: string;
  width?: string;
  allowClear?: boolean;
  renderItem?: (opt: SearchableOption) => ReactNode;
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Selecione...",
  emptyText = "Nenhum resultado.",
  searchPlaceholder = "Buscar...",
  className,
  width = "w-80",
  allowClear = false,
  renderItem,
}: Props) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value) || null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(width, "justify-between font-normal", className)}
        >
          <span className="truncate text-left">
            {selected ? (
              <>
                {selected.hint && (
                  <span className="font-mono text-xs mr-2 text-muted-foreground">{selected.hint}</span>
                )}
                {selected.label}
              </>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn(width, "p-0")} align="start">
        <Command
          filter={(val, search) => {
            const opt = options.find((o) => o.value === val);
            const hay = `${opt?.label || ""} ${opt?.hint || ""} ${opt?.searchText || ""}`.toLowerCase();
            return hay.includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {allowClear && (
                <CommandItem
                  value="__clear__"
                  onSelect={() => { onChange(null); setOpen(false); }}
                  className="text-muted-foreground"
                >
                  <X className="mr-2 h-4 w-4" /> Limpar seleção
                </CommandItem>
              )}
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.value}
                  onSelect={() => { onChange(opt.value); setOpen(false); }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === opt.value ? "opacity-100" : "opacity-0")} />
                  {renderItem ? renderItem(opt) : (
                    <span className="truncate">
                      {opt.hint && <span className="font-mono text-xs mr-2 text-muted-foreground">{opt.hint}</span>}
                      {opt.label}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
