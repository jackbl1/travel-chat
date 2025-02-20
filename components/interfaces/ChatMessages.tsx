import { cn } from "@/lib/utils";
import { formatMessageDate } from "@/lib/utils";
import Image from "next/image";
import { MessageInterface } from "@/lib/types";
import { UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Copy, Download, ThumbsDown, ThumbsUp } from "lucide-react";

interface ChatMessagesProps {
  firstMessageSent: boolean;
  startAnimation: boolean;
  defaultMessage: MessageInterface;
  messages: MessageInterface[];
}

export const ChatMessages = ({
  firstMessageSent,
  startAnimation,
  defaultMessage,
  messages,
}: ChatMessagesProps) => {
  return (
    <div className="space-y-4">
      {!firstMessageSent && (
        <div
          className="flex gap-2 max-w-[80%] transition-all duration-500 ease-in-out"
          style={{
            opacity: 1,
            transform: "translateY(0)",
          }}
        >
          <Image
            src="/icon.webp"
            alt="Icon"
            className="h-6 w-6 rounded-full"
            width={32}
            height={32}
          />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Travel Chat</span>
              <span className="text-sm text-muted-foreground">
                {formatMessageDate(defaultMessage.createdAt)}
              </span>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm whitespace-pre-wrap">
                {defaultMessage.content}
              </p>
            </div>
          </div>
        </div>
      )}
      {messages?.map((message, index) => (
        <div
          key={index}
          className={cn(
            "flex gap-2 max-w-[80%] transition-all duration-500 ease-in-out",
            message.role === "user" && "ml-auto justify-end"
          )}
          style={{
            opacity: startAnimation ? 1 : 0,
            transform: startAnimation ? "translateY(0)" : "translateY(20px)",
            transitionDelay: `${index * 200}ms`,
          }}
        >
          {message.role === "agent" && (
            <Image
              src="/icon.webp"
              alt="Icon"
              className="h-6 w-6 rounded-full"
              width={32}
              height={32}
            />
          )}
          {message.role === "user" && (
            <UserIcon className="h-4 w-4 rounded-full" />
          )}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {message.role === "agent" ? "Travel Chat" : "User"}
              </span>
              <span className="text-sm text-muted-foreground">
                {formatMessageDate(message.createdAt)}
              </span>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
            {message.role === "agent" && (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ThumbsUp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ThumbsDown className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export const LoadingMessage = () => {
  return (
    <div className="flex gap-2 max-w-[80%] transition-all duration-500 ease-in-out">
      <Image
        src="/icon.webp"
        alt="Icon"
        className="h-6 w-6 rounded-full"
        width={32}
        height={32}
      />
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Travel Chat</span>
        </div>
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-sm whitespace-pre-wrap">Loading...</p>
        </div>
      </div>
    </div>
  );
};

export const ErrorMessage = () => {
  return (
    <div className="flex gap-2 max-w-[80%] transition-all duration-500 ease-in-out">
      <Image
        src="/icon.webp"
        alt="Icon"
        className="h-6 w-6 rounded-full"
        width={32}
        height={32}
      />
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Travel Chat</span>
        </div>
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-sm whitespace-pre-wrap">
            An error occurred while processing your request, please try again or
            contact Jack
          </p>
        </div>
      </div>
    </div>
  );
};
