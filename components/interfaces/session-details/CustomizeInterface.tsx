import { useChat } from "@/hooks/useGeneration";
import { useGetMessages } from "@/hooks/useMessages";
import { getActiveSessionId } from "@/redux/sessionSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plane, Mountain, Coffee, Plus, Timer, MapPin } from "lucide-react";
import { setCurrentView, View } from "@/redux/viewSlice";

type ModificationOption = {
  icon: React.ReactNode;
  title: string;
  description: string;
  prompt: string;
};

export const CustomizeInterface = () => {
  const dispatch = useDispatch();
  const activeSessionId = useSelector(getActiveSessionId);
  const {
    data: messages,
    isLoading: messagesLoading,
    isSuccess: messagesSuccess,
  } = useGetMessages(activeSessionId);
  const chatMutation = useChat();

  const modificationOptions: ModificationOption[] = [
    {
      icon: <Mountain className="h-5 w-5" />,
      title: "More Adventurous",
      description: "Add more outdoor and adrenaline-pumping activities",
      prompt:
        "Please modify my trip to include more adventurous activities and destinations. Focus on outdoor activities and thrilling experiences.",
    },
    {
      icon: <Coffee className="h-5 w-5" />,
      title: "More Relaxing",
      description: "Focus on relaxation and wellness activities",
      prompt:
        "Please modify my trip to be more relaxing. Include more spa destinations, peaceful locations, and leisure activities.",
    },
    {
      icon: <Plus className="h-5 w-5" />,
      title: "Extend Trip",
      description: "Add more destinations to the itinerary",
      prompt:
        "Please add more destinations to my trip. I'd like to explore more places during this journey.",
    },
    {
      icon: <Timer className="h-5 w-5" />,
      title: "Longer Stay",
      description: "Spend more time at each destination",
      prompt:
        "Please modify the trip to allow more time at each destination. I'd like a more relaxed pace with fewer rushed transitions.",
    },
    {
      icon: <MapPin className="h-5 w-5" />,
      title: "Local Experience",
      description: "Focus on authentic local experiences",
      prompt:
        "Please modify my trip to include more authentic local experiences. I want to experience the culture and daily life of each destination.",
    },
    {
      icon: <Plane className="h-5 w-5" />,
      title: "Optimize Travel",
      description: "Optimize the travel route and connections",
      prompt:
        "Please optimize the travel route of my trip. Focus on efficient connections and travel times between destinations.",
    },
  ];

  const handleModification = async (option: ModificationOption) => {
    if (!activeSessionId) return;

    dispatch(setCurrentView(View.CurrentChat));

    try {
      await chatMutation.mutateAsync({
        sessionId: activeSessionId,
        message: option.prompt,
      });
    } catch (error) {
      console.error("Error modifying trip:", error);
    }
  };

  if (!messages?.length) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No trip details available
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-md font-semibold mb-4">
        How can I make your trip better?
      </h3>
      <div className="grid grid-cols-1 gap-4">
        <TooltipProvider>
          {modificationOptions.map((option) => (
            <Tooltip key={option.title}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-start gap-4 p-4 h-auto text-left w-full"
                  onClick={() => handleModification(option)}
                  disabled={chatMutation.isLoading}
                >
                  <div className="shrink-0 mt-1">{option.icon}</div>
                  <div>
                    <h4 className="font-medium">{option.title}</h4>
                  </div>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[200px]">
                <p>{option.description}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
    </div>
  );
};
