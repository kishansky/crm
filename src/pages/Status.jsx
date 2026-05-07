"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useEffect, useState } from "react";
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

import {
  DndContext,
  closestCenter,
} from "@dnd-kit/core";

import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

// ================= SORTABLE ROW =================
function SortableRow({
  s,
  openModal,
  deleteStatus,
  handleOrderChange,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: s.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="border-t bg-white"
    >
      {/* DRAG */}
      <td
        className="p-3 cursor-move text-lg font-bold"
        {...attributes}
        {...listeners}
      >
        ☰
      </td>

      {/* ORDER */}
      <td className="p-3">
        <Input
          type="number"
          min={1}
          value={s.orders || ""}
          className="w-20 border-gray"
          onChange={(e) =>
            handleOrderChange(s.id, e.target.value)
          }
        />
      </td>

      {/* NAME */}
      <td className="p-3">{s.name}</td>

      {/* COLOR */}
      <td className="p-3">{s.color}</td>

      {/* PREVIEW */}
      <td className="p-3 text-center">
        <Badge
          style={{
            color: s.color || "#22c55e",
            backgroundColor:
              (s.color || "#22c55e") + "33",
          }}
        >
          {s.name}
        </Badge>
      </td>

      {/* ACTION */}
      <td className="p-3 text-center space-x-2">
        <Button
          size="sm"
          className="bg-amber-100 hover:bg-amber-200 text-yellow-600"
          onClick={() => openModal(s)}
        >
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
  );
}

export default function Status() {
  const [statuses, setStatuses] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState({
    name: "",
    color: "#22c55e",
  });

  // ================= FETCH =================
  const fetchStatuses = async () => {
    const res = await api.get("/statuses");

    const sorted = [...res.data].sort(
      (a, b) => (a.orders || 0) - (b.orders || 0)
    );

    setStatuses(sorted);
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

      setForm({
        name: "",
        color: "#22c55e",
      });
    }

    setOpen(true);
  };

  // ================= SAVE STATUS =================
  const saveStatus = async () => {
    if (editing) {
      await api.put(`/statuses/${form.id}`, form);
    } else {
      await api.post("/statuses", {
        ...form,
        orders: statuses.length + 1,
      });
    }

    setOpen(false);

    fetchStatuses();
  };

  // ================= DELETE =================
  const deleteStatus = async (id) => {
    if (!confirm("Delete this status?")) return;

    await api.delete(`/statuses/${id}`);

    fetchStatuses();
  };

  // ================= SAVE ORDER =================
  const saveOrder = async (updatedStatuses) => {
    const payload = {
      statuses: updatedStatuses.map((item, index) => ({
        id: item.id,
        orders: index + 1,
      })),
    };

    await api.post("/statuses/rearrange", payload);

    fetchStatuses();
  };

  // ================= DRAG END =================
  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = statuses.findIndex(
      (i) => i.id === active.id
    );

    const newIndex = statuses.findIndex(
      (i) => i.id === over.id
    );

    const updated = arrayMove(
      statuses,
      oldIndex,
      newIndex
    ).map((item, index) => ({
      ...item,
      orders: index + 1,
    }));

    setStatuses(updated);

    await saveOrder(updated);
  };

  // ================= MANUAL ORDER =================
  const handleOrderChange = async (id, value) => {
    let num = parseInt(value);

    if (isNaN(num)) return;

    if (num < 1) num = 1;

    if (num > statuses.length) {
      num = statuses.length;
    }

    let updated = [...statuses];

    const currentIndex = updated.findIndex(
      (s) => s.id === id
    );

    const item = updated[currentIndex];

    updated.splice(currentIndex, 1);

    updated.splice(num - 1, 0, item);

    updated = updated.map((s, index) => ({
      ...s,
      orders: index + 1,
    }));

    setStatuses(updated);

    await saveOrder(updated);
  };

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">
          Manage Status
        </h1>

        <Button onClick={() => openModal()}>
          + Add Status
        </Button>
      </div>

      {/* ================= TABLE ================= */}
      <div className="border rounded-lg overflow-x-auto">
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={statuses.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3 text-left">
                    Drag
                  </th>

                  <th className="p-3 text-left">
                    Order
                  </th>

                  <th className="p-3 text-left">
                    Name
                  </th>

                  <th className="p-3 text-left">
                    Color
                  </th>

                  <th className="p-3 text-center">
                    Preview
                  </th>

                  <th className="p-3 text-center">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {statuses.map((s) => (
                  <SortableRow
                    key={s.id}
                    s={s}
                    openModal={openModal}
                    deleteStatus={deleteStatus}
                    handleOrderChange={
                      handleOrderChange
                    }
                  />
                ))}
              </tbody>
            </table>
          </SortableContext>
        </DndContext>
      </div>

      {/* ================= MODAL ================= */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing
                ? "Edit Status"
                : "Add Status"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            {/* NAME */}
            <Input
              placeholder="Status Name"
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
            />

            {/* COLOR */}
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.color || "#22c55e"}
                onChange={(e) =>
                  setForm({
                    ...form,
                    color: e.target.value,
                  })
                }
                className="w-12 h-10 border rounded cursor-pointer"
              />

              <span
                className="px-3 py-1 rounded text-sm font-medium"
                style={{
                  color:
                    form.color || "#22c55e",

                  backgroundColor:
                    (form.color || "#22c55e") +
                    "33",
                }}
              >
                {form.name || "Preview"}
              </span>
            </div>

            {/* SAVE */}
            <Button onClick={saveStatus}>
              {editing
                ? "Update Status"
                : "Create Status"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}