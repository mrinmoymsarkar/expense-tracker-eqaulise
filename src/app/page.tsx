
"use client";

import * as React from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { auth } from '@/lib/firebase';
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
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

import { EqualizeLogo } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import Dashboard from "@/components/dashboard";
import Expenses, { ExpenseForm } from "@/components/expenses";
import Groups from "@/components/groups";
import Settings from "@/components/settings";
import GroupDetail from "@/components/group-detail";
import { expenseData as initialExpenseData, groupData as initialGroupData } from "@/lib/data";
import { cn } from "@/lib/utils";

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
  const [isAddExpenseOpen, setIsAddExpenseOpen] = React.useState(false);
  const { user } = useAuth();

  const handleLogout = async () => {
    await auth.signOut();
  };

  const { isMobile, setOpenMobile } = useSidebar();
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
    setIsAddExpenseOpen(false);
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
                    size={isMobile ? "lg" : "default"}
                    onClick={() => {
                      setActiveView(view);
                      setSelectedGroup(null);
                      if (isMobile) {
                        setOpenMobile(false);
                      }
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
              <SidebarMenuButton onClick={handleLogout} size={isMobile ? "lg" : "default"} tooltip={{children: 'Logout'}}>
                <LogOut />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
               <div className={cn(
                  "transition-colors rounded-md",
                  isMobile
                  ? "flex-col items-center gap-2 p-4 text-center"
                  : "flex items-center gap-2 p-2"
                )}>
                  <Avatar className={cn("transition-all", isMobile ? "h-16 w-16" : "h-8 w-8")}>
                    <AvatarImage src={user?.photoURL || "https://placehold.co/40x40.png"} alt={user?.displayName || "User"} data-ai-hint="profile picture" />
                    <AvatarFallback>{user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : user?.email?.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "flex flex-col",
                    isMobile ? "items-center" : ""
                  )}>
                    <span className={cn("font-medium", isMobile ? "text-base" : "text-sm")}>{user?.displayName || user?.email}</span>
                    <span className={cn("text-muted-foreground", isMobile ? "text-sm" : "text-xs")}>
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
            {isMobile && <SidebarTrigger />}
            <h2 className="font-headline text-xl font-semibold truncate">
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
      
      {['dashboard', 'expenses', 'groups'].includes(activeView) && !selectedGroup && (
        <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
          <DialogTrigger asChild>
            <Button className="fixed bottom-6 right-6 z-10 h-14 w-14 rounded-full shadow-lg md:h-auto md:w-auto md:rounded-md md:px-4 md:py-2">
              <Plus className="h-6 w-6 md:mr-2 md:h-4 md:w-4" />
              <span className="hidden md:inline">Add Expense</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl max-h-[90vh] overflow-y-auto">
            <ExpenseForm setOpen={setIsAddExpenseOpen} addExpense={addExpense} groups={groups} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    // AuthProvider shows a loading spinner, so we can return null here
    // to prevent flashing the login page while the user is being authenticated.
    return null;
  }

  return (
    <SidebarProvider>
      <AppLayout />
    </SidebarProvider>
  );
}
