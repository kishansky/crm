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
import toast from "react-hot-toast";

export default function Places() {
  const [places, setPlaces] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState({
    name: "",
    state: "",
    country: "India",
    is_active: true,
  });

  // ================= FETCH PLACES =================
  const fetchPlaces = async () => {
    try {
      const res = await api.get("/places");
      setPlaces(res.data.data || res.data);
    } catch (error) {
      toast.error("Failed to fetch places");
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, []);

  // ================= OPEN MODAL =================
  const openModal = (place = null) => {
    if (place) {
      setEditing(true);
      setForm(place);
    } else {
      setEditing(false);
      setForm({
        name: "",
        state: "",
        country: "India",
        is_active: true,
      });
    }
    setOpen(true);
  };

  // ================= SAVE PLACE =================
  const savePlace = async () => {
    try {
      if (!form.name) {
        toast.error("Place name is required");
        return;
      }

      if (editing) {
        await api.put(`/places/${form.id}`, form);
        toast.success("Place updated successfully");
      } else {
        await api.post("/places", form);
        toast.success("Place created successfully");
      }

      setOpen(false);
      fetchPlaces();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to save place"
      );
    }
  };

  // ================= DELETE PLACE =================
  const deletePlace = async (id) => {
    if (!confirm("Delete this place?")) return;

    try {
      await api.delete(`/places/${id}`);
      toast.success("Place deleted successfully");
      fetchPlaces();
    } catch (error) {
      toast.error("Failed to delete place");
    }
  };

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Manage Places</h1>
        <Button onClick={() => openModal()}>+ Add Place</Button>
      </div>

      {/* TABLE */}
      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">State</th>
              <th className="p-3 text-left">Country</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {places.map((place) => (
              <tr key={place.id} className="border-t">
                <td className="p-3">{place.name}</td>
                <td className="p-3">{place.state}</td>
                <td className="p-3">{place.country}</td>
                <td className="p-3 text-center">
                  <Badge
                    className={
                      place.is_active
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }
                  >
                    {place.is_active ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="p-3 text-center space-x-2">
                  <Button
                    size="sm"
                    className="bg-amber-100 hover:bg-amber-200 text-yellow-600"
                    onClick={() => openModal(place)}
                  >
                    <FaRegEdit /> Edit
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deletePlace(place.id)}
                  >
                    <MdDelete /> Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Place" : "Add Place"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <Input
              placeholder="Place Name (e.g., Gorakhpur)"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />

            <Input
              placeholder="State (e.g., Uttar Pradesh)"
              value={form.state}
              onChange={(e) =>
                setForm({ ...form, state: e.target.value })
              }
            />

            <Input
              placeholder="Country"
              value={form.country}
              onChange={(e) =>
                setForm({ ...form, country: e.target.value })
              }
            />

            <select
              className="border p-2 rounded"
              value={form.is_active ? "1" : "0"}
              onChange={(e) =>
                setForm({
                  ...form,
                  is_active: e.target.value === "1",
                })
              }
            >
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>

            <Button onClick={savePlace}>
              {editing ? "Update Place" : "Create Place"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}