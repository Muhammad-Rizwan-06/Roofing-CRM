export const estimatesMock = [
  {
    id: 101,
    estimateNo: "EST-0001",
    projectId: null,
    projectName: "Ali Roofing Project",
    customer: "Ali Roofing",
    issueDate: "2026-04-01",
    validUntil: "2026-04-15",
    items: [{ description: "Roof inspection & estimate", qty: 1, unitPrice: 250 }],
    taxRate: 0,
    status: "Draft", // Draft | Sent | Accepted | Rejected
  },
];

export const invoicesMock = [
  {
    id: 201,
    invoiceNo: "INV-0001",
    projectId: null,
    projectName: "Ahmad Builders Project",
    customer: "Ahmad Builders",
    issueDate: "2026-04-02",
    dueDate: "2026-04-20",
    items: [{ description: "Roof repair labor", qty: 1, unitPrice: 1500 }],
    taxRate: 0,
    amountPaid: 0,
    status: "Unpaid", // Unpaid | Partially Paid | Paid
  },
];

export const paymentsMock = [
  // example:
  // { id: 301, paymentNo:"PAY-0001", invoiceId:201, invoiceNo:"INV-0001", customer:"Ahmad Builders", date:"2026-04-05", method:"Cash", amount:500, note:"Advance" }
];

export const expensesMock = [
  {
    id: 401,
    expenseNo: "EXP-0001",
    projectId: null,
    projectName: "Ali Roofing Project",
    vendor: "Local Supplier",
    category: "Materials",
    date: "2026-04-03",
    amount: 200,
    note: "Sealant & nails",
  },
];