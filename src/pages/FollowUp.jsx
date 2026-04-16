import { useEffect, useRef, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import api from "../api/axios";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FaQuestionCircle, FaWhatsapp } from "react-icons/fa";
import { PhoneIcon } from "lucide-react";
import { MdAssignmentInd, MdDelete } from "react-icons/md";
import { Input } from "@/components/ui/input";

export default function FollowUps() {
  const [leads, setLeads] = useState([]);
  const [sales, setSales] = useState([]);
  const [statuses, setStatuses] = useState([]);

  // ✅ URL Pagination & Filter
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const isUrlSyncingRef = useRef(false);

  const [filter, setFilter] = useState(searchParams.get("filter") || "today");
  const [page, setPage] = useState(parseInt(searchParams.get("page")) || 1);
  const [lastPage, setLastPage] = useState(1);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [selectedLeads, setSelectedLeads] = useState([]);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignUser, setAssignUser] = useState("");

  // ✅ STATUS MODAL
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusForm, setStatusForm] = useState({
    status_id: "",
    status_type: "",
    remark: "",
    reschedule_time: "",
    shift: "",
  });

  const [loading, setLoading] = useState(true);

  const role = localStorage.getItem("role");
  const user = JSON.parse(localStorage.getItem("user"));

  // ================================
  // SYNC STATE FROM URL
  // ================================
  useEffect(() => {
    isUrlSyncingRef.current = true;

    const urlFilter = searchParams.get("filter") || "today";
    const urlPage = parseInt(searchParams.get("page")) || 1;

    setFilter(urlFilter);
    setPage(urlPage);

    setTimeout(() => {
      isUrlSyncingRef.current = false;
    }, 0);
  }, [searchParams]);

  // ================================
  // SYNC URL FROM STATE
  // ================================
  useEffect(() => {
    if (isUrlSyncingRef.current) return;

    const params = new URLSearchParams();

    if (filter && filter !== "today") {
      params.set("filter", filter);
    }

    if (page > 1) {
      params.set("page", page);
    }

    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params, { replace: true });
    }
  }, [filter, page, searchParams, setSearchParams]);

  useEffect(() => {
    if (role === "admin") {
      fetchSales();
    }
    fetchStatuses();
    fetchPlaces();
  }, []);

  // ===============================
  // PLACES & NEEDS STATE
  // ===============================
  const [places, setPlaces] = useState([]);
  const [needsOpen, setNeedsOpen] = useState(false);
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

  const openNeedsModal = (leadId) => {
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
    setNeedsOpen(true);
  };

  const saveNeed = async () => {
    try {
      await api.post("/needs", needForm);
      toast.success("Need added successfully");
      setNeedsOpen(false);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to save requirement",
      );
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, [filter, page]);

  const fetchSales = async () => {
    const res = await api.get("/sales-team");
    setSales(res.data.data);
  };

  const fetchFollowUps = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        filter,
        page,
      });

      const res = await api.get(`/follow-ups?${params.toString()}`);

      setLeads(res.data.data);
      setLastPage(res.data.last_page);
    } catch {
      toast.error("Failed to load follow-ups");
    } finally {
      setLoading(false);
    }
  };

  const addStatus = async () => {
    try {
      await api.post("/status-history", {
        lead_id: selectedLeadId,
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

      fetchFollowUps();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error adding status");
    }
  };

  const fetchStatuses = async () => {
    const res = await api.get("/statuses");
    setStatuses(res.data);
  };

  const statusMap = Object.fromEntries(statuses.map((s) => [s.id, s]));

  const filtersList = [
    { key: "yesterday", label: "Yesterday", icon: "⏮️" },
    { key: "today", label: "Today", icon: "📅" },
    { key: "tomorrow", label: "Tomorrow", icon: "⏭️" },
    { key: "missed", label: "Missed", icon: "❌" },
    { key: "week", label: "This Week", icon: "📆" },
    { key: "upcoming", label: "Upcoming", icon: "⏳" },
    { key: "all", label: "All", icon: "📋" },
  ];

  const selectAllRef = useRef(null);

  useEffect(() => {
    if (!selectAllRef.current) return;

    const currentIds = leads.map((l) => l.lead_id);
    const selectedOnPage = currentIds.filter((id) =>
      selectedLeads.includes(id),
    );

    selectAllRef.current.indeterminate =
      selectedOnPage.length > 0 && selectedOnPage.length < currentIds.length;
  }, [selectedLeads, leads]);

  const bulkDelete = async () => {
    if (selectedLeads.length === 0) {
      return toast.error("No leads selected");
    }

    if (!confirm("Delete selected leads? 🗑️")) return;

    try {
      await api.post("/leads-bulk-delete", {
        lead_ids: selectedLeads,
      });

      toast.success("Deleted successfully 🚀");

      setSelectedLeads([]);
      fetchFollowUps();
    } catch {
      toast.error("Delete failed ❌");
    }
  };

  const bulkAssign = async () => {
    if (!assignUser) {
      return toast.error("Select sales person");
    }

    try {
      await api.post("/leads-bulk-assign", {
        lead_ids: selectedLeads,
        assigned_to: assignUser,
      });

      toast.success("Assigned successfully 🚀");

      setAssignOpen(false);
      setSelectedLeads([]);
      setAssignUser("");

      fetchFollowUps();
    } catch {
      toast.error("Assignment failed ❌");
    }
  };

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="flex flex-wrap gap-2 mb-4">
        {filtersList.map((f) => (
          <button
            key={f.key}
            onClick={() => {
              setFilter(f.key);
              setPage(1);
            }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm border transition-all
        ${
          filter === f.key
            ? "bg-blue-500 text-white border-blue-500 shadow"
            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
        }`}
          >
            <span>{f.icon}</span>
            {f.label}
          </button>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row items-end w-full sm:items-center sm:justify-between gap-2 mb-2">
        {/* LEFT: Bulk actions */}
        <div className="flex flex-wrap gap-2 items-end w-full justify-end">
          {role === "admin" && selectedLeads.length > 0 && (
            <>
              <Button
                variant="destructive"
                className="w-full sm:w-auto"
                onClick={bulkDelete}
              >
                <MdDelete /> Delete ({selectedLeads.length})
              </Button>

              <Button
                className="w-full sm:w-auto"
                onClick={() => setAssignOpen(true)}
              >
                <MdAssignmentInd /> Assign ({selectedLeads.length})
              </Button>
            </>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="hidden md:flex border rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-muted">
            <tr>
              {role === "admin" && (
                <th className="p-3 text-center flex flex-row">
                  <input
                    type="checkbox"
                    ref={selectAllRef}
                    className="scale-125"
                    checked={
                      leads.length > 0 &&
                      leads.every((lead) =>
                        selectedLeads.includes(lead.lead_id),
                      )
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        // select all current page rows
                        const allIds = leads.map((lead) => lead.lead_id);
                        setSelectedLeads((prev) => [
                          ...new Set([...prev, ...allIds]),
                        ]);
                      } else {
                        // unselect only current page rows
                        const currentIds = leads.map((lead) => lead.lead_id);
                        setSelectedLeads((prev) =>
                          prev.filter((id) => !currentIds.includes(id)),
                        );
                      }
                    }}
                  />{" "}
                  <p className="pl-2">All</p>
                </th>
              )}
              <th className="p-3 text-left">Person</th>
              <th className="p-3 text-left">Phone</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Follow-Up</th>
              <th className="p-3 text-left">Shift</th>
              {role === "admin" && <th className="p-3 text-left">Assigned</th>}
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center p-4">
                  Loading...
                </td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center p-4">
                  No data
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                return (
                  <tr
                    key={lead.lead_id}
                    className="border-t hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate(`/leads/${lead.lead_id}`)}
                  >
                    {role === "admin" && (
                      <td
                        className="p-3 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          className="scale-125"
                          checked={selectedLeads.includes(lead.lead_id)}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLeads([
                                ...selectedLeads,
                                lead.lead_id,
                              ]);
                            } else {
                              setSelectedLeads(
                                selectedLeads.filter(
                                  (id) => id !== lead.lead_id,
                                ),
                              );
                            }
                          }}
                        />
                      </td>
                    )}
                    {/* PERSON */}
                    <td className="p-3">{lead?.contact_person}</td>

                    {/* PHONE */}
                    <td className="p-3">
                      <a
                        href={`tel:${lead?.phone_number}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-500"
                      >
                        {lead?.phone_number}
                      </a>
                    </td>

                    {/* STATUS */}
                    <td className="p-3 min-w-[100px]">
                      {lead?.latest_status ? (
                        (() => {
                          const status =
                            statusMap[lead.latest_status.status_id];

                          return (
                            <Badge
                              style={{
                                color: status?.color,
                                backgroundColor: status?.color + "33",
                              }}
                              className={"text-xs"}
                            >
                              {status?.name}
                            </Badge>
                          );
                        })()
                      ) : (
                        <Badge
                          style={{
                            color: "#FF0000 ",
                            backgroundColor: "#FF0000" + "33",
                          }}
                          className={"text-xs"}
                        >
                          New
                        </Badge>
                      )}
                    </td>

                    {/* FOLLOW-UP */}
                    <td className="p-3">
                      {lead?.latest_status?.reschedule_time ? (
                        <>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600 font-medium">
                              📅{" "}
                              {new Date(
                                lead?.latest_status?.reschedule_time,
                              ).toLocaleDateString()}
                            </span>
                            {/* TIME */}
                            <span className="text-xs px-2 py-1 rounded bg-green-50 text-green-600 font-medium">
                              ⏰{" "}
                              {new Date(
                                lead?.latest_status?.reschedule_time,
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </>
                      ) : (
                        "--/--/--"
                      )}
                    </td>

                    {/* SHIFT */}
                    <td className="p-3 capitalize">
                      <span
                        className={`text-xs px-2 py-1 rounded capitalize font-medium ${
                          lead?.latest_status?.shift === "morning"
                            ? "bg-yellow-50 text-yellow-600"
                            : lead?.latest_status?.shift === "noon"
                              ? "bg-orange-50 text-orange-600"
                              : "bg-purple-50 text-purple-600"
                        }`}
                      >
                        {lead?.latest_status?.shift || "--"}
                      </span>
                    </td>

                    {role === "admin" && (
                      <td className="p-3">{lead.sales_person?.name}</td>
                    )}

                    {/* ACTIONS */}
                    <td
                      className="p-3 flex gap-2 items-center justify-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        size="sm"
                        onClick={() =>
                          (window.location.href = `tel:${lead.phone_number}`)
                        }
                        className="bg-blue-500 hover:bg-blue-500/90"
                      >
                        <PhoneIcon />
                      </Button>

                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-white"
                        onClick={() =>
                          window.open(
                            `https://wa.me/${lead.phone_number}`,
                            "_blank",
                          )
                        }
                      >
                        <FaWhatsapp size={16} />
                      </Button>

                      {/* ADD STATUS */}
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedLeadId(lead.lead_id);
                          setStatusOpen(true);
                        }}
                      >
                        + Status
                      </Button>
                      <Button
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={() => openNeedsModal(lead?.lead_id)}
                      >
                        <FaQuestionCircle />
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ================= MOBILE ================= */}
      <div className="md:hidden flex flex-col gap-3">
        {role === "admin" && (
          <div className="flex items-center gap-2 px-2">
            <input
              type="checkbox"
              ref={selectAllRef}
              className="scale-125"
              checked={
                leads.length > 0 &&
                leads.every((lead) => selectedLeads.includes(lead.lead_id))
              }
              onChange={(e) => {
                if (e.target.checked) {
                  const allIds = leads.map((lead) => lead.lead_id);
                  setSelectedLeads((prev) => [
                    ...new Set([...prev, ...allIds]),
                  ]);
                } else {
                  const currentIds = leads.map((lead) => lead.lead_id);
                  setSelectedLeads((prev) =>
                    prev.filter((id) => !currentIds.includes(id)),
                  );
                }
              }}
            />
            <span className="text-sm font-medium">Select All</span>
          </div>
        )}
        {leads.map((lead) => {
          const status = statusMap[lead?.latest_status?.status_id];

          const date = lead?.latest_status?.Freschedule_time
            ? new Date(lead?.latest_status?.reschedule_time)
            : null;

          return (
            <div
              key={lead.lead_id}
              className="border rounded-lg p-3 shadow-sm bg-white"
              onClick={() => navigate(`/leads/${lead.lead_id}`)}
            >
              {/* TOP */}
              <div className="flex justify-between items-start">
                <div className="flex gap-2">
                  {role === "admin" && (
                    <input
                      type="checkbox"
                      className="scale-125"
                      checked={selectedLeads.includes(lead.lead_id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLeads([...selectedLeads, lead.lead_id]);
                        } else {
                          setSelectedLeads(
                            selectedLeads.filter((id) => id !== lead.lead_id),
                          );
                        }
                      }}
                    />
                  )}
                  <h3 className="font-semibold text-sm">
                    {lead?.contact_person}
                  </h3>
                </div>

                {lead?.latest_status ? (
                  <Badge
                    style={{
                      color: status?.color,
                      backgroundColor: status?.color + "33",
                    }}
                    className={"text-xs"}
                  >
                    {status?.name}
                  </Badge>
                ) : (
                  <Badge
                    style={{
                      color: "#FF0000 ",
                      backgroundColor: "#FF0000" + "33",
                    }}
                    className={"text-xs"}
                  >
                    New
                  </Badge>
                )}
              </div>

              {/* PHONE */}
              <p className="text-xs mt-2">
                <b>Phone:</b>{" "}
                <span
                  className="text-blue-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `tel:${lead?.phone_number}`;
                  }}
                >
                  {lead?.phone_number}
                </span>
              </p>
              <p className="text-xs mt-2">
                <b>Email:</b>{" "}
                <span
                  className="text-blue-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `mailto:${lead?.email}`;
                  }}
                >
                  {lead?.email}
                </span>
              </p>

              {/* RESCHEDULE (BEAUTIFUL) */}
              {lead?.latest_status?.reschedule_time && (
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {/* DATE */}
                  <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600 font-medium">
                    📅{" "}
                    {new Date(
                      lead?.latest_status?.reschedule_time,
                    ).toLocaleDateString()}
                  </span>

                  {/* TIME */}
                  <span className="text-xs px-2 py-1 rounded bg-green-50 text-green-600 font-medium">
                    ⏰{" "}
                    {new Date(
                      lead?.latest_status?.reschedule_time,
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>

                  {/* SHIFT */}
                  {lead?.latest_status?.shift && (
                    <span
                      className={`text-xs px-2 py-1 rounded capitalize font-medium ${
                        lead?.latest_status?.shift === "morning"
                          ? "bg-yellow-50 text-yellow-600"
                          : lead?.latest_status?.shift === "noon"
                            ? "bg-orange-50 text-orange-600"
                            : "bg-purple-50 text-purple-600"
                      }`}
                    >
                      {lead?.latest_status?.shift}
                    </span>
                  )}
                </div>
              )}

              {role === "admin" && (
                <p className="text-sm py-1">
                  <b>Assigned:</b> {lead?.sales_person?.name}
                </p>
              )}

              {/* ACTIONS */}
              <div
                className="flex gap-2 mt-3"
                onClick={(e) => e.stopPropagation()}
              >
                {/* CALL */}
                <Button
                  size="sm"
                  className="flex-1 bg-blue-500"
                  onClick={() =>
                    (window.location.href = `tel:${lead?.phone_number}`)
                  }
                >
                  <PhoneIcon />
                </Button>

                {/* WHATSAPP */}
                <Button
                  size="sm"
                  className="flex-1 bg-green-500 text-white"
                  onClick={() =>
                    window.open(`https://wa.me/${lead?.phone_number}`, "_blank")
                  }
                >
                  <FaWhatsapp />
                </Button>

                {/* ADD STATUS */}
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setSelectedLeadId(lead.lead_id);
                    setStatusOpen(true);
                  }}
                >
                  + Status
                </Button>
                <Button
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => openNeedsModal(lead?.lead_id)}
                >
                  <FaQuestionCircle />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* PAGINATION */}
      <div className="flex justify-center gap-2 mt-4">
        <Button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Prev
        </Button>

        <span className="px-3 py-1">
          {page} / {lastPage}
        </span>

        <Button disabled={page === lastPage} onClick={() => setPage(page + 1)}>
          Next
        </Button>
      </div>

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

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Leads</DialogTitle>
          </DialogHeader>

          <select
            className="border p-2 w-full rounded"
            value={assignUser}
            onChange={(e) => setAssignUser(e.target.value)}
          >
            <option value="">Select Sales</option>

            {sales.map((s) => (
              <option key={s.sales_person_id} value={s.sales_person_id}>
                {s.name}
              </option>
            ))}
          </select>

          <Button onClick={bulkAssign} className="w-full mt-3">
            Assign
          </Button>
        </DialogContent>
      </Dialog>

      {/* NEEDS MODAL */}
      <Dialog open={needsOpen} onOpenChange={setNeedsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Property Requirement</DialogTitle>
          </DialogHeader>

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
              <option value="katha">Kata</option>
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
            Save Requirement
          </Button>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
