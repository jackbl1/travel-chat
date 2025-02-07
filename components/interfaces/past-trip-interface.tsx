import React, { useState } from "react";
import { useSupabase } from "@/contexts/SupabaseContext";
import { useSelector, useDispatch } from "react-redux";
import { getActiveSessionId, setActiveSessionId } from "@/redux/itinerarySlice";
import { setCurrentView, View } from "@/redux/viewSlice";
import { useGetSessions } from "@/hooks/useSessions";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

function PastTripInterface() {
  const activeSessionId = useSelector(getActiveSessionId);
  const dispatch = useDispatch();
  const { user } = useSupabase();
  const { data: sessions, isLoading } = useGetSessions(user?.id ?? "");
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(
    null
  );

  const handleSessionClick = (sessionId: string) => {
    dispatch(setActiveSessionId(sessionId));
    dispatch(setCurrentView(View.CurrentChat));
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  console.log("rendering with expanded session id:", expandedSessionId);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Past Trips</h1>
      <ul className="grid gap-4">
        {sessions?.map((session) => (
          <li key={session.sessionId}>
            <div
              className={`w-full rounded-lg shadow-md transition-transform transform hover:scale-105
                ${
                  session.sessionId == activeSessionId
                    ? "bg-gray-200 text-gray-700"
                    : "bg-gray-400 text-gray-800"
                }
                ${
                  expandedSessionId === session.sessionId ? "bg-gray-300" : ""
                }`}
            >
              <button
                className="w-full p-4 text-left hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 rounded-lg"
                onClick={() => handleSessionClick(session.sessionId)}
                aria-label={`View session ${session.name}`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{session.name}</span>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-4">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      className="p-1 rounded-full hover:bg-gray-400 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedSessionId(
                          expandedSessionId === session.sessionId
                            ? null
                            : session.sessionId
                        );
                      }}
                    >
                      {expandedSessionId === session.sessionId ? (
                        <ChevronUpIcon className="w-5 h-5" />
                      ) : (
                        <ChevronDownIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </button>
              {expandedSessionId === session.sessionId && (
                <div className="px-4 pb-4 border-t border-gray-400 mt-2 pt-2">
                  <h2 className="text-lg font-semibold mb-2">
                    Session Details
                  </h2>
                  <p className="text-sm text-gray-600">
                    Locations: {session.locations?.map((loc) => loc).join(", ")}
                  </p>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PastTripInterface;
