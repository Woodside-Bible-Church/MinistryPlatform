import Header from "@/components/Header";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col">
      {/* Auth is handled client-side by MPWidgetAuthWrapper in page components */}
      {children}
    </div>
  );
}