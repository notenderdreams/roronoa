"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/AuthForms";
import { Badge } from "@/components/ui/badge";

interface AdminNavProps {
  user: {
    name: string;
    email: string;
    role?: string | null;
  };
}

export function AdminNav({ user }: AdminNavProps) {
  const pathname = usePathname();

  const links = [
    { href: "/admin/handovers", label: "Pending Handovers" },
    { href: "/admin/inventory", label: "Found Inventory" },
  ];

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <span>Roronoa</span>
            <Badge variant="secondary" className="text-xs">
              Admin
            </Badge>
          </Link>
          <nav className="flex items-center gap-1">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden text-xs text-muted-foreground sm:inline-block">
            {user.name} ({user.email})
          </span>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
