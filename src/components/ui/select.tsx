import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 pl-0.5">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            ref={ref}
            className={cn(
              "w-full h-11 bg-card text-foreground border rounded-lg pl-4 pr-10 text-base appearance-none transition-all duration-200 outline-none cursor-pointer",
              "focus:border-primary focus:ring-1 focus:ring-primary",
              {
                "border-error focus:border-error focus:ring-error": !!error,
                "border-border": !error,
              },
              className
            )}
            {...props}
          >
            {children}
          </select>
          <div className="absolute right-4 text-muted-foreground pointer-events-none flex items-center justify-center">
            <ChevronDown className="w-4 h-4 stroke-[2]" />
          </div>
        </div>
        {error && (
          <p className="mt-1 text-sm text-error font-medium pl-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };
