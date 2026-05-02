import { useState } from "react";
import Button from "../components/ui/Button";

const ProjectForm = ({ onAdd }) => {
  const [form, setForm] = useState({
    customer: "",
    roofType: "",
    area: "",
    startDate: "",
    status: "Scheduled",
    cost: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(form);

    setForm({
      customer: "",
      roofType: "",
      area: "",
      startDate: "",
      status: "Scheduled",
      cost: "",
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-5 rounded-2xl shadow mb-6 grid grid-cols-3 gap-4"
    >
      <input name="customer" placeholder="Customer" onChange={handleChange} className="border p-2 rounded" />
      <input name="roofType" placeholder="Roof Type" onChange={handleChange} className="border p-2 rounded" />
      <input name="area" placeholder="Roof Area" onChange={handleChange} className="border p-2 rounded" />

      <input type="date" name="startDate" onChange={handleChange} className="border p-2 rounded" />
      <input name="cost" placeholder="Total Cost" onChange={handleChange} className="border p-2 rounded" />

      <select name="status" onChange={handleChange} className="border p-2 rounded">
        <option>Scheduled</option>
        <option>Inspection</option>
        <option>Material Ordered</option>
        <option>In Progress</option>
        <option>Quality Check</option>
        <option>Completed</option>
      </select>

      <div className="col-span-3">
        <Button>Add Project</Button>
      </div>
    </form>
  );
};

export default ProjectForm;