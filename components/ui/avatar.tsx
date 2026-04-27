

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils"; // Asegúrate de tener una función 'cn' para combinar clases si usas Tailwind

export function Avatar({ className, ...props }: AvatarPrimitive.AvatarProps) {
  return (
    <AvatarPrimitive.Root className={cn("relative flex h-10 w-10 overflow-hidden rounded-full", className)} {...props} />
  );
}

export function AvatarImage({ className, ...props }: AvatarPrimitive.AvatarImageProps) {
  return <AvatarPrimitive.Image className={cn("object-cover", className)} {...props} />;
}

export function AvatarFallback({ className, ...props }: AvatarPrimitive.AvatarFallbackProps) {
  return (
    <AvatarPrimitive.Fallback className={cn("flex items-center justify-center bg-gray-500 text-white", className)} {...props}>
      {/* Texto o ícono de fallback */}
    </AvatarPrimitive.Fallback>
  );
}

