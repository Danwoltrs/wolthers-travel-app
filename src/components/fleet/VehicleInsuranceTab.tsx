"use client";

import React, { useState, useEffect } from "react";
import { 
  Shield, 
  Plus, 
  Calendar, 
  DollarSign, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Phone,
  Building
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Vehicle {
  id: string;
  model: string;
  year: number;
  color: string;
  license_plate: string;
  current_mileage: number;
  is_available: boolean;
  last_maintenance_date: string | null;
  last_maintenance_mileage: number | null;
  insurance_expiry_date: string | null;
  vehicle_type: string;
  seating_capacity: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface InsurancePolicy {
  id: string;
  insurance_company: string;
  policy_number: string;
  policy_type: string;
  coverage_amount_brl: number | null;
  deductible_brl: number | null;
  start_date: string;
  expiry_date: string;
  premium_amount_brl: number | null;
  payment_frequency: string | null;
  agent_name: string | null;
  agent_contact: string | null;
  is_active: boolean;
  created_at: string;
}

interface VehicleInsuranceTabProps {
  vehicle: Vehicle;
}

export default function VehicleInsuranceTab({ vehicle }: VehicleInsuranceTabProps) {
  const [insurancePolicies, setInsurancePolicies] = useState<InsurancePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPolicy, setNewPolicy] = useState({
    insurance_company: "",
    policy_number: "",
    policy_type: "",
    coverage_amount_brl: "",
    deductible_brl: "",
    start_date: new Date().toISOString().split('T')[0],
    expiry_date: "",
    premium_amount_brl: "",
    payment_frequency: "",
    agent_name: "",
    agent_contact: "",
    is_active: true,
  });

  useEffect(() => {
    fetchInsurancePolicies();
  }, [vehicle.id]);

  const fetchInsurancePolicies = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/fleet/vehicles/${vehicle.id}/insurance`, {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        setInsurancePolicies(data.insurance || []);
      }
    } catch (error) {
      console.error("Error fetching insurance policies:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`/api/fleet/vehicles/${vehicle.id}/insurance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...newPolicy,
          coverage_amount_brl: newPolicy.coverage_amount_brl ? parseFloat(newPolicy.coverage_amount_brl) : null,
          deductible_brl: newPolicy.deductible_brl ? parseFloat(newPolicy.deductible_brl) : null,
          premium_amount_brl: newPolicy.premium_amount_brl ? parseFloat(newPolicy.premium_amount_brl) : null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setInsurancePolicies([data.insurance, ...insurancePolicies]);
        setShowAddForm(false);
        setNewPolicy({
          insurance_company: "",
          policy_number: "",
          policy_type: "",
          coverage_amount_brl: "",
          deductible_brl: "",
          start_date: new Date().toISOString().split('T')[0],
          expiry_date: "",
          premium_amount_brl: "",
          payment_frequency: "",
          agent_name: "",
          agent_contact: "",
          is_active: true,
        });
      }
    } catch (error) {
      console.error("Error adding insurance policy:", error);
    }
  };

  const getInsuranceStatus = (policy: InsurancePolicy) => {
    if (!policy.is_active) {
      return { status: "inactive", color: "text-gray-600", bgColor: "bg-gray-100 dark:bg-gray-700", label: "Inactive" };
    }

    const expiryDate = new Date(policy.expiry_date);
    const currentDate = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    if (expiryDate < currentDate) {
      return { status: "expired", color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30", label: "Expired" };
    }
    
    if (expiryDate <= sevenDaysFromNow) {
      return { status: "urgent", color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30", label: "Expires Soon" };
    }
    
    if (expiryDate <= thirtyDaysFromNow) {
      return { status: "warning", color: "text-orange-600", bgColor: "bg-orange-100 dark:bg-orange-900/30", label: "Expires This Month" };
    }
    
    return { status: "active", color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30", label: "Active" };
  };

  const getPolicyTypeIcon = (type: string) => {
    const iconClass = "h-4 w-4";
    switch (type.toLowerCase()) {
      case "comprehensive":
        return <Shield className={iconClass} />;
      case "liability":
        return <div className={`${iconClass} border border-current rounded-full`} />;
      case "dpvat":
        return <div className={`${iconClass} bg-current`} />;
      default:
        return <FileText className={iconClass} />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatPolicyType = (type: string) => {
    switch (type.toLowerCase()) {
      case "comprehensive":
        return "Comprehensive Coverage";
      case "liability":
        return "Liability Only";
      case "dpvat":
        return "DPVAT (Mandatory)";
      default:
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getPaymentFrequencyLabel = (frequency: string) => {
    switch (frequency?.toLowerCase()) {
      case "monthly":
        return "Monthly";
      case "quarterly":
        return "Quarterly";
      case "annually":
        return "Annually";
      case "semi-annually":
        return "Semi-annually";
      default:
        return frequency || "Not specified";
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-1"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-golden-400">
            Insurance Policies
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage all insurance policies for this vehicle
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Policy
        </button>
      </div>

      {/* Brazilian Insurance Requirements Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
              Brazilian Vehicle Insurance Requirements
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
              <li>• DPVAT (mandatory basic coverage) - Required by law</li>
              <li>• Comprehensive coverage - Recommended for business vehicles</li>
              <li>• Keep policy documents in the vehicle at all times</li>
              <li>• Renewal typically required annually</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Add Policy Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-golden-400 mb-4">
            Add Insurance Policy
          </h4>
          
          <form onSubmit={handleAddPolicy} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Insurance Company *
                </label>
                <input
                  type="text"
                  value={newPolicy.insurance_company}
                  onChange={(e) => setNewPolicy({...newPolicy, insurance_company: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g., Porto Seguro, SulAmérica"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Policy Number *
                </label>
                <input
                  type="text"
                  value={newPolicy.policy_number}
                  onChange={(e) => setNewPolicy({...newPolicy, policy_number: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Policy Type *
                </label>
                <select
                  value={newPolicy.policy_type}
                  onChange={(e) => setNewPolicy({...newPolicy, policy_type: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select policy type</option>
                  <option value="comprehensive">Comprehensive Coverage</option>
                  <option value="liability">Liability Only</option>
                  <option value="dpvat">DPVAT (Mandatory)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Coverage Amount (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newPolicy.coverage_amount_brl}
                  onChange={(e) => setNewPolicy({...newPolicy, coverage_amount_brl: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Deductible (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newPolicy.deductible_brl}
                  onChange={(e) => setNewPolicy({...newPolicy, deductible_brl: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Premium Amount (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newPolicy.premium_amount_brl}
                  onChange={(e) => setNewPolicy({...newPolicy, premium_amount_brl: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={newPolicy.start_date}
                  onChange={(e) => setNewPolicy({...newPolicy, start_date: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Expiry Date *
                </label>
                <input
                  type="date"
                  value={newPolicy.expiry_date}
                  onChange={(e) => setNewPolicy({...newPolicy, expiry_date: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Frequency
                </label>
                <select
                  value={newPolicy.payment_frequency}
                  onChange={(e) => setNewPolicy({...newPolicy, payment_frequency: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select frequency</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="semi-annually">Semi-annually</option>
                  <option value="annually">Annually</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Agent Name
                </label>
                <input
                  type="text"
                  value={newPolicy.agent_name}
                  onChange={(e) => setNewPolicy({...newPolicy, agent_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Agent Contact
                </label>
                <input
                  type="text"
                  value={newPolicy.agent_contact}
                  onChange={(e) => setNewPolicy({...newPolicy, agent_contact: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Phone or email"
                />
              </div>

              <div className="flex items-center">
                <input
                  id="is_active"
                  type="checkbox"
                  checked={newPolicy.is_active}
                  onChange={(e) => setNewPolicy({...newPolicy, is_active: e.target.checked})}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 dark:border-gray-600 rounded dark:bg-[#1a1a1a]"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Currently Active
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 transition-colors"
              >
                Add Policy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Insurance Policies */}
      {insurancePolicies.length === 0 ? (
        <div className="text-center py-12">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No Insurance Policies
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Add insurance policies to track coverage and renewal dates.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add First Policy
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {insurancePolicies.map((policy) => {
            const status = getInsuranceStatus(policy);
            return (
              <div
                key={policy.id}
                className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                      {getPolicyTypeIcon(policy.policy_type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          {policy.insurance_company}
                        </h4>
                        <span className={cn(
                          "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                          status.bgColor,
                          status.color
                        )}>
                          {status.label}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {formatPolicyType(policy.policy_type)} • Policy #{policy.policy_number}
                      </p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-500">Valid Until</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {new Date(policy.expiry_date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        
                        {policy.coverage_amount_brl && (
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-500">Coverage</p>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {formatCurrency(policy.coverage_amount_brl)}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {policy.premium_amount_brl && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-500">Premium</p>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {formatCurrency(policy.premium_amount_brl)}
                                {policy.payment_frequency && (
                                  <span className="text-xs ml-1">/{policy.payment_frequency}</span>
                                )}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {policy.deductible_brl && (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border border-current rounded" />
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-500">Deductible</p>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {formatCurrency(policy.deductible_brl)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Agent Information */}
                      {(policy.agent_name || policy.agent_contact) && (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Insurance Agent
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            {policy.agent_name && (
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4" />
                                <span>{policy.agent_name}</span>
                              </div>
                            )}
                            {policy.agent_contact && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                <span>{policy.agent_contact}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Policy Period */}
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Policy Period:
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(policy.start_date).toLocaleDateString('pt-BR')} - {new Date(policy.expiry_date).toLocaleDateString('pt-BR')}
                          {policy.payment_frequency && (
                            <span className="ml-2">• Paid {getPaymentFrequencyLabel(policy.payment_frequency)}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}