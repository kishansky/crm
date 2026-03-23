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

export default function LeadDetails() {
  const { id } = useParams();
  const [lead, setLead] = useState(null);
  const [sales, setSales] = useState([]);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);

  // ✅ STATUS MODAL
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusForm, setStatusForm] = useState({
    status_type: "",
    remark: "",
  });

  const navigate = useNavigate();

  const role = localStorage.getItem("role");
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    fetchLead();

    if (role === "admin") {
      fetchSales();
    }
  }, [id]);

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
        lead_id: lead.lead_id,
        status_type: statusForm.status_type,
        remark: statusForm.remark,
      });

      toast.success("Status added ✅");

      setStatusOpen(false);
      setStatusForm({ status_type: "", remark: "" });

      fetchLead();
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
  const getStatusStepColor = (status) => {
    switch (status) {
      case "Follow-Up":
        return "bg-yellow-400 text-yellow-700";

      case "Appointment Scheduled":
        return "bg-blue-400 text-blue-700";

      case "Interested":
        return "bg-green-500 text-green-700";

      case "Quotation Sent":
        return "bg-indigo-400 text-indigo-700";

      case "Negotiation":
        return "bg-purple-400 text-purple-700";

      case "Closed-Ordered":
        return "bg-green-600 text-green-800";

      case "Closed-Lost":
        return "bg-red-500 text-red-700";

      case "Not Interested":
        return "bg-gray-400 text-gray-700";

      case "On Hold":
        return "bg-orange-400 text-orange-700";

      case "Callback Requested":
        return "bg-cyan-400 text-cyan-700";

      case "Unreachable":
        return "bg-slate-400 text-slate-700";

      default:
        return "bg-gray-300 text-gray-600";
    }
  };

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
      <div className="mb-6 flex justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{lead.company_name}</h1>
          <p className="text-sm text-muted-foreground">Lead Details Overview</p>
        </div>

        <div className="flex gap-3">
          

          {role === "admin" && (<>
            <Button size="sm" variant="outline" onClick={() => openModal(lead)}>
            Edit
          </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => deleteLead(lead.lead_id)}
              >
              Delete
            </Button>
              </>
          )}
        </div>
      </div>

      {/* COMPANY + CONTACT */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Company Info</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{lead.company_name}</p>
            <Badge>{lead.source}</Badge>
            <p className="text-xs mt-2">{lead.enquiry_description}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{lead.contact_person}</p>
            <p>{lead.phone_number}</p>
            <p>{lead.email}</p>
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
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        .map((s, index) => (
          <div key={s.history_id} className="relative mb-4">

             {/* LINE */}
            {index !== lead.status_history.length - 1 && (
              <span
                className={`absolute left-1.5 top-5 w-[2px] h-[80%] ${getStatusStepColor(s.status_type)}`}
              ></span>
            )}

            {/* DOT */}
            <div
              className={`absolute left-0 top-1 w-3 h-3 rounded-full ${getStatusStepColor(s.status_type)}`}
            ></div>

            {/* CONTENT */}
            <div className="ml-6 border rounded-lg p-3 bg-white shadow-sm">

              <div className="flex justify-between items-center mb-1">
                <Badge className={getStatusColor(s.status_type)}>
                  {s.status_type}
                </Badge>

                <span className="text-xs text-muted-foreground font-semibold">
                  {new Date(s.updated_at).toLocaleString()}
                </span>
              </div>

              <p className="text-sm">
                {s.remark || "No remark"}
              </p>

            </div>

          </div>
        ))}

    </div>
  )}
</CardContent>
        </Card>
      </div>

      {/* EDIT MODAL */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
          </DialogHeader>

          <Input
            placeholder="Company"
            value={form.company_name || ""}
            onChange={(e) => setForm({ ...form, company_name: e.target.value })}
          />

          <Button onClick={saveLead}>Save</Button>
        </DialogContent>
      </Dialog>

      {/* STATUS MODAL */}
      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Status</DialogTitle>
          </DialogHeader>

          <select
            className="border p-2 w-full rounded"
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
    </DashboardLayout>
  );
}
