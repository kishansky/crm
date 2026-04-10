"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useEffect, useState } from "react";
// import axios from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import api from "@/api/axios";
import { Badge } from "@/components/ui/badge";
import { FaRegEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";

export default function Status() {
  const [statuses, setStatuses] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", color: "#22c55e" });

  // ================= FETCH =================
  const fetchStatuses = async () => {
    const res = await api.get("/statuses");
    setStatuses(res.data);
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  // ================= OPEN MODAL =================
  const openModal = (status = null) => {
    if (status) {
      setEditing(true);
      setForm(status);
    } else {
      setEditing(false);
      setForm({ name: "", color: "" });
    }
    setOpen(true);
  };

  // ================= SAVE =================
  const saveStatus = async () => {
    if (editing) {
      await api.put(`/statuses/${form.id}`, form);
    } else {
      await api.post("/statuses", form);
    }

    setOpen(false);
    fetchStatuses();
  };

  // ================= DELETE =================
  const deleteStatus = async (id) => {
    if (!confirm("Delete this status?")) return;

    await axios.delete(`/statuses/${id}`);
    fetchStatuses();
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Manage Status</h1>

        <Button onClick={() => openModal()}>+ Add Status</Button>
      </div>

      {/* ================= TABLE ================= */}
      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Color</th>
              <th className="p-3 text-center">Preview</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {statuses.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-3">{s.name}</td>

                <td className="p-3">{s.color}</td>

                <td className="p-3 text-center">
                  <Badge
                    style={{
                      color: s.color || "#22c55e",
                      backgroundColor: (s.color || "#22c55e") + "33", 
                    }}
                  >
                    {s.name}
                  </Badge>
                </td>

                <td className="p-3 text-center space-x-2">
                  <Button size="sm" className={"bg-amber-100 hover:bg-amber-200 text-yellow-600"} onClick={() => openModal(s)}>
                    <FaRegEdit /> Edit
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteStatus(s.id)}
                  >
                    <MdDelete /> Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= MODAL ================= */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Status" : "Add Status"}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <Input
              placeholder="Status Name (e.g. Interested)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.color || "#22c55e"}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="w-12 h-10 border rounded cursor-pointer"
              />

              <span
                className="px-3 py-1 rounded text-sm font-medium"
                style={{
                  color: form.color || "#22c55e",
                  backgroundColor: (form.color || "#22c55e") + "33", // 🔥 5% opacity
                }}
              >
                {form.name || "Preview"}
              </span>
              {/* <Input
                value={form.color || ""}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                placeholder="#22c55e"
              /> */}
            </div>

            {/* Preview */}
            {/* <div> */}

            {/* </div> */}

            <Button onClick={saveStatus}>
              {editing ? "Update Status" : "Create Status"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
