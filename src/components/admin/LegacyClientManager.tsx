"use client";

import React, { useState, useEffect } from 'react';
import { Search, Link2, Users, Building2, Mail, Phone, MapPin } from 'lucide-react';

interface LegacyClient {
  id: number;
  legacy_client_id: number;
  descricao: string;
  descricao_fantasia?: string;
  cidade?: string;
  email?: string;
  telefone1?: string;
  ativo: boolean;
  company_id?: string;
}

interface Company {
  id: string;
  name: string;
  fantasy_name?: string;
}

export default function LegacyClientManager() {
  const [legacyClients, setLegacyClients] = useState<LegacyClient[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<LegacyClient | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 25;

  useEffect(() => {
    loadLegacyClients();
    loadCompanies();
  }, []);

  const loadLegacyClients = async () => {
    try {
      const response = await fetch('/api/admin/legacy-clients', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setLegacyClients(data);
      }
    } catch (error) {
      console.error('Failed to load legacy clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const response = await fetch('/api/admin/companies', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error('Failed to load companies:', error);
    }
  };

  const linkClientToCompany = async (legacyClientId: number, companyId: string) => {
    try {
      const response = await fetch('/api/admin/link-legacy-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ legacyClientId, companyId })
      });
      
      if (response.ok) {
        await loadLegacyClients(); // Refresh data
        setShowLinkModal(false);
        setSelectedClient(null);
      }
    } catch (error) {
      console.error('Failed to link client:', error);
    }
  };

  const filteredClients = legacyClients.filter(client =>
    client.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.cidade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredClients.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const paginatedClients = filteredClients.slice(startIndex, startIndex + recordsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Legacy Client Manager
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage connections between legacy clients ({legacyClients.length} total) and current companies
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <Search className="w-4 h-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name, city, or email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page when searching
            }}
            style={{ paddingLeft: '36px' }}
            className="w-full pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-[#1a1a1a] border border-pearl-200 dark:border-[#2a2a2a] rounded-lg p-4">
          <div className="flex items-center">
            <Users className="w-5 h-5 text-emerald-600 mr-2" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Legacy</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{legacyClients.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#1a1a1a] border border-pearl-200 dark:border-[#2a2a2a] rounded-lg p-4">
          <div className="flex items-center">
            <Link2 className="w-5 h-5 text-blue-600 mr-2" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Linked</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {legacyClients.filter(c => c.company_id).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#1a1a1a] border border-pearl-200 dark:border-[#2a2a2a] rounded-lg p-4">
          <div className="flex items-center">
            <Building2 className="w-5 h-5 text-amber-600 mr-2" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {legacyClients.filter(c => c.ativo).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#1a1a1a] border border-pearl-200 dark:border-[#2a2a2a] rounded-lg p-4">
          <div className="flex items-center">
            <Mail className="w-5 h-5 text-purple-600 mr-2" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">With Email</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {legacyClients.filter(c => c.email).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Client Table */}
      <div className="bg-white dark:bg-[#1a1a1a] border border-pearl-200 dark:border-[#2a2a2a] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-[#1E293B]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-amber-400 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-amber-400 uppercase tracking-wider">
                  Company Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-amber-400 uppercase tracking-wider">
                  City
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-amber-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-amber-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-amber-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedClients.map((client, index) => (
                <tr 
                  key={client.id}
                  className={index % 2 === 0 ? 'bg-[#FFFDF9]' : 'bg-[#FCFAF4]'}
                >
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {client.legacy_client_id}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs">
                        {client.descricao}
                      </div>
                      {client.descricao_fantasia && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                          {client.descricao_fantasia}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {client.cidade && (
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 text-gray-400 mr-1" />
                        {client.cidade}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {client.email && (
                        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                          <Mail className="w-3 h-3 mr-1" />
                          <span className="truncate max-w-[150px]">{client.email}</span>
                        </div>
                      )}
                      {client.telefone1 && (
                        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                          <Phone className="w-3 h-3 mr-1" />
                          {client.telefone1}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col space-y-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        client.ativo 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {client.ativo ? 'Active' : 'Inactive'}
                      </span>
                      {client.company_id && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          Linked
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {!client.company_id && (
                      <button
                        onClick={() => {
                          setSelectedClient(client);
                          setShowLinkModal(true);
                        }}
                        className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 text-sm font-medium"
                      >
                        Link Company
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white dark:bg-[#1a1a1a] px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {startIndex + 1} to {Math.min(startIndex + recordsPerPage, filteredClients.length)} of {filteredClients.length} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Link Modal */}
      {showLinkModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#1a1a1a] border border-pearl-200 dark:border-[#2a2a2a] rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Link Legacy Client
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Link "{selectedClient.descricao}" to a current company:
            </p>
            
            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
              {companies.map(company => (
                <button
                  key={company.id}
                  onClick={() => linkClientToCompany(selectedClient.legacy_client_id, company.id)}
                  className="w-full text-left p-3 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="font-medium text-gray-900 dark:text-white">{company.name}</div>
                  {company.fantasy_name && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">{company.fantasy_name}</div>
                  )}
                </button>
              ))}
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowLinkModal(false);
                  setSelectedClient(null);
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}