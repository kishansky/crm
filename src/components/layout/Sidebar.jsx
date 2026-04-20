import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  PhoneCall,
  BarChart3,
  Settings,
  MapPin,
  Lock,
  Link as LinkIcon,
} from "lucide-react";

export default function Sidebar({ open, setOpen }) {
  const location = useLocation();
  const role = localStorage.getItem("role");

  const adminMenu = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Leads", path: "/leads", icon: Users, match: ["/leads", "/lead"] },
    { name: "Follow-Up", path: "/follow-up", icon: PhoneCall },
    { name: "Sales Team", path: "/sales-team", icon: Users },
    { name: "Team Reports", path: "/team-status-reports", icon: BarChart3 },
    // { name: "Performance", path: "/performance", icon: BarChart3 },
    { name: "Status", path: "/status", icon: Settings },
    { name: "Places", path: "/places", icon: MapPin },
    { name: "Change Password", path: "/change-password", icon: Lock },
    { name: "Form Links", path: "/links", icon: LinkIcon },
  ];

  const salesMenu = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Leads", path: "/leads", icon: Users, match: ["/leads", "/lead"] },
    { name: "Follow-Up", path: "/follow-up", icon: PhoneCall },
    { name: "My Reports", path: "/team-status-reports", icon: BarChart3 },
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
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed md:static z-50 h-full w-52 bg-white border-r shadow-sm flex flex-col transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* HEADER / BRAND */}
        <div className="h-16 flex items-center gap-3 px-4 border-b">
          <div className="h-9 w-9 flex items-center justify-center rounded-lg 
            bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold">
            C
          </div>

          <div className="flex flex-col leading-tight">
            <span className="font-semibold text-sm">CRM Panel</span>
            <span className="text-xs text-gray-500 capitalize">
              {role}
            </span>
          </div>
        </div>

        {/* MENU */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menu.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  active
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <Icon size={16} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* FOOTER */}
        <div className="p-3 border-t text-xs text-gray-400 text-center">
          © {new Date().getFullYear()} CRM System
        </div>
      </aside>
    </>
  );
}