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

export default function Dashboard() {

  const [stats, setStats] = useState({
    leads: 0,
    sales: 0,
    performance: 0,
  });

  const [recentLeads, setRecentLeads] = useState([]);
  const [chartData, setChartData] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      const [leadsRes, salesRes, perfRes] = await Promise.all([
        api.get("/leads"),
        api.get("/sales-team"),
        api.get("/performance"),
      ]);

      // ✅ HANDLE PAGINATION SAFE
      const leadsData = leadsRes.data.data || leadsRes.data;
      const salesData = salesRes.data.data || salesRes.data;
      const perfData = perfRes.data.data || perfRes.data;

      // ✅ STATS
      setStats({
        leads: leadsData.length,
        sales: salesData.length,
        performance: perfData.length,
      });

      // ✅ RECENT LEADS (latest 5)
      setRecentLeads(leadsData.slice(0, 5));

      // ✅ CHART DATA FORMAT
      const formattedChart = perfData.map((item) => ({
        report_date: item.report_date,
        total_leads: Number(item.total_leads),
        total_calls: Number(item.total_calls),
        closed_ordered: Number(item.closed_ordered),
      }));

      setChartData(formattedChart);

    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-semibold">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Overview of your CRM system
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* LEADS */}
        <Card className="hover:shadow-md transition">
          <CardContent className="p-5 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Total Leads</p>
              <h2 className="text-2xl font-bold">
                {loading ? "..." : stats.leads}
              </h2>
            </div>
            <div className="bg-blue-100 text-blue-600 p-3 rounded-xl">
              <Users size={20} />
            </div>
          </CardContent>
        </Card>

        {/* SALES */}
        <Card className="hover:shadow-md transition">
          <CardContent className="p-5 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Sales Team</p>
              <h2 className="text-2xl font-bold">
                {loading ? "..." : stats.sales}
              </h2>
            </div>
            <div className="bg-green-100 text-green-600 p-3 rounded-xl">
              <UserCheck size={20} />
            </div>
          </CardContent>
        </Card>

        {/* PERFORMANCE */}
        <Card className="hover:shadow-md transition">
          <CardContent className="p-5 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Performance</p>
              <h2 className="text-2xl font-bold">
                {loading ? "..." : stats.performance}
              </h2>
            </div>
            <div className="bg-purple-100 text-purple-600 p-3 rounded-xl">
              <BarChart3 size={20} />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* LOWER SECTION */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* RECENT LEADS */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Leads</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">

            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : recentLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No leads found
              </p>
            ) : (
              recentLeads.map((lead) => (
                <div
                  key={lead.lead_id}
                  className="flex justify-between border-b pb-2"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {lead.company_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {lead.contact_person}
                    </p>
                  </div>

                  <span className="text-xs text-muted-foreground">
                    {lead.source}
                  </span>
                </div>
              ))
            )}

          </CardContent>
        </Card>

        {/* PERFORMANCE CHART */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
          </CardHeader>

          <CardContent className="h-[300px]">

            {loading ? (
              <p className="text-sm text-muted-foreground">
                Loading chart...
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>

                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="report_date" />

                  <Tooltip />

                  <Bar
                    dataKey="total_leads"
                    fill="#3b82f6"
                    radius={[6, 6, 0, 0]}
                  />

                  <Bar
                    dataKey="total_calls"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                  />

                  <Bar
                    dataKey="closed_ordered"
                    fill="#a855f7"
                    radius={[6, 6, 0, 0]}
                  />

                </BarChart>
              </ResponsiveContainer>
            )}

          </CardContent>
        </Card>

      </div>

    </DashboardLayout>
  );
}