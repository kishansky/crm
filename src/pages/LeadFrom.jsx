import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";


export default function LeadForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // ✅ get source from URL
  const sourceFromUrl = searchParams.get("source") || "website";

  const [form, setForm] = useState({
    company_name: "",
    contact_person: "",
    phone_number: "",
    email: "",
    enquiry_description: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submitForm = async () => {
    if (!form.phone_number) {
      return toast.error("Phone number is required");
    }

    try {
      setLoading(true);

      await api.post("/public/lead-form", {
        ...form,
        source: sourceFromUrl, // ✅ from URL
      });

      toast.success("Submitted successfully 🚀");

      // ✅ reset form
      setForm({
        company_name: "",
        contact_person: "",
        phone_number: "",
        email: "",
        enquiry_description: "",
      });
      navigate("/thank-you");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Something went wrong ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full py-6 flex items-center justify-center bg-muted px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Form</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Company Name */}
          <div className="space-y-2 ">
            <label className="text-sm font-medium ">Company Name</label>
            <Input
              name="company_name"
              placeholder="Enter company name"
              value={form.company_name}
              onChange={handleChange}
            />
          </div>

          {/* Contact Person (Required) */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Your Name <span className="text-red-500">*</span>
            </label>

            <Input
              name="contact_person"
              placeholder="Enter your name"
              value={form.contact_person}
              onChange={handleChange}
            />
          </div>

          {/* Phone Number (Required) */}
          <div className="space-y-1">
            <label className="text-sm font-medium">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <Input
              type="tel"
              name="phone_number"
              placeholder="Enter phone number"
              value={form.phone_number}
              onChange={handleChange}
            />
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              name="email"
              placeholder="Enter email"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          {/* Enquiry */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Enquiry Description</label>

            <textarea
              name="enquiry_description"
              placeholder="Describe your requirement"
              value={form.enquiry_description}
              onChange={handleChange}
              rows={4}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <Button onClick={submitForm} className="w-full" disabled={loading}>
            {loading ? "Submitting..." : "Submit"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
