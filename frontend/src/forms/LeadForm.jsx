import { useState } from "react";
import Button from "../components/ui/Button";

const LeadForm = ({ onAdd }) => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    roofType: "",
    source: "",
    status: "New",
    assigned: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(form);
    setForm({
      name: "",
      phone: "",
      email: "",
      roofType: "",
      source: "",
      status: "New",
      assigned: "",
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-5 rounded-2xl shadow mb-6 grid grid-cols-3 gap-4"
    >
      <input name="name" placeholder="Customer Name" onChange={handleChange} className="border p-2 rounded" />
      <input name="phone" placeholder="Phone" onChange={handleChange} className="border p-2 rounded" />
      <input name="email" placeholder="Email" onChange={handleChange} className="border p-2 rounded" />

      <input name="roofType" placeholder="Roof Type" onChange={handleChange} className="border p-2 rounded" />
      <input name="source" placeholder="Lead Source" onChange={handleChange} className="border p-2 rounded" />
      <input name="assigned" placeholder="Assigned Rep" onChange={handleChange} className="border p-2 rounded" />

      <select name="status" onChange={handleChange} className="border p-2 rounded">
        <option>New</option>
        <option>Contacted</option>
        <option>Inspection Scheduled</option>
        <option>Quote Sent</option>
        <option>Negotiation</option>
        <option>Won</option>
        <option>Lost</option>
      </select>

      <div className="col-span-3">
        <Button>Add Lead</Button>
      </div>
    </form>
  );
};

export default LeadForm;