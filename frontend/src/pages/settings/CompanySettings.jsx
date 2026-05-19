import React, { useEffect, useState } from "react";
import { useCompany } from "../../context/CompanyContext";

const CompanySettings = () => {
  const { company, loading, error, getCompany, updateCompany } = useCompany();
  const [form, setForm] = useState({
    companyName: "",
    phone: "",
    email: "",
    address: "",
    timezone: "UTC",
    currency: "USD",
    taxRateDefault: 0,
    invoicePrefix: "INV",
    estimatePrefix: "EST",
    poPrefix: "PO",
  });
  const [initialData, setInitialData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch company data on mount
  useEffect(() => {
    getCompany();
  }, [getCompany, updateCompany]);

  // Initialize form when company data is loaded
  useEffect(() => {
    if (company) {
      setForm(company);
      setInitialData(company);
      setHasChanges(false);
    }
  }, [company]);

  const onChange = (e) => {
    const { name, value } = e.target;
    const newForm = { ...form, [name]: value };
    setForm(newForm);
    
    // Check if form differs from initial data
    setHasChanges(JSON.stringify(newForm) !== JSON.stringify(initialData));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const result = await updateCompany(form);
      if (result.ok) {
        setSaveMessage({ type: "success", text: "Company settings saved successfully!" });
        setInitialData(form);
        setHasChanges(false);
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage({ type: "error", text: result.message || "Failed to save company settings" });
      }
    } catch (err) {
      setSaveMessage({ type: "error", text: "Error saving company settings" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Company Settings
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Manage your company information and finance defaults
          </p>
        </div>

        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-xl transition"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        )}
      </div>

      {saveMessage && (
        <div
          className={`p-4 rounded-xl ${
            saveMessage.type === "success"
              ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
          Error loading company data: {error}
        </div>
      )}

      {form && (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow border border-gray-100 dark:border-gray-800 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500">Company Name</label>
              <input
                name="companyName"
                value={form.companyName || ""}
                onChange={onChange}
                className="mt-1 w-full border rounded-xl px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500">Phone</label>
              <input
                name="phone"
                value={form.phone || ""}
                onChange={onChange}
                className="mt-1 w-full border rounded-xl px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500">Email</label>
              <input
                name="email"
                type="email"
                value={form.email || ""}
                onChange={onChange}
                className="mt-1 w-full border rounded-xl px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500">Timezone</label>
              <select
                name="timezone"
                value={form.timezone || "UTC"}
                onChange={onChange}
                className="mt-1 w-full border rounded-xl px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
                <option value="Europe/London">Europe/London</option>
                <option value="Asia/Karachi">Asia/Karachi</option>
                <option value="Asia/Dubai">Asia/Dubai</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs text-gray-500">Address</label>
              <input
                name="address"
                value={form.address || ""}
                onChange={onChange}
                className="mt-1 w-full border rounded-xl px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
              />
            </div>
          </div>

          <hr className="border-gray-200 dark:border-gray-800" />

          <div>
            <h2 className="font-semibold text-gray-800 dark:text-white">
              Finance Defaults
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-300">
              These values are used as defaults for finance documents.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-gray-500">Currency</label>
              <select
                name="currency"
                value={form.currency || "USD"}
                onChange={onChange}
                className="mt-1 w-full border rounded-xl px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
              >
                <option value="USD">USD</option>
                <option value="PKR">PKR</option>
                <option value="AED">AED</option>
                <option value="GBP">GBP</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-500">Default Tax Rate</label>
              <input
                name="taxRateDefault"
                type="number"
                step="0.01"
                value={form.taxRateDefault || 0}
                onChange={onChange}
                className="mt-1 w-full border rounded-xl px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
                placeholder="0.1 = 10%"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500">Invoice Prefix</label>
              <input
                name="invoicePrefix"
                value={form.invoicePrefix || "INV"}
                onChange={onChange}
                className="mt-1 w-full border rounded-xl px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500">Estimate Prefix</label>
              <input
                name="estimatePrefix"
                value={form.estimatePrefix || "EST"}
                onChange={onChange}
                className="mt-1 w-full border rounded-xl px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500">PO Prefix</label>
              <input
                name="poPrefix"
                value={form.poPrefix || "PO"}
                onChange={onChange}
                className="mt-1 w-full border rounded-xl px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanySettings;
