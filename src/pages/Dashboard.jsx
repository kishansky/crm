import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import api from "../api/axios";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import Loader from "@/components/ui/Loader";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const navigate = useNavigate();

  const [stats1, setStats1] = useState({
    total_leads: 0,
    today_leads: 0,
    weekly_leads: 0,
    monthly_leads: 0,
    status_counts: [],
  });

  const [statuses, setStatuses] = useState([]);
  const [recentLeads, setRecentLeads] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Role & User
  const role = localStorage.getItem("role");
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    fetchDashboard();
    fetchStatuses();
  }, []);

  // ✅ Fetch Dashboard Data
  const fetchDashboard = async () => {
    try {
      setLoading(true);

      let statsRes, perfRes, leadsRes;

      if (role === "admin") {
        [statsRes, perfRes, leadsRes] = await Promise.all([
          api.get("/dashboard-stats"),
          api.get("/performance"),
          api.get("/leads?page=1"),
        ]);
      } else {
        [statsRes, leadsRes] = await Promise.all([
          api.get("/dashboard-stats"),
          api.get(`/leads?assigned_to=${user.sales_person_id}`),
        ]);
      }

      const statsData = statsRes.data;
      const perfData = Array.isArray(perfRes?.data)
        ? perfRes?.data
        : perfRes?.data?.data || [];
      const leadsData = leadsRes?.data?.data || [];

      // ✅ Stats
      setStats1({
        total_leads: statsData.total_leads || 0,
        today_leads: statsData.today_leads || 0,
        weekly_leads: statsData.weekly_leads || 0,
        monthly_leads: statsData.monthly_leads || 0,
        status_counts: statsData.status_counts || [],
      });

      // ✅ Recent Leads
      setRecentLeads(leadsData.slice(0, 5));

      // ✅ Performance Chart (Admin Only)
      if (role === "admin") {
        const formattedChart = perfData.map((item) => ({
          report_date: item.report_date,
          total_leads: Number(item.total_leads),
          total_calls: Number(item.total_calls),
          closed_ordered: Number(item.closed_ordered),
        }));
        setChartData(formattedChart);
      }
    } catch (err) {
      console.error("Dashboard Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch Status List
  const fetchStatuses = async () => {
    try {
      const res = await api.get("/statuses");
      setStatuses(res.data);
    } catch (error) {
      console.error("Failed to fetch statuses", error);
    }
  };

  const statusMap = Object.fromEntries(statuses.map((s) => [s.id, s]));

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of your CRM system
          </p>
        </div>
        <Loader type="card" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-semibold">
          Dashboard ({role})
        </h1>
        <p className="text-sm text-muted-foreground">
          {role === "admin"
            ? "Overview of your CRM system"
            : "Overview of your assigned leads"}
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Leads */}
        <Card onClick={() => navigate(`/leads`)} className={"cursor-pointer"}>
          <CardContent className="p-5 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">
                {role === "admin" ? "Total Leads" : "My Leads"}
              </p>
              <h2 className="text-2xl font-bold">{stats1.total_leads}</h2>
            </div>
            <div className="bg-blue-100 text-blue-600 p-3 rounded-xl">
              <Users size={20} />
            </div>
          </CardContent>
        </Card>

        {/* Today's Leads */}
        <Card onClick={() => navigate(`/leads`)} className={"cursor-pointer"}>
          <CardContent className="p-5 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Today's Leads</p>
              <h2 className="text-2xl font-bold">{stats1.today_leads}</h2>
            </div>
            <div className="bg-yellow-100 text-yellow-600 p-3 rounded-xl">
              📅
            </div>
          </CardContent>
        </Card>

        {/* Weekly Leads */}
        <Card onClick={() => navigate(`/leads`)} className={"cursor-pointer"}>
          <CardContent className="p-5 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">
                Weekly Leads Counts
              </p>
              <h2 className="text-2xl font-bold">{stats1.weekly_leads}</h2>
            </div>
            <div className="bg-green-100 text-green-600 p-3 rounded-xl">📈</div>
          </CardContent>
        </Card>

        {/* Monthly Leads */}
        <Card onClick={() => navigate(`/leads`)} className={"cursor-pointer"}>
          <CardContent className="p-5 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">
                Monthly Leads Counts
              </p>
              <h2 className="text-2xl font-bold">{stats1.monthly_leads}</h2>
            </div>
            <div className="bg-purple-100 text-purple-600 p-3 rounded-xl">
              📊
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="my-6">
        <h1 className="text-xl md:text-2xl font-semibold">
          Today's Status Counts
        </h1>
      </div>
      {/* STATUS-WISE STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
        {stats1.status_counts.map((status) => (
          <Card
            key={status.status_id}
            onClick={() =>
              navigate(
                `/leads?${new URLSearchParams({
                  status: status.status_name,
                }).toString()}`,
              )
            }
            className={"cursor-pointer"}
          >
            <CardContent className="p-5 flex justify-between items-center">
              <div>
                <Badge
                  style={{
                    backgroundColor: status?.status_color + "33",
                    color: status?.status_color,
                  }}
                  className="text-sm "
                >
                  {status?.status_name}
                </Badge>
                <h2 className="text-2xl font-bold mt-2">{status?.count}</h2>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* TOP GRID */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* RECENT LEADS */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Leads</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {recentLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground">No leads found</p>
            ) : (
              recentLeads.map((lead) => (
                <div
                  key={lead.lead_id}
                  className="flex justify-between border-b p-2 rounded-xl hover:cursor-pointer hover:bg-gray-50"
                  onClick={() => navigate(`/leads/${lead.lead_id}`)}
                >
                  <div>
                    <p className=" font-medium text-sm ">
                      {lead?.contact_person} | {lead?.phone_number}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {lead.company_name || "N/A"}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    {lead?.latest_status &&
                      (() => {
                        const status = statusMap[lead?.latest_status.status_id];
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
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* PERFORMANCE CHART (ADMIN ONLY) */}
        {role === "admin" && (
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
            </CardHeader>

            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="report_date" />
                  <Tooltip />
                  <Bar dataKey="total_leads" fill="#3b82f6" />
                  <Bar dataKey="total_calls" fill="#10b981" />
                  <Bar dataKey="closed_ordered" fill="#a855f7" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
