// ⚠️ SAME FILE — ONLY LOGIC CHANGED

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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import FormatDate from "@/components/FormatDate";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

export default function NewLeads() {
  const [leads, setLeads] = useState([]);
  const [sales, setSales] = useState([]);
  const [statuses, setStatuses] = useState([]);

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const isUrlSyncingRef = useRef(false);

  const [page, setPage] = useState(parseInt(searchParams.get("page")) || 1);
  const [lastPage, setLastPage] = useState(1);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [selectedLeads, setSelectedLeads] = useState([]);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignUser, setAssignUser] = useState("");

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

  const [filters, setFilters] = useState({
  search: searchParams.get("search") || "",
  source: searchParams.get("source") || "",
  status: searchParams.get("status") || "",
  assigned_to: searchParams.get("assigned_to") || "",
  place_id: searchParams.get("place_id") || "",
});

  
  // ===============================
  // INIT
  // ===============================
  useEffect(() => {
  isUrlSyncingRef.current = true;

  setPage(parseInt(searchParams.get("page")) || 1);

  setFilters({
    search: searchParams.get("search") || "",
    source: searchParams.get("source") || "",
    status: searchParams.get("status") || "",
    assigned_to: searchParams.get("assigned_to") || "",
    place_id: searchParams.get("place_id") || "",
  });

  setTimeout(() => {
    isUrlSyncingRef.current = false;
  }, 0);
  }, [searchParams]);
  
  useEffect(() => {
  if (isUrlSyncingRef.current) return;

  const params = new URLSearchParams();

  if (page > 1) params.set("page", page);

  if (filters.search) params.set("search", filters.search);
  if (filters.source) params.set("source", filters.source);
  if (filters.status) params.set("status", filters.status);
  if (filters.assigned_to)
    params.set("assigned_to", filters.assigned_to);
  if (filters.place_id) params.set("place_id", filters.place_id);

  setSearchParams(params, { replace: true });
  }, [page, filters, setSearchParams]);
  
  useEffect(() => {
    if (role === "admin") fetchSales();
    fetchStatuses();
    fetchPlaces();
  }, []);

  // ===============================
  // PLACES
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
    const res = await api.get("/places-list");
    setPlaces(res.data);
  };

  const openNeedsModal = (leadId) => {
    setNeedForm({ ...needForm, lead_id: leadId });
    setNeedsOpen(true);
  };

  const saveNeed = async () => {
    await api.post("/needs", needForm);
    toast.success("Need added");
      setNeedsOpen(false);
      fetchNewLeads();
  };

  // ===============================
  // FETCH NEW LEADS
  // ===============================
  useEffect(() => {
    fetchNewLeads();
  }, [page, filters]);

  const fetchSales = async () => {
    const res = await api.get("/sales-team");
    setSales(res.data.data);
  };

  const fetchNewLeads = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page,
        search: filters.search || "",
        source: filters.source || "",
        status: filters.status || "",
        assigned_to: filters.assigned_to || "",
        place_id: filters.place_id || "",
      });

      const res = await api.get(`/new-leads?${params.toString()}`);

      setLeads(res.data.data);
      setLastPage(res.data.last_page);
    } catch {
      toast.error("Failed to load new leads");
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // STATUS
  // ===============================
  const addStatus = async () => {
    await api.post("/status-history", {
      lead_id: selectedLeadId,
      ...statusForm,
    });

    toast.success("Status added");
    setStatusOpen(false);
    fetchNewLeads();
  };

  const fetchStatuses = async () => {
    const res = await api.get("/statuses");
    setStatuses(res.data);
  };

  const statusMap = Object.fromEntries(statuses.map((s) => [s.id, s]));

  // ===============================
  // BULK
  // ===============================
  const bulkDelete = async () => {
    await api.post("/leads-bulk-delete", { lead_ids: selectedLeads });
    toast.success("Deleted");
    setSelectedLeads([]);
    fetchNewLeads();
  };

  const bulkAssign = async () => {
    await api.post("/leads-bulk-assign", {
      lead_ids: selectedLeads,
      assigned_to: assignUser,
    });
    toast.success("Assigned");
    setAssignOpen(false);
    setSelectedLeads([]);
    fetchNewLeads();
  };

  const selectAllRef = useRef(null);

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="flex flex-col">
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 mb-4">
          <Input
            placeholder="Search..."
            className="w-full sm:w-48 bg-white/90 h-9 mt-0"
            value={filters.search}
            onChange={(e) => {
              setFilters({ ...filters, search: e.target.value });
              setPage(1);
            }}
          />

          <select
            className="w-full sm:w-40 border rounded-md h-9 text-sm bg-white/90 px-2"
            value={filters.source}
            onChange={(e) => {
              setFilters({ ...filters, source: e.target.value });
              setPage(1);
            }}
          >
            <option value="">All Sources</option>
            <option value="website">Website</option>
            <option value="facebook">Facebook</option>
            <option value="whatsapp">Whatsapp</option>
            <option value="instragram">Instragram</option>
            <option value="linkedin">Linkedin</option>
            <option value="google">Google</option>
          </select>


          {role === "admin" && (
            <select
              className="w-full sm:w-40 border rounded-md h-9 text-sm bg-white/90 px-2"
              value={filters.assigned_to}
              onChange={(e) => {
                setFilters({ ...filters, assigned_to: e.target.value });
                setPage(1);
              }}
            >
              <option value="">All Sales</option>
              {sales.map((s) => (
                <option key={s.sales_person_id} value={s.sales_person_id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
          <select
            className="w-full sm:w-44 border rounded-md h-9 text-sm bg-white/90 px-2"
            value={filters.place_id}
            onChange={(e) => {
              setFilters({ ...filters, place_id: e.target.value });
              setPage(1);
            }}
          >
            <option value="">All Places</option>
            {places.map((place) => (
              <option key={place.id} value={place.id}>
                {place.name}
              </option>
            ))}
          </select>
        </div>

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
              {/* <th className="p-3 text-left">Shift</th> */}
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
                    <td className="p-3">
                      {lead?.contact_person}
                      <p className="text-xs text-gray-500 whitespace-nowrap">
                        <FormatDate date={lead?.created_at} />
                      </p>
                    </td>

                    {/* PHONE */}
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      {(() => {
                        const numbers = lead?.phone_number
                          ?.split(",")
                          .map((n) => n.trim())
                          .filter((n) => n);

                        const isMultiple = numbers?.length > 1;

                        return (
                          <>
                            {/* 📞 PHONE */}
                            {numbers?.length ? (
                              isMultiple ? (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <span
                                      className="text-gray-700 hover:underline cursor-pointer"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {numbers.join(", ")}
                                    </span>
                                  </PopoverTrigger>

                                  <PopoverContent className="w-56 p-2 rounded-xl shadow-xl">
                                    <p className="text-xs text-gray-500 mb-2 px-2">
                                      Select number to call
                                    </p>

                                    {numbers.map((num, i) => (
                                      <div
                                        key={i}
                                        onClick={() =>
                                          (window.location.href = `tel:${num}`)
                                        }
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-blue-50 transition"
                                      >
                                        <PhoneIcon
                                          size={14}
                                          className="text-blue-500"
                                        />
                                        <span className="text-sm font-medium">
                                          {num}
                                        </span>
                                      </div>
                                    ))}
                                  </PopoverContent>
                                </Popover>
                              ) : (
                                <a
                                  href={`tel:${numbers[0]}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-gray-700 hover:underline"
                                >
                                  {numbers[0]}
                                </a>
                              )
                            ) : (
                              "-"
                            )}

                            {/* 📧 EMAIL */}
                            <p>
                              <a
                                href={`mailto:${lead?.email}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-gray-700 hover:underline"
                              >
                                {lead?.email || "-"}
                              </a>
                            </p>
                          </>
                        );
                      })()}
                    </td>

                    {/* STATUS */}
                    <td className="p-3 max-w-[260px]">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col gap-1 cursor-pointer">
                            {/* Latest Status */}
                            {lead?.latest_status ? (
                              (() => {
                                const status =
                                  statusMap[lead?.latest_status?.status_id];

                                return (
                                  <Badge
                                    style={{
                                      color: status?.color || "#6b7280",
                                      backgroundColor: status?.color
                                        ? `${status.color}33`
                                        : "#e5e7eb",
                                    }}
                                    className="text-xs w-fit"
                                  >
                                    {status?.name || "Unknown"}
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

                            {/* Places Summary */}
                            {lead?.needs?.length > 0 && (
                              <Badge className="bg-purple-600 text-white text-xs w-fit">
                                {[
                                  ...new Set(
                                    lead.needs
                                      .map((need) => need.place?.name)
                                      .filter(Boolean),
                                  ),
                                ].join(" | ")}
                              </Badge>
                            )}
                          </div>
                        </TooltipTrigger>

                        {/* Tooltip Content */}
                        <TooltipContent className="max-w-sm bg-purple-500 py-4">
                          <div className="space-y-3 text-xs">
                            <p className="font-semibold text-sm">
                              Property Requirements
                            </p>

                            {lead?.needs?.length > 0 ? (
                              lead.needs.map((need) => (
                                <div
                                  key={need.id}
                                  className="border rounded-md p-1  bg-gray-50 text-black"
                                >
                                  <p>
                                    <strong>{need.place?.name || "N/A"}</strong>
                                    {" ("}
                                    {need.property_type || "N/A"}
                                    {")"}
                                  </p>

                                  <p>
                                    {need.min_area && (
                                      <strong>
                                        {need.min_area || "--"} -{" "}
                                        {need.max_area || "--"} {need.area_unit}
                                      </strong>
                                    )}
                                  </p>
                                  <p>
                                    {need.min_budget && (
                                      <strong>
                                        {Number(
                                          need.min_budget || 0,
                                        ).toLocaleString("en-IN")}{" "}
                                        - ₹
                                        {Number(
                                          need.max_budget || 0,
                                        ).toLocaleString("en-IN")}
                                        {" Lakhs"}
                                      </strong>
                                    )}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <p className="text-gray-200">
                                No requirements available.
                              </p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </td>

                    {/* FOLLOW-UP */}
                    <td className="p-3">
                      {lead?.latest_status?.reschedule_time ? (
                        <>
                          <div className="flex flex-col items-start gap-2 mt-2 flex-wrap">
                            <div>
                              <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600 font-medium">
                                {" "}
                                {new Date(
                                  lead?.latest_status?.reschedule_time,
                                ).toLocaleDateString()}
                              </span>
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
                            </div>
                            {/* TIME */}
                            <span className="text-xs px-2 py-1 rounded bg-green-50 text-green-600 font-medium">
                              {" "}
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

                    {role === "admin" && (
                      <td className="p-3">
                        {lead.sales_person?.name && (
                          <Badge className={"bg-[#3E2C23] text-white"}>
                            {lead.sales_person?.name}
                          </Badge>
                        )}
                      </td>
                    )}

                    {/* ACTIONS */}
                    <td
                      className="p-3 flex gap-2 items-center justify-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {(() => {
                        const numbers = lead?.phone_number
                          ?.split(",")
                          .map((n) => n.trim())
                          .filter((n) => n);

                        const isMultiple = numbers?.length > 1;

                        return (
                          <>
                            {/* 📞 CALL */}
                            {isMultiple ? (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    size="sm"
                                    className="bg-blue-500 hover:bg-blue-600 text-white"
                                  >
                                    <PhoneIcon />
                                  </Button>
                                </PopoverTrigger>

                                <PopoverContent className="w-52 p-2 rounded-xl shadow-xl">
                                  <p className="text-xs text-gray-500 mb-2 px-2">
                                    Call a number
                                  </p>

                                  {numbers.map((num, i) => (
                                    <div
                                      key={i}
                                      onClick={() =>
                                        (window.location.href = `tel:${num}`)
                                      }
                                      className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-blue-50 transition"
                                    >
                                      <PhoneIcon
                                        size={14}
                                        className="text-blue-500"
                                      />
                                      <span className="text-sm font-medium">
                                        {num}
                                      </span>
                                    </div>
                                  ))}
                                </PopoverContent>
                              </Popover>
                            ) : (
                              <Button
                                size="sm"
                                className="bg-blue-500 hover:bg-blue-600 text-white"
                                onClick={() =>
                                  (window.location.href = `tel:${numbers?.[0]}`)
                                }
                              >
                                <PhoneIcon />
                              </Button>
                            )}

                            {/* 🟢 WHATSAPP */}
                            {isMultiple ? (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    size="sm"
                                    className="bg-green-500 hover:bg-green-600 text-white"
                                  >
                                    <FaWhatsapp size={16} />
                                  </Button>
                                </PopoverTrigger>

                                <PopoverContent className="w-52 p-2 rounded-xl shadow-xl">
                                  <p className="text-xs text-gray-500 mb-2 px-2">
                                    WhatsApp a number
                                  </p>

                                  {numbers.map((num, i) => (
                                    <div
                                      key={i}
                                      onClick={() =>
                                        window.open(
                                          `https://wa.me/${num}`,
                                          "_blank",
                                        )
                                      }
                                      className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-green-50 transition"
                                    >
                                      <FaWhatsapp
                                        size={14}
                                        className="text-green-500"
                                      />
                                      <span className="text-sm font-medium">
                                        {num}
                                      </span>
                                    </div>
                                  ))}
                                </PopoverContent>
                              </Popover>
                            ) : (
                              <Button
                                size="sm"
                                className="bg-green-500 hover:bg-green-600 text-white"
                                onClick={() =>
                                  window.open(
                                    `https://wa.me/${numbers?.[0]}`,
                                    "_blank",
                                  )
                                }
                              >
                                <FaWhatsapp size={16} />
                              </Button>
                            )}

                            {/* ➕ STATUS */}
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedLeadId(lead.lead_id);
                                setStatusOpen(true);
                              }}
                              className="hover:bg-gray-100"
                            >
                              + Status
                            </Button>

                            {/* ❓ NEEDS */}
                            <Button
                              size="sm"
                              className="bg-purple-600 hover:bg-purple-700 text-white"
                              onClick={() => openNeedsModal(lead?.lead_id)}
                            >
                              <FaQuestionCircle />
                            </Button>
                          </>
                        );
                      })()}
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
                {(() => {
                  const numbers = lead?.phone_number
                    ?.split(",")
                    .map((n) => n.trim())
                    .filter((n) => n);

                  const isMultiple = numbers?.length > 1;

                  if (!numbers?.length) return "-";

                  return isMultiple ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <span
                          className="text-gray-500 hover:underline cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {numbers.join(", ")}
                        </span>
                      </PopoverTrigger>

                      <PopoverContent className="w-52 p-2 rounded-xl shadow-xl">
                        <p className="text-[10px] text-gray-500 mb-2 px-2">
                          Select number
                        </p>

                        {numbers.map((num, i) => (
                          <div
                            key={i}
                            onClick={() =>
                              (window.location.href = `tel:${num}`)
                            }
                            className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-blue-50 transition"
                          >
                            <PhoneIcon size={12} className="text-blue-500" />
                            <span className="text-xs">{num}</span>
                          </div>
                        ))}
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <span
                      className="text-gray-500 hover:underline cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `tel:${numbers[0]}`;
                      }}
                    >
                      {numbers[0]}
                    </span>
                  );
                })()}
              </p>
              <p className="text-xs mt-2">
                <b>Email:</b>{" "}
                <span
                  className="text-gray-500"
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
                {(() => {
                  const numbers = lead?.phone_number
                    ?.split(",")
                    .map((n) => n.trim())
                    .filter((n) => n);

                  const isMultiple = numbers?.length > 1;

                  return (
                    <>
                      {/* 📞 CALL */}
                      {isMultiple ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              size="sm"
                              className="flex-1 bg-blue-500 hover:bg-blue-600"
                            >
                              <PhoneIcon />
                            </Button>
                          </PopoverTrigger>

                          <PopoverContent className="w-48 p-2 rounded-lg shadow-lg">
                            <p className="text-[10px] text-gray-500 mb-2 px-1">
                              Call number
                            </p>

                            {numbers.map((num, i) => (
                              <div
                                key={i}
                                onClick={() =>
                                  (window.location.href = `tel:${num}`)
                                }
                                className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-blue-50"
                              >
                                <PhoneIcon
                                  size={12}
                                  className="text-blue-500"
                                />
                                <span className="text-xs">{num}</span>
                              </div>
                            ))}
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <Button
                          size="sm"
                          className="flex-1 bg-blue-500 hover:bg-blue-600"
                          onClick={() =>
                            (window.location.href = `tel:${numbers?.[0]}`)
                          }
                        >
                          <PhoneIcon />
                        </Button>
                      )}

                      {/* 🟢 WHATSAPP */}
                      {isMultiple ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              size="sm"
                              className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                            >
                              <FaWhatsapp />
                            </Button>
                          </PopoverTrigger>

                          <PopoverContent className="w-48 p-2 rounded-lg shadow-lg">
                            <p className="text-[10px] text-gray-500 mb-2 px-1">
                              WhatsApp number
                            </p>

                            {numbers.map((num, i) => (
                              <div
                                key={i}
                                onClick={() =>
                                  window.open(`https://wa.me/${num}`, "_blank")
                                }
                                className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-green-50"
                              >
                                <FaWhatsapp
                                  size={12}
                                  className="text-green-500"
                                />
                                <span className="text-xs">{num}</span>
                              </div>
                            ))}
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <Button
                          size="sm"
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                          onClick={() =>
                            window.open(
                              `https://wa.me/${numbers?.[0]}`,
                              "_blank",
                            )
                          }
                        >
                          <FaWhatsapp />
                        </Button>
                      )}

                      {/* ➕ STATUS */}
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

                      {/* ❓ NEEDS */}
                      <Button
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={() => openNeedsModal(lead?.lead_id)}
                      >
                        <FaQuestionCircle />
                      </Button>
                    </>
                  );
                })()}
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
