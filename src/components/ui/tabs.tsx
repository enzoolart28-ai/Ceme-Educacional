"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  key: string;
  label: string;
  content: React.ReactNode;
}

export function Tabs({ items, defaultKey }: { items: TabItem[]; defaultKey?: string }) {
  const [active, setActive] = useState(defaultKey ?? items[0]?.key);
  const activeItem = items.find((i) => i.key === active) ?? items[0];

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-1 overflow-x-auto border-b border-slate-200">
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => setActive(item.key)}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              item.key === active
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-slate-500 hover:text-slate-800",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div>{activeItem?.content}</div>
    </div>
  );
}
