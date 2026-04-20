import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { MdLogout } from "react-icons/md";

export default function Header({ setOpen }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
    const role = localStorage.getItem("role");

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  return (
    <header className="h-16 px-4 md:px-6 flex items-center justify-between 
      backdrop-blur bg-white/70 border-b shadow-sm sticky top-0 z-30">

      {/* LEFT */}
      <div className="flex items-center gap-3">

        {/* MOBILE MENU */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
          onClick={() => setOpen(true)}
        >
          <Menu size={20} />
        </button>

        {/* TITLE */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 flex items-center justify-center rounded-lg 
            bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold">
            C
          </div>

          <h1 className="font-semibold text-sm md:text-base tracking-wide">
            CRM Dashboard
          </h1>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3">

        {/* USER INFO */}
        <div className="hidden sm:flex items-center gap-3 bg-gray-100 px-3 py-1.5 rounded-full">

          {/* Avatar */}
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white flex items-center justify-center text-xs font-bold">
            {initials}
          </div>

          {/* Name + Role */}
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-semibold">
              {user?.name || "User"}
            </span>
            <span className="text-[10px] text-gray-500 capitalize">
              {role || "role"}
            </span>
          </div>
        </div>

        {/* LOGOUT */}
        <Button
          size="sm"
          className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white shadow-sm"
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/";
          }}
        >
          <MdLogout size={16} />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}