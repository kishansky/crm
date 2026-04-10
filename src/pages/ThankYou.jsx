import React from "react";
// import { useNavigate } from "react-router-dom";
// import { Button } from "@/components/ui/button";

function ThankYou() {
//   const navigate = useNavigate();

  return (
    <div className="h-screen flex items-center justify-center bg-muted px-4">

      <div className="bg-white p-6 rounded-xl shadow-md text-center space-y-4 max-w-md">

        <h1 className="text-2xl font-bold text-green-600">
          Thank You 🎉
        </h1>

        <p className="text-gray-600">
          Your enquiry has been submitted successfully.  
          Our team will contact you soon.
        </p>

        {/* <Button onClick={() => navigate("/")}>
          Go Home
        </Button> */}

      </div>
    </div>
  );
}

export default ThankYou;