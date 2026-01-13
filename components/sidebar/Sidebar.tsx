"use client";

import { Type, Image, Brain, PanelLeft } from "lucide-react";
import { useFlowStore } from "@/store/flowStore";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { WorkflowControls } from "@/components/flow/WorkflowControls";

export function Sidebar() {
  const addNode = useFlowStore((s) => s.addNode);
  const { toggleSidebar } = useSidebar();

  const items = [
    {
      title: "Text Node",
      type: "text",
      icon: Type,
    },
    {
      title: "Image Node",
      type: "image",
      icon: Image,
    },
    {
      title: "LLM Node",
      type: "llm",
      icon: Brain,
    },
  ];

  return (
    <ShadcnSidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center justify-between p-2">
          <span className="font-bold text-xl text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            Galaxy AI
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Nodes</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => addNode(item.type)}
                    tooltip={item.title}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {/* Footer with Workflow Controls */}
      <SidebarFooter className="p-2 border-t border-sidebar-border/50">
        <WorkflowControls />
      </SidebarFooter>
      <SidebarHeader className="hidden">
        <SidebarTrigger />
      </SidebarHeader>
    </ShadcnSidebar>
  );
}