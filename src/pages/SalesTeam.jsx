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

  const getPagination = (current, total) => {
    const delta = 1;
    const range = [];
    const result = [];

    for (let i = 1; i <= total; i++) {
      if (
        i === 1 ||
        i === total ||
        (i >= current - delta && i <= current + delta)
      ) {
        range.push(i);
      }
    }

    let prev;
    for (let i of range) {
      if (prev) {
        if (i - prev === 2) {
          result.push(prev + 1);
        } else if (i - prev > 2) {
          result.push("...");
        }
      }
      result.push(i);
      prev = i;
    }

    return result;
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
      <div className="flex flex-col gap-4 mb-6">
        {/* TOP */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* FILTERS */}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Input
              placeholder="Search..."
              className="w-full sm:w-52 bg-white/90"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
            />

            <select
              className="w-full sm:w-40 border rounded-md h-9 text-sm bg-white/90 px-2"
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

          {/* ACTION */}
          <Button className="w-full sm:w-auto" onClick={() => openModal()}>
            + Add Member
          </Button>
        </div>
      </div>

      {!loading ? (
        <>
          {/* DESKTOP TABLE */}
          <div className="hidden md:block border rounded-lg overflow-x-auto">
            <Table className="min-w-[600px]">
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
                        <Badge className="bg-red-100 text-red-700">
                          Inactive
                        </Badge>
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

          {/* MOBILE CARDS */}
          <div className="md:hidden flex flex-col gap-3">
            {team.map((user) => (
              <div
                key={user.sales_person_id}
                className="border rounded-lg p-3 bg-white shadow-sm"
              >
                <h3 className="font-semibold text-sm">{user.name}</h3>

                <p className="text-xs text-muted-foreground break-words">
                  {user.email}
                </p>

                <div className="mt-2">
                  {user.is_active ? (
                    <Badge className="bg-green-100 text-green-700">
                      Active
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-700">Inactive</Badge>
                  )}
                </div>

                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    className="flex-1"
                    variant="outline"
                    onClick={() => openModal(user)}
                  >
                    Edit
                  </Button>

                  <Button
                    size="sm"
                    className="flex-1"
                    variant="destructive"
                    onClick={() => deleteUser(user.sales_person_id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center items-center gap-2 mt-4 flex-wrap">
            {/* PREV */}
            <Button
              size="sm"
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Prev
            </Button>

            {/* PAGES */}
            {getPagination(page, lastPage).map((p, i) =>
              p === "..." ? (
                <span key={i} className="px-2 text-sm">
                  ...
                </span>
              ) : (
                <Button
                  key={i}
                  size="sm"
                  variant={page === p ? "default" : "outline"}
                  onClick={() => setPage(p)}
                  className="min-w-[36px]"
                >
                  {p}
                </Button>
              ),
            )}

            {/* NEXT */}
            <Button
              size="sm"
              variant="outline"
              disabled={page === lastPage}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </>
      ) : (
        <Loader type="table" />
      )}

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
