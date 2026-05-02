import React from "react";

const StatCard = ({ title, value }) => {
  return (
    <div className="bg-white p-5 rounded-2xl shadow border hover:shadow-md transition">

      <h2 className="text-sm text-gray-500">
        {title}
      </h2>

      <p className="text-2xl font-bold text-gray-800 mt-2">
        {value}
      </p>

    </div>
  );
};

export default StatCard;