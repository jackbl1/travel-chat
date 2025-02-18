import React, { useState } from "react";
import { useSupabase } from "@/contexts/SupabaseContext";
import { useSelector, useDispatch } from "react-redux";
import { getActiveSessionId, setActiveSessionId } from "@/redux/sessionSlice";
import { setCurrentView, View } from "@/redux/viewSlice";
import { useDeleteSession, useGetSessions } from "@/hooks/useSessions";
import { ArrowUpRight, PlaneTakeoff, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export const PastTripInterface = () => {
  const activeSessionId = useSelector(getActiveSessionId);
  const dispatch = useDispatch();
  const { user } = useSupabase();
  const { data: sessions, isLoading } = useGetSessions(user?.id);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(
    null
  );

  const deleteSessionMutation = useDeleteSession();

  const handleDeleteSession = async (sessionId: string) => {
    await deleteSessionMutation.mutateAsync({
      sessionId,
      userId: user?.id ?? "",
    });

    // Clear active session if deleting the currently active one
    if (activeSessionId === sessionId) {
      dispatch(setActiveSessionId(null));
    }
  };

  const handleSessionClick = (sessionId: string) => {
    dispatch(setActiveSessionId(sessionId));
    dispatch(setCurrentView(View.CurrentChat));
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full text-center px-4">
        <PlaneTakeoff className="h-16 w-16 text-gray-700 mb-4" />
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">
          No trips yet
        </h2>
        <p className="text-gray-500 mb-8 max-w-md">
          Start planning your first adventure! Create a new chat to begin
          exploring destinations and crafting your perfect itinerary.
        </p>
        <Button
          onClick={() => dispatch(setCurrentView(View.NewChat))}
          className="flex items-center gap-2 bg-gray-700"
        >
          <Plus className="h-4 w-4" />
          Start New Trip
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 w-full overflow-y-auto">
      <h1 className="text-2xl font-bold mb-4">Past Trips</h1>
      <ul className="grid gap-4">
        {sessions?.map((session) => (
          <li
            className="flex flex-row gap-x-2 items-start"
            key={session.sessionId}
          >
            <div
              className={`w-auto rounded-lg shadow-md transition-transform duration-200 transform hover:scale-[102%]
                ${
                  session.sessionId == activeSessionId
                    ? "bg-gray-200 text-gray-700 ring-2 ring-gray-500"
                    : "bg-gray-200 text-gray-800"
                }
                ${
                  expandedSessionId === session.sessionId ? "bg-gray-300" : ""
                }`}
            >
              <div
                className="w-full p-4 text-left hover:bg-gray-300 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-gray-500 rounded-lg cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch(setActiveSessionId(session.sessionId));
                  setExpandedSessionId(
                    expandedSessionId === session.sessionId
                      ? null
                      : session.sessionId
                  );
                }}
                aria-label={`View session ${session.name}`}
              >
                <div className="flex justify-between items-center gap-x-4">
                  <span className="font-medium">{session.name}</span>
                  <div className="flex items-center">
                    <button
                      className="p-1 rounded-md hover:bg-gray-400 transition-colors"
                      onClick={() => {
                        handleSessionClick(session.sessionId);
                      }}
                    >
                      <ArrowUpRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
              {expandedSessionId === session.sessionId && (
                <div className="px-4 pb-4 border-t border-gray-400 mt-2 pt-2">
                  <h2 className="text-sm font-semibold mb-2">
                    Session Details
                  </h2>
                  <span className="text-sm text-gray-500 mr-4">
                    {new Date(session.createdAt).toLocaleDateString()}
                  </span>
                  <p className="text-sm text-gray-600">
                    Locations: {session.locations?.map((loc) => loc).join(", ")}
                  </p>
                </div>
              )}
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  className="p-1.5 mt-4 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                  aria-label="Delete session"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Are you sure you want to delete this trip?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. All chat history and saved
                    locations will be permanently deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDeleteSession(session.sessionId)}
                  >
                    Delete Trip
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </li>
        ))}
      </ul>
    </div>
  );
};
