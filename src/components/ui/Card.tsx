import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "highlight" | "ghost";
  padding?: "none" | "sm" | "md" | "lg";
  hover?:   boolean;
}

const variants = {
  default:   "bg-turf border border-line shadow-card",
  highlight: "bg-turf border border-ref/30 shadow-ref",
  ghost:     "bg-transparent border border-line",
};

const paddings = {
  none: "",
  sm:   "p-3",
  md:   "p-4 sm:p-5",
  lg:   "p-6 sm:p-8",
};

export function Card({
  variant = "default",
  padding = "md",
  hover   = false,
  children,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl2 transition-all duration-200",
        variants[variant],
        paddings[padding],
        hover && "hover:border-ref/40 hover:-translate-y-0.5 hover:shadow-ref cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

//  Card sub-components 

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title:    React.ReactNode;
  subtitle?: React.ReactNode;
  action?:  React.ReactNode;
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: CardHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4 mb-4", className)}>
      <div>
        <h3 className="font-display font-600 text-chalk text-base leading-tight">
          {title}
        </h3>
        {subtitle && (
          <p className="text-mist text-xs mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardDivider({ className }: { className?: string }) {
  return <div className={cn("border-t border-line my-4", className)} />;
}
