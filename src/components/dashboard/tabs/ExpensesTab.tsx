/**
 * Expenses Tab Component
 * 
 * Provides comprehensive expense tracking and budget management
 * with cost breakdowns, approval workflows, and financial reporting.
 */

import React, { useState, useCallback } from 'react'
import {
  DollarSign,
  Plus,
  Receipt,
  CreditCard,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Calendar,
  User,
  Filter,
  Download
} from 'lucide-react'
import type { TripCard } from '@/types'
import type { TabValidationState } from '@/types/enhanced-modal'
import { cn } from '@/lib/utils'
import ReceiptScanModal from '@/components/expenses/ReceiptScanModal'

interface ExpensesTabProps {
  trip: TripCard
  tripDetails?: any
  onUpdate: (tab: 'expenses', updates: any) => void
  validationState: TabValidationState
  className?: string
}

export function ExpensesTab({
  trip,
  tripDetails,
  onUpdate,
  validationState,
  className = ''
}: ExpensesTabProps) {
  const [activeSection, setActiveSection] = useState<'overview' | 'expenses' | 'receipts' | 'reports'>('overview')
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState('BRL')
  const [dateFilter, setDateFilter] = useState('all')

  // Real expense data would come from API call to /api/trips/${trip.id}/expenses
  // For now, show empty state until real expenses are implemented
  const mockExpenses: any[] = []

  const handleExpenseAdded = (expense: any) => {
    console.log('Expense added:', expense)
    // TODO: Refresh expenses list or show success message
    // This could trigger a refetch of expenses data
  }

  const expenseCategories = [
    { id: 'transportation', label: 'Transportation', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
    { id: 'accommodation', label: 'Accommodation', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
    { id: 'meals', label: 'Meals & Entertainment', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
    { id: 'supplies', label: 'Supplies', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
    { id: 'other', label: 'Other', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-500" />
      case 'rejected':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'draft':
        return <FileText className="w-4 h-4 text-gray-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
      case 'pending':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
    }
  }

  const getCategoryColor = (category: string) => {
    const cat = expenseCategories.find(c => c.id === category)
    return cat?.color || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }

  const formatCurrency = (amount: number, currency: string) => {
    const locale = currency === 'BRL' ? 'pt-BR' : currency === 'USD' ? 'en-US' : 'en-EU'
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  // Calculate totals from trip data
  const totalBudget = trip.estimatedBudget || 0
  const totalExpenses = mockExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const approvedExpenses = mockExpenses.filter(e => e.status === 'approved').reduce((sum, expense) => sum + expense.amount, 0)
  const pendingExpenses = mockExpenses.filter(e => e.status === 'pending').reduce((sum, expense) => sum + expense.amount, 0)
  const budgetUsedPercentage = (totalExpenses / totalBudget) * 100

  return (
    <div className={cn('flex flex-col min-h-0 space-y-6', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400">
          Expenses & Budget
        </h3>
        <div className="flex items-center space-x-3">
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            <option value="BRL">BRL</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
          
          <button
            onClick={() => setShowAddExpense(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="border-b border-gray-200 dark:border-[#2a2a2a]">
        <nav className="flex space-x-6">
          {[
            { id: 'overview', label: 'Budget Overview', icon: TrendingUp },
            { id: 'expenses', label: 'Expense List', icon: Receipt },
            { id: 'receipts', label: 'Receipts', icon: FileText },
            { id: 'reports', label: 'Reports', icon: Download }
          ].map((section) => {
            const Icon = section.icon
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as any)}
                className={`flex items-center space-x-2 pb-3 border-b-2 transition-colors ${
                  activeSection === section.id
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{section.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content Area */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          {/* Budget Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total Budget</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(totalBudget, selectedCurrency)}
                  </div>
                </div>
                <DollarSign className="w-8 h-8 text-emerald-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(totalExpenses, selectedCurrency)}
                  </div>
                </div>
                <Receipt className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Remaining</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(totalBudget - totalExpenses, selectedCurrency)}
                  </div>
                </div>
                {totalBudget - totalExpenses >= 0 ? (
                  <TrendingUp className="w-8 h-8 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-8 h-8 text-red-500" />
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Budget Used</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {budgetUsedPercentage.toFixed(1)}%
                  </div>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  budgetUsedPercentage > 100 
                    ? 'bg-red-100 dark:bg-red-900' 
                    : budgetUsedPercentage > 80 
                      ? 'bg-amber-100 dark:bg-amber-900' 
                      : 'bg-emerald-100 dark:bg-emerald-900'
                }`}>
                  {budgetUsedPercentage > 100 ? (
                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Budget Progress Bar */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Budget Progress</h4>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {formatCurrency(totalExpenses, selectedCurrency)} of {formatCurrency(totalBudget, selectedCurrency)}
              </div>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
              <div 
                className={`h-full transition-all duration-700 ${
                  budgetUsedPercentage > 100 
                    ? 'bg-red-500' 
                    : budgetUsedPercentage > 80 
                      ? 'bg-amber-500' 
                      : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(budgetUsedPercentage, 100)}%` }}
              />
              {budgetUsedPercentage > 100 && (
                <div className="bg-red-600 h-full" style={{ width: `${budgetUsedPercentage - 100}%` }} />
              )}
            </div>
            
            <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Expenses by Category</h4>
            <div className="space-y-3">
              {expenseCategories.map(category => {
                const categoryExpenses = mockExpenses.filter(e => e.category === category.id)
                const categoryTotal = categoryExpenses.reduce((sum, e) => sum + e.amount, 0)
                const categoryPercentage = totalExpenses > 0 ? (categoryTotal / totalExpenses) * 100 : 0
                
                return (
                  <div key={category.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${category.color}`}>
                        {category.label}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {categoryExpenses.length} items
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(categoryTotal, selectedCurrency)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {categoryPercentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {activeSection === 'expenses' && (
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] overflow-hidden">
          {/* Expenses Header */}
          <div className="px-6 py-4 bg-emerald-800 dark:bg-emerald-900 border-b border-emerald-700">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-golden-400">All Expenses</h4>
              <div className="flex items-center space-x-3">
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="text-xs px-2 py-1 bg-emerald-700 border border-emerald-600 rounded-md text-golden-400"
                >
                  <option value="all">All Dates</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
                <div className="text-xs text-golden-400/70">
                  {mockExpenses.length} items
                </div>
              </div>
            </div>
          </div>

          {/* Expenses List */}
          <div className="divide-y divide-gray-200 dark:divide-[#2a2a2a]">
            {mockExpenses.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Receipt className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 mb-2">No expenses recorded yet</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Click "Add Expense" to start tracking trip costs
                </p>
              </div>
            ) : (
              mockExpenses.map((expense) => (
                <div key={expense.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-[#111111]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <Receipt className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {expense.description}
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(expense.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>{expense.submittedBy}</span>
                          </div>
                          {expense.receipt && (
                            <div className="flex items-center space-x-1">
                              <FileText className="w-3 h-3 text-emerald-500" />
                              <span className="text-emerald-600 dark:text-emerald-400">Receipt</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {formatCurrency(expense.amount, expense.currency)}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getCategoryColor(expense.category)}`}>
                            {expenseCategories.find(c => c.id === expense.category)?.label}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(expense.status)}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(expense.status)}`}>
                          {expense.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Receipts Section */}
      {activeSection === 'receipts' && (
        <div className="relative">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] overflow-hidden">
            {/* Receipts Header */}
            <div className="px-6 py-4 bg-emerald-800 dark:bg-emerald-900 border-b border-emerald-700">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-golden-400">Receipt Management</h4>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowReceiptModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Receipt</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Receipts Content */}
            <div className="p-8 text-center">
              <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h5 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Smart Receipt Scanning
              </h5>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Scan receipts with your camera to automatically extract expense data
              </p>
              <button
                onClick={() => setShowReceiptModal(true)}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Receipt className="w-5 h-5" />
                <span>Scan Your First Receipt</span>
              </button>
            </div>
          </div>

          {/* Mobile Floating Receipt Button */}
          <div className="md:hidden fixed bottom-6 right-6 z-40">
            <button
              onClick={() => setShowReceiptModal(true)}
              className="group flex items-center space-x-3 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Receipt className="w-5 h-5" />
              <span className="font-medium">Receipts</span>
            </button>
          </div>
        </div>
      )}

      {/* Reports Section */}
      {activeSection === 'reports' && (
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-12 text-center">
          <Download className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Expense reporting coming soon</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Generate detailed expense reports and analytics
          </p>
        </div>
      )}
      {/* Receipt Scan Modal */}
      <ReceiptScanModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        onExpenseAdded={handleExpenseAdded}
        tripId={trip.id}
      />
    </div>
  )
}
