import { InterfaceWindow } from "@/components/interfaces/InterfaceWindow";
import PageLayout from "./page-layout";
import { SessionDetailPanel } from "@/components/interfaces/SessionDetailPanel";
import HeaderAuth from "@/components/header-auth";
import { NavPanel } from "@/components/interfaces/NavPanel";

export default function Page() {
  return (
    <PageLayout>
      <div className="flex-1 flex">
        <NavPanel />
        <InterfaceWindow />
        <div className="w-80 border-l flex flex-col">
          <div className="h-14 border-b px-4 flex items-center">
            <HeaderAuth />
          </div>
          <SessionDetailPanel />
        </div>
      </div>
    </PageLayout>
  );
}
