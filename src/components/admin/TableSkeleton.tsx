import { TableRow, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
  columns: number;
  rows?: number;
}

export function TableSkeleton({ columns, rows = 5 }: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <TableRow key={r} className="hover:bg-transparent">
          {Array.from({ length: columns }).map((_, c) => (
            <TableCell key={c}>
              <Skeleton
                className={
                  c === 0
                    ? "h-4 w-3/4"
                    : c === columns - 1
                    ? "h-7 w-16"
                    : "h-4 w-20"
                }
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
