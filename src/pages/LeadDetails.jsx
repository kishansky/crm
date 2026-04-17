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
import { FaQuestionCircle, FaWhatsapp } from "react-icons/fa";
import { PhoneIcon } from "lucide-react";
import { MdDelete, MdEdit } from "react-icons/md";
import FormatDate from "@/components/FormatDate";

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

  // ===============================
  // PLACES & NEEDS STATE
  // ===============================
  const [places, setPlaces] = useState([]);
  const [needsOpen, setNeedsOpen] = useState(false);
  const [editingNeedId, setEditingNeedId] = useState(null);
  const [needForm, setNeedForm] = useState({
    lead_id: "",
    place_id: "",
    property_type: "",
    min_area: "",
    max_area: "",
    area_unit: "sqft",
    min_budget: "",
    max_budget: "",
    description: "",
  });

  const fetchPlaces = async () => {
    try {
      const res = await api.get("/places-list");
      setPlaces(res.data);
    } catch (error) {
      toast.error("Failed to load places");
    }
  };

  const openNeedsModal = (leadId, need = null) => {
    if (need) {
      setNeedForm({
        lead_id: need.lead_id || leadId,
        place_id: need.place_id || "",
        property_type: need.property_type || "",
        min_area: need.min_area ? parseFloat(need.min_area) : "",
        max_area: need.max_area ? parseFloat(need.max_area) : "",
        area_unit: need.area_unit || "sqft",
        min_budget: need.min_budget ? parseFloat(need.min_budget) : "",
        max_budget: need.max_budget ? parseFloat(need.max_budget) : "",
        description: need.description || "",
      });
      setEditingNeedId(need.id);
    } else {
      setNeedForm({
        lead_id: leadId,
        place_id: "",
        property_type: "",
        min_area: "",
        max_area: "",
        area_unit: "sqft",
        min_budget: "",
        max_budget: "",
        description: "",
      });
      setEditingNeedId(null);
    }

    setNeedsOpen(true);
  };

  const saveNeed = async () => {
    try {
      if (editingNeedId) {
        await api.put(`/needs/${editingNeedId}`, needForm);
        toast.success("Need updated successfully");
      } else {
        await api.post("/needs", needForm);
        toast.success("Need added successfully");
      }

      setNeedsOpen(false);
      setEditingNeedId(null);
      fetchLead();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to save requirement",
      );
    }
  };

  const deleteNeed = async (id) => {
    if (!confirm("Delete this requirement?")) return;

    try {
      await api.delete(`/needs/${id}`);
      toast.success("Need deleted successfully");
      fetchLead();
    } catch (error) {
      toast.error("Failed to delete requirement");
    }
  };

  useEffect(() => {
    fetchLead();
    fetchStatuses();
    fetchPlaces();

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

      const result = await api.put(`/leads/${editing}`, payload);

      if (result.data?.status === true) {
        toast.success("Lead updated");
      } else {
        toast.error(result.data?.message || "Error saving lead");
      }

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

  const propertyTypeStyles = {
    land: "border-green-500 bg-green-50",
    plot: " border-indigo-500 bg-indigo-50",
    house: "border-blue-600 bg-blue-50",
    flat: "border-purple-600 bg-purple-50",
    commercial: "border-amber-500 bg-amber-50",
    villa: "border-pink-500 bg-pink-50",
    apartment: "border-yellow-200 bg-yellow-50",
    default: "border-gray-300 bg-muted/30",
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
            {lead.contact_person}
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
      <div className="flex flex-col md:flex-row gap-4 w-full">
        {/* CONTACT */}
        <Card className={"md:w-1/3"}>
          <CardHeader className={"flex flex-row justify-between"}>
            <CardTitle>Contact Info</CardTitle>
            <p className="text-xs text-gray-500 whitespace-nowrap">
              <FormatDate date={lead?.created_at} />
            </p>
          </CardHeader>

          <CardContent className="space-y-2 text-sm">
            <p className="break-words">
              <b>Name:</b> {lead?.contact_person || "-"}
            </p>

            <p className="break-words">
              <b>Phone:</b>{" "}
              <a
                href={`tel:${lead?.phone_number}`}
                onClick={(e) => e.stopPropagation()}
                className="text-blue-500"
              >
                {lead?.phone_number || "-"}
              </a>
            </p>

            <p className="break-words">
              <b>Email:</b> {lead?.email || "-"}
            </p>
            <p className="font-medium break-words">
              <b>Address:</b> {lead?.company_name}
            </p>
          </CardContent>
        </Card>

        {/* COMPANY */}
        <Card className={"md:w-2/3 w"}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                Description Info
                {role === "admin" && lead?.source && (
                  <Badge>{lead?.source}</Badge>
                )}
              </div>
              <div>
                {role === "admin" && lead.sales_person?.name && (
                  <Badge className={"bg-[#3E2C23] text-white"}>
                    {lead.sales_person?.name}
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Enquiry Description */}
            <p className="text-xs text-muted-foreground break-words">
              {lead?.enquiry_description || "No description"}
            </p>

            <div className="pt-3 border-t">
              <div className="flex justify-between">
                <h4 className="text-sm font-semibold mb-2">
                  Property Requirements
                </h4>
                <Button
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => openNeedsModal(lead?.lead_id)}
                >
                  <FaQuestionCircle /> Add Needs
                </Button>
              </div>
              {lead?.needs && lead.needs.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  {lead.needs.map((need) => {
                    const typeKey = (need.property_type || "")
                      .toLowerCase()
                      .trim();

                    const style =
                      propertyTypeStyles[typeKey] || propertyTypeStyles.default;

                    return (
                      <div
                        key={need.id}
                        className={`border-l-4 rounded-lg p-3 shadow-sm ${style}`}
                      >
                        {/* Header */}
                        <div className="flex justify-between items-center mb-2">
                          <Badge>{need.place?.name || "N/A"}</Badge>

                          {need.property_type && (
                            <Badge className="capitalize" variant="outline">
                              {need.property_type}
                            </Badge>
                          )}
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => openNeedsModal(lead.lead_id, need)}
                            >
                              <MdEdit className="w-4 h-4 text-blue-600" />
                            </Button>
                            {role === "admin" && (
                              <>
                                <Button
                                  size="icon"
                                  variant="destructive"
                                  onClick={() => deleteNeed(need.id)}
                                >
                                  <MdDelete className="w-4 h-4 text-red-600" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Area */}
                        {(need.min_area || need.max_area) && (
                          <p className="text-xs text-muted-foreground">
                            <strong>Area:</strong>{" "}
                            {parseFloat(need.min_area) || "--"} -{" "}
                            {parseFloat(need.max_area) || "--"} {need.area_unit}
                          </p>
                        )}

                        {/* Budget */}
                        {(need.min_budget || need.max_budget) && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <strong>Budget:</strong>{" "}
                            {Number(need?.min_budget || "--").toLocaleString(
                              "en-IN",
                            )}{" "}
                            - ₹
                            {Number(need?.max_budget || "--").toLocaleString(
                              "en-IN",
                            )}
                            {" Lakhs"}
                          </p>
                        )}

                        {/* Description */}
                        {need.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <strong>Note:</strong> {need.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {lead?.needs?.length === 0 && (
                <div className="pt-3">
                  <p className="text-xs text-muted-foreground">
                    No property requirements added.
                  </p>
                </div>
              )}
            </div>

            {/* Empty State */}
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
            {lead?.status_history?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No status</p>
            ) : (
              <div className="relative pl-2">
                {[...(lead?.status_history || [])]
                  .sort(
                    (a, b) => new Date(b.updated_at) - new Date(a.updated_at),
                  )
                  .map((s, index) => {
                    const status = statusMap[s.status_id];

                    return (
                      <div key={s.history_id} className="relative mb-4">
                        {/* LINE */}
                        {index !== lead?.status_history.length - 1 && (
                          <span
                            className="absolute left-[5px] top-5 w-[2px] h-[90%]"
                            style={{
                              backgroundColor: status?.color
                                ? status?.color + "80" // 🔥 50% opacity
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
                        <div
                          className={`ml-6 border rounded-lg p-3 bg-white shadow-sm ${s?.reschedule_time ? "border-red-300" : ""}`}
                        >
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
                                    s?.reschedule_time,
                                  ).toLocaleDateString()}{" "}
                                  ⏰{" "}
                                  {new Date(
                                    s?.reschedule_time,
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              )}

                              {/* SHIFT */}
                              {s?.shift && (
                                <span className="text-xs px-2 py-1 rounded bg-purple-50 text-purple-600 capitalize font-medium">
                                  {s?.shift}
                                </span>
                              )}
                            </div>

                            {/* RIGHT SIDE */}
                            <div className="flex items-center gap-2">
                              <Badge>{s?.added_by_name || "Admin"}</Badge>

                              <span className="text-xs text-muted-foreground font-semibold">
                                {new Date(s?.updated_at).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          {/* REMARK */}
                          <p className="text-sm break-words">
                            {s?.remark || "No remark"}
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
              placeholder="Address"
              value={form.company_name || ""}
              onChange={(e) =>
                setForm({ ...form, company_name: e.target.value })
              }
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

      {/* NEEDS MODAL */}
      <Dialog open={needsOpen} onOpenChange={setNeedsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>
            <DialogHeader>
              {editingNeedId
                ? "Edit Property Requirement"
                : "Add Property Requirement"}
            </DialogHeader>
          </DialogTitle>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Place */}
            <select
              className="border p-2 rounded w-full"
              value={needForm.place_id}
              onChange={(e) =>
                setNeedForm({ ...needForm, place_id: e.target.value })
              }
            >
              <option value="">Select Place</option>
              {places.map((place) => (
                <option key={place.id} value={place.id}>
                  {place.name}
                </option>
              ))}
            </select>

            {/* Property Type */}
            <select
              className="border p-2 rounded w-full"
              value={needForm.property_type}
              onChange={(e) =>
                setNeedForm({ ...needForm, property_type: e.target.value })
              }
            >
              <option value="">Property Type</option>
              <option value="Land">Land</option>
              <option value="Plot">Plot</option>
              <option value="House">House</option>
              <option value="Flat">Flat</option>
              <option value="Commercial">Commercial</option>
            </select>

            <Input
              placeholder="Min Area"
              value={needForm.min_area}
              onChange={(e) =>
                setNeedForm({ ...needForm, min_area: e.target.value })
              }
            />

            <Input
              placeholder="Max Area"
              value={needForm.max_area}
              onChange={(e) =>
                setNeedForm({ ...needForm, max_area: e.target.value })
              }
            />

            <select
              className="border p-2 rounded w-full"
              value={needForm.area_unit}
              onChange={(e) =>
                setNeedForm({ ...needForm, area_unit: e.target.value })
              }
            >
              <option value="sqft">Sq Ft</option>
              <option value="sqyd">Sq Yard</option>
              <option value="acre">Acre</option>
              <option value="katha">Katha</option>
              <option value="bigha">Bigha</option>
            </select>

            <Input
              placeholder="Min Budget in Lakhs"
              value={needForm.min_budget}
              onChange={(e) =>
                setNeedForm({ ...needForm, min_budget: e.target.value })
              }
            />

            <Input
              placeholder="Max Budget in Lakhs"
              value={needForm.max_budget}
              onChange={(e) =>
                setNeedForm({ ...needForm, max_budget: e.target.value })
              }
            />
          </div>

          <textarea
            className="border p-2 rounded w-full mt-2"
            placeholder="Additional Requirements"
            value={needForm.description}
            onChange={(e) =>
              setNeedForm({ ...needForm, description: e.target.value })
            }
          />

          <Button className="w-full mt-3" onClick={saveNeed}>
            {editingNeedId ? "Update Requirement" : "Save Requirement"}
          </Button>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
