import React from "react";

const SelectField = ({ label, name, value, onChange, options }) => {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-gray-600">{label}</label>

      <select
        name={name}
        value={value}
        onChange={onChange}
        className="border rounded-lg px-3 py-2 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((opt, index) => {
          // Handle both string options and object options with label/value
          if (typeof opt === "string") {
            return (
              <option key={index} value={opt}>
                {opt}
              </option>
            );
          }
          return (
            <option key={index} value={opt.value}>
              {opt.label}
            </option>
          );
        })}
      </select>
    </div>
  );
};

export default SelectField;
