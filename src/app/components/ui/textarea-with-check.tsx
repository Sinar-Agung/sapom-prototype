import * as React from "react";
import { Check, AlertCircle } from "lucide-react";
import { cn } from "./utils";
import { Textarea } from "./textarea";

interface TextareaWithCheckProps extends React.ComponentProps<"textarea"> {
  value?: string;
  error?: boolean;
}

const TextareaWithCheck = React.forwardRef<HTMLTextAreaElement, TextareaWithCheckProps>(
  ({ className, value, error = false, ...props }, ref) => {
    const hasValue = value !== undefined && value !== "" && value !== null;

    return (
      <div className="relative flex items-start">
        {hasValue && (
          <div className={cn(
            "absolute left-3 top-3 h-5 w-5 rounded-full flex items-center justify-center z-10 pointer-events-none",
            error ? "bg-red-600" : "bg-emerald-600"
          )}>
            {error ? (
              <AlertCircle className="h-3.5 w-3.5 text-white" strokeWidth={3} />
            ) : (
              <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
            )}
          </div>
        )}
        <Textarea
          ref={ref}
          value={value}
          className={cn(
            "transition-all duration-200",
            hasValue 
              ? error
                ? "bg-red-50 border-red-500 text-slate-800 font-medium" 
                : "bg-emerald-50 border-emerald-500 text-slate-800 font-medium"
              : "border-slate-300 bg-white text-slate-500",
            hasValue && "pl-12",
            className
          )}
          style={hasValue ? { paddingLeft: '48px' } : {}}
          {...props}
        />
      </div>
    );
  }
);

TextareaWithCheck.displayName = "TextareaWithCheck";

export { TextareaWithCheck };