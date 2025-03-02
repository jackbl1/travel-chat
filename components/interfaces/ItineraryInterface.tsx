import { useEffect, useState } from "react";
import { useGenerateItinerary } from "@/hooks/useGeneration";
import { Card } from "@/components/ui/card";
import { Loader2, PlaneTakeoff, Plus } from "lucide-react";
import { getActiveSessionId } from "@/redux/sessionSlice";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "../ui/button";
import { setCurrentView, View } from "@/redux/viewSlice";

export const ItineraryInterface = () => {
  const dispatch = useDispatch();
  const activeSessionId = useSelector(getActiveSessionId);
  const [savedItinerary, setSavedItinerary] = useState<string>("");
  const {
    mutate: generateItinerary,
    isLoading,
    error,
  } = useGenerateItinerary();

  useEffect(() => {
    if (activeSessionId) {
      const saved = localStorage.getItem(`itinerary-${activeSessionId}`);
      if (saved) {
        setSavedItinerary(saved);
      } else {
        generateItinerary(
          {
            sessionId: activeSessionId,
          },
          {
            onSuccess: (data) => {
              localStorage.setItem(`itinerary-${activeSessionId}`, data);
              setSavedItinerary(data);
            },
          }
        );
      }
    }
  }, [activeSessionId, generateItinerary]);

  if (error) {
    return (
      <div className="h-full w-full flex justify-center pt-12">
        <Card className="p-8 bg-red-50 border-red-200 flex flex-col items-center justify-center space-y-4 w-[400px] h-[240px]">
          <div className="text-red-600 text-center flex flex-col items-center space-y-4">
            <p className="text-lg font-medium">
              An error occurred while generating your itinerary
            </p>
            <p className="text-sm">
              Please refresh or click the button to try again.
            </p>
            <Button
              variant={"outline"}
              onClick={() => {
                localStorage.removeItem(`itinerary-${activeSessionId}`);
                generateItinerary({ sessionId: activeSessionId ?? "" });
              }}
              className="mt-2"
            >
              Generate New Itinerary
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-8 flex flex-col items-center justify-center space-y-4 min-h-[400px] w-full bg-muted/5">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground text-sm">
          Crafting your perfect itinerary...
        </p>
      </Card>
    );
  }

  if (!savedItinerary || !activeSessionId) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full text-center px-4">
        <PlaneTakeoff className="h-16 w-16 text-gray-700 mb-4" />
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">
          No destinations yet
        </h2>
        <p className="text-gray-500 mb-8 max-w-md">
          Start planning your first adventure! Chat with TravelChat to begin
          exploring destinations and crafting your perfect itinerary.
        </p>
        <Button
          onClick={() => dispatch(setCurrentView(View.NewChat))}
          className="flex items-center gap-2 bg-gray-700"
        >
          <Plus className="h-4 w-4" />
          Plan a New Adventure
        </Button>
      </div>
    );
  }

  return (
    <div className="p-2 w-full h-full flex flex-col items-center justify-center">
      <Card className="p-12 max-w-4xl mx-auto bg-[#FDF6E4] border-stone-200 shadow-lg overflow-y-auto">
        <article className="prose prose-stone max-w-none">
          <header className="text-center mb-12 border-b border-stone-300 pb-8">
            <h1 className="font-serif text-5xl tracking-widest text-stone-800 mb-4 uppercase leading-tight">
              Travel Itinerary
            </h1>
            <div className="font-serif text-stone-500 text-sm tracking-wide">
              A Curated Journey •{" "}
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </header>

          <div className="font-serif leading-loose whitespace-pre-wrap text-stone-700 [text-wrap:balance] columns-1 md:columns-2 gap-8 text-base">
            {savedItinerary.split("\n\n").map((paragraph, i) => (
              <p key={i} className="mb-6">
                {paragraph}
              </p>
            ))}
          </div>

          <footer className="mt-12 pt-6 border-t border-stone-200 text-center">
            <div className="text-stone-500 text-xs tracking-wider uppercase">
              Generated with care by TripGen •{" "}
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </footer>
        </article>
      </Card>
    </div>
  );
};
