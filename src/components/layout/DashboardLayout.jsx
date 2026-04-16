import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function DashboardLayout({ children }) {

  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen">

      <Sidebar open={open} setOpen={setOpen} />

      <div className="flex-1 flex flex-col">

        <Header setOpen={setOpen} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/40 w-full overflow-x-scroll">
          {children}
        </main>

      </div>

    </div>
  );
}