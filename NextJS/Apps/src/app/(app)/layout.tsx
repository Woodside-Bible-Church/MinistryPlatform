import Header from "@/components/Header";
import AuthWrapper from "@/components/AuthWrapper";
import { CampusProvider } from "@/contexts/CampusContext";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen">
      <AuthWrapper>
        <CampusProvider>
          <Header />

        <main className="flex-1 mt-24 md:mt-16">
          {children}
        </main>
        </CampusProvider>
      </AuthWrapper>
    </div>
  );
}
