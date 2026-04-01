import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import api from "../api/axios";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import Loader from "@/components/ui/Loader";
import { MdDelete, MdEdit } from "react-icons/md";

export default function Performance() {

  const [data, setData] = useState([]);
  const [sales, setSales] = useState([]);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    fetchSales();
  }, []);

  // ✅ FETCH
  const fetchData = async () => {
    try {
      const res = await api.get("/performance");
      setData(res.data);
      setLoading(false);
      
    } catch {
      toast.error("Failed to load performance");
      setLoading(false);
    }
  };

  const fetchSales = async () => {
    try {
      const res = await api.get("/sales-team");
      setSales(res.data.data);
    } catch {
      toast.error("Failed to load sales team");
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setForm(item);
      setEditing(item.perf_id);
    } else {
      setForm({});
      setEditing(null);
    }
    setOpen(true);
  };

  // ✅ SAVE
  const save = async () => {
    try {
      if (editing) {
        await api.put(`/performance/${editing}`, form);
        toast.success("Updated successfully ✅");
      } else {
        await api.post("/performance", form);
        toast.success("Created successfully 🚀");
      }

      setOpen(false);
      setForm({});
      setEditing(null);
      fetchData();

    } catch {
      toast.error("Error saving data ❌");
    }
  };

  // ✅ DELETE
  const deleteItem = async (id) => {
    if (!confirm("Delete?")) return;

    try {
      await api.delete(`/performance/${id}`);
      toast.success("Deleted 🗑️");
      fetchData();
    } catch {
      toast.error("Delete failed ❌");
    }
  };

  // ✅ KPI BADGE LOGIC
  const getPerformanceBadge = (item) => {
    const ratio =
      item.total_leads > 0
        ? item.closed_ordered / item.total_leads
        : 0;

    if (ratio >= 0.5) {
      return <Badge className="bg-green-100 text-green-700">High</Badge>;
    } else if (ratio >= 0.2) {
      return <Badge className="bg-yellow-100 text-yellow-700">Medium</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-700">Low</Badge>;
    }
  };

      if (loading) {
        return (<DashboardLayout>
          <div className="flex justify-between mb-6">
        <h1 className="text-xl font-semibold">Performance</h1>

        <Button onClick={() => openModal()}>
          + Add Record
        </Button>
      </div>
          <Loader type="table"/>
        </DashboardLayout>)
    }

  return (
    <DashboardLayout>

      {/* HEADER */}
      {/* HEADER */}
      <div className="flex justify-between mb-6">
        <h1 className="text-xl font-semibold">Performance</h1>

        <Button onClick={() => openModal()}>
          + Add Record
        </Button>
      </div>


      {!loading ? (
  <>
    {/* ================= DESKTOP ================= */}
    <div className="hidden md:block border rounded-lg overflow-x-auto">
      <Table className="min-w-[800px]">
        <TableHeader>
          <TableRow>
            <TableHead>Sales</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Leads</TableHead>
            <TableHead>Calls</TableHead>
            <TableHead>Closed</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.map((item) => (
            <TableRow key={item.perf_id}>
              <TableCell>{item.sales_person?.name}</TableCell>
              <TableCell>{item.report_date}</TableCell>
              <TableCell>{item.total_leads}</TableCell>
              <TableCell>{item.total_calls}</TableCell>
              <TableCell>{item.closed_ordered}</TableCell>

              <TableCell>
                {getPerformanceBadge(item)}
              </TableCell>

              <TableCell className="space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openModal(item)}
                >
                  <MdEdit /> Edit
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteItem(item.perf_id)}
                >
                  <MdDelete /> Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
          </div>
          
              {/* ================= MOBILE ================= */}
    <div className="md:hidden flex flex-col gap-3">

      {data.map((item) => (
        <div
          key={item.perf_id}
          className="border rounded-lg p-3 bg-white shadow-sm"
        >
          {/* TOP */}
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-sm">
              {item.sales_person?.name}
            </h3>

            {getPerformanceBadge(item)}
          </div>

          {/* INFO */}
          <div className="text-xs text-muted-foreground mt-2 space-y-1">
            <p><b>Date:</b> {item.report_date}</p>
            <p><b>Leads:</b> {item.total_leads}</p>
            <p><b>Calls:</b> {item.total_calls}</p>
            <p><b>Closed:</b> {item.closed_ordered}</p>
          </div>

          {/* ACTIONS */}
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              className="flex-1"
              variant="outline"
              onClick={() => openModal(item)}
            >
              Edit
            </Button>

            <Button
              size="sm"
              className="flex-1"
              variant="destructive"
              onClick={() => deleteItem(item.perf_id)}
            >
              Delete
            </Button>
          </div>
        </div>
      ))}

    </div>
  </>
) : (
  <Loader type="table" />
)}

      {/* MODAL */}
      <Dialog open={open} onOpenChange={setOpen}>

        <DialogContent className="max-w-md">

          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit" : "Add"} Performance
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">

            <select
              className="border p-2 rounded w-full"
              value={form.sales_person_id || ""}
              onChange={(e) =>
                setForm({ ...form, sales_person_id: e.target.value })
              }
            >
              <option>Select Sales</option>

              {sales.map((s) => (
                <option key={s.sales_person_id} value={s.sales_person_id}>
                  {s.name}
                </option>
              ))}
            </select>

            <Input
              type="date"
              value={form.report_date || ""}
              onChange={(e) =>
                setForm({ ...form, report_date: e.target.value })
              }
            />

            <Input
              placeholder="Total Leads"
              value={form.total_leads || ""}
              onChange={(e) =>
                setForm({ ...form, total_leads: e.target.value })
              }
            />

            <Input
              placeholder="Total Calls"
              value={form.total_calls || ""}
              onChange={(e) =>
                setForm({ ...form, total_calls: e.target.value })
              }
            />

            <Input
              placeholder="Closed Orders"
              value={form.closed_ordered || ""}
              onChange={(e) =>
                setForm({ ...form, closed_ordered: e.target.value })
              }
            />

            <Button onClick={save} className="w-full">
              Save
            </Button>

          </div>

        </DialogContent>

      </Dialog>

    </DashboardLayout>
  );
}