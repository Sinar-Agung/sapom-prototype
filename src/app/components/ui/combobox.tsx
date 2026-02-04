import * as React from "react";
import Fuse from "fuse.js";
import { Check, ChevronsUpDown, X, AlertCircle } from "lucide-react";
import { cn } from "./utils";
import { Button } from "./button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  popoverContentClassName?: string;
  searchPlaceholder?: string;
  allowCustomValue?: boolean;
  autoOpenOnFocus?: boolean;
  error?: boolean;
  disabled?: boolean;
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  emptyMessage = "No option found.",
  className,
  popoverContentClassName,
  searchPlaceholder = "Search...",
  allowCustomValue = true,
  autoOpenOnFocus = false,
  error = false,
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const [highlightedValue, setHighlightedValue] = React.useState("");
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const highlightedValueRef = React.useRef("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  // Create fuzzy search instance
  const fuse = React.useMemo(() => {
    return new Fuse(options, {
      keys: ["label", "value"],
      threshold: 0.4, // More lenient for fuzzy matching
      ignoreLocation: true,
      distance: 100,
    });
  }, [options]);

  // Check if search term matches as a subsequence (e.g., "klg" matches "Kalung")
  const matchesSubsequence = (text: string, search: string): boolean => {
    const textLower = text.toLowerCase();
    const searchLower = search.toLowerCase();
    
    let searchIndex = 0;
    for (let i = 0; i < textLower.length && searchIndex < searchLower.length; i++) {
      if (textLower[i] === searchLower[searchIndex]) {
        searchIndex++;
      }
    }
    
    return searchIndex === searchLower.length;
  };

  // Calculate a quality score for subsequence matches (lower is better, like Fuse.js)
  const calculateSubsequenceScore = (text: string, search: string): number => {
    const textLower = text.toLowerCase();
    const searchLower = search.toLowerCase();
    
    let score = 0;
    let searchIndex = 0;
    let lastMatchIndex = -1;
    let consecutiveMatches = 0;
    
    for (let i = 0; i < textLower.length && searchIndex < searchLower.length; i++) {
      if (textLower[i] === searchLower[searchIndex]) {
        // Bonus for matches at the start
        if (searchIndex === 0) {
          score -= 20;
        }
        
        // Bonus for consecutive matches
        if (lastMatchIndex === i - 1) {
          consecutiveMatches++;
          score -= consecutiveMatches * 5; // More consecutive = better
        } else {
          consecutiveMatches = 0;
          // Penalty for gaps between matches
          if (lastMatchIndex !== -1) {
            score += (i - lastMatchIndex) * 2;
          }
        }
        
        // Penalty for later matches
        score += i * 0.5;
        
        lastMatchIndex = i;
        searchIndex++;
      }
    }
    
    // Bonus for exact or starts-with matches
    if (textLower === searchLower) {
      score -= 100;
    } else if (textLower.startsWith(searchLower)) {
      score -= 50;
    }
    
    // Bonus for shorter text (more specific match)
    score += text.length * 0.1;
    
    return score;
  };

  // Update ref whenever highlightedValue changes
  React.useEffect(() => {
    highlightedValueRef.current = highlightedValue;
  }, [highlightedValue]);

  // Reset search value and highlighted value when popover closes
  React.useEffect(() => {
    if (!open) {
      setSearchValue("");
      setHighlightedValue("");
      setHighlightedIndex(0);
      highlightedValueRef.current = "";
    } else {
      // Focus the input when dropdown opens
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          // Move cursor to the end without selecting text
          const length = inputRef.current.value.length;
          inputRef.current.setSelectionRange(length, length);
        }
      }, 0);
    }
  }, [open]);

  // Update highlighted value when search changes or index changes
  React.useEffect(() => {
    const availableOptions = getAvailableItemsList();
    if (availableOptions.length > 0 && highlightedIndex >= 0 && highlightedIndex < availableOptions.length) {
      const newHighlighted = availableOptions[highlightedIndex];
      setHighlightedValue(newHighlighted);
    }
  }, [highlightedIndex, searchValue]);

  // Get list of all available items (custom value + regular options)
  const getAvailableItemsList = () => {
    const items: string[] = [];
    const filteredOpts = getFilteredOptions();
    
    // Add custom value option if applicable
    if (allowCustomValue && searchValue && !options.find(
      (option) =>
        option.label.toLowerCase() === searchValue.toLowerCase() ||
        option.value.toLowerCase() === searchValue.toLowerCase()
    )) {
      items.push(searchValue); // The custom value item
    }
    
    // Add all filtered options
    filteredOpts.forEach(opt => items.push(opt.value));
    
    return items;
  };

  // Get display label for current value
  const getDisplayLabel = () => {
    // If dropdown is open and there's a highlighted value, show that
    if (open && highlightedValue) {
      const option = options.find((option) => option.value === highlightedValue);
      return option ? option.label : highlightedValue;
    }
    // Otherwise show the actual selected value
    const option = options.find((option) => option.value === value);
    return option ? option.label : value || placeholder;
  };

  // Get filtered options using fuzzy search and subsequence matching
  const getFilteredOptions = () => {
    if (!searchValue) {
      return options;
    }

    const searchLower = searchValue.toLowerCase();
    const searchWords = searchLower.split(/\s+/).filter(w => w.length > 0);

    // Score each option based on how well it matches
    const scoredOptions = options.map((option) => {
      const labelLower = option.label.toLowerCase();
      const valueLower = option.value.toLowerCase();
      
      let score = 0;

      // Check for exact match (highest priority)
      if (labelLower === searchLower || valueLower === searchLower) {
        score += 10000;
      }
      // Check if label/value starts with search term (very high priority)
      else if (labelLower.startsWith(searchLower) || valueLower.startsWith(searchLower)) {
        score += 5000;
      }
      // Check if label/value contains search term as whole phrase
      else if (labelLower.includes(searchLower) || valueLower.includes(searchLower)) {
        score += 2000;
        // Bonus if it appears early in the string
        const labelIndex = labelLower.indexOf(searchLower);
        const valueIndex = valueLower.indexOf(searchLower);
        const earliestIndex = Math.min(
          labelIndex >= 0 ? labelIndex : Infinity,
          valueIndex >= 0 ? valueIndex : Infinity
        );
        if (earliestIndex !== Infinity) {
          score += Math.max(0, 500 - earliestIndex * 10);
        }
      }
      // Check if all search words appear in the label/value
      else {
        const labelWords = labelLower.split(/\s+/);
        const valueWords = valueLower.split(/\s+/);
        
        let wordMatchCount = 0;
        let wordStartMatchCount = 0;
        
        for (const searchWord of searchWords) {
          // Check if any word in label starts with this search word
          for (const labelWord of labelWords) {
            if (labelWord.startsWith(searchWord)) {
              wordStartMatchCount++;
              wordMatchCount++;
              break;
            } else if (labelWord.includes(searchWord)) {
              wordMatchCount++;
              break;
            }
          }
          
          // Also check value words if not found in label
          if (wordMatchCount === 0) {
            for (const valueWord of valueWords) {
              if (valueWord.startsWith(searchWord)) {
                wordStartMatchCount++;
                wordMatchCount++;
                break;
              } else if (valueWord.includes(searchWord)) {
                wordMatchCount++;
                break;
              }
            }
          }
        }
        
        // Score based on how many words matched
        if (wordMatchCount === searchWords.length) {
          score += 1000 + (wordStartMatchCount * 200);
        } else if (wordMatchCount > 0) {
          score += wordMatchCount * 300;
        }
        // Check subsequence matching as fallback
        else if (matchesSubsequence(labelLower, searchLower) || matchesSubsequence(valueLower, searchLower)) {
          score += 100;
        }
      }

      // Bonus for shorter strings (more specific matches)
      score -= (option.label.length + option.value.length) * 0.1;

      return { option, score };
    });

    // Filter out options with score 0 and sort by score descending
    return scoredOptions
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ option }) => option);
  };

  // Handle keydown on the trigger button (when focused but dropdown not open)
  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    // Handle Delete key to clear the value
    if (e.key === "Delete" && value) {
      e.preventDefault();
      onValueChange("");
      return;
    }

    // If dropdown is already open, don't handle here
    if (open) return;

    // Check if user is typing a searchable character (not special keys)
    // Allow alphanumeric characters and common symbols
    const isSearchableCharacter =
      e.key.length === 1 &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey &&
      // Match alphanumeric, space, and common punctuation
      /^[a-zA-Z0-9\s\-_@#$%&*()+='",.?<>/;:\[\]{}|\\`~]$/.test(e.key);

    if (isSearchableCharacter) {
      e.preventDefault();
      // Open dropdown and set the typed character as search value
      setSearchValue(e.key);
      setOpen(true);
    }
  };

  // Handle key press in the search input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle Tab to close dropdown and move focus away from combobox
    if (e.key === "Tab") {
      e.preventDefault();
      setOpen(false);

      // Find the next focusable element after the trigger button
      if (triggerRef.current) {
        const focusableElements = Array.from(
          document.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );

        const currentIndex = focusableElements.indexOf(triggerRef.current);
        const nextElement = focusableElements[currentIndex + 1];

        if (nextElement) {
          // Use setTimeout to ensure the popover has closed before focusing
          setTimeout(() => {
            nextElement.focus();
          }, 0);
        }
      }
      return;
    }
  };

  // Handle selecting a value (called by both Enter key and clicking)
  const handleSelectValue = React.useCallback((selectedValue: string) => {
    onValueChange(selectedValue);
    setOpen(false);
    setSearchValue("");
    setHighlightedValue("");
    highlightedValueRef.current = "";
  }, [onValueChange]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between h-8 text-sm pr-10 relative transition-all duration-200",
            value 
              ? error
                ? "bg-red-50 border-red-500 hover:bg-red-50 text-slate-800 font-medium"
                : "bg-emerald-50 border-emerald-500 hover:bg-emerald-50 text-slate-800 font-medium"
              : "border-slate-300 bg-white text-slate-500 pl-3",
            value && "pl-3",
            className
          )}
          style={value ? { paddingLeft: '48px' } : {}}
          onFocus={() => {
            if (autoOpenOnFocus && !open) {
              setOpen(true);
            }
          }}
          onKeyDown={handleTriggerKeyDown}
          disabled={disabled}
        >
          {value && (
            <div className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full flex items-center justify-center pointer-events-none",
              error ? "bg-red-600" : "bg-emerald-600"
            )}>
              {error ? (
                <AlertCircle className="h-3.5 w-3.5 text-white" strokeWidth={3} />
              ) : (
                <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
              )}
            </div>
          )}
          <span className="truncate">{getDisplayLabel()}</span>
          <div className="flex items-center absolute right-1 top-1/2 -translate-y-1/2 gap-1 shrink-0">
            {value && (
              <div
                role="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.stopPropagation();
                  onValueChange("");
                }}
                className="rounded-sm hover:bg-gray-200 p-0.5 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
                aria-label="Clear selection"
              >
                <X className="h-3 w-3" />
              </div>
            )}
            <ChevronsUpDown className={cn(
              "h-4 w-4 transition-colors duration-200",
              value ? (error ? "text-red-600" : "text-emerald-600") : "text-slate-400"
            )} />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn(
        "w-[300px] p-0",
        popoverContentClassName
      )} align="start">
        <Command
          shouldFilter={false}
          loop
          onValueChange={(value) => {
            // Track which item is highlighted by keyboard navigation
            setHighlightedValue(value);
          }}
          onKeyDown={(e: React.KeyboardEvent) => {
            // Handle arrow keys for manual navigation tracking
            if (e.key === "ArrowDown") {
              e.preventDefault();
              const availableItems = getAvailableItemsList();
              setHighlightedIndex((prev) => (prev + 1) % availableItems.length);
              return;
            }
            
            if (e.key === "ArrowUp") {
              e.preventDefault();
              const availableItems = getAvailableItemsList();
              setHighlightedIndex((prev) => (prev - 1 + availableItems.length) % availableItems.length);
              return;
            }
            
            if (e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
              // Get the currently highlighted value
              const currentHighlighted = highlightedValueRef.current;
              
              if (currentHighlighted) {
                // Use the highlighted value
                handleSelectValue(currentHighlighted);
              } else if (searchValue) {
                // No highlighting, check for exact match or use custom value
                const exactMatch = options.find(
                  (option) =>
                    option.label.toLowerCase() === searchValue.toLowerCase() ||
                    option.value.toLowerCase() === searchValue.toLowerCase()
                );
                
                if (exactMatch) {
                  handleSelectValue(exactMatch.value);
                } else if (allowCustomValue) {
                  handleSelectValue(searchValue);
                } else {
                  // Use first filtered option
                  const filteredOptions = getFilteredOptions();
                  if (filteredOptions.length > 0) {
                    handleSelectValue(filteredOptions[0].value);
                  }
                }
              }
            }
          }}
        >
          <CommandInput
            ref={inputRef}
            placeholder={searchPlaceholder}
            value={searchValue}
            onValueChange={setSearchValue}
            onKeyDown={handleKeyDown}
          />
          <CommandList>
            <CommandEmpty>
              {allowCustomValue ? (
                <div className="px-2 py-3">
                  <button
                    className="w-full text-left text-sm hover:bg-accent rounded px-2 py-1.5"
                    onClick={() => {
                      onValueChange(searchValue);
                      setOpen(false);
                      setSearchValue("");
                    }}
                  >
                    Use "{searchValue}"
                  </button>
                </div>
              ) : (
                <div className="px-2 py-3 text-center text-sm">{emptyMessage}</div>
              )}
            </CommandEmpty>
            <CommandGroup>
              {allowCustomValue && searchValue && !options.find(
                (option) =>
                  option.label.toLowerCase() === searchValue.toLowerCase() ||
                  option.value.toLowerCase() === searchValue.toLowerCase()
              ) && (
                <CommandItem
                  key="__custom__"
                  value={searchValue}
                  onSelect={() => {
                    handleSelectValue(searchValue);
                  }}
                  onMouseEnter={() => setHighlightedValue(searchValue)}
                  onMouseLeave={() => setHighlightedValue("")}
                  className={cn(
                    "bg-blue-50 border-b",
                    highlightedValue === searchValue && "bg-primary/10"
                  )}
                >
                  <Check className="mr-2 h-4 w-4 opacity-0" />
                  Use "{searchValue}"
                </CommandItem>
              )}
              {getFilteredOptions().map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    handleSelectValue(currentValue === value ? "" : currentValue);
                  }}
                  onMouseEnter={() => setHighlightedValue(option.value)}
                  onMouseLeave={() => setHighlightedValue("")}
                  className={cn(
                    highlightedValue === option.value && "bg-primary/10"
                  )}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}