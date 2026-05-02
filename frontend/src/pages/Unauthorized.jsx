import React from "react";
import { Link } from "react-router-dom";

const Unauthorized = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Unauthorized</h1>
      <p className="text-gray-500 dark:text-gray-300 mt-2">
        You don’t have permission to view this page.
      </p>
      <Link to="/" className="mt-6 text-blue-600 hover:underline">
        Go to Dashboard
      </Link>
    </div>
  );
};

export default Unauthorized;