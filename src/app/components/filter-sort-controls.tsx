import { ArrowDownNarrowWide, ArrowUpWideNarrow, X } from "lucide-react";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export interface SortOption {
  value: string;
  label: string;
}

interface FilterSortControlsProps {
  type: "request" | "order";
  totalCount: number;
  filterValue: string;
  onFilterChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  sortDirection: "asc" | "desc";
  onSortDirectionChange: (direction: "asc" | "desc") => void;
  sortOptions: SortOption[];
}

export function FilterSortControls({
  type,
  totalCount,
  filterValue,
  onFilterChange,
  sortBy,
  onSortChange,
  sortDirection,
  onSortDirectionChange,
  sortOptions,
}: FilterSortControlsProps) {
  const label = type === "request" ? "Request No" : "Order No";
  const itemName = type === "request" ? "requests" : "orders";

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      {/* Total - left aligned, grows to push filter and sort to the right on desktop */}
      <p className="text-gray-600 text-xs sm:text-sm whitespace-nowrap sm:flex-grow">
        Total: {totalCount} {itemName}
      </p>

      {/* Filter box - takes remaining space on mobile, fixed width on desktop */}
      <div className="flex-1 sm:flex-none relative min-w-[150px] sm:min-w-0 sm:w-52">
        <Input
          placeholder={`Filter by ${label}...`}
          value={filterValue}
          onChange={(e) => onFilterChange(e.target.value)}
          className="h-8 sm:h-9 pr-8 text-xs sm:text-sm"
        />
        {filterValue && (
          <button
            onClick={() => onFilterChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        )}
      </div>

      {/* Sort controls - wraps to next line on mobile if needed, grouped with filter on desktop */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <label className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
          Sort by {sortDirection === "asc" ? "(Asc)" : "(Desc)"}:
        </label>
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="h-8 sm:h-9 w-36 sm:w-48 text-xs sm:text-sm">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          onClick={() =>
            onSortDirectionChange(sortDirection === "asc" ? "desc" : "asc")
          }
          className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center border rounded-md hover:bg-gray-100 transition-colors"
          title={sortDirection === "asc" ? "Ascending" : "Descending"}
        >
          {sortDirection === "asc" ? (
            <ArrowUpWideNarrow className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          ) : (
            <ArrowDownNarrowWide className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
