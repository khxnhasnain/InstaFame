import React from "react";
import { Loader2 } from "lucide-react";

interface LoaderProps {
  text?: string;
  size?: "sm" | "md" | "lg";
}

export default function Loader({ text = "Loading profile data...", size = "md" }: LoaderProps) {
  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-instagram-pink`} />
      {text && <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{text}</p>}
    </div>
  );
}
