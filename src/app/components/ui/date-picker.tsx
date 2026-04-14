"use client";

import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import * as React from "react";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { TickIndicator } from "./input-with-check";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "./utils";

interface DatePickerProps {
  value?: Date;
  onValueChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  minDate?: Date;
  disabled?: boolean;
  error?: boolean;
}

export function DatePicker({
  value,
  onValueChange,
  placeholder = "Pick a date",
  className,
  minDate,
  disabled = false,
  error = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal h-8 text-xs relative transition-all duration-200",
            !value && "text-slate-500 border-slate-300 bg-white pl-3",
            value &&
              (error
                ? "bg-red-50 border-red-500 hover:bg-red-50 text-slate-800 font-medium"
                : "bg-emerald-50 border-emerald-500 hover:bg-emerald-50 text-slate-800 font-medium"),
            className,
          )}
          style={value ? { paddingLeft: "22px" } : {}}
          disabled={disabled}
        >
          <TickIndicator show={!!value} error={error} />
          <CalendarIcon
            className={cn(
              "h-4 w-4 mr-2",
              value
                ? error
                  ? "text-red-600"
                  : "text-emerald-600"
                : "text-slate-400",
            )}
          />
          {value ? format(value, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onValueChange?.(date);
            setOpen(false);
          }}
          disabled={(date) => {
            if (minDate) {
              // Create start of day for comparison
              const minDateStart = new Date(minDate);
              minDateStart.setHours(0, 0, 0, 0);
              const dateToCheck = new Date(date);
              dateToCheck.setHours(0, 0, 0, 0);
              return dateToCheck < minDateStart;
            }
            return false;
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
