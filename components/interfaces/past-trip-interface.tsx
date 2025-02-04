import React from "react";
import { useSupabase } from "@/contexts/SupabaseContext";
import { useSelector } from "react-redux";
import { getActiveSessionId } from "@/redux/itinerarySlice";
import { useGetSessions } from "@/hooks/useSessions";

function PastTripInterface() {
  const activeSessionId = useSelector(getActiveSessionId);
  const { user } = useSupabase();
  const { data: sessions, isLoading } = useGetSessions(user?.id ?? "");

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Past Trips</h1>
      <ul>
        {sessions?.map((session) => (
          <li
            key={session.sessionId}
            className={
              session.sessionId == activeSessionId
                ? "bg-slate-500"
                : "bg-slate-400"
            }
          >
            {session.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PastTripInterface;
