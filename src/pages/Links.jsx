import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import toast from "react-hot-toast";

const BASE_URL = "https://crm.onexcode.com/form";

const sources = [
  "website",
  "facebook",
  "instagram",
  "whatsapp",
  "linkedin",
  "google",
];

// ✅ generate random 8 char code
const generateCode = () => {
  return Math.random().toString(36).substring(2, 10); // e.g. ab3k9xq2
};

function Links() {
  const [customLinks, setCustomLinks] = useState([]);

  const copyLink = (url) => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied ✅");
  };

  // ✅ create new influencer link
  const addCustomLink = () => {
    const code = generateCode();
    const newLink = `${BASE_URL}?source=${code}`;

    setCustomLinks((prev) => [...prev, { code, url: newLink }]);
    toast.success("Custom link created 🚀");
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-2xl mx-auto space-y-6">

        <h1 className="text-2xl font-bold text-center">
          Lead Form Links 🔗
        </h1>

        {/* 🔹 Default Sources */}
        {sources.map((src) => {
          const url = `${BASE_URL}?source=${src}`;

          return (
            <div
              key={src}
              className="flex items-center justify-between border rounded-lg p-3"
            >
              <div>
                <h5 className="text-sm text-blue-500">
                  {src.charAt(0).toUpperCase() + src.slice(1)}
                </h5>
                <div className="text-sm break-all">{url}</div>
              </div>

              <Button onClick={() => copyLink(url)}>
                Copy
              </Button>
            </div>
          );
        })}

        {/* 🔥 Custom Influencer Section */}
        <div className="border-t pt-4 space-y-3">

          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">
              Influencer Links 🎯
            </h2>

            <Button onClick={addCustomLink}>
              + Generate Link
            </Button>
          </div>

          {customLinks.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between border rounded-lg p-3"
            >
              <div>
                <h5 className="text-sm text-purple-500">
                  Code: {item.code}
                </h5>
                <div className="text-sm break-all">{item.url}</div>
              </div>

              <Button onClick={() => copyLink(item.url)}>
                Copy
              </Button>
            </div>
          ))}

        </div>

      </div>
    </DashboardLayout>
  );
}

export default Links;