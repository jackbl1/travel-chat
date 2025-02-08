export default function PageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex bg-background h-screen">
      <div className="flex-1 flex">{children}</div>
    </div>
  );
}
