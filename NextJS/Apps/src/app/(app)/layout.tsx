import Header from "@/components/Header";
import AuthWrapper from "@/components/AuthWrapper";
import { CampusProvider } from "@/contexts/CampusContext";
import { MPWidgetsLoader } from "@/components/MPWidgetsLoader";
import { ToasterWrapper } from "@/components/ToasterWrapper";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen">
      <MPWidgetsLoader />
      <div className="print:hidden">
        <ToasterWrapper />
      </div>

      <AuthWrapper>
        <CampusProvider>
          <div className="print:hidden">
            <Header />
          </div>

          <main className="flex-1 mt-4 print:mt-0">
            {children}
          </main>
        </CampusProvider>
      </AuthWrapper>
    </div>
  );
}
