import SideNav from "@/components/SideNav";
import TopBar from "@/components/TopBar";

export default function DashboardLayout({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="bg-surface text-on-surface selection:bg-primary-container selection:text-on-primary-container">
      <SideNav />
      <TopBar title={title} subtitle={subtitle} />
      <main className="ml-64 pt-20 p-8 min-h-screen">{children}</main>
    </div>
  );
}
