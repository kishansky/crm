import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";
import DashboardLayout from "../components/layout/DashboardLayout";

export default function LeadDetails() {
  const { id } = useParams();
  const [lead, setLead] = useState(null);

  useEffect(() => {
    api.get(`/leads/${id}`).then(res => setLead(res.data));
  }, []);

  if (!lead) return "Loading...";

  return (
    <DashboardLayout>

      <h1 className="text-xl font-bold">{lead.company_name}</h1>

      <p>Contact: {lead.contact_person}</p>
      <p>Phone: {lead.phone_number}</p>

      <h2 className="mt-4 font-bold">Status Timeline</h2>

      {lead.status_history?.map((s) => (
        <div key={s.history_id} className="border p-2 mt-2">
          {s.status_type} - {s.remark}
        </div>
      ))}

    </DashboardLayout>
  );
}