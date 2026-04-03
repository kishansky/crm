import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import Company from "../ui/Company";

export default function Sidebar({ open, setOpen }) {
  const location = useLocation();

  // ✅ Get role
  const role = localStorage.getItem("role");

  // ✅ Menu based on role
  const adminMenu = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Leads", path: "/leads", match: ["/leads", "/lead"] },
    { name: "Sales Team", path: "/sales-team" },
    { name: "Performance", path: "/performance" },
  ];

  const salesMenu = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Leads", path: "/leads", match: ["/leads", "/lead"] },
  ];

  const menu = role === "admin" ? adminMenu : salesMenu;

  const isActive = (item) => {
    if (item.match) {
      return item.match.some((p) =>
        location.pathname.startsWith(p)
      );
    }
    return location.pathname.startsWith(item.path);
  };

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
          "fixed md:static z-50 h-full w-48 bg-background border-r transform transition-transform flex flex-col",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* TOP */}
        <div className="h-14 p-4 font-bold border-b">
          CRM ({role})
        </div>

        {/* MENU */}
        <nav className="p-2 space-y-1">
          {menu.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setOpen(false)}
              className={cn(
                "block px-3 py-2 rounded-md text-sm",
                isActive(item)
                  ? "bg-primary text-white hover:bg-primary/90"
                  : "hover:bg-muted"
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* <Company /> */}
      </aside>
    </>
  );
}