
import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, Sidebar, SidebarContent, SidebarTrigger, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Home, Dumbbell, MessageCircle, FileText, Settings, User, LogOut, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const AppLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: Dumbbell, label: "Workouts", path: "/workouts" },
    { icon: CalendarCheck, label: "History", path: "/history" },
    { icon: FileText, label: "Plans", path: "/plans" },
    { icon: MessageCircle, label: "Chat", path: "/chat" },
    { icon: User, label: "Profile", path: "/profile" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full fitness-gradient-bg">
        <Sidebar className="fitness-sidebar">
          <div className="py-6">
            <div className="px-4 py-3 flex items-center">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full fitness-icon-bg">
                  <Dumbbell className="h-6 w-6 text-fitness-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold fitness-gradient-text">FitTrack AI</h1>
              </div>
            </div>
          </div>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton asChild>
                        <button
                          onClick={() => navigate(item.path)}
                          className="w-full flex items-center gap-3"
                        >
                          <item.icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-auto pb-4">
              <SidebarGroupContent>
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-4 p-3 rounded-lg fitness-bg-secondary/50">
                    <Avatar className="ring-2 ring-fitness-primary/20">
                      <AvatarFallback className="fitness-avatar-bg">
                        {user ? getInitials(user.fullname || user.username) : "FT"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{user?.fullname || user?.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {user?.fitness_level || "Set fitness level"}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-2 hover:fitness-border/50 transition-all duration-200" 
                    onClick={logout}
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </Button>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 min-h-screen">
          <div className="p-4">
            <SidebarTrigger>
              <Button variant="outline" size="icon" className="md:hidden border-2 hover:fitness-border/50 transition-all duration-200">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
                <span className="sr-only">Toggle sidebar</span>
              </Button>
            </SidebarTrigger>
          </div>

          <main className="container mx-auto p-4 pt-0">
            <div className="space-y-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
