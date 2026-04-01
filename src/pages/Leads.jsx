import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

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
  FaRegEdit,
  FaWhatsapp,
} from "react-icons/fa";
import { MdAdd, MdAssignmentInd, MdDelete, MdEdit } from "react-icons/md";

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [sales, setSales] = useState([]);

  const [filters, setFilters] = useState({
    search: "",
    source: "",
    status: "",
    assigned_to: "",
  });
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);

  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

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
  });

  const navigate = useNavigate();

  // ✅ Role
  const role = localStorage.getItem("role");
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (role === "admin") {
      fetchSales();
    }
  }, []);
  useEffect(() => {
    fetchLeads(page);
  }, [
    page,
    debouncedSearch,
    filters.source,
    filters.assigned_to,
    filters.status,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      // ✅ Only allow if empty OR >= 3 chars
      if (filters.search.length === 0 || filters.search.length >= 3) {
        setDebouncedSearch(filters.search);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.source, filters.assigned_to, filters.status]);

  const fetchLeads = async (page = 1) => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page,
        search: debouncedSearch || "", // ✅ use debounced value
        source: filters.source || "",
        assigned_to: filters.assigned_to || "",
        status: filters.status || "", // ✅ NEW
        // per_page:100
      });

      const res = await api.get(`/leads?${params.toString()}`);

      setLeads(res.data.data);
      setLastPage(res.data.last_page);
    } catch {
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
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
      };

      if (editing) {
        await api.put(`/leads/${editing}`, payload);
        toast.success("Lead updated");
      } else {
        await api.post("/leads", {
          ...payload,
          lead_id: "L" + Date.now(),
          timestamp: new Date().toISOString().slice(0, 19).replace("T", " "),
        });
        toast.success("Lead created");
      }

      setOpen(false);
      setForm({});
      setEditing(null);
      fetchLeads(page);
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
    fetchLeads(page);
  };

  // ✅ STATUS MODAL
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusForm, setStatusForm] = useState({
    status_type: "",
    remark: "",
  });

  const EXPORT_COLUMNS = [
    "company",
    "contact_person",
    "phone",
    "email",
    "source",
    "latest_status",
  ];

  // ✅ ADD STATUS
  const addStatus = async () => {
    try {
      await api.post("/status-history", {
        lead_id: selectedLeadId,
        status_type: statusForm.status_type,
        remark: statusForm.remark,
      });

      toast.success("Status added ✅");

      setStatusOpen(false);
      setStatusForm({ status_type: "", remark: "" });

      fetchLeads();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error adding status");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Follow-Up":
        return "bg-yellow-100 text-yellow-700";

      case "Appointment Scheduled":
        return "bg-blue-100 text-blue-700";

      case "Interested":
        return "bg-green-100 text-green-700";

      case "Quotation Sent":
        return "bg-indigo-100 text-indigo-700";

      case "Negotiation":
        return "bg-purple-100 text-purple-700";

      case "Closed-Ordered":
        return "bg-green-200 text-green-800";

      case "Closed-Lost":
        return "bg-red-100 text-red-700";

      case "Not Interested":
        return "bg-gray-200 text-gray-700";

      case "On Hold":
        return "bg-orange-100 text-orange-700";

      case "Callback Requested":
        return "bg-cyan-100 text-cyan-700";

      case "Unreachable":
        return "bg-slate-200 text-slate-700";

      default:
        return "bg-gray-100 text-gray-600";
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

      console.log(result);

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

  const exportExcel = async () => {
    try {
      const res = await api.post(
        "/leads-export-excel",
        {
          columns: selectedColumns,
          lead_ids: selectedLeads, // optional
          assigned_to: exportFilters.assigned_to,
          start_date: exportFilters.start_date,
          end_date: exportFilters.end_date,
          limit: exportFilters.limit,
        },
        { responseType: "blob" },
      );

      const total = res.headers["x-total-count"];

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", "leads.xlsx");
      document.body.appendChild(link);
      link.click();

      toast.success(`Exported ${total} records 🚀`);

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
      await api.post("/leads-bulk-delete", {
        lead_ids: selectedLeads,
      });

      toast.success("Deleted successfully 🚀");

      setSelectedLeads([]);
      fetchLeads(page);
    } catch {
      toast.error("Delete failed ❌");
    }
  };

  const getPagination = (current, total) => {
    const delta = 1; // how many pages around current
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

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="flex flex-col gap-4 mb-6">
        {/* TOP: Filters */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
          <Input
            placeholder="Search..."
            className="w-full sm:w-48 bg-white/90 h-9"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />

          <select
            className="w-full sm:w-40 border rounded-md h-9 text-sm bg-white/90 px-2"
            value={filters.source}
            onChange={(e) => setFilters({ ...filters, source: e.target.value })}
          >
            <option value="">All Sources</option>
            <option value="website">Website</option>
            <option value="Ads">Ads</option>
          </select>

          <select
            className="w-full sm:w-52 border rounded-md h-9 text-sm bg-white/90 px-2"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Status</option>
            {[
              "Follow-Up",
              "Appointment Scheduled",
              "Not Interested",
              "Interested",
              "Quotation Sent",
              "Negotiation",
              "Closed-Ordered",
              "Closed-Lost",
              "On Hold",
              "Callback Requested",
              "Unreachable",
            ].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {role === "admin" && (
            <select
              className="w-full sm:w-40 border rounded-md h-9 text-sm bg-white/90 px-2"
              value={filters.assigned_to}
              onChange={(e) =>
                setFilters({ ...filters, assigned_to: e.target.value })
              }
            >
              <option value="">All Sales</option>
              {sales.map((s) => (
                <option key={s.sales_person_id} value={s.sales_person_id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
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
            <div className="hidden border rounded-lg md:block overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead className="bg-muted">
                  <tr>
                    {role === "admin" && <th className="p-3 text-center"></th>}
                    <th className="p-3 text-left">Company</th>
                    <th className="p-3 text-left">Person</th>
                    <th className="p-3 text-left">Phone</th>
                    <th className="p-3 text-left">Email</th>
                    {/* <th className="p-3 text-left">Source</th> */}
                    <th className="p-3 text-left">Status</th>
                    {role === "admin" && (
                      <th className="p-3 text-left">Assigned</th>
                    )}
                    <th className="p-3 text-center">Action</th>
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
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
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

                      <td className="p-3">{lead.company_name}</td>
                      <td className="p-3">{lead.contact_person}</td>

                      <td className="p-3">
                        <a
                          href={`tel:${lead.phone_number}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {lead.phone_number}
                        </a>
                      </td>
                      <td className="p-3">
                        <a
                          href={`mailto:${lead.email}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {lead.email}
                        </a>
                      </td>

                      {/* <td className="p-3">{lead.source}</td> */}

                      <td className="p-3">
                        {lead.latest_status && (
                          <Badge
                            className={getStatusColor(
                              lead.latest_status?.status_type,
                            )}
                          >
                            {lead.latest_status?.status_type}
                          </Badge>
                        )}
                      </td>

                      {role === "admin" && (
                        <td className="p-3">{lead.sales_person?.name}</td>
                      )}

                      {/* ✅ ACTIONS RESTORED */}
                      <td
                        className="p-3 space-x-2 text-center"
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

                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedLeadId(lead.lead_id);
                            setStatusOpen(true);
                          }}
                        >
                          <MdAdd /> Status
                        </Button>

                        {role === "admin" && (
                          <>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="bg-amber-100 hover:bg-amber-200"
                              onClick={() => openModal(lead)}
                            >
                              <FaRegEdit />
                            </Button>

                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteLead(lead.lead_id)}
                            >
                              <MdDelete />
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ================= MOBILE ================= */}
            <div className="md:hidden flex flex-col gap-3 ">
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
                        {lead?.company_name}
                      </h3>
                    </div>

                    {lead.latest_status && (
                      <Badge
                        className={getStatusColor(
                          lead.latest_status?.status_type,
                        )}
                      >
                        {lead.latest_status?.status_type}
                      </Badge>
                    )}
                  </div>

                  {/* INFO */}
                  <div className="text-xs mt-2 space-y-1 text-muted-foreground">
                    <p>
                      <b>Person:</b> {lead?.contact_person}
                    </p>

                    <p>
                      <b>Phone:</b>{" "}
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `tel:${lead?.phone_number}`;
                        }}
                        className="text-blue-500"
                      >
                        {lead?.phone_number}
                      </span>
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
                      <b>Source:</b> {lead?.source}
                    </p>

                    {role === "admin" && (
                      <p>
                        <b>Assigned:</b> {lead?.sales_person?.name}
                      </p>
                    )}
                  </div>

                  {/* ACTIONS */}
                  <div
                    className="flex flex-wrap gap-2 mt-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      size="sm"
                      className="flex-1 bg-blue-500"
                      onClick={() =>
                        (window.location.href = `tel:${lead?.phone_number}`)
                      }
                    >
                      <PhoneIcon />
                    </Button>

                    <Button
                      size="sm"
                      className="flex-1 bg-green-500 text-white"
                      onClick={() =>
                        window.open(
                          `https://wa.me/${lead?.phone_number}`,
                          "_blank",
                        )
                      }
                    >
                      <FaWhatsapp />
                    </Button>

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

                    {role === "admin" && (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="flex-1"
                          onClick={() => openModal(lead)}
                        >
                          <FaRegEdit />
                          Edit
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1"
                          onClick={() => deleteLead(lead.lead_id)}
                        >
                          <MdDelete />
                          Delete
                        </Button>
                      </>
                    )}
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

      {/* ADD Status MODAL */}
      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Status</DialogTitle>
          </DialogHeader>

          <select
            className="border p-2 w-full rounded mb-2"
            value={statusForm.status_type}
            onChange={(e) =>
              setStatusForm({
                ...statusForm,
                status_type: e.target.value,
              })
            }
          >
            <option value="">Select Status</option>

            {[
              "Follow-Up",
              "Appointment Scheduled",
              "Not Interested",
              "Interested",
              "Quotation Sent",
              "Negotiation",
              "Closed-Ordered",
              "Closed-Lost",
              "On Hold",
              "Callback Requested",
              "Unreachable",
            ].map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <textarea
            className="border p-2 w-full"
            placeholder="Remark"
            value={statusForm.remark}
            onChange={(e) =>
              setStatusForm({
                ...statusForm,
                remark: e.target.value,
              })
            }
          />

          <Button onClick={addStatus}>Save Status</Button>
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
              accept=".xlsx,.xls"
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
              <label key={col} className="flex gap-2 items-center">
                <input
                  type="checkbox"
                  checked={selectedColumns.includes(col)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedColumns([...selectedColumns, col]);
                    } else {
                      setSelectedColumns(
                        selectedColumns.filter((c) => c !== col),
                      );
                    }
                  }}
                />
                {col}
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
            <Button onClick={exportExcel} className="w-full mt-3">
              Download Excel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
