import { ArrowDown, ArrowUp, X } from "lucide-react";
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
    <div className="flex items-center justify-between">
      <p className="text-gray-600 text-sm">
        Total: {totalCount} {itemName}
      </p>
      <div className="flex gap-6 items-center">
        <div className="w-52 relative">
          <Input
            placeholder={`Filter by ${label}...`}
            value={filterValue}
            onChange={(e) => onFilterChange(e.target.value)}
            className="h-9 pr-8"
          />
          {filterValue && (
            <button
              onClick={() => onFilterChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 whitespace-nowrap">
            Sort by
          </label>
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="h-9 w-48">
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
            className="h-9 w-9 flex items-center justify-center border rounded-md hover:bg-gray-100 transition-colors"
            title={sortDirection === "asc" ? "Ascending" : "Descending"}
          >
            {sortDirection === "asc" ? (
              <ArrowDown className="w-4 h-4" />
            ) : (
              <ArrowUp className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
