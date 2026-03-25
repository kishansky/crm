import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import api from "../api/axios";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, BarChart3 } from "lucide-react";

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
  const [stats, setStats] = useState({
    leads: 0,
    sales: 0,
    performance: 0,
  });

  const [stats1, setStats1] = useState({
    total_leads: 0,
    today_leads: 0,
    interested: 0,
    closed: 0,
    sales: 0,
  });

  const [recentLeads, setRecentLeads] = useState([]);
  const [chartData, setChartData] = useState([]);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  // ✅ Role & User
  const role = localStorage.getItem("role");
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);

      let statsRes, salesRes, perfRes, leadsRes;

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
      const salesData = salesRes?.data.length || [];
      const perfData = Array.isArray(perfRes?.data)
        ? perfRes.data
        : perfRes?.data?.data || [];
      const leadsData = leadsRes?.data?.data || [];

      // ✅ Stats
      setStats1({
        total_leads: statsData.total_leads,
        today_leads: statsData.today_leads,
        interested: statsData.interested,
        closed: statsData.closed,
        sales: role === "admin" ? salesData.length : 0,
      });

      // ✅ Recent Leads
      setRecentLeads(leadsData.slice(0, 5));
      console.log(salesRes, 999);

      // ✅ Chart
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
      console.log(err);
    } finally {
      setLoading(false);
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
                  className="flex justify-between border-b p-2 rounded-2xl hover:cursor-pointer hover:bg-gray-50"
                  onClick={() => navigate(`/leads/${lead.lead_id}`)}
                >
                  <div>
                    <p className="font-medium text-sm">{lead.company_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {lead.contact_person} | {lead.phone_number}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    {lead.latest_status && (
                      <Badge
                        className={getStatusColor(
                          lead.latest_status?.status_type,
                        )}
                      >
                        {lead.latest_status?.status_type}
                      </Badge>
                    )}
                    {lead.source && <Badge>{lead.source}</Badge>}
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

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        <Card>
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

        <Card>
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

        <Card>
          <CardContent className="p-5 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Interested Leads</p>
              <h2 className="text-2xl font-bold">{stats1.interested}</h2>
            </div>
            <div className="bg-green-100 text-green-600 p-3 rounded-xl">👍</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Closed Deals</p>
              <h2 className="text-2xl font-bold">{stats1.closed}</h2>
            </div>
            <div className="bg-purple-100 text-purple-600 p-3 rounded-xl">
              💰
            </div>
          </CardContent>
        </Card>
        {/* ADMIN ONLY */}
        {/* {role === "admin" && (
          <>
            <Card>
              <CardContent className="p-5 flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Sales Team</p>
                  <h2 className="text-2xl font-bold">{stats1.sales}</h2>
                </div>
                <div className="bg-green-100 text-green-600 p-3 rounded-xl">
                  <UserCheck size={20} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Performance</p>
                  <h2 className="text-2xl font-bold">{stats.performance}</h2>
                </div>
                <div className="bg-purple-100 text-purple-600 p-3 rounded-xl">
                  <BarChart3 size={20} />
                </div>
              </CardContent>
            </Card>
          </>
        )} */}
      </div>
    </DashboardLayout>
  );
}
