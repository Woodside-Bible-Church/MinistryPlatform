"use client";

import { mockProjects } from "@/data/mockProjects";
import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  CreditCard,
  Receipt,
  CheckCircle,
  Check,
  XCircle,
  Edit,
  Trash2,
  Plus,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function LineItemDetailPage({
  params,
}: {
  params: Promise<{ id: string; itemId: string }>;
}) {
  const { id, itemId } = use(params);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isEditTransactionOpen, setIsEditTransactionOpen] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    paymentMethod: "Credit Card",
    payee: "",
    description: "",
    referenceNumber: "",
  });

  // Filter and sort state
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>("all");
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const project = mockProjects.find((p) => p.id === id);

  if (!project) return null;

  // Find the line item across all categories
  let lineItem;
  let category;
  for (const cat of project.categories) {
    const item = cat.lineItems.find((li) => li.id === itemId);
    if (item) {
      lineItem = item;
      category = cat;
      break;
    }
  }

  if (!lineItem || !category) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Line Item Not Found
          </h2>
          <Link
            href={`/projects/${id}`}
            className="inline-flex items-center gap-2 text-[#61bc47] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Project
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Adding transaction:", formData);
    setIsAddTransactionOpen(false);
    setFormData({
      date: new Date().toISOString().split("T")[0],
      amount: "",
      paymentMethod: "Credit Card",
      payee: "",
      description: "",
      referenceNumber: "",
    });
  };

  // Filter and sort transactions
  const filteredAndSortedTransactions = lineItem.transactions
    .filter((transaction) => {
      // Filter by payment method
      if (filterPaymentMethod !== "all" && transaction.paymentMethod !== filterPaymentMethod) {
        return false;
      }

      // Filter by approval status
      if (filterApprovalStatus === "approved" && !transaction.approvedBy) {
        return false;
      }
      if (filterApprovalStatus === "pending" && transaction.approvedBy) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      // Sort by date or amount
      let comparison = 0;
      if (sortBy === "date") {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === "amount") {
        comparison = a.amount - b.amount;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1600px]">
      <div className="mb-8">
        <Link
          href={`/projects/${id}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#61bc47] mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {project.title}
        </Link>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-primary dark:text-foreground">
              {lineItem.name}
            </h1>
            <p className="text-muted-foreground mt-2">
              {category.name} • {category.type === "revenue" ? "Revenue" : "Expense"}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                console.log("Edit line item:", lineItem.id);
              }}
              className="border border-border bg-card hover:bg-gray-50 dark:hover:bg-gray-800 text-foreground px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Line Item
            </button>
            <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
              <DialogTrigger asChild>
                <button className="bg-[#61BC47] hover:bg-[#4fa037] text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm hover:shadow-md flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Transaction
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>Add Transaction</DialogTitle>
                    <DialogDescription>
                      Record a new transaction for {lineItem.name}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="date" className="text-sm font-medium text-foreground">
                          Date *
                        </label>
                        <input
                          id="date"
                          type="date"
                          required
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="amount" className="text-sm font-medium text-foreground">
                          Amount *
                        </label>
                        <input
                          id="amount"
                          type="number"
                          step="0.01"
                          required
                          placeholder="0.00"
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="payee" className="text-sm font-medium text-foreground">
                        Payee *
                      </label>
                      <input
                        id="payee"
                        type="text"
                        required
                        placeholder="Who was paid or who paid?"
                        value={formData.payee}
                        onChange={(e) => setFormData({ ...formData, payee: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="paymentMethod" className="text-sm font-medium text-foreground">
                        Payment Method *
                      </label>
                      <select
                        id="paymentMethod"
                        required
                        value={formData.paymentMethod}
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                      >
                        <option value="Credit Card">Credit Card</option>
                        <option value="Check">Check</option>
                        <option value="Cash">Cash</option>
                        <option value="Wire Transfer">Wire Transfer</option>
                        <option value="ACH">ACH</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="referenceNumber" className="text-sm font-medium text-foreground">
                        Reference Number
                      </label>
                      <input
                        id="referenceNumber"
                        type="text"
                        placeholder="Check #, Invoice #, etc."
                        value={formData.referenceNumber}
                        onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="description" className="text-sm font-medium text-foreground">
                        Description *
                      </label>
                      <textarea
                        id="description"
                        required
                        rows={3}
                        placeholder="What was this transaction for?"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47] resize-none"
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <button
                      type="button"
                      onClick={() => setIsAddTransactionOpen(false)}
                      className="px-4 py-2 border border-border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#61BC47] hover:bg-[#4fa037] text-white rounded-lg transition-colors"
                    >
                      Add Transaction
                    </button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Estimated</h3>
            <DollarSign className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-foreground">
            {formatCurrency(lineItem.estimated)}
          </div>
          {lineItem.quantity && lineItem.unitPrice !== undefined && (
            <p className="text-xs text-muted-foreground mt-2">
              {lineItem.quantity} × {formatCurrency(lineItem.unitPrice)}
            </p>
          )}
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Actual</h3>
            <DollarSign className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-3xl font-bold text-foreground">
            {formatCurrency(lineItem.actual)}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {lineItem.transactions.length} transaction(s)
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Variance</h3>
            {lineItem.actual - lineItem.estimated <= 0 ? (
              <DollarSign className="w-5 h-5 text-green-500" />
            ) : (
              <DollarSign className="w-5 h-5 text-red-500" />
            )}
          </div>
          <div
            className={`text-3xl font-bold ${
              lineItem.actual - lineItem.estimated <= 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {lineItem.actual - lineItem.estimated >= 0 ? "+" : ""}
            {formatCurrency(lineItem.actual - lineItem.estimated)}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {lineItem.estimated > 0
              ? ((((lineItem.actual - lineItem.estimated) / lineItem.estimated) * 100).toFixed(1))
              : "0"}
            % {lineItem.actual - lineItem.estimated >= 0 ? "over" : "under"} budget
          </p>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Transactions</h2>
        </div>

        {/* Filters and Sort */}
        {lineItem.transactions.length > 0 && (
          <div className="px-6 py-4 border-b border-border bg-gray-50 dark:bg-gray-900/30">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Filters:</span>
              </div>

              <select
                value={filterPaymentMethod}
                onChange={(e) => setFilterPaymentMethod(e.target.value)}
                className="px-3 py-1.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
              >
                <option value="all">All Payment Methods</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Check">Check</option>
                <option value="Cash">Cash</option>
                <option value="Wire Transfer">Wire Transfer</option>
                <option value="ACH">ACH</option>
              </select>

              <select
                value={filterApprovalStatus}
                onChange={(e) => setFilterApprovalStatus(e.target.value)}
                className="px-3 py-1.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
              >
                <option value="all">All Statuses</option>
                <option value="approved">Approved Only</option>
                <option value="pending">Pending Only</option>
              </select>

              <div className="flex items-center gap-2 ml-auto">
                <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Sort:</span>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "date" | "amount")}
                className="px-3 py-1.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
              >
                <option value="date">By Date</option>
                <option value="amount">By Amount</option>
              </select>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                className="px-3 py-1.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        )}

        {lineItem.transactions.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No transactions yet
            </h3>
            <p className="text-muted-foreground mb-6">
              Start by adding your first transaction for this line item.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-border">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Payee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Receipt
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAndSortedTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {formatDate(transaction.date)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-foreground">
                        {transaction.payee}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-muted-foreground max-w-xs">
                        {transaction.description}
                      </div>
                      {transaction.referenceNumber && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Ref: {transaction.referenceNumber}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CreditCard className="w-4 h-4" />
                        {transaction.paymentMethod}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-bold text-red-600 dark:text-red-400">
                        -{formatCurrency(transaction.amount)}
                      </div>
                      {transaction.approvedBy && (
                        <div className="flex items-center justify-end gap-1 text-xs text-green-600 dark:text-green-400 mt-1">
                          <CheckCircle className="w-3 h-3" />
                          Approved
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {transaction.receiptUrl ? (
                        <button className="text-[#61bc47] hover:text-[#4fa037] transition-colors">
                          <Receipt className="w-5 h-5" />
                        </button>
                      ) : (
                        <span className="text-muted-foreground">
                          <Receipt className="w-5 h-5 opacity-30" />
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {!transaction.approvedBy ? (
                          <>
                            <button
                              onClick={() => {
                                console.log("Approving transaction:", transaction.id);
                              }}
                              className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                console.log("Rejecting transaction:", transaction.id);
                              }}
                              className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                            Approved
                          </span>
                        )}
                        <button
                          onClick={() => {
                            setEditingTransactionId(transaction.id);
                            setFormData({
                              date: transaction.date,
                              amount: transaction.amount.toString(),
                              paymentMethod: transaction.paymentMethod,
                              payee: transaction.payee,
                              description: transaction.description,
                              referenceNumber: transaction.referenceNumber || "",
                            });
                            setIsEditTransactionOpen(true);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this transaction?")) {
                              console.log("Deleting transaction:", transaction.id);
                            }
                          }}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Transaction Dialog */}
      <Dialog open={isEditTransactionOpen} onOpenChange={setIsEditTransactionOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              console.log("Editing transaction:", editingTransactionId, formData);
              setIsEditTransactionOpen(false);
              setEditingTransactionId(null);
              setFormData({
                date: new Date().toISOString().split("T")[0],
                amount: "",
                paymentMethod: "Credit Card",
                payee: "",
                description: "",
                referenceNumber: "",
              });
            }}
          >
            <DialogHeader>
              <DialogTitle>Edit Transaction</DialogTitle>
              <DialogDescription>
                Update the details of this transaction
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="edit-date" className="text-sm font-medium text-foreground">
                    Date *
                  </label>
                  <input
                    id="edit-date"
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="edit-amount" className="text-sm font-medium text-foreground">
                    Amount *
                  </label>
                  <input
                    id="edit-amount"
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="edit-payee" className="text-sm font-medium text-foreground">
                  Payee *
                </label>
                <input
                  id="edit-payee"
                  type="text"
                  required
                  placeholder="Who was paid or who paid?"
                  value={formData.payee}
                  onChange={(e) => setFormData({ ...formData, payee: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="edit-paymentMethod" className="text-sm font-medium text-foreground">
                  Payment Method *
                </label>
                <select
                  id="edit-paymentMethod"
                  required
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                >
                  <option value="Credit Card">Credit Card</option>
                  <option value="Check">Check</option>
                  <option value="Cash">Cash</option>
                  <option value="Wire Transfer">Wire Transfer</option>
                  <option value="ACH">ACH</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="edit-referenceNumber" className="text-sm font-medium text-foreground">
                  Reference Number
                </label>
                <input
                  id="edit-referenceNumber"
                  type="text"
                  placeholder="Check #, Invoice #, etc."
                  value={formData.referenceNumber}
                  onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47]"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="edit-description" className="text-sm font-medium text-foreground">
                  Description *
                </label>
                <textarea
                  id="edit-description"
                  required
                  rows={3}
                  placeholder="What was this transaction for?"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#61bc47] resize-none"
                />
              </div>
            </div>

            <DialogFooter>
              <button
                type="button"
                onClick={() => {
                  setIsEditTransactionOpen(false);
                  setEditingTransactionId(null);
                }}
                className="px-4 py-2 border border-border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#61BC47] hover:bg-[#4fa037] text-white rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
