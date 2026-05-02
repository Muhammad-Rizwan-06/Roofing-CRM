import React, { useEffect, useState } from "react";

const LS_KEY = "company_settings";

const load = () => {
  try {
    return (
      JSON.parse(localStorage.getItem(LS_KEY)) || {
        companyName: "Roofing CRM",
        phone: "",
        email: "",
        address: "",
        timezone: "UTC",
        currency: "USD",
        taxRateDefault: 0,
        invoicePrefix: "INV",
        estimatePrefix: "EST",
        poPrefix: "PO",
      }
    );
  } catch {
    return {
      companyName: "Roofing CRM",
      phone: "",
      email: "",
      address: "",
      timezone: "UTC",
      currency: "USD",
      taxRateDefault: 0,
      invoicePrefix: "INV",
      estimatePrefix: "EST",
      poPrefix: "PO",
    };
  }
};

const CompanySettings = () => {
  const [form, setForm] = useState(load());

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(form));
  }, [form]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const reset = () => {
    const ok = confirm("Reset company settings to defaults?");
    if (!ok) return;
    const defaults = load();
    // load() already returns saved if present; so force defaults:
    const hardDefaults = {
      companyName: "Roofing CRM",
      phone: "",
      email: "",
      address: "",
      timezone: "UTC",
      currency: "USD",
      taxRateDefault: 0,
      invoicePrefix: "INV",
      estimatePrefix: "EST",
      poPrefix: "PO",
    };
    setForm(hardDefaults);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Company Settings
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Manage defaults for finance documents and organization details (stored in localStorage)
          </p>
        </div>

        <button
          onClick={reset}
          className="bg-gray-200 px-4 py-2 rounded-xl hover:bg-gray-300 transition"
        >
          Reset
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow border border-gray-100 dark:border-gray-800 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500">Company Name</label>
            <input
              name="companyName"
              value={form.companyName}
              onChange={onChange}
              className="mt-1 w-full border rounded-xl px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Phone</label>
            <input
              name="phone"
              value={form.phone}
              onChange={onChange}
              className="mt-1 w-full border rounded-xl px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              className="mt-1 w-full border rounded-xl px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Timezone</label>
            <select
              name="timezone"
              value={form.timezone}
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
              value={form.address}
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
            These values are used as defaults for future backend integration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-gray-500">Currency</label>
            <select
              name="currency"
              value={form.currency}
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
              value={form.taxRateDefault}
              onChange={onChange}
              className="mt-1 w-full border rounded-xl px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
              placeholder="0.1 = 10%"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Invoice Prefix</label>
            <input
              name="invoicePrefix"
              value={form.invoicePrefix}
              onChange={onChange}
              className="mt-1 w-full border rounded-xl px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Estimate Prefix</label>
            <input
              name="estimatePrefix"
              value={form.estimatePrefix}
              onChange={onChange}
              className="mt-1 w-full border rounded-xl px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">PO Prefix</label>
            <input
              name="poPrefix"
              value={form.poPrefix}
              onChange={onChange}
              className="mt-1 w-full border rounded-xl px-3 py-2 bg-white dark:bg-gray-950 dark:text-white"
            />
          </div>
        </div>

        {/* <p className="text-xs text-gray-500 dark:text-gray-400">
          Note: In backend phase, these settings will be saved per organization and applied automatically.
        </p> */}
      </div>
    </div>
  );
};

export default CompanySettings;