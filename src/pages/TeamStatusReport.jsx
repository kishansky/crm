import api from "@/api/axios";
import DashboardLayout from "@/components/layout/DashboardLayout";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Loader from "@/components/ui/Loader";
import toast from "react-hot-toast";

const TeamStatusReport = () => {
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState("today");
  const [date, setDate] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    try {
      setLoading(true);

      let url = `/team-status-report?filter=${filter}`;

      if (filter === "date" && date) {
        url += `&date=${date}`;
      }

      if (filter === "range" && fromDate && toDate) {
        url += `&from_date=${fromDate}&to_date=${toDate}`;
      }

      const res = await api.get(url);
      setData(res.data.data);
    } catch (error) {
      toast.error("Failed to fetch report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filter === "date" && !date) return;
    if (filter === "range" && (!fromDate || !toDate)) return;

    fetchReport();
  }, [filter, date, fromDate, toDate]);

  const today = new Date().toISOString().split("T")[0];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex sm:flex-row flex-col flex-wrap sm:items-center item-start gap-2 mb-4">
        {/* Today */}
        <Button
          onClick={() => {
            setFilter("today");
            setDate("");
            setFromDate("");
            setToDate("");
          }}
          className={`px-4 py-2 h-9 rounded-md ${
            filter === "today"
              ? "bg-primary text-white shadow"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          Today
        </Button>

        {/* Yesterday */}
        <Button
          onClick={() => {
            setFilter("yesterday");
            setDate("");
            setFromDate("");
            setToDate("");
          }}
          className={`px-4 py-2 h-9 rounded-md ${
            filter === "yesterday"
              ? "bg-primary text-white shadow"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          Yesterday
        </Button>

        {/* Single Date */}
         Single Date :
        <input
          type="date"
          className={`border rounded-md h-9 px-3 ${
            filter === "date"
              ? "border-primary ring-2 ring-primary/30"
              : "border-gray-300"
          }`}
          value={date || ""}
          max={today}
          onChange={(e) => {
            setDate(e.target.value);
            setFilter("date");
            setFromDate("");
            setToDate("");
          }}
        />

        {/* 🔥 FROM DATE */}
        From Date :
        <input
          type="date"
          className={`border rounded-md h-9 px-3 ${
            filter === "range"
              ? "border-primary ring-2 ring-primary/30"
              : "border-gray-300"
          }`}
          value={fromDate || ""}
          max={today}
          onChange={(e) => {
            setFromDate(e.target.value);
            setFilter("range");
          }}
        />

        {/* 🔥 TO DATE */}
        To Date :
        <input
          type="date"
          className={`border rounded-md h-9 px-3 ${
            filter === "range"
              ? "border-primary ring-2 ring-primary/30"
              : "border-gray-300"
          }`}
          value={toDate || ""}
          max={today}
          onChange={(e) => {
            setToDate(e.target.value);
            setFilter("range");
          }}
        />
      </div>

      {loading ? (
        <Loader type="table" />
      ) : (
        <div className="hidden border rounded-lg md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-3 text-left">Team Member</th>
                <th className="p-3 text-left">Assigned Leads</th>
                <th className="p-3 text-left">Statuses</th>
                <th className="p-3 text-center">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.map((team, index) => (
                <tr key={index} className="border-t hover:bg-muted/50">
                  <td className="p-3 font-medium">{team.team_member}</td>
                  <td className="p-3 text-start font-bold">
                    {team.assigned_leads}
                  </td>
                  <td className="p-3 ">
                    <div className="flex flex-wrap gap-2">
                      {team.statuses.map((status, idx) => (
                        <Badge
                          key={idx}
                          style={{
                            backgroundColor: status.status_color + "33",
                            color: status.status_color,
                          }}
                        >
                          {status.status_name} ({status.count})
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 text-center font-bold">{team.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile View */}
      {!loading && (
        <div className="md:hidden flex flex-col gap-3">
          {data.map((team, index) => (
            <div key={index} className="border rounded-lg p-3 bg-white">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">{team.team_member}</h3>
                <span className="font-bold">Total: {team.total}</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {team.statuses.map((status, idx) => (
                  <Badge
                    key={idx}
                    style={{
                      backgroundColor: status.status_color + "33",
                      color: status.status_color,
                    }}
                  >
                    {status.status_name} ({status.count})
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default TeamStatusReport;
