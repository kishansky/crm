import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";
import DashboardLayout from "../components/layout/DashboardLayout";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Loader from "@/components/ui/Loader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { FaWhatsapp } from "react-icons/fa";
import { PhoneIcon } from "lucide-react";
import { MdDelete, MdEdit } from "react-icons/md";

export default function LeadDetails() {
  const { id } = useParams();
  const [lead, setLead] = useState(null);
  const [sales, setSales] = useState([]);
  const [statuses, setStatuses] = useState([]);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);

  // ✅ STATUS MODAL
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusForm, setStatusForm] = useState({
    status_id: "",
    status_type: "",
    remark: "",
    reschedule_time: "",
    shift: "",
  });

  const navigate = useNavigate();

  const role = localStorage.getItem("role");
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    fetchLead();
    fetchStatuses();

    if (role === "admin") {
      fetchSales();
    }
  }, [id]);

  const fetchStatuses = async () => {
    const res = await api.get("/statuses");
    setStatuses(res.data);
  };

  const fetchLead = async () => {
    try {
      const res = await api.get(`/leads/${id}`);
      setLead(res.data);
    } catch {
      toast.error("Unauthorized ❌");
      navigate("/leads");
    }
  };

  const fetchSales = async () => {
    const res = await api.get("/sales-team");
    setSales(res.data.data);
  };

  const openModal = (lead = null) => {
    if (lead) {
      setForm(lead);
      setEditing(lead.lead_id);
    } else {
      setForm({});
      setEditing(null);
    }
    setOpen(true);
  };

  const saveLead = async () => {
    try {
      const payload = {
        ...form,
        assigned_to: role === "sales" ? user.sales_person_id : form.assigned_to,
      };

      await api.put(`/leads/${editing}`, payload);

      toast.success("Lead updated");

      setOpen(false);
      setForm({});
      setEditing(null);
      fetchLead();
    } catch {
      toast.error("Error saving lead");
    }
  };

  const deleteLead = async (id) => {
    if (role !== "admin") {
      return toast.error("Only admin can delete ❌");
    }

    if (!confirm("Delete this lead?")) return;

    await api.delete(`/leads/${id}`);
    toast.success("Deleted");
    navigate("/leads");
  };

  // ✅ ADD STATUS
  const addStatus = async () => {
    try {
      await api.post("/status-history", {
        lead_id: id,
        status_id: statusForm.status_id, // ✅ backend
        status_type: statusForm.status_type, // ✅ optional (keep if needed)
        remark: statusForm.remark,
        reschedule_time: statusForm.reschedule_time,
        shift: statusForm.shift,
      });

      toast.success("Status added ✅");

      setStatusOpen(false);
      setStatusForm({
        status_id: "",
        status_type: "",
        remark: "",
        reschedule_time: "",
        shift: "",
      });

      fetchLead();
    } catch (err) {
      console.log(err);

      toast.error(err?.response?.data?.message || "Error adding status");
    }
  };

  const statusMap = Object.fromEntries(statuses.map((s) => [s.id, s]));

  if (!lead) {
    return (
      <DashboardLayout>
        <Loader type="card" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* LEFT */}
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold break-words">
            {lead.company_name}
          </h1>
          <p className="text-sm text-muted-foreground">Lead Details Overview</p>
        </div>

        {/* RIGHT ACTIONS */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button
            size="sm"
            className="bg-blue-500 flex-1 sm:flex-none"
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `tel:${lead.phone_number}`;
            }}
          >
            <PhoneIcon /> Phone
          </Button>

          <Button
            size="sm"
            className="bg-green-500 hover:bg-green-600 text-white flex-1 sm:flex-none"
            onClick={(e) => {
              e.stopPropagation();
              window.open(`https://wa.me/${lead.phone_number}`, "_blank");
            }}
          >
            <FaWhatsapp size={16} /> WhatsApp
          </Button>

          {role === "admin" && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 sm:flex-none"
                onClick={() => openModal(lead)}
              >
                <MdEdit /> Edit
              </Button>

              <Button
                size="sm"
                variant="destructive"
                className="flex-1 sm:flex-none"
                onClick={() => deleteLead(lead.lead_id)}
              >
                <MdDelete /> Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* COMPANY + CONTACT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* COMPANY */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 flex-wrap">
              Company Info
              {
                role === "admin" && lead.source && <Badge>{lead.source}</Badge>
            }
              
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-2">
            <p className="font-medium break-words">{lead.company_name}</p>
            <p className="text-xs text-muted-foreground break-words">
              {lead.enquiry_description || "No description"}
            </p>
          </CardContent>
        </Card>

        {/* CONTACT */}
        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>

          <CardContent className="space-y-2 text-sm">
            <p className="break-words">
              <b>Name:</b> {lead.contact_person || "-"}
            </p>

            <p className="break-words">
              <b>Phone:</b>{" "}
              <a
                href={`tel:${lead.phone_number}`}
                onClick={(e) => e.stopPropagation()}
                className="text-blue-500"
              >
                {lead.phone_number || "-"}
              </a>
            </p>

            <p className="break-words">
              <b>Email:</b> {lead.email || "-"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* TIMELINE */}
      <div className="mt-6">
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Status Timeline</CardTitle>

            <Button size="sm" onClick={() => setStatusOpen(true)}>
              + Add Status
            </Button>
          </CardHeader>

          {/* <CardContent>
            {lead.status_history?.length === 0 ? (
              <p>No status</p>
            ) : (
              lead.status_history.map((s) => (
                <div key={s.history_id} className="border p-2 mb-2 rounded">
                  <div className="flex justify-between">
                    <Badge className={getStatusColor(s.status_type)}>
                      {s.status_type}
                    </Badge>
                    <span className="text-xs">
                      {new Date(s.updated_at).toLocaleString()}
                    </span>
                  </div>
                  <p>{s.remark}</p>
                </div>
              ))
            )}
          </CardContent> */}

          <CardContent>
            {lead.status_history?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No status</p>
            ) : (
              <div className="relative pl-2">
                {[...(lead.status_history || [])]
                  .sort(
                    (a, b) => new Date(b.updated_at) - new Date(a.updated_at),
                  )
                  .map((s, index) => {
                    const status = statusMap[s.status_id];

                    return (
                      <div key={s.history_id} className="relative mb-4">
                        {/* LINE */}
                        {index !== lead.status_history.length - 1 && (
                          <span
                            className="absolute left-[5px] top-5 w-[2px] h-[90%]"
                            style={{
                              backgroundColor: status?.color
                                ? status.color + "80" // 🔥 50% opacity
                                : "#ccc",
                            }}
                          ></span>
                        )}

                        {/* DOT */}
                        <div
                          className="absolute left-0 top-1 w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: status?.color || "#ccc",
                          }}
                        ></div>

                        {/* CONTENT */}
                        <div className={`ml-6 border rounded-lg p-3 bg-white shadow-sm ${s.reschedule_time ? "border-red-300" : ""}`}>
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-1">
                            {/* LEFT SIDE */}
                            <div className="flex flex-wrap items-center gap-2">
                              {/* STATUS BADGE */}
                              <Badge
                                style={{
                                  color: status?.color,
                                  backgroundColor: status?.color + "33",
                                }}
                              >
                                {status?.name || "N/A"}
                              </Badge>

                              {/* RESCHEDULE */}
                              {s.reschedule_time && (
                                <span className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 font-medium">
                                  📅{" "}
                                  {new Date(
                                    s.reschedule_time,
                                  ).toLocaleDateString()}{" "}
                                  ⏰{" "}
                                  {new Date(
                                    s.reschedule_time,
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              )}

                              {/* SHIFT */}
                              {s.shift && (
                                <span className="text-xs px-2 py-1 rounded bg-purple-50 text-purple-600 capitalize font-medium">
                                  {s.shift}
                                </span>
                              )}
                            </div>

                            {/* RIGHT SIDE */}
                            <div className="flex items-center gap-2">
                              <Badge>{s.added_by_name || "Admin"}</Badge>

                              <span className="text-xs text-muted-foreground font-semibold">
                                {new Date(s.updated_at).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          {/* REMARK */}
                          <p className="text-sm break-words">
                            {s.remark || "No remark"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* EDIT MODAL */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Lead" : "Add Lead"}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              placeholder="Company"
              value={form.company_name || ""}
              onChange={(e) =>
                setForm({ ...form, company_name: e.target.value })
              }
            />

            <Input
              placeholder="Contact Person"
              value={form.contact_person || ""}
              onChange={(e) =>
                setForm({ ...form, contact_person: e.target.value })
              }
            />

            <Input
              placeholder="Phone"
              value={form.phone_number || ""}
              onChange={(e) =>
                setForm({ ...form, phone_number: e.target.value })
              }
            />

            <Input
              placeholder="Email"
              value={form.email || ""}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <Input
              placeholder="Source"
              value={form.source || ""}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
            />

            {/* ✅ ADMIN ONLY ASSIGN */}
            {role === "admin" && (
              <select
                className="border rounded p-2 w-full"
                value={form.assigned_to || ""}
                onChange={(e) =>
                  setForm({ ...form, assigned_to: e.target.value })
                }
              >
                <option value="">Assign Sales</option>

                {sales.map((s) => (
                  <option key={s.sales_person_id} value={s.sales_person_id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <textarea
            placeholder="Description"
            className="border p-2 rounded w-full mt-3"
            value={form.enquiry_description || ""}
            onChange={(e) =>
              setForm({
                ...form,
                enquiry_description: e.target.value,
              })
            }
          />

          <Button onClick={saveLead} className="w-full mt-4">
            Save Lead
          </Button>
        </DialogContent>
      </Dialog>

      {/* STATUS MODAL */}
      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Status</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            {/* STATUS DROPDOWN */}
            <select
              className="border p-2 w-full rounded mb-2"
              value={statusForm.status_id}
              onChange={(e) => {
                const selected = statuses.find(
                  (s) => s.id === Number(e.target.value),
                );

                setStatusForm({
                  ...statusForm,
                  status_id: selected?.id || "",
                  status_type: selected?.name || "",
                });
              }}
            >
              <option value="">Select Status</option>

              {statuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* REMARK */}
            <textarea
              className="border p-2 w-full rounded mb-2"
              placeholder="Remark"
              value={statusForm.remark}
              onChange={(e) =>
                setStatusForm({
                  ...statusForm,
                  remark: e.target.value,
                })
              }
            />

            {/* RESCHEDULE TIME */}
            <div className="flex flex-col gap-1">
              <label htmlFor="" className="">
                Reschedule Time
              </label>
              <input
                type="datetime-local"
                className="border p-2 w-full rounded mb-2"
                value={statusForm.reschedule_time || ""}
                onChange={(e) =>
                  setStatusForm({
                    ...statusForm,
                    reschedule_time: e.target.value,
                  })
                }
              />
            </div>

            {/* SHIFT */}
            <select
              className="border p-2 w-full rounded mb-2"
              value={statusForm.shift || ""}
              onChange={(e) =>
                setStatusForm({
                  ...statusForm,
                  shift: e.target.value,
                })
              }
            >
              <option value="">Select Shift</option>
              <option value="morning">Morning</option>
              <option value="noon">Noon</option>
              <option value="evening">Evening</option>
            </select>

            <Button onClick={addStatus}>Save Status</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
