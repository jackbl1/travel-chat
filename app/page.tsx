import PageLayout from "./page-layout";
import ChatInterface from "./chat-interface";

export default function Page() {
  // const [currentView, setCurrentView] = useState("current-chat");

  // const renderContent = () => {
  //   switch (currentView) {
  //     case "current-chat":
  //       return <ChatInterface />;
  //     case "itinerary":
  //       return <div>Itinerary Content</div>;
  //     case "map":
  //       return <div>Map Content</div>;
  //     case "past-trips":
  //       return <div>Past Trips Content</div>;
  //     default:
  //       return <div>Current Chat Content</div>;
  //   }
  // };

  return (
    <PageLayout>
      <ChatInterface />
    </PageLayout>
  );
}
