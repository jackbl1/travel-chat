import { Button } from "@/components/ui/button";
import HeaderAuth from "@/components/header-auth";

export default function PageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex bg-background">
      {/* Main Content */}
      <div className="flex-1 flex">
        <div className="flex-1 flex flex-col">{children}</div>

        {/* Right Panel */}
        <div className="w-80 border-l">
          <div className="h-14 border-b px-4 flex items-center">
            <HeaderAuth />
          </div>
          <div className="h-14 border-b px-4 flex items-center">
            <h2 className="font-medium">Conversation details</h2>
          </div>
          <div className="p-4">
            <div className="flex gap-4 border-b pb-4">
              <Button variant="secondary" size="sm" className="rounded-full">
                Actions
              </Button>
              <Button variant="ghost" size="sm" className="rounded-full">
                Customer
              </Button>
              <Button variant="ghost" size="sm" className="rounded-full">
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
