import React from "react";

const InputField = ({ label, name, value, onChange, type = "text", placeholder }) => {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-gray-600">{label}</label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
};

export default InputField;