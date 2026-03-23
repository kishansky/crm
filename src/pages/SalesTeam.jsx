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

export default function SalesTeam() {
  const [team, setTeam] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeam();
  }, []);

  // ✅ FETCH
  const fetchTeam = async () => {
    try {
      const res = await api.get("/sales-team");
      setTeam(res.data);
      setLoading(false);
    } catch {
      toast.error("Failed to load team");
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

    if (loading) {
      return (<DashboardLayout>
        <div className="flex flex-col md:flex-row gap-3 md:justify-between mb-6">
        <h1 className="text-xl md:text-2xl font-semibold">Sales Team</h1>

        <Button onClick={() => openModal()}>+ Add Member</Button>
      </div>
        <Loader type="table"/>
      </DashboardLayout>)
  }
  
  

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="flex flex-col md:flex-row gap-3 md:justify-between mb-6">
        <h1 className="text-xl md:text-2xl font-semibold">Sales Team</h1>

        <Button onClick={() => openModal()}>+ Add Member</Button>
      </div>

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
                    Edit
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteUser(user.sales_person_id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* MODAL */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Sale Team" : "Add Sale Team"}</DialogTitle>
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
