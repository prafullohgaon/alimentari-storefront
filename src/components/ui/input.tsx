"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error, icon, iconPosition = "left", ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative flex items-center">
          {icon && iconPosition === "left" && (
            <div className="absolute left-4 text-muted-foreground pointer-events-none flex items-center justify-center">
              {icon}
            </div>
          )}
          <input
            type={type}
            ref={ref}
            className={cn(
              "w-full h-11 bg-card text-foreground border rounded-lg px-4 text-base transition-all duration-200 outline-none placeholder:text-muted/70",
              "focus:border-primary focus:ring-1 focus:ring-primary",
              {
                "pl-11": icon && iconPosition === "left",
                "pr-11": icon && iconPosition === "right",
                "border-error focus:border-error focus:ring-error": !!error,
                "border-border": !error,
              },
              className
            )}
            {...props}
          />
          {icon && iconPosition === "right" && (
            <div className="absolute right-4 text-muted-foreground pointer-events-none flex items-center justify-center">
              {icon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-error font-medium pl-1 animate-fadeIn">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
