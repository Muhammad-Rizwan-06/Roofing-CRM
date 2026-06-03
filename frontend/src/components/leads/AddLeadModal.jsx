import React, { useState, useEffect } from "react";
import InputField from "../ui/InputField";
import SelectField from "../ui/SelectField";
import Button from "../ui/Button";
import { useUser } from "../../context/UserContext";
import { useCompany } from "../../context/CompanyContext";

const PIPELINE_STAGES = [
  "New",
  "Inspection Scheduled",
  "Estimate Sent",
  "Negotiation",
  "Won",
  "Lost",
];

const AddLeadModal = ({ setOpen, onAdd }) => {
  const { getCustomers, customers } = useUser();
  const [isExisting, setIsExisting] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    estimatedValue: "",
    status: "New",
    userId: "",
  });

  const { company, getCompany } = useCompany();

  useEffect(() => {
    getCompany();
  }, [getCompany]);


  // Fetch customers on mount
  useEffect(() => {
    getCustomers();
  }, [getCustomers]);

  // Handle customer selection
  const handleCustomerSelect = (e) => {
    const customerId = e.target.value;
    setSelectedCustomer(customerId);

    if (customerId) {
      const customer = customers.find((c) => c.userId === customerId);
      if (customer) {
        setForm((p) => ({
          ...p,
          name: customer.name || "",
          email: customer.email || "",
          phone: customer.phone || "",
          userId: customer.userId || "",
        }));
      }
    } else {
      setForm((p) => ({
        ...p,
        name: "",
        email: "",
        phone: "",
        userId: "",
      }));
    }
  };

  // Handle toggle between existing and new lead
  const handleToggleLeadType = () => {
    setIsExisting(!isExisting);
    setSelectedCustomer("");
    setForm({
      name: "",
      email: "",
      phone: "",
      address: "",
      estimatedValue: "",
      status: "New",
      userId: "",
    });
  };

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
    if (isExisting && !selectedCustomer)
      return alert("Please select an existing customer");

    onAdd({
      ...form,
      estimatedValue: Number(form.estimatedValue || 0),
      userId: isExisting ? form.userId : "",
    });

    setOpen(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md p-6 rounded-2xl shadow-lg space-y-4">
        <h2 className="text-xl font-bold dark:text-white text-gray-800">
          Add New Lead
        </h2>

        {/* Lead Type Toggle */}
        <div className="flex gap-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="leadType"
              value="new"
              checked={!isExisting}
              onChange={handleToggleLeadType}
              className="w-4 h-4"
            />
            <span className="dark:text-white text-gray-800">New Lead</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="leadType"
              value="existing"
              checked={isExisting}
              onChange={handleToggleLeadType}
              className="w-4 h-4"
            />
            <span className="dark:text-white text-gray-800">
              Existing Customer
            </span>
          </label>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Selector (when existing customer is selected) */}
          {isExisting && (
            <SelectField
              label="Select Customer"
              name="customer"
              value={selectedCustomer}
              onChange={handleCustomerSelect}
              options={[
                { label: "-- Select a customer --", value: "" },
                ...customers.map((c) => ({
                  label: `${c.name} (${c.email})`,
                  value: c.userId,
                })),
              ]}
            />
          )}

          {/* Name Input */}
          <InputField
            label="Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Enter name"
            readOnly={isExisting && !!selectedCustomer}
          />

          {/* Email Input */}
          <InputField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Enter email"
            readOnly={isExisting && !!selectedCustomer}
          />

          {/* Phone Input */}
          <InputField
            label="Phone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Enter phone"
            readOnly={isExisting && !!selectedCustomer}
          />

          {/* Address Input */}
          <InputField
            label="Address (optional)"
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Site / Customer address"
          />

          {/* Estimated Value Input */}
          <InputField
            label={`Estimated Value (${company?.currency || $})`}
            name="estimatedValue"
            type="number"
            value={form.estimatedValue}
            onChange={handleChange}
            placeholder="e.g. 50000"
          />

          {/* Pipeline Stage Selector */}
          <SelectField
            label="Pipeline Stage"
            name="status"
            value={form.status}
            onChange={handleChange}
            options={PIPELINE_STAGES}
          />

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setOpen(false)}
            >
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
