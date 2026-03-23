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

  const [recentLeads, setRecentLeads] = useState([]);
  const [chartData, setChartData] = useState([]);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  // ✅ Role & User
  const role = localStorage.getItem("role");
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      let leadsRes, salesRes, perfRes;

      if (role === "admin") {
        // ✅ ADMIN
        [leadsRes, salesRes, perfRes] = await Promise.all([
          api.get("/leads"),
          api.get("/sales-team"),
          api.get("/performance"),
        ]);
      } else {
        // ✅ SALES (only own leads)
        leadsRes = await api.get(`/leads?assigned_to=${user.sales_person_id}`);
      }

      const leadsData = leadsRes?.data?.data || leadsRes?.data || [];
      const salesData = salesRes?.data?.data || salesRes?.data || [];
      const perfData = perfRes?.data?.data || perfRes?.data || [];

      // ✅ Stats
      setStats({
        leads: leadsData.length,
        sales: role === "admin" ? salesData.length : 0,
        performance: role === "admin" ? perfData.length : 0,
      });

      // ✅ Recent Leads
      setRecentLeads(leadsData.slice(0, 5));

      // ✅ Chart (Admin only)
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
              <p className="text-sm text-muted-foreground">
                No leads found
              </p>
            ) : (
              recentLeads.map((lead) => (
                <div
                  key={lead.lead_id}
                  className="flex justify-between border-b p-2 rounded-2xl hover:cursor-pointer hover:bg-gray-50"
                  onClick={() => navigate(`/leads/${lead.lead_id}`)}
                >
                  <div>
                    <p className="font-medium text-sm">
                      {lead.company_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {lead.contact_person} | {lead.phone_number}
                    </p>
                  </div>

                  <Badge>{lead.source}</Badge>
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

        {/* LEADS */}
        <Card>
          <CardContent className="p-5 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">
                {role === "admin" ? "Total Leads" : "My Leads"}
              </p>
              <h2 className="text-2xl font-bold">
                {stats.leads}
              </h2>
            </div>
            <div className="bg-blue-100 text-blue-600 p-3 rounded-xl">
              <Users size={20} />
            </div>
          </CardContent>
        </Card>

        {/* ADMIN ONLY */}
        {role === "admin" && (
          <>
            <Card>
              <CardContent className="p-5 flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Sales Team</p>
                  <h2 className="text-2xl font-bold">
                    {stats.sales}
                  </h2>
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
                  <h2 className="text-2xl font-bold">
                    {stats.performance}
                  </h2>
                </div>
                <div className="bg-purple-100 text-purple-600 p-3 rounded-xl">
                  <BarChart3 size={20} />
                </div>
              </CardContent>
            </Card>
          </>
        )}

      </div>

    </DashboardLayout>
  );
}