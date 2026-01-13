import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Sidebar as SidebarBase } from "@/components/sidebar/Sidebar";
import FlowClient from "@/components/flow/FlowClient";

export default function FlowPage() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-[#0B0F14]">
        <SidebarBase />
        <SidebarInset>
          <FlowClient />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}