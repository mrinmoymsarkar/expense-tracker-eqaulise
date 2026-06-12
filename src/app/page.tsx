
"use client";

import * as React from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { useData } from '@/components/providers/data-provider';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  ReceiptIndianRupee,
  Users,
  SettingsIcon,
  Plus,
  Bell,
  LogOut,
} from "lucide-react";

import { EqualizeLogo } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import Dashboard from "@/components/dashboard";
import Expenses from "@/components/expenses";
import Groups from "@/components/groups";
import Settings from "@/components/settings";
import GroupDetail from "@/components/group-detail";
import { MobileNav, type MobileView } from "@/components/mobile-nav";
import { AddExpenseSheet } from "@/components/add-expense-sheet";
import { cn } from "@/lib/utils";
import type { ExpenseFormValues, Group } from "@/lib/types";

type View = MobileView;

const viewConfig: Record<
  View,
  { title: string; icon: React.ElementType; component: React.ElementType }
> = {
  dashboard: {
    title: "Dashboard",
    icon: LayoutDashboard,
    component: Dashboard,
  },
  expenses: {
    title: "Expenses",
    icon: ReceiptIndianRupee,
    component: Expenses,
  },
  groups: { title: "Groups", icon: Users, component: Groups },
  settings: {
    title: "Settings",
    icon: SettingsIcon,
    component: Settings,
  },
};

const AppLayout = () => {
  const [activeView, setActiveView] = React.useState<View>("dashboard");
  const [selectedGroup, setSelectedGroup] = React.useState<Group | null>(null);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = React.useState(false);
  const { user } = useAuth();
  const {
    groups,
    personalExpenses,
    addPersonalExpense,
    createGroup,
    joinGroupByCode,
    summary,
    profile,
  } = useData();

  const handleLogout = async () => {
    const { auth } = await import('@/lib/firebase');
    await auth.signOut();
  };

  const { isMobile, setOpenMobile } = useSidebar();
  const ActiveComponent = viewConfig[activeView].component;

  // Legacy view shape (ISO date string + group name) consumed by the feature
  // components until they migrate to Firestore types directly.
  const viewExpenses = React.useMemo(() => {
    const personal = personalExpenses.map((e) => ({
      id: e.id,
      description: e.description,
      amount: e.amount,
      category: e.category,
      date: e.date.toDate().toISOString(),
      group: "",
      groupId: null as string | null,
      paymentMethod: e.paymentMethod,
      notes: e.notes,
      tags: e.tags ?? [],
    }));
    const fromGroups = summary.allGroupExpenses.map((e) => ({
      id: e.id,
      description: e.description,
      amount: e.amount,
      category: e.category,
      date: e.date.toDate().toISOString(),
      group: e.groupName,
      groupId: e.groupId as string | null,
      paymentMethod: e.paymentMethod,
      notes: e.notes,
      tags: e.tags ?? [],
      paidBy: e.paidBy,
      splitMethod: e.splitMethod,
      splits: e.splits,
    }));
    return [...personal, ...fromGroups].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [personalExpenses, summary.allGroupExpenses]);

  const existingTags = React.useMemo(() => {
    const set = new Set<string>();
    for (const e of viewExpenses) {
      for (const t of (e.tags ?? [])) set.add(t);
    }
    return [...set].sort();
  }, [viewExpenses]);

  const handleAddExpense = async (values: ExpenseFormValues) => {
    if (values.groupId) {
      const { addGroupExpense } = await import('@/lib/db/expenses');
      if (!user) throw new Error('Not authenticated');
      await addGroupExpense(values.groupId, user.uid, values);
    } else {
      await addPersonalExpense(values);
    }
  };

  const handleAddGroup = async (newGroupData: { name: string }) => {
    await createGroup(newGroupData);
  };

  const handleNavigate = (view: View) => {
    setActiveView(view);
    setSelectedGroup(null);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const componentProps: any = {
    dashboard: { expenses: viewExpenses, summary },
    expenses: { expenses: viewExpenses, groups },
    groups: { groups, addGroup: handleAddGroup, joinGroupByCode, onSelectGroup: setSelectedGroup },
    settings: {},
  };
  const activeProps = componentProps[activeView];


  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <EqualizeLogo className="size-7 shrink-0 text-sidebar-primary" />
            <h1 className="font-headline text-xl font-semibold italic group-data-[collapsible=icon]:hidden">
              Equalize
            </h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {Object.keys(viewConfig).map((key) => {
              const view = key as View;
              const Icon = viewConfig[view].icon;
              return (
                <SidebarMenuItem key={view}>
                  <SidebarMenuButton
                    onClick={() => handleNavigate(view)}
                    isActive={activeView === view && !selectedGroup}
                    tooltip={{ children: viewConfig[view].title }}
                  >
                    <Icon />
                    <span>{viewConfig[view].title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
             <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout} tooltip={{children: 'Logout'}}>
                <LogOut />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
               <div className="flex items-center gap-2 p-2 transition-colors rounded-md">
                  <Avatar className="h-8 w-8 transition-all">
                    <AvatarImage src={profile?.photoURL || user?.photoURL || "https://placehold.co/40x40.png"} alt={profile?.displayName || user?.displayName || "User"} data-ai-hint="profile picture" />
                    <AvatarFallback>{(profile?.displayName || user?.displayName) ? (profile?.displayName || user?.displayName)!.slice(0, 2).toUpperCase() : user?.email?.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{profile?.displayName || user?.displayName || user?.email}</span>
                    <span className="text-xs text-muted-foreground">
                      {user?.email}
                    </span>
                  </div>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-center gap-2 min-w-0">
            <EqualizeLogo className="size-6 shrink-0 text-primary md:hidden" />
            <h2 className="truncate font-headline text-2xl font-medium">
              {selectedGroup ? selectedGroup.name : viewConfig[activeView].title}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="hidden md:inline-flex"
              size="sm"
              onClick={() => setIsAddExpenseOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
            <Button size="icon" variant="ghost">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notifications</span>
            </Button>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 pb-[calc(5rem+var(--sab))] sm:p-6 sm:pb-[calc(5rem+var(--sab))] md:pb-6">
           {selectedGroup ? (
            <GroupDetail group={selectedGroup} onBack={() => setSelectedGroup(null)} />
          ) : (
            <ActiveComponent {...activeProps} />
          )}
        </main>
      </SidebarInset>

      <MobileNav
        activeView={activeView}
        onNavigate={handleNavigate}
        onAddExpense={() => setIsAddExpenseOpen(true)}
      />

      <AddExpenseSheet
        open={isAddExpenseOpen}
        onOpenChange={setIsAddExpenseOpen}
        groups={groups}
        defaultGroupId={selectedGroup?.id ?? null}
        onSubmit={handleAddExpense}
        existingTags={existingTags}
      />
    </div>
  );
}

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const isUnverifiedEmailUser =
    !!user &&
    user.providerData.some((p) => p.providerId === 'password') &&
    !user.emailVerified;

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  React.useEffect(() => {
    if (!loading && isUnverifiedEmailUser) {
      (async () => {
        const { auth } = await import('@/lib/firebase');
        await auth.signOut();
        router.push('/login');
      })();
    }
  }, [loading, isUnverifiedEmailUser, router]);

  if (loading || !user || isUnverifiedEmailUser) {
    return null;
  }

  return (
    <SidebarProvider>
      <AppLayout />
    </SidebarProvider>
  );
}
