"use client";

import { ChevronsUp } from "lucide-react";
import { useState } from "react";
import { Button } from "./button";
import { Input } from "./input";

interface AvailablePcsInputProps {
  value: string;
  onChange: (value: string) => void;
  requestedPcs: string;
  className?: string;
  disabled?: boolean;
}

export function AvailablePcsInput({
  value,
  onChange,
  requestedPcs,
  className = "",
  disabled = false,
}: AvailablePcsInputProps) {
  const [localValue, setLocalValue] = useState(value);

  const handleChange = (inputValue: string) => {
    // Allow empty string
    if (inputValue === "") {
      setLocalValue("");
      return;
    }

    // Remove non-numeric characters
    const numericValue = inputValue.replace(/[^0-9]/g, "");

    // Parse as integer
    const parsedValue = parseInt(numericValue, 10);

    // Validate: must be >= 0 and <= requestedPcs
    if (!isNaN(parsedValue) && parsedValue >= 0) {
      const maxValue = parseInt(requestedPcs, 10);
      if (!isNaN(maxValue) && parsedValue > maxValue) {
        // Cap the value at the maximum (requested pcs)
        setLocalValue(maxValue.toString());
        return;
      }
      setLocalValue(numericValue);
    }
  };

  const handleBlur = () => {
    // Only call onChange when input loses focus
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  const handleMatchRequested = () => {
    setLocalValue(requestedPcs);
    onChange(requestedPcs);
  };

  // Sync local value with prop value when it changes externally
  if (value !== localValue && localValue === value) {
    setLocalValue(value);
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder="0"
        className="w-[80px] h-8 text-sm px-2 text-center"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleMatchRequested}
        disabled={disabled}
        title="Match requested pcs"
        className="h-8 w-7 px-0 shrink-0"
      >
        <ChevronsUp className="w-3 h-3" />
      </Button>
    </div>
  );
}
