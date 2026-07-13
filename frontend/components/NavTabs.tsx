"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Importar" },
  { href: "/produtos", label: "Produtos" },
];

export function NavTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 border border-slate-200">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              active ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
