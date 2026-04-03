import { forwardRef } from "react";
import { cn } from "@/lib/utils";

//  Text Input 

interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode; // ✅ ADD THIS
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, prefix, suffix, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-500 text-mist uppercase tracking-wider"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {prefix && (
            <div className="absolute left-3 text-mist pointer-events-none text-sm">
              {prefix}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full bg-turf border text-chalk placeholder-mist",
              "rounded-xl px-3.5 py-2.5 text-sm font-body",
              "transition-all duration-200 outline-none",
              "focus:border-ref/60 focus:shadow-[0_0_0_3px_rgba(245,197,24,0.08)]",
              error
                ? "border-loss/60 focus:border-loss/80"
                : "border-line hover:border-mist/40",
              prefix  && "pl-9",
              suffix  && "pr-9",
              className
            )}
            {...props}
          />

          {suffix && (
            <div className="absolute right-3 text-mist pointer-events-none text-sm">
              {suffix}
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs text-loss">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-mist">{hint}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

//  Textarea 

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?:  string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-500 text-mist uppercase tracking-wider"
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            "w-full bg-turf border text-chalk placeholder-mist",
            "rounded-xl px-3.5 py-2.5 text-sm font-body",
            "transition-all duration-200 outline-none resize-y min-h-[80px]",
            "focus:border-ref/60 focus:shadow-[0_0_0_3px_rgba(245,197,24,0.08)]",
            error
              ? "border-loss/60 focus:border-loss/80"
              : "border-line hover:border-mist/40",
            className
          )}
          {...props}
        />

        {error && <p className="text-xs text-loss">{error}</p>}
        {hint && !error && <p className="text-xs text-mist">{hint}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

//  Select 

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?:   string;
  error?:   string;
  hint?:    string;
  options:  { value: string; label: string }[];
}

export function Select({
  label,
  error,
  hint,
  options,
  className,
  id,
  ...props
}: SelectProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-500 text-mist uppercase tracking-wider"
        >
          {label}
        </label>
      )}

      <select
        id={inputId}
        className={cn(
          "w-full bg-turf border text-chalk",
          "rounded-xl px-3.5 py-2.5 text-sm font-body",
          "transition-all duration-200 outline-none cursor-pointer",
          "focus:border-ref/60 focus:shadow-[0_0_0_3px_rgba(245,197,24,0.08)]",
          error
            ? "border-loss/60"
            : "border-line hover:border-mist/40",
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-turf">
            {opt.label}
          </option>
        ))}
      </select>

      {error && <p className="text-xs text-loss">{error}</p>}
      {hint && !error && <p className="text-xs text-mist">{hint}</p>}
    </div>
  );
}
