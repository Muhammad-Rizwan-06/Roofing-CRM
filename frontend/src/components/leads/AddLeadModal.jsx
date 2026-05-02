import React, { useState } from "react";
import InputField from "../ui/InputField";
import SelectField from "../ui/SelectField";
import Button from "../ui/Button";

const PIPELINE_STAGES = [
  "New",
  "Inspection Scheduled",
  "Estimate Sent",
  "Negotiation",
  "Won",
  "Lost",
];

const AddLeadModal = ({ setOpen, onAdd }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    estimatedValue: "",
    status: "New",
  });

  const handleChange = (e) => {
    setForm((p) => ({
      ...p,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name.trim()) return alert("Name is required");
    if (!form.phone.trim()) return alert("Phone is required");

    onAdd({
      ...form,
      estimatedValue: Number(form.estimatedValue || 0),
    });

    setOpen(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
      <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-lg space-y-4">
        <h2 className="text-xl font-bold text-gray-800">Add New Lead</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            label="Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Enter name"
          />

          <InputField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Enter email"
          />

          <InputField
            label="Phone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Enter phone"
          />

          <InputField
            label="Address (optional)"
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Site / Customer address"
          />

          <InputField
            label="Estimated Value ($)"
            name="estimatedValue"
            type="number"
            value={form.estimatedValue}
            onChange={handleChange}
            placeholder="e.g. 50000"
          />

          <SelectField
            label="Pipeline Stage"
            name="status"
            value={form.status}
            onChange={handleChange}
            options={PIPELINE_STAGES}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Lead</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLeadModal;