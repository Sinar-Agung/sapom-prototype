import {
  ArrowDownNarrowWide,
  ArrowUpWideNarrow,
  ChevronDown,
  X,
} from "lucide-react";
import { RefObject, useState } from "react";
import { Checkbox } from "./ui/checkbox";
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
  disabled?: boolean;
}

interface FilterSortControlsProps {
  type: "request" | "order" | "notification";
  totalCount: number;
  displayedCount?: number;
  filterValue: string;
  onFilterChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  sortDirection: "asc" | "desc";
  onSortDirectionChange: (direction: "asc" | "desc") => void;
  sortOptions: SortOption[];
  searchInputRef?: RefObject<HTMLInputElement>;
  statusFilter?: string[];
  onStatusFilterChange?: (values: string[]) => void;
  statusOptions?: SortOption[];
  branchFilter?: string[];
  onBranchFilterChange?: (values: string[]) => void;
  branchOptions?: SortOption[];
  eventTypeFilter?: string[];
  onEventTypeFilterChange?: (values: string[]) => void;
  eventTypeOptions?: SortOption[];
  kadarFilter?: string[];
  onKadarFilterChange?: (values: string[]) => void;
  kadarOptions?: SortOption[];
}

export function FilterSortControls({
  type,
  totalCount,
  displayedCount,
  filterValue,
  onFilterChange,
  sortBy,
  onSortChange,
  sortDirection,
  onSortDirectionChange,
  sortOptions,
  searchInputRef,
  statusFilter = [],
  onStatusFilterChange,
  statusOptions,
  branchFilter = [],
  onBranchFilterChange,
  branchOptions,
  eventTypeFilter = [],
  onEventTypeFilterChange,
  eventTypeOptions,
  kadarFilter = [],
  onKadarFilterChange,
  kadarOptions,
}: FilterSortControlsProps) {
  const [statusOpen, setStatusOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [eventTypeOpen, setEventTypeOpen] = useState(false);
  const [kadarOpen, setKadarOpen] = useState(false);
  const itemName =
    type === "request"
      ? "requests"
      : type === "order"
        ? "orders"
        : "notifications";

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      {/* Total - left aligned, grows to push filter and sort to the right on desktop */}
      <p className="text-gray-600 text-xs sm:text-sm whitespace-nowrap sm:flex-grow">
        {displayedCount !== undefined
          ? `Displaying: ${displayedCount} of total ${totalCount} ${itemName}`
          : `Total: ${totalCount} ${itemName}`}
      </p>

      {/* Filter box - takes remaining space on mobile, fixed width on desktop */}
      <div className="flex-1 sm:flex-none relative min-w-[150px] sm:min-w-0 sm:w-52">
        <Input
          ref={searchInputRef}
          placeholder="Search"
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

      {/* Status filter multi-select - shown only when statusOptions provided */}
      {statusOptions && statusOptions.length > 0 && onStatusFilterChange && (
        <div className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setStatusOpen((o) => !o)}
            className={`h-8 sm:h-9 flex items-center gap-1.5 px-3 border rounded-md text-xs sm:text-sm bg-white transition-colors ${
              statusFilter.length > 0
                ? "border-blue-400 bg-blue-50 text-blue-700"
                : "border-input text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span className="whitespace-nowrap">
              {statusFilter.length === 0
                ? "All Statuses"
                : statusFilter.length === 1
                  ? statusFilter[0]
                  : `${statusFilter.length} statuses`}
            </span>
            {statusFilter.length > 0 ? (
              <X
                className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusFilterChange([]);
                }}
              />
            ) : (
              <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
            )}
          </button>
          {statusOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setStatusOpen(false)}
              />
              <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-md shadow-lg min-w-[180px] max-h-72 overflow-y-auto">
                {statusOptions.map((opt) => {
                  const checked = statusFilter.includes(opt.value);
                  return (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm ${
                        opt.disabled
                          ? "opacity-40 cursor-not-allowed"
                          : "hover:bg-gray-50 cursor-pointer"
                      }`}
                    >
                      <Checkbox
                        checked={checked}
                        disabled={opt.disabled}
                        onCheckedChange={(c) => {
                          if (opt.disabled) return;
                          if (c) {
                            onStatusFilterChange([...statusFilter, opt.value]);
                          } else {
                            onStatusFilterChange(
                              statusFilter.filter((s) => s !== opt.value),
                            );
                          }
                        }}
                      />
                      <span>{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Branch filter multi-select - shown only when branchOptions provided */}
      {branchOptions && branchOptions.length > 0 && onBranchFilterChange && (
        <div className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setBranchOpen((o) => !o)}
            className={`h-8 sm:h-9 flex items-center gap-1.5 px-3 border rounded-md text-xs sm:text-sm bg-white transition-colors ${
              branchFilter.length > 0
                ? "border-blue-400 bg-blue-50 text-blue-700"
                : "border-input text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span className="whitespace-nowrap">
              {branchFilter.length === 0
                ? "All Branches"
                : branchFilter.length === 1
                  ? (branchOptions.find((b) => b.value === branchFilter[0])
                      ?.label ?? branchFilter[0])
                  : `${branchFilter.length} branches`}
            </span>
            {branchFilter.length > 0 ? (
              <X
                className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onBranchFilterChange([]);
                }}
              />
            ) : (
              <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
            )}
          </button>
          {branchOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setBranchOpen(false)}
              />
              <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-md shadow-lg min-w-[160px] max-h-72 overflow-y-auto">
                {branchOptions.map((opt) => {
                  const checked = branchFilter.includes(opt.value);
                  return (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm ${
                        opt.disabled
                          ? "opacity-40 cursor-not-allowed"
                          : "hover:bg-gray-50 cursor-pointer"
                      }`}
                    >
                      <Checkbox
                        checked={checked}
                        disabled={opt.disabled}
                        onCheckedChange={(c) => {
                          if (opt.disabled) return;
                          if (c) {
                            onBranchFilterChange([...branchFilter, opt.value]);
                          } else {
                            onBranchFilterChange(
                              branchFilter.filter((s) => s !== opt.value),
                            );
                          }
                        }}
                      />
                      <span>{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Event type filter multi-select - shown only when eventTypeOptions provided */}
      {eventTypeOptions &&
        eventTypeOptions.length > 0 &&
        onEventTypeFilterChange && (
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setEventTypeOpen((o) => !o)}
              className={`h-8 sm:h-9 flex items-center gap-1.5 px-3 border rounded-md text-xs sm:text-sm bg-white transition-colors ${
                eventTypeFilter.length > 0
                  ? "border-blue-400 bg-blue-50 text-blue-700"
                  : "border-input text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="whitespace-nowrap">
                {eventTypeFilter.length === 0
                  ? "All Types"
                  : eventTypeFilter.length === 1
                    ? (eventTypeOptions.find(
                        (t) => t.value === eventTypeFilter[0],
                      )?.label ?? eventTypeFilter[0])
                    : `${eventTypeFilter.length} types`}
              </span>
              {eventTypeFilter.length > 0 ? (
                <X
                  className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventTypeFilterChange([]);
                  }}
                />
              ) : (
                <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
              )}
            </button>
            {eventTypeOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setEventTypeOpen(false)}
                />
                <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-md shadow-lg min-w-[200px] max-h-72 overflow-y-auto">
                  {eventTypeOptions.map((opt) => {
                    const checked = eventTypeFilter.includes(opt.value);
                    return (
                      <label
                        key={opt.value}
                        className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-xs sm:text-sm"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(c) => {
                            if (c) {
                              onEventTypeFilterChange([
                                ...eventTypeFilter,
                                opt.value,
                              ]);
                            } else {
                              onEventTypeFilterChange(
                                eventTypeFilter.filter((s) => s !== opt.value),
                              );
                            }
                          }}
                        />
                        <span>{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

      {/* Kadar filter multi-select */}
      {kadarOptions && kadarOptions.length > 0 && onKadarFilterChange && (
        <div className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setKadarOpen((o) => !o)}
            className={`h-8 sm:h-9 flex items-center gap-1.5 px-3 border rounded-md text-xs sm:text-sm bg-white transition-colors ${
              kadarFilter.length > 0
                ? "border-blue-400 bg-blue-50 text-blue-700"
                : "border-input text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span className="whitespace-nowrap">
              {kadarFilter.length === 0
                ? "All Kadar"
                : kadarFilter.length === 1
                  ? (kadarOptions.find((k) => k.value === kadarFilter[0])
                      ?.label ?? kadarFilter[0])
                  : `${kadarFilter.length} kadar`}
            </span>
            {kadarFilter.length > 0 ? (
              <X
                className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onKadarFilterChange([]);
                }}
              />
            ) : (
              <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
            )}
          </button>
          {kadarOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setKadarOpen(false)}
              />
              <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-md shadow-lg min-w-[140px] max-h-72 overflow-y-auto">
                {kadarOptions.map((opt) => {
                  const checked = kadarFilter.includes(opt.value);
                  return (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm ${
                        opt.disabled
                          ? "opacity-40 cursor-not-allowed"
                          : "hover:bg-gray-50 cursor-pointer"
                      }`}
                    >
                      <Checkbox
                        checked={checked}
                        disabled={opt.disabled}
                        onCheckedChange={(c) => {
                          if (opt.disabled) return;
                          if (c) {
                            onKadarFilterChange([...kadarFilter, opt.value]);
                          } else {
                            onKadarFilterChange(
                              kadarFilter.filter((s) => s !== opt.value),
                            );
                          }
                        }}
                      />
                      <span>{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Sort controls - wraps to next line on mobile if needed, grouped with filter on desktop */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <label className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
          Sort by:
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
          className={`h-8 sm:h-9 flex items-center justify-center gap-1 px-2 border rounded-md transition-colors text-xs sm:text-sm font-medium ${
            sortDirection === "desc"
              ? "bg-blue-50 text-blue-700 border-blue-400 hover:bg-blue-100"
              : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
          }`}
          title={
            sortDirection === "asc"
              ? "Ascending — click to switch to Descending"
              : "Descending — click to switch to Ascending"
          }
        >
          {sortDirection === "asc" ? (
            <ArrowUpWideNarrow className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          ) : (
            <ArrowDownNarrowWide className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          )}
          <span>{sortDirection === "asc" ? "Asc" : "Desc"}</span>
        </button>
      </div>
    </div>
  );
}
