"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Send,
  BarChart2,
  Globe,
  Video,
  PlaneTakeoff,
  AudioLines,
} from "lucide-react";
import useDebounce from "@/hooks/useDebounce";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useDispatch } from "react-redux";
import { setCurrentView, View } from "@/redux/viewSlice";
import { setActiveSessionId } from "@/redux/sessionSlice";
import { useSupabase } from "@/contexts/SupabaseContext";
import { useAddSession, useGetSessions } from "@/hooks/useSessions";
import { useAddMessage } from "@/hooks/useMessages";
import { clearPendingQuery, savePendingQuery } from "@/lib/pendingQuery";

interface Action {
  id: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
  short?: string;
  end?: string;
}

interface SearchResult {
  actions: Action[];
}

const allActions = [
  {
    id: "1",
    label: "Trip to Peru",
    icon: <PlaneTakeoff className="h-4 w-4 text-blue-500" />,
    description: "",
    short: "",
    end: "Machu Picchu",
  },
  {
    id: "2",
    label: "Trip to Japan",
    icon: <BarChart2 className="h-4 w-4 text-orange-500" />,
    description: "",
    short: "",
    end: "Samurai Culture",
  },
  {
    id: "3",
    label: "Trip to France",
    icon: <Video className="h-4 w-4 text-purple-500" />,
    description: "",
    short: "",
    end: "Coffee, Croissants, Cigarettes",
  },
  {
    id: "4",
    label: "Trip to the Galapogos Islands",
    icon: <AudioLines className="h-4 w-4 text-green-500" />,
    description: "",
    short: "",
    end: "Turtles and Tortoises",
  },
  {
    id: "5",
    label: "Trip to Norway",
    icon: <Globe className="h-4 w-4 text-blue-500" />,
    description: "",
    short: "",
    end: "Northern Lights",
  },
];

export const NewChatInterface = () => {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const debouncedQuery = useDebounce(query, 200);

  const router = useRouter();
  const { toast } = useToast();

  const dispatch = useDispatch();
  const { user } = useSupabase();
  const { data: sessions } = useGetSessions(user?.id);
  const addSessionMutation = useAddSession();
  const addMessageMutation = useAddMessage();

  useEffect(() => {
    if (!isFocused) {
      setResult(null);
      return;
    }

    if (!debouncedQuery) {
      setResult({ actions: allActions });
      return;
    }

    const normalizedQuery = debouncedQuery.toLowerCase().trim();
    const filteredActions = allActions.filter((action) => {
      const searchableText = action.label.toLowerCase();
      return searchableText.includes(normalizedQuery);
    });

    setResult({ actions: filteredActions });
  }, [debouncedQuery, isFocused]);

  const handleCreateSession = async (content: string) => {
    savePendingQuery(content);
    if (!user?.id) {
      toast({
        title: "Sign in required",
        description: "Please sign in to continue chatting",
        variant: "default",
      });
      router.push("/sign-in");
      return;
    }
    console.log("creating session");

    try {
      console.log("creating session");
      const newSession = await addSessionMutation.mutateAsync({
        name: `Session ${(sessions?.length ?? 0) + 1}`,
        userId: user.id,
      });

      console.log("created session", newSession);

      if (newSession?.sessionId) {
        dispatch(setActiveSessionId(newSession.sessionId));
        dispatch(setCurrentView(View.CurrentChat));
      }
    } catch (error) {
      console.error("Error creating session:", error);
      clearPendingQuery();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("handleSubmit");
    e.preventDefault();
    console.log("submitting");
    console.log(query);
    if (query.trim()) {
      await handleCreateSession(query);
      setQuery("");
    }
  };

  const container = {
    hidden: { opacity: 0, height: 0 },
    show: {
      opacity: 1,
      height: "auto",
      transition: {
        height: {
          duration: 0.4,
        },
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: {
        height: {
          duration: 0.3,
        },
        opacity: {
          duration: 0.2,
        },
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
      },
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: {
        duration: 0.2,
      },
    },
  };

  // Reset selectedAction when focusing the input
  const handleFocus = () => {
    setSelectedAction(null);
    setIsFocused(true);
  };

  return (
    <div className="w-full max-w-xl mx-auto pt-8">
      <div className="relative flex flex-col justify-start items-center min-h-[300px]">
        <div className="w-full max-w-sm sticky top-0 bg-background z-10 pt-4 pb-1">
          <label
            className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block"
            htmlFor="search"
          >
            Ready for your next trip?
          </label>
          <div className="relative">
            <form onSubmit={handleSubmit}>
              <Input
                type="text"
                placeholder="Where can I take you?"
                value={query}
                onChange={handleInputChange}
                onFocus={handleFocus}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                className="pl-3 pr-9 py-1.5 h-9 text-sm rounded-lg focus-visible:ring-offset-0"
              />
            </form>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4">
              <AnimatePresence mode="popLayout">
                {query.length > 0 ? (
                  <motion.div
                    key="send"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Send className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="search"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Search className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="w-full max-w-sm">
          <AnimatePresence>
            {isFocused && result && !selectedAction && (
              <motion.div
                className="w-full border rounded-md shadow-sm overflow-hidden dark:border-gray-800 bg-white dark:bg-black mt-1"
                variants={container}
                initial="hidden"
                animate="show"
                exit="exit"
              >
                <motion.ul>
                  {result.actions.map((action) => (
                    <motion.li
                      key={action.id}
                      className="px-3 py-2 flex items-center justify-between hover:bg-gray-200 dark:hover:bg-zinc-900  cursor-pointer rounded-md"
                      variants={item}
                      layout
                      onClick={() => handleCreateSession(action.label)}
                    >
                      <div className="flex items-center gap-2 justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">{action.icon}</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {action.label}
                          </span>
                          <span className="text-xs text-gray-400">
                            {action.description}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {action.short}
                        </span>
                        <span className="text-xs text-gray-400 text-right">
                          {action.end}
                        </span>
                      </div>
                    </motion.li>
                  ))}
                </motion.ul>
                <div className="mt-2 px-3 py-2 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span></span>
                    <span>ESC to cancel</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
