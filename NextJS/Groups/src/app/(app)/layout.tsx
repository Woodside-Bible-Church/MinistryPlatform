import { Navigation } from "@/components/Navigation";
import AuthWrapper from "@/components/AuthWrapper";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen">
      <AuthWrapper>
        <Navigation />
        <main className="flex-1">
          {children}
        </main>
      </AuthWrapper>
    </div>
  );
}