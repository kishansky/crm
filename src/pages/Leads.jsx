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

export default function Leads() {

  const [leads, setLeads] = useState([]);
  const [sales, setSales] = useState([]);

  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchLeads(page);
    fetchSales();
  }, [page]);

  // ✅ FETCH WITH PAGINATION
  const fetchLeads = async (page = 1) => {
    try {
      const res = await api.get(`/leads?page=${page}`);

      setLeads(res.data.data);
      setLastPage(res.data.last_page);

    } catch {
      toast.error("Failed to load leads");
    }
  };

  const fetchSales = async () => {
    const res = await api.get("/sales-team");
    setSales(res.data);
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

  // ✅ SAVE
  const saveLead = async () => {
    try {
      if (editing) {
        await api.put(`/leads/${editing}`, form);
        toast.success("Lead updated");
      } else {
        await api.post("/leads", {
          ...form,
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

  // ✅ DELETE
  const deleteLead = async (id) => {
    if (!confirm("Delete this lead?")) return;

    await api.delete(`/leads/${id}`);
    toast.success("Deleted");
    fetchLeads(page);
  };

  // ✅ FILTERS
  const filtered = leads.filter((l) =>
    l.company_name?.toLowerCase().includes(search.toLowerCase()) &&
    (sourceFilter ? l.source === sourceFilter : true)
  );

  return (
    <DashboardLayout>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row gap-3 md:justify-between mb-6">

        <div className="flex gap-2 flex-wrap">

          <Input
            placeholder="Search..."
            className="w-full md:w-60"
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* SOURCE FILTER */}
          <select
            className="border rounded p-2"
            onChange={(e) => setSourceFilter(e.target.value)}
          >
            <option value="">All Sources</option>
            <option value="website">Website</option>
            <option value="Ads">Ads</option>
          </select>

        </div>

        <Button onClick={() => openModal()}>
          + Add Lead
        </Button>

      </div>

      {/* TABLE */}
      <div className="border rounded-lg overflow-x-auto">

        <table className="w-full text-sm">

          <thead className="bg-muted">
            <tr>
              <th className="p-3 text-left">Company</th>
              <th className="p-3 text-left">Contact</th>
              <th className="p-3 text-left">Phone</th>
              <th className="p-3 text-left">Source</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Assigned</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>

          <tbody>

            {filtered.map((lead) => {

              // ✅ latest status
              const latestStatus =
                lead.status_history?.[lead.status_history.length - 1];

              return (
                <tr
                  key={lead.lead_id}
                  className="border-t hover:bg-muted/50 cursor-pointer"
                  onClick={() => navigate(`/leads/${lead.lead_id}`)}
                >

                  <td className="p-3">{lead.company_name}</td>
                  <td className="p-3">{lead.contact_person}</td>
                  <td className="p-3">{lead.phone_number}</td>
                  <td className="p-3">{lead.source}</td>

                  {/* ✅ STATUS BADGE */}
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        latestStatus?.status_type === "Closed"
                          ? "bg-green-100 text-green-700"
                          : latestStatus?.status_type === "Follow Up"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {latestStatus?.status_type || "New"}
                    </span>
                  </td>

                  <td className="p-3">{lead.sales_person?.name}</td>

                  <td className="p-3 space-x-2 text-center">

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal(lead);
                      }}
                    >
                      Edit
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteLead(lead.lead_id);
                      }}
                    >
                      Delete
                    </Button>

                  </td>

                </tr>
              );
            })}

          </tbody>

        </table>

      </div>

      {/* ✅ PAGINATION */}
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

      {/* MODAL */}
      <Dialog open={open} onOpenChange={setOpen}>

        <DialogContent className="max-w-2xl">

          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Lead" : "Add Lead"}
            </DialogTitle>
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
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />

            <Input
              placeholder="Source"
              value={form.source || ""}
              onChange={(e) =>
                setForm({ ...form, source: e.target.value })
              }
            />

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

    </DashboardLayout>
  );
}