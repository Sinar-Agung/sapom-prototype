import { AlertCircle, Check } from "lucide-react";
import * as React from "react";
import { Input } from "./input";
import { cn } from "./utils";

interface TickIndicatorProps {
  show: boolean;
  error?: boolean;
}

export function TickIndicator({ show, error = false }: TickIndicatorProps) {
  if (!show) return null;
  return (
    <div
      className={cn(
        "absolute left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full flex items-center justify-center pointer-events-none",
        error ? "bg-red-600" : "bg-emerald-600",
      )}
    >
      {error ? (
        <AlertCircle className="size-1.5 text-white" strokeWidth={3} />
      ) : (
        <Check className="size-1.5 text-white" strokeWidth={3} />
      )}
    </div>
  );
}

interface InputWithCheckProps extends React.ComponentProps<"input"> {
  value?: string | number;
  error?: boolean;
}

const InputWithCheck = React.forwardRef<HTMLInputElement, InputWithCheckProps>(
  ({ className, value, error = false, ...props }, ref) => {
    const hasValue = value !== undefined && value !== "" && value !== null;

    return (
      <div className="relative flex items-center">
        <TickIndicator show={hasValue} error={error} />
        <Input
          ref={ref}
          value={value}
          className={cn(
            "transition-all duration-200 text-xs",
            props.type === "number" &&
              "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            hasValue
              ? error
                ? "bg-red-50 border-red-500 text-slate-800 font-medium"
                : "bg-emerald-50 border-emerald-500 text-slate-800 font-medium"
              : "border-slate-300 bg-white text-slate-500",
            hasValue && "pl-[22px]",
            className,
          )}
          style={hasValue ? { paddingLeft: "22px" } : {}}
          {...props}
        />
      </div>
    );
  },
);

InputWithCheck.displayName = "InputWithCheck";

export { InputWithCheck };
