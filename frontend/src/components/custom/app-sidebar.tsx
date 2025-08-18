import { Home, Settings } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Profile from "./Profile";
import { FaMoneyBill } from "react-icons/fa";

type AppSidebarProps = {
  onTabChange: (tab: string) => void;
};

const items = [
  {
    title: "Project",
    icon: Home,
  },
  {
    title: "Prompt",
    icon: Settings,
  },
  {
    title: "Recharge",
    icon: FaMoneyBill,
  },
];

export function AppSidebar({ onTabChange }: AppSidebarProps) {
  const [activeTab, setActiveTab] = useState("Project");

  const handleTabChange = (tab: string) => {
    if (tab === "Project") {
      window.location.reload();
    }
    setActiveTab(tab);
    onTabChange(tab);
  };

  return (
    <Sidebar className="w-60 min-h-screen bg-[#1E1E1E] text-white">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center p-4">
            <Image src="/logo.png" alt="columsprout" width={200} height={50} />
          </SidebarGroupLabel>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="mt-4">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild onClick={() => handleTabChange(item.title)}>
                    <button
                      className={`flex items-center gap-3 px-4 py-2 ${
                        activeTab === item.title ? "bg-gray-700" : ""
                      } text-white hover:bg-gray-700 rounded-lg`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="absolute bottom-4 left-4 flex items-center gap-2 flex-col">
          <Profile />
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
