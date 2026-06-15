import React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

export const TooltipProvider = ({ children }: { children: React.ReactNode }) => (
  <TooltipPrimitive.Provider>{children}</TooltipPrimitive.Provider>
);

export const Tooltip = ({ children, content }: { children: React.ReactNode; content: string }) => (
  <TooltipPrimitive.Root>
    <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
    <TooltipPrimitive.Content side="top" className="bg-neutral-900 border border-white/10 text-white text-[10px] px-2 py-1 rounded shadow-lg">
      {content}
      <TooltipPrimitive.Arrow className="fill-neutral-900" />
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Root>
);
