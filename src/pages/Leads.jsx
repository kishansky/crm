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
    "company_name",
    "contact_person",
    "phone_number",
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

      await api.post("/leads-import-excel", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Excel imported 🚀");

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

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="flex flex-col md:flex-row gap-3 md:justify-between mb-6">
        <div className="flex gap-2 flex-wrap">
          <Input
            placeholder="Search..."
            className="w-full md:w-40 bg-white/90"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />

          <select
            className="border rounded-md h-8 text-sm bg-white/90 md:max-w-32"
            value={filters.source}
            onChange={(e) => setFilters({ ...filters, source: e.target.value })}
          >
            <option value="">All Sources</option>
            <option value="website">Website</option>
            <option value="Ads">Ads</option>
          </select>

          <select
            className="border rounded-md h-8 text-sm bg-white/90 md:max-w-36"
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
              className="border rounded-md h-8 text-sm bg-white/90 md:max-w-32"
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

        <div className="flex gap-2">
          {role === "admin" && selectedLeads.length > 0 && (
            <>
              <Button variant="destructive" onClick={bulkDelete}>
                <MdDelete /> Delete ({selectedLeads.length})
              </Button>

              <Button onClick={() => setAssignOpen(true)}>
                <MdAssignmentInd />Assign ({selectedLeads.length})
              </Button>
            </>
          )}
          {role === "admin" && (
            <>
              <Button variant="outline" onClick={() => setExportOpen(true)}>
                Export <FaFileExport />
              </Button>
              <Button variant="outline" onClick={() => setImportOpen(true)}>
                Import <FaFileImport />
              </Button>
            </>
          )}

          <Button onClick={() => openModal()}>+ Lead</Button>
        </div>
      </div>

      {loading ? (
        <Loader type="table" />
      ) : (
        <>
          {/* TABLE */}
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  {role === "admin" && (
                    <th className="p-3 text-center">Select</th>
                  )}
                  <th className="p-3 text-left">Company</th>
                  <th className="p-3 text-left">Contact</th>
                  <th className="p-3 text-left">Phone</th>
                  <th className="p-3 text-left">Source</th>
                  <th className="p-3 text-left">Status</th>
                  {role === "admin" && (
                    <th className="p-3 text-left">Assigned</th>
                  )}

                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>

              <tbody>
                {leads.map((lead) => {
                  // const latestStatus =
                  //   lead.status_history?.[lead.status_history.length - 1];

                  return (
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
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {lead.phone_number}
                        </a>
                      </td>
                      <td className="p-3">{lead.source}</td>

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

                      <td className="p-3 space-x-2 text-center">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `tel:${lead.phone_number}`;
                          }}
                          className={"bg-blue-500 hover:bg-blue-500/90"}
                        >
                          <PhoneIcon />
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(
                              `https://wa.me/${lead.phone_number}`,
                              "_blank",
                            );
                          }}
                        >
                          <FaWhatsapp size={16} />
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
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
                              className={"bg-amber-100 hover:bg-amber-200"}
                              onClick={(e) => {
                                e.stopPropagation();
                                openModal(lead);
                              }}
                            >
                              <FaRegEdit className="text-secondary-foreground " />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteLead(lead.lead_id);
                              }}
                            >
                              <MdDelete />
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="flex justify-center gap-2 mt-4 flex-wrap">
            {[...Array(lastPage)].map((_, i) => (
              <Button
                key={i}
                variant={page === i + 1 ? "default" : "outline"}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </Button>
            ))}
          </div>
        </>
      )}

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
