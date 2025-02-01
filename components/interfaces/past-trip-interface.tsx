import React, { useEffect, useState } from "react";
import { useSupabase } from "@/contexts/SupabaseContext";

interface Session {
  id: string;
  name: string;
}

function PastTripInterface() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const { supabase, user } = useSupabase();

  useEffect(() => {
    const fetchSessions = async () => {
      if (!supabase) return;
      if (user) {
        const { data, error } = await supabase
          .from("sessions")
          .select("id, name")
          .eq("user_id", user.id);

        if (error) {
          console.error("Error fetching sessions:", error);
        } else {
          setSessions(data);
        }
      }
      setLoading(false);
    };
    if (supabase && user) fetchSessions();
  }, [supabase, user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Past Trips</h1>
      <ul>
        {sessions.map((session) => (
          <li key={session.id}>{session.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default PastTripInterface;
