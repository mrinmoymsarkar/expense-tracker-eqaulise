
"use client";

import * as React from "react";
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
  SidebarTrigger,
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
import { expenseData as initialExpenseData, groupData as initialGroupData } from "@/lib/data";

type View = "dashboard" | "expenses" | "groups" | "settings";

type Expense = (typeof initialExpenseData)[0];
type Group = (typeof initialGroupData)[0];


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
  const [expenses, setExpenses] = React.useState<Expense[]>(initialExpenseData);
  const [groups, setGroups] = React.useState<Group[]>(initialGroupData);
  const [selectedGroup, setSelectedGroup] = React.useState<Group | null>(null);

  const { isMobile } = useSidebar();
  const ActiveComponent = viewConfig[activeView].component;

  const addExpense = (newExpenseData: Omit<Expense, "id">) => {
    const newExpense = {
      ...newExpenseData,
      id: Date.now().toString(),
    };
    setExpenses(prev => [newExpense, ...prev]);

    if (newExpense.group) {
      const groupToUpdate = groups.find(g => g.name === newExpense.group);
      if (groupToUpdate) {
        setGroups(prev => 
          prev.map(g => 
            g.name === newExpense.group 
              ? { ...g, totalExpenses: g.totalExpenses + newExpense.amount }
              : g
          )
        );
      }
    }
  };

  const addGroup = (newGroupData: Pick<Group, "name" | "imageUrl" | "imageHint">) => {
    const newGroup = {
      ...newGroupData,
      id: Date.now().toString(),
      totalExpenses: 0,
      members: [
        { initials: "SN", avatarUrl: "https://placehold.co/40x40.png" },
      ],
    };
    setGroups(prev => [newGroup, ...prev]);
  };

  const componentProps: any = {
    dashboard: { expenses },
    expenses: { expenses, groups, addExpense },
    groups: { groups, addGroup, onSelectGroup: setSelectedGroup },
    settings: {},
  };
  const activeProps = componentProps[activeView];


  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <EqualizeLogo className="size-7 text-primary" />
            <h1 className="font-headline text-xl font-semibold">Equalize</h1>
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
                    onClick={() => {
                      setActiveView(view);
                      setSelectedGroup(null);
                    }}
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
              <SidebarMenuButton tooltip={{children: 'Logout'}}>
                <LogOut />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
               <div className="flex items-center gap-2 rounded-md p-2 transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="https://placehold.co/40x40.png" alt="@shadcn" data-ai-hint="profile picture" />
                    <AvatarFallback>SN</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Shishir Nikam</span>
                    <span className="text-xs text-muted-foreground">
                      shishir.nikam@email.com
                    </span>
                  </div>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-center gap-2">
            {isMobile && <SidebarTrigger />}
            <h2 className="font-headline text-xl font-semibold">
              {selectedGroup ? selectedGroup.name : viewConfig[activeView].title}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notifications</span>
            </Button>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-6">
           {selectedGroup ? (
            <GroupDetail group={selectedGroup} onBack={() => setSelectedGroup(null)} />
          ) : (
            <ActiveComponent {...activeProps} />
          )}
        </main>
      </SidebarInset>
    </div>
  );
}

export default function Home() {
  return (
    <SidebarProvider>
      <AppLayout />
    </SidebarProvider>
  );
}
