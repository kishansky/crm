import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import api from "../api/axios";
import toast from "react-hot-toast"; // ✅ ADD THIS

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Loader from "@/components/ui/Loader";
import { MdDelete, MdEdit } from "react-icons/md";

export default function SalesTeam() {
  const [team, setTeam] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    search: "",
    is_active: "",
  });

  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.search.length === 0 || filters.search.length >= 3) {
        setDebouncedSearch(filters.search);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    fetchTeam(page);
  }, [page, debouncedSearch, filters.is_active]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.is_active]);

  // ✅ FETCH
  const fetchTeam = async (pageNum = 1) => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: pageNum,
        search: debouncedSearch || "",
        is_active: filters.is_active,
      });

      const res = await api.get(`/sales-team?${params}`);

      setTeam(res.data.data);
      setLastPage(res.data.last_page);
    } catch {
      toast.error("Failed to load team");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (user = null) => {
    if (user) {
      setForm(user);
      setEditing(user.sales_person_id);
    } else {
      setForm({});
      setEditing(null);
    }
    setOpen(true);
  };

  // ✅ SAVE (CREATE + UPDATE)
  const saveUser = async () => {
    try {
      if (editing) {
        await api.put(`/sales-team/${editing}`, form);
        toast.success("Member updated ✅");
      } else {
        await api.post("/sales-team", {
          ...form,
          sales_person_id: "SP" + Date.now(),
        });
        toast.success("Member added 🚀");
      }

      setOpen(false);
      setForm({});
      setEditing(null);
      fetchTeam();
    } catch {
      toast.error("Error saving member ❌");
    }
  };

  // ✅ DELETE
  const deleteUser = async (id) => {
    if (!confirm("Delete this user?")) return;

    try {
      await api.delete(`/sales-team/${id}`);
      toast.success("Deleted successfully 🗑️");
      fetchTeam();
    } catch {
      toast.error("Delete failed ❌");
    }
  };

  // if (loading) {
  //   return (
  //     <DashboardLayout>
        
  //       <Loader type="table" />
  //     </DashboardLayout>
  //   );
  // }

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="flex flex-col md:flex-row gap-3 md:justify-between mb-6">
          {/* <h1 className="text-xl md:text-2xl font-semibold">Sales Team</h1> */}
          <div className="flex flex-col md:flex-row gap-3 md:justify-between mb-6">
            <div className="flex gap-3 flex-wrap">
              <Input
                placeholder="Search..."
                className="w-full md:w-52 bg-white/90"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
              />

              <select
                className="border rounded-md h-8 text-sm bg-white/90"
                value={filters.is_active}
                onChange={(e) =>
                  setFilters({ ...filters, is_active: e.target.value })
                }
              >
                <option value="">All Status</option>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>

          </div>
          <Button onClick={() => openModal()}>+ Add Member</Button>
      </div>
      
      {
        !loading ? (<>
        {/* TABLE */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {team.map((user) => (
              <TableRow key={user.sales_person_id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>

                <TableCell>
                  {user.is_active ? (
                    <Badge className="bg-green-100 text-green-700">
                      Active
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-700">Inactive</Badge>
                  )}
                </TableCell>

                <TableCell className="text-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openModal(user)}
                  >
                   <MdEdit /> Edit
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteUser(user.sales_person_id)}
                  >
                    <MdDelete /> Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
      </div>
      <div className="flex justify-center gap-2 mt-4 flex-wrap">
          {[...Array(lastPage)].map((_, i) => (
            <Button
              key={i}
              variant={page === i + 1 ? "default" : "outline"}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </Button>
          ))}
          </div>
        </>) : <Loader type="table" />
      }

      

      {/* MODAL */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Sale Team" : "Add Sale Team"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              placeholder="Name"
              value={form.name || ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <Input
              placeholder="Email"
              value={form.email || ""}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              placeholder="Password"
              value={form.password || ""}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />

            <select
              className="border rounded p-2 w-full"
              value={
                form.is_active === true || form.is_active === 1 ? "1" : "0"
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  is_active: e.target.value === "1" ? 1 : 0, // ✅ send number
                })
              }
            >
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>

            <Button onClick={saveUser} className="w-full">
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
