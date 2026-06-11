'use client';

import { LayoutDashboard, ReceiptIndianRupee, Users, Settings as SettingsIcon, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MobileView = 'dashboard' | 'expenses' | 'groups' | 'settings';

interface MobileNavProps {
  activeView: MobileView;
  onNavigate: (view: MobileView) => void;
  onAddExpense: () => void;
}

type NavItem = {
  view: MobileView;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
};

const navItems: NavItem[] = [
  { view: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { view: 'expenses', icon: ReceiptIndianRupee, label: 'Expenses' },
];

const navItemsRight: NavItem[] = [
  { view: 'groups', icon: Users, label: 'Groups' },
  { view: 'settings', icon: SettingsIcon, label: 'Settings' },
];

function NavButton({
  item,
  isActive,
  onNavigate,
}: {
  item: NavItem;
  isActive: boolean;
  onNavigate: (view: MobileView) => void;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={() => onNavigate(item.view)}
      className={cn(
        'flex min-h-[44px] flex-col items-center justify-center gap-1 transition-colors',
        isActive
          ? 'text-accent'
          : 'text-[hsl(var(--sidebar-foreground))]/60 hover:text-[hsl(var(--sidebar-foreground))]/80',
      )}
      aria-label={item.label}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className="h-5 w-5" />
      <span className="font-code text-[0.55rem] uppercase tracking-[0.15em]">{item.label}</span>
      {isActive ? (
        <span className="h-1 w-1 rounded-full bg-accent" aria-hidden="true" />
      ) : (
        <span className="h-1 w-1" aria-hidden="true" />
      )}
    </button>
  );
}

export function MobileNav({ activeView, onNavigate, onAddExpense }: MobileNavProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[40] border-t border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] md:hidden"
      style={{ paddingBottom: 'var(--sab)' }}
      aria-label="Mobile navigation"
    >
      {/* Subtle ledger lines overlay */}
      <div
        className="ledger-lines pointer-events-none absolute inset-0 overflow-hidden opacity-10"
        aria-hidden="true"
      />

      <div className="relative grid h-16 grid-cols-5">
        {navItems.map((item) => (
          <NavButton
            key={item.view}
            item={item}
            isActive={activeView === item.view}
            onNavigate={onNavigate}
          />
        ))}

        {/* Center + button */}
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={onAddExpense}
            aria-label="Add expense"
            className="flex h-14 w-14 -mt-5 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-transform active:scale-95"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>

        {navItemsRight.map((item) => (
          <NavButton
            key={item.view}
            item={item}
            isActive={activeView === item.view}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </nav>
  );
}
