import { useEffect, useRef, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Loader from "@/components/ui/Loader";
import { Badge } from "@/components/ui/badge";
import { Delete, PhoneIcon } from "lucide-react";
import {
  FaEdit,
  FaFileExport,
  FaFileImport,
  FaPlus,
  FaQuestionCircle,
  FaRegEdit,
  FaWhatsapp,
} from "react-icons/fa";
import { MdAdd, MdAssignmentInd, MdDelete, MdEdit } from "react-icons/md";
import FormatDate from "@/components/FormatDate";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

export default function Leads() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLeadId, setSelectedLeadId] = useState(null);

  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importAssign, setImportAssign] = useState("");

  const [selectedLeads, setSelectedLeads] = useState([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignUser, setAssignUser] = useState("");

  const [exportOpen, setExportOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [exportFilters, setExportFilters] = useState({
    assigned_to: "",
    start_date: "",
    end_date: "",
    limit: null,
    status: "",
  });
  const role = localStorage.getItem("role");
  const user = JSON.parse(localStorage.getItem("user"));

  // ===============================
  // STATE MANAGEMENT
  // ===============================
  const [leads, setLeads] = useState([]);
  const [sales, setSales] = useState([]);
  const [statuses, setStatuses] = useState([]);

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const isUrlSyncingRef = useRef(false);

  // Initialize state from URL
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    source: searchParams.get("source") || "",
    status: searchParams.get("status") || "",
    assigned_to: searchParams.get("assigned_to") || "",
    place_id: searchParams.get("place_id") || "",
  });

  const [page, setPage] = useState(parseInt(searchParams.get("page")) || 1);

  const [debouncedSearch, setDebouncedSearch] = useState(
    searchParams.get("search") || "",
  );

  const [lastPage, setLastPage] = useState(1);

  // ===============================
  // SYNC STATE FROM URL
  // Handles browser back/forward
  // ===============================
  useEffect(() => {
    isUrlSyncingRef.current = true;

    const urlFilters = {
      search: searchParams.get("search") || "",
      source: searchParams.get("source") || "",
      status: searchParams.get("status") || "",
      assigned_to: searchParams.get("assigned_to") || "",
      place_id: searchParams.get("place_id") || "",
    };

    const urlPage = parseInt(searchParams.get("page")) || 1;

    setFilters(urlFilters);
    setDebouncedSearch(urlFilters.search);
    setPage(urlPage);

    setTimeout(() => {
      isUrlSyncingRef.current = false;
    }, 0);
  }, [searchParams]);

  // ===============================
  // SYNC URL FROM STATE
  // ===============================
  useEffect(() => {
    if (isUrlSyncingRef.current) return;

    const params = new URLSearchParams();

    if (page > 1) params.set("page", page);
    if (filters.search) params.set("search", filters.search);
    if (filters.source) params.set("source", filters.source);
    if (filters.status) params.set("status", filters.status);
    if (filters.assigned_to) params.set("assigned_to", filters.assigned_to);
    if (filters.place_id) params.set("place_id", filters.place_id); // ✅ Added

    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params, { replace: true });
    }
  }, [page, filters, searchParams, setSearchParams]);

  // ===============================
  // FETCH DROPDOWN DATA
  // ===============================
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

  // ===============================
  // FETCH LEADS
  // ===============================
  useEffect(() => {
    fetchLeads(page);
  }, [
    page,
    debouncedSearch,
    filters.source,
    filters.assigned_to,
    filters.status,
    filters.place_id,
  ]);

  // ===============================
  // DEBOUNCE SEARCH
  // ===============================
  useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.search.length === 0 || filters.search.length >= 3) {
        setDebouncedSearch(filters.search);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [filters.search]);

  // ===============================
  // RESET PAGE ON FILTER CHANGE
  // ===============================
  useEffect(() => {
    if (isUrlSyncingRef.current) return;

    setPage(1);
  }, [
    debouncedSearch,
    filters.source,
    filters.assigned_to,
    filters.status,
    filters.place_id,
  ]);

  // ===============================
  // PAGINATION HELPER
  // ===============================
  const getPagination = (current, total) => {
    const delta = 1;
    const range = [];
    const rangeWithDots = [];

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
          rangeWithDots.push(prev + 1);
        } else if (i - prev > 2) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      prev = i;
    }

    return rangeWithDots;
  };

  // ===============================
  // FETCH LEADS FROM API
  // ===============================
  const fetchLeads = async (page = 1) => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page,
        search: debouncedSearch || "",
        source: filters.source || "",
        assigned_to: filters.assigned_to || "",
        status: filters.status || "",
        place_id: filters.place_id || "",
      });

      const res = await api.get(`/leads?${params.toString()}`);

      setLeads(res.data.data);
      setLastPage(res.data.last_page);
    } catch (error) {
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  const fetchSales = async () => {
    const res = await api.get("/sales-team");
    setSales(res.data.data);
  };

  const fetchStatuses = async () => {
    const res = await api.get("/statuses");
    setStatuses(res.data);
  };

  const openModal = (lead = null) => {
    if (lead) {
      setForm(lead);
      setEditing(lead.lead_id);
    } else {
      setForm({
        assigned_to: role === "sales" ? user.sales_person_id : "",
      });
      setEditing(null);
    }
    setOpen(true);
  };

  const saveLead = async () => {
    try {
      const payload = {
        ...form,
        assigned_to: role === "sales" ? user.sales_person_id : form.assigned_to,

        // ✅ If source is empty → use user.name
        // source: form.source?.trim() ? form.source : user.name,
      };

      if (editing) {
        await api.put(`/leads/${editing}`, payload);
        toast.success("Lead updated successfully");
      } else {
        await api.post("/leads", {
          ...payload,
          lead_id: "L" + Date.now(),
          timestamp: new Date().toISOString().slice(0, 19).replace("T", " "),
        });
        toast.success("Lead created successfully");
      }

      setOpen(false);
      setForm({});
      setEditing(null);
      fetchLeads(page);
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message;

        if (status === 409) {
          toast.error(message || "Phone number already registered");
        } else if (status === 422) {
          const errors = error.response.data?.errors;
          if (errors) {
            Object.values(errors).forEach((errArray) => {
              errArray.forEach((msg) => toast.error(msg));
            });
          } else {
            toast.error(message || "Validation failed");
          }
        } else {
          toast.error(message || "Something went wrong");
        }
      } else {
        toast.error("Network error. Please try again.");
      }
    }
  };

  const deleteLead = async (id) => {
    if (role !== "admin") {
      return toast.error("Only admin can delete ❌");
    }

    if (!confirm("Delete this lead?")) return;

    const result = await api.delete(`/leads/${id}`);
    toast.success(result?.data?.message);
    fetchLeads(page);
  };

  // ✅ STATUS MODAL
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusForm, setStatusForm] = useState({
    status_id: "",
    status_type: "",
    remark: "",
    reschedule_time: "",
    shift: "",
  });

  const EXPORT_COLUMNS = [
    { label: "Contact Person", value: "contact_person" },
    { label: "Phone", value: "phone" },
    { label: "Email", value: "email" },
    { label: "Source", value: "source" },
    { label: "Address", value: "company_name" },
    { label: "Latest Status", value: "latest_status" },
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

  // ✅ ADD STATUS
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

      fetchLeads(page);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error adding status");
    }
  };

  const importExcel = async () => {
    if (!importFile) {
      return toast.error("Please select file");
    }

    try {
      const formData = new FormData();
      formData.append("file", importFile);

      if (importAssign) {
        formData.append("assigned_to", importAssign);
      }

      let result = await api.post("/leads-import-excel", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(result?.data?.message);

      setImportOpen(false);
      setImportFile(null);
      setImportAssign("");

      fetchLeads(page);
    } catch (err) {
      toast.error("Import failed ❌");
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

      fetchLeads(page);
    } catch {
      toast.error("Assignment failed ❌");
    }
  };

  const exportFile = async (format) => {
    try {
      const res = await api.post(
        "/leads-export",
        {
          columns: selectedColumns,
          lead_ids: selectedLeads,
          assigned_to: exportFilters.assigned_to,
          start_date: exportFilters.start_date,
          end_date: exportFilters.end_date,
          limit: exportFilters.limit,
          status: exportFilters.status, // ✅ ADD
          format: format,
        },
        { responseType: "blob" },
      );

      const total = res.headers["x-total-count"];

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute(
        "download",
        format === "csv" ? "leads.csv" : "leads.xlsx",
      );

      document.body.appendChild(link);
      link.click();

      const totalcount =
        res.headers["x-total-count"] || res.headers["X-Total-Count"];

      const exported =
        res.headers["x-exported-count"] || res.headers["X-Exported-Count"];

      toast.success(`Exported ${exported}/${totalcount} records 🚀`);

      setExportOpen(false);
    } catch {
      toast.error("Export failed ❌");
    }
  };

  const bulkDelete = async () => {
    if (selectedLeads.length === 0) {
      return toast.error("No leads selected");
    }

    if (!confirm("Delete selected leads? 🗑️")) return;

    try {
      const result = await api.post("/leads-bulk-delete", {
        lead_ids: selectedLeads,
      });

      toast.success(result?.data?.message);

      setSelectedLeads([]);
      fetchLeads(page);
    } catch {
      toast.error("Delete failed ❌");
    }
  };

  const statusMap = Object.fromEntries(statuses.map((s) => [s.id, s]));

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="flex flex-col gap-4 mb-6">
        {/* TOP: Filters */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
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

          <select
            className="w-full sm:w-52 border rounded-md h-9 text-sm bg-white/90 px-2"
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value });
              setPage(1);
            }}
          >
            <option value="">All Status</option>
            {statuses.map((s) => (
              <option key={s?.id} value={s?.name}>
                {s?.name}
              </option>
            ))}
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

        {/* BOTTOM: Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          {/* LEFT: Bulk actions */}
          <div className="flex flex-wrap gap-2">
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

          {/* RIGHT: Import/Export/Add */}
          <div className="flex flex-wrap gap-2">
            {role === "admin" && (
              <>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => setExportOpen(true)}
                >
                  Export <FaFileExport />
                </Button>

                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => setImportOpen(true)}
                >
                  Import <FaFileImport />
                </Button>
              </>
            )}

            <Button className="w-full sm:w-auto" onClick={() => openModal()}>
              + Lead
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <Loader type="table" />
      ) : (
        <>
          {/* TABLE */}
          <div className=" ">
            {/* ================= DESKTOP ================= */}
            <div className="hidden border rounded-lg md:block ">
              <table className="w-full text-sm min-w-[900px]">
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
                              const currentIds = leads.map(
                                (lead) => lead.lead_id,
                              );
                              setSelectedLeads((prev) =>
                                prev.filter((id) => !currentIds.includes(id)),
                              );
                            }
                          }}
                        />{" "}
                        <p className="pl-2">All</p>
                      </th>
                    )}
                    <th className="p-3 text-left whitespace-nowrap">Person</th>
                    <th className="p-3 text-left">Contact</th>
                    <th className="p-3 text-left">Address</th>
                    <th className="p-3 text-left">Status</th>
                    {role === "admin" && (
                      <>
                        <th className="p-3 text-left">Source</th>
                        <th className="p-3 text-left">Assigned</th>
                      </>
                    )}
                    <th className="p-3 text-center whitespace-nowrap">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {leads.map((lead) => (
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

                      <td className="p-3 min-w-[150px]">
                        <p className="font-medium text-gray-800 whitespace-nowrap">
                          {lead?.contact_person}
                        </p>
                        <p className="text-xs text-gray-500 whitespace-nowrap">
                          <FormatDate date={lead?.created_at} />
                        </p>
                      </td>

                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <p>
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
                                    className="text-gray-700 cursor-pointer hover:underline "
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
                            );
                          })()}
                        </p>
                        <p>
                          <a
                            href={`mailto:${lead?.email}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {lead?.email}
                          </a>
                        </p>
                      </td>

                      <td className="p-3 min-w-[150px]">
                        {lead?.company_name}
                      </td>

                      {/* <td className="p-3">{lead.source}</td> */}

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
                                      <strong>
                                        {need.place?.name || "N/A"}
                                      </strong>
                                      {" ("}
                                      {need.property_type || "N/A"}
                                      {")"}
                                    </p>

                                    <p>
                                      {need.min_area && (
                                        <strong>
                                          {need.min_area || "--"} -{" "}
                                          {need.max_area || "--"}{" "}
                                          {need.area_unit}
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

                      {role === "admin" && (
                        <>
                          <td className="p-3">
                            {lead.source && <Badge>{lead?.source}</Badge>}
                          </td>
                          <td className="p-3">
                            {lead.sales_person?.name && (
                              <Badge className={"bg-[#3E2C23] text-white"}>
                                {lead.sales_person?.name}
                              </Badge>
                            )}
                          </td>
                        </>
                      )}

                      {/* ✅ ACTIONS RESTORED */}
                      <td
                        className="p-3 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {(() => {
                          const numbers = lead?.phone_number
                            ?.split(",")
                            .map((n) => n.trim())
                            .filter((n) => n);

                          const isMultiple = numbers?.length > 1;

                          return (
                            <div className="flex items-center justify-center gap-2">
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
                                  setSelectedLeadId(lead?.lead_id);
                                  setStatusOpen(true);
                                }}
                                className="hover:bg-gray-100"
                              >
                                <MdAdd />
                              </Button>

                              {/* ❓ NEEDS */}
                              <Button
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                                onClick={() => openNeedsModal(lead?.lead_id)}
                              >
                                <FaQuestionCircle />
                              </Button>

                              {/* ✏️ EDIT */}
                              <Button
                                size="sm"
                                variant="secondary"
                                className="bg-amber-100 hover:bg-amber-200"
                                onClick={() => openModal(lead)}
                              >
                                <FaRegEdit />
                              </Button>

                              {/* 🗑 DELETE */}
                              {role === "admin" && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => deleteLead(lead?.lead_id)}
                                >
                                  <MdDelete />
                                </Button>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ================= MOBILE ================= */}
            <div className="md:hidden flex flex-col gap-3 ">
              {role === "admin" && (
                <div className="flex items-center gap-2 px-2">
                  <input
                    type="checkbox"
                    ref={selectAllRef}
                    className="scale-125"
                    checked={
                      leads.length > 0 &&
                      leads.every((lead) =>
                        selectedLeads.includes(lead?.lead_id),
                      )
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        const allIds = leads.map((lead) => lead?.lead_id);
                        setSelectedLeads((prev) => [
                          ...new Set([...prev, ...allIds]),
                        ]);
                      } else {
                        const currentIds = leads.map((lead) => lead?.lead_id);
                        setSelectedLeads((prev) =>
                          prev.filter((id) => !currentIds.includes(id)),
                        );
                      }
                    }}
                  />
                  <span className="text-sm font-medium">Select All</span>
                </div>
              )}
              {leads.map((lead) => (
                <div
                  key={lead.lead_id}
                  className="border rounded-lg p-3 shadow-sm bg-white"
                  onClick={() => navigate(`/leads/${lead.lead_id}`)}
                >
                  {/* TOP ROW */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2">
                      {role === "admin" && (
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
                      )}

                      <h3 className="font-semibold text-sm">
                        {lead?.contact_person}
                      </h3>
                    </div>

                    {lead.latest_status &&
                      (() => {
                        const status =
                          statusMap[lead?.latest_status?.status_id];

                        return (
                          <Badge
                            style={{
                              color: status?.color,
                              backgroundColor: status?.color + "33",
                            }}
                          >
                            {status?.name}
                          </Badge>
                        );
                      })()}
                  </div>

                  {/* INFO */}
                  <div className="text-xs mt-2 space-y-1 text-muted-foreground">
                    <p>
                      <b>Phone:</b>{" "}
                      {lead?.phone_number?.includes(",") ? (
                        lead.phone_number.split(",").map((num, i) => {
                          const cleanNum = num.trim();

                          return (
                            <a
                              key={i}
                              href={`tel:${cleanNum}`}
                              onClick={(e) => e.stopPropagation()}
                              // style={{ display: "block" }} // each number on new line (optional)
                            >
                              {cleanNum}{" "}
                            </a>
                          );
                        })
                      ) : (
                        <a
                          href={`tel:${lead?.phone_number}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {lead?.phone_number}
                        </a>
                      )}
                    </p>
                    <p>
                      <b>Email:</b>{" "}
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `mailto:${lead?.email}`;
                        }}
                        className="text-blue-500"
                      >
                        {lead?.email}
                      </span>
                    </p>

                    <p>
                      <b>Address:</b> {lead?.company_name}
                    </p>
                    <p>
                      <b>Date:</b> <FormatDate date={lead?.created_at} />
                    </p>
                    {role === "admin" && (
                      <>
                        <p>
                          <b>Source:</b> {lead?.source}
                        </p>

                        <p>
                          <b>Assigned:</b>{" "}
                          {lead.sales_person?.name && (
                            <Badge className={"bg-[#3E2C23] text-white"}>
                              {lead.sales_person?.name}
                            </Badge>
                          )}
                        </p>
                      </>
                    )}
                    {lead?.needs?.length > 0 && (
                      <Badge className="mt-1 bg-purple-600 text-white">
                        {lead.needs
                          .map((need) => need.place?.name)
                          .filter(Boolean)
                          .join(" | ")}
                      </Badge>
                    )}
                  </div>

                  {/* ACTIONS */}
                  <div
                    className="flex flex-wrap gap-2 mt-3"
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

                              <PopoverContent className="w-56 p-2 rounded-xl shadow-xl">
                                <p className="text-xs text-gray-500 mb-2 px-2">
                                  Choose number to call
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
                                      className="text-blue-500"
                                      size={14}
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

                              <PopoverContent className="w-56 p-2 rounded-xl shadow-xl">
                                <p className="text-xs text-gray-500 mb-2 px-2">
                                  Choose number for WhatsApp
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
                                      className="text-green-500"
                                      size={14}
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
                            className="flex-1 hover:bg-gray-100"
                            onClick={() => {
                              setSelectedLeadId(lead?.lead_id);
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

                          {/* ADMIN */}
                          {role === "admin" && (
                            <>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="flex-1 hover:bg-gray-200"
                                onClick={() => openModal(lead)}
                              >
                                <FaRegEdit />
                                Edit
                              </Button>

                              <Button
                                size="sm"
                                variant="destructive"
                                className="flex-1"
                                onClick={() => deleteLead(lead?.lead_id)}
                              >
                                <MdDelete />
                                Delete
                              </Button>
                            </>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* PAGINATION */}
      <div className="flex justify-center gap-2 mt-4 flex-wrap">
        <Button
          size="sm"
          variant="outline"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Prev
        </Button>
        {getPagination(page, lastPage).map((p, i) =>
          p === "..." ? (
            <span key={i} className="px-2 py-1 text-sm">
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
      {/* ADD/EDIT MODAL */}
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
              disabled={role !== "admin" && editing}
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

      {/* ADD Status MODAL */}
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

      {/* Import Lead MODAL */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import Excel</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {/* FILE */}
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setImportFile(e.target.files[0])}
              className="border rounded p-2 w-full"
            />

            {/* ASSIGN (OPTIONAL) */}
            <select
              className="border rounded p-2 w-full"
              value={importAssign}
              onChange={(e) => setImportAssign(e.target.value)}
            >
              <option value="">Assign (Optional)</option>

              {sales.map((s) => (
                <option key={s.sales_person_id} value={s.sales_person_id}>
                  {s.name}
                </option>
              ))}
            </select>

            <Button onClick={importExcel} className="w-full">
              Upload & Import
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Lead MODAL */}
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

      {/* Export Lead MODAL */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent>
          <DialogHeader className={"mb-2"}>
            <DialogTitle>Select Columns to Export</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {/* FILTER: SALES */}
            <select
              className="border p-2 w-full rounded"
              value={exportFilters.assigned_to}
              onChange={(e) =>
                setExportFilters({
                  ...exportFilters,
                  assigned_to: e.target.value,
                })
              }
            >
              <option value="">All Sales</option>
              {sales.map((s) => (
                <option key={s.sales_person_id} value={s.sales_person_id}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              className="border p-2 w-full rounded"
              value={exportFilters.status}
              onChange={(e) =>
                setExportFilters({
                  ...exportFilters,
                  status: e.target.value,
                })
              }
            >
              <option value="">All Status</option>

              {statuses.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* DATE RANGE */}
            <label htmlFor="">Starting Date</label>
            <input
              type="date"
              className="border p-2 w-full"
              onChange={(e) =>
                setExportFilters({
                  ...exportFilters,
                  start_date: e.target.value,
                })
              }
            />

            <label htmlFor="">Ending Date</label>
            <input
              type="date"
              className="border p-2 w-full"
              onChange={(e) =>
                setExportFilters({ ...exportFilters, end_date: e.target.value })
              }
            />
            <h4 className="font-semibold">Columns</h4>

            {/* COLUMN SELECT */}
            {EXPORT_COLUMNS.map((col) => (
              <label key={col.value} className="flex gap-2 items-center">
                <input
                  type="checkbox"
                  checked={selectedColumns.includes(col.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedColumns([...selectedColumns, col.value]);
                    } else {
                      setSelectedColumns(
                        selectedColumns.filter((c) => c !== col.value),
                      );
                    }
                  }}
                />
                {col.label}
              </label>
            ))}

            {/* DATE RANGE */}

            <label>Number of row (optional)</label>
            <input
              type="number"
              className="border p-2 w-full"
              onChange={(e) =>
                setExportFilters({
                  ...exportFilters,
                  limit: e.target.value,
                })
              }
            />
            <div className="flex gap-2 mt-3">
              <Button onClick={() => exportFile("xlsx")} className="">
                Download Excel (.xlsx)
              </Button>

              <Button
                onClick={() => exportFile("csv")}
                variant="outline"
                className=""
              >
                Download CSV (.csv)
              </Button>
            </div>
          </div>
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
