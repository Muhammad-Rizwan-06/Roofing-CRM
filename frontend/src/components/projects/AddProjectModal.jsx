import { useMemo, useState, useEffect } from "react";
import { useUser } from "../../context/UserContext";

const AddProjectModal = ({ isOpen, onClose, onAddProject, editProject }) => {
  const { getCustomers, customers = [] } = useUser();
  const [isExisting, setIsExisting] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [form, setForm] = useState({
    name: "",
    client: "",
    clientEmail: "",
    status: "Pending",
    supervisor: "",
    team: "",
    budget: "",
    userId: "",
  });

  // Fetch customers on mount
  useEffect(() => {
    getCustomers();
  }, [getCustomers]);

  useEffect(() => {
    if (editProject) {
      setForm({
        name: editProject.name || "",
        client: editProject.client || "",
        clientEmail: editProject.clientEmail || "",
        status: editProject.status || "Pending",
        supervisor: editProject.supervisor || "",
        team: editProject.team || "",
        budget: editProject.budget ?? "",
        userId: editProject.userId || "",
      });
      setIsExisting(true);
      setSelectedCustomer(editProject.userId || "");
    } else {
      setForm({
        name: "",
        client: "",
        clientEmail: "",
        status: "Pending",
        supervisor: "",
        team: "",
        budget: "",
        userId: "",
      });
      setIsExisting(true);
      setSelectedCustomer("");
    }
  }, [editProject]);

  // Handle customer selection
  const handleCustomerSelect = (e) => {
    const customerId = e.target.value;
    setSelectedCustomer(customerId);

    if (customerId) {
      const customer = customers.find((c) => c.userId === customerId);
      if (customer) {
        setForm((p) => ({
          ...p,
          client: customer.name || "",
          clientEmail: customer.email || "",
          userId: customer.userId || "",
        }));
      }
    } else {
      setForm((p) => ({
        ...p,
        client: "",
        clientEmail: "",
        userId: "",
      }));
    }
  };

  // Handle toggle between existing and new customer
  const handleToggleCustomerType = () => {
    setIsExisting(!isExisting);
    setSelectedCustomer("");
    setForm((p) => ({
      ...p,
      client: "",
      clientEmail: "",
      userId: "",
    }));
  };

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm((p) => ({
      ...p,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name || !form.client) {
      alert("Please fill required fields");
      return;
    }

    if (isExisting && !selectedCustomer) {
      alert("Please select an existing customer");
      return;
    }

    const base = editProject || {};

    const updated = {
      ...base, // ✅ preserve source/leadId/estimateId/completedAt/etc.
      ...form,
      id: editProject ? editProject.projectId : Date.now(),

      // keep arrays always
      materials: base.materials || [],
      workers: base.workers || [],
      tasks: base.tasks || [],

      // ensure numeric
      budget: Number(form.budget || 0),

      // ✅ normalize email (optional)
      clientEmail: String(form.clientEmail || "")
        .trim()
        .toLowerCase(),

      // Include userId
      userId: isExisting ? form.userId : "",
    };

    onAddProject(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-96 shadow-2xl">
        <h2 className="text-xl font-bold mb-4">
          {editProject ? "Edit Project" : "Add Project"}
        </h2>

        {/* Customer Type Toggle (only on create) */}
        {!editProject && (
          <div className="flex gap-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="customerType"
                value="existing"
                checked={isExisting}
                onChange={handleToggleCustomerType}
                className="w-4 h-4"
              />
              <span className="dark:text-white text-gray-800 text-sm">
                Existing Customer
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="customerType"
                value="new"
                checked={!isExisting}
                onChange={handleToggleCustomerType}
                className="w-4 h-4"
              />
              <span className="dark:text-white text-gray-800 text-sm">
                New Customer
              </span>
            </label>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            name="name"
            placeholder="Project Name"
            className="w-full border p-2 rounded"
            value={form.name}
            onChange={handleChange}
          />

          {/* Customer Selector (when existing customer is selected) */}
          {isExisting && !editProject && (
            <select
              name="customer"
              value={selectedCustomer}
              onChange={handleCustomerSelect}
              className="w-full border p-2 rounded dark:bg-gray-900 bg-white"
            >
              <option value="">-- Select a customer --</option>
              {customers.map((c) => (
                <option key={c.userId} value={c.userId}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          )}

          <input
            name="client"
            placeholder="Client"
            className="w-full border p-2 rounded"
            value={form.client}
            onChange={handleChange}
            readOnly={isExisting && !!selectedCustomer}
          />

          {/* ✅ Portal login linking (recommended) */}
          <input
            name="clientEmail"
            placeholder="Client Email (Portal)"
            className="w-full border p-2 rounded"
            value={form.clientEmail}
            onChange={handleChange}
            readOnly={isExisting && !!selectedCustomer}
            list={!isExisting ? "customerEmails" : undefined}
          />
          {!isExisting && (
            <datalist id="customerEmails">
              {customers.map((u) => (
                <option key={u.userId} value={u.email}>
                  {u.name}
                </option>
              ))}
            </datalist>
          )}

          <select
            name="status"
            className="w-full border p-2 rounded dark:bg-gray-900 bg-white"
            value={form.status}
            onChange={handleChange}
          >
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          <input
            name="supervisor"
            placeholder="Supervisor"
            className="w-full border p-2 rounded"
            value={form.supervisor}
            onChange={handleChange}
          />

          <input
            name="team"
            placeholder="Team"
            className="w-full border p-2 rounded"
            value={form.team}
            onChange={handleChange}
          />

          <input
            name="budget"
            type="number"
            placeholder="Budget"
            className="w-full border p-2 rounded"
            value={form.budget}
            onChange={handleChange}
          />

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 rounded hover:bg-gray-700"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {editProject ? "Update" : "Add"}
            </button>
          </div>

          {!editProject && (
            <p className="text-xs text-gray-500">
              Tip: Select an existing customer to auto-fill details, or create a
              new customer account.
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddProjectModal;
