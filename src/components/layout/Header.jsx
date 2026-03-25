import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { MdLogout } from "react-icons/md";


export default function Header({ setOpen }) {

  return (
    <header className="h-14 border-b flex items-center justify-between px-4 md:px-6 bg-background">

      <div className="flex items-center gap-3">

        {/* MOBILE MENU */}
        <button
          className="md:hidden"
          onClick={() => setOpen(true)}
        >
          <Menu size={20} />
        </button>

        <h1 className="font-semibold text-sm md:text-base">
          CRM Dashboard
        </h1>

      </div>

      <Button
        size="sm"
        variant="destructive"
        onClick={() => {
          localStorage.removeItem("token");
          window.location.href = "/";
        }}
      >
       <MdLogout /> Logout
      </Button>

    </header>
  );
}