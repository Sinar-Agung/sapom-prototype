"use client";

import { ChevronsUp } from "lucide-react";
import { Input } from "./input";
import { Button } from "./button";

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
  const handleChange = (inputValue: string) => {
    // Allow empty string
    if (inputValue === "") {
      onChange("");
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
        // Don't allow values higher than requested pcs
        return;
      }
      onChange(numericValue);
    }
  };

  const handleMatchRequested = () => {
    onChange(requestedPcs);
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
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