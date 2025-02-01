import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import {
  LayoutGrid,
  Settings,
  Users,
  SettingsIcon as Functions,
  Layers,
  Eye,
  BarChart2,
  X,
} from "lucide-react";

export default function PageLayout({
  children,
  setCurrentView,
}: {
  children: React.ReactNode;
  setCurrentView: (view: string) => void;
}) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-muted/10">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Image
              src="/icon.webp"
              alt="Icon"
              className="h-6 w-6 rounded-full"
              width={32}
              height={32}
            />
            <span className="font-semibold">Trip-Gen-Bot-ZX3000</span>
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-64px)]">
          <div className="space-y-4 p-4">
            <nav className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setCurrentView("current-chat")}
              >
                <LayoutGrid className="mr-2 h-4 w-4" />
                Current Chat
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setCurrentView("itinerary")}
              >
                <Functions className="mr-2 h-4 w-4" />
                Itinerary
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setCurrentView("map")}
              >
                <Layers className="mr-2 h-4 w-4" />
                Map
              </Button>
            </nav>
            <div className="pt-4 border-t">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setCurrentView("past-trips")}
              >
                <BarChart2 className="mr-2 h-4 w-4" />
                Past Trips
              </Button>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-14 border-b px-4 flex items-center justify-between">
            <h1 className="text-sm font-medium">insert name of trip here</h1>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                Save conversation
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </header>
          {children}
        </div>

        {/* Right Panel */}
        <div className="w-80 border-l">
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
