import { Sidebar, TabBar } from "@/components/nav";

/** Signed-in shell: sidebar from lg up, bottom tab bar below. */
export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-60 shrink-0 border-r border-line bg-paper lg:block print:hidden">
        <Sidebar />
      </aside>
      <main className="flex min-w-0 flex-1 flex-col gap-8 px-5 pt-8 pb-32 sm:px-[clamp(20px,3.5vw,56px)] lg:pt-10 lg:pb-14">
        {children}
      </main>
      <div className="lg:hidden print:hidden">
        <TabBar />
      </div>
    </div>
  );
}
