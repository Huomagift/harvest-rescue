import React from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "filled" | "tonal" | "outlined" | "text" | "error";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "filled",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyles =
    "m3-touch-target inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:scale-100 select-none cursor-pointer";

  let variantStyles = "";
  switch (variant) {
    case "filled":
      variantStyles =
        "bg-[#1B4D3E] text-white hover:bg-[#163E32] focus:ring-[#1B4D3E] shadow-sm hover:shadow-md";
      break;
    case "tonal":
      variantStyles =
        "bg-[#D8ECE0] text-[#052119] hover:bg-[#c2e4cf] focus:ring-[#1B4D3E]";
      break;
    case "outlined":
      variantStyles =
        "border border-[#717973] text-[#1B4D3E] hover:bg-[#1B4D3E]/5 focus:ring-[#1B4D3E]";
      break;
    case "text":
      variantStyles =
        "text-[#1B4D3E] hover:bg-[#1B4D3E]/10 focus:ring-[#1B4D3E]";
      break;
    case "error":
      variantStyles =
        "bg-[#BA1A1A] text-white hover:bg-[#931515] focus:ring-[#BA1A1A] shadow-sm";
      break;
  }

  let sizeStyles = "";
  switch (size) {
    case "sm":
      sizeStyles = "px-4 py-2 text-xs gap-1.5 min-h-[40px]";
      break;
    case "lg":
      sizeStyles = "px-7 py-3.5 text-base gap-2.5 min-h-[52px]";
      break;
    case "md":
    default:
      sizeStyles = "px-5 py-2.5 text-sm gap-2 min-h-[48px]";
      break;
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && (
        <span className="inline-flex shrink-0">{rightIcon}</span>
      )}
    </button>
  );
};
