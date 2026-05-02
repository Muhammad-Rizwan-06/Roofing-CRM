import React from "react";
import { Link } from "react-router-dom";

const CustomersTable = ({ customers }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow border">

      <h2 className="text-lg font-semibold mb-4">
        Customer List
      </h2>

      <table className="w-full text-left">

        <thead>
          <tr className="border-b text-gray-500 text-sm">
            <th className="py-2">Customer Name</th>
            <th>Total Projects</th>
          </tr>
        </thead>

        <tbody>
          {customers.length === 0 ? (
            <tr>
              <td colSpan="2" className="text-center py-6 text-gray-400">
                No Customers Found
              </td>
            </tr>
          ) : (
            customers.map((customer) => (
              <tr key={customer.id} className="border-b">

                <td className="py-3 font-medium">

                  {/* 🔥 CLICKABLE */}
                  <Link
                    to={`/customers/${customer.name}`}
                    className="text-blue-600 hover:underline"
                  >
                    {customer.name}
                  </Link>

                </td>

                <td>{customer.projects}</td>

              </tr>
            ))
          )}
        </tbody>

      </table>

    </div>
  );
};

export default CustomersTable;