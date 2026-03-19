import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function Sidebar({ open, setOpen }) {

  const location = useLocation();

  const menu = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Leads", path: "/leads" },
    { name: "Sales Team", path: "/sales-team" },
    { name: "Performance", path: "/performance" },
  ];

  return (
    <>
      {/* OVERLAY */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed md:static z-50 h-full w-64 bg-background border-r transform transition-transform",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >

        <div className="p-4 font-bold">CRM</div>

        <nav className="p-2 space-y-1">

          {menu.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setOpen(false)}
              className={cn(
                "block px-3 py-2 rounded-md text-sm",
                location.pathname === item.path
                  ? "bg-primary text-white"
                  : "hover:bg-muted"
              )}
            >
              {item.name}
            </Link>
          ))}

        </nav>

      </aside>
    </>
  );
}