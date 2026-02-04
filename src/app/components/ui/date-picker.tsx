"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Check, AlertCircle } from "lucide-react";
import { cn } from "./utils";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

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
            "justify-start text-left font-normal h-8 text-sm relative transition-all duration-200",
            !value && "text-slate-500 border-slate-300 bg-white pl-3",
            value && (error 
              ? "bg-red-50 border-red-500 hover:bg-red-50 text-slate-800 font-medium"
              : "bg-emerald-50 border-emerald-500 hover:bg-emerald-50 text-slate-800 font-medium"),
            className
          )}
          style={value ? { paddingLeft: '48px' } : {}}
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
          <CalendarIcon className={cn(
            "h-4 w-4 mr-2",
            value ? (error ? "text-red-600" : "text-emerald-600") : "text-slate-400"
          )} />
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