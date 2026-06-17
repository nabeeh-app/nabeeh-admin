'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Search, Download } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { StatusBadge, getTierVariant, getStatusVariant } from '@/components/StatusBadge';

interface TeacherRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  tier: string;
  status: string;
  students_count: number;
  created_at: string;
}

type SortField = 'name' | 'email' | 'created_at';

function SortableHeader({
  field, children, sortField, sortAsc, onToggle,
}: {
  field: SortField;
  children: React.ReactNode;
  sortField: SortField;
  sortAsc: boolean;
  onToggle: (field: SortField) => void;
}) {
  return (
    <th
      onClick={() => onToggle(field)}
      className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-ink/60 cursor-pointer hover:text-ink select-none"
    >
      {children} {sortField === field && (sortAsc ? '↑' : '↓')}
    </th>
  );
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortAsc, setSortAsc] = useState(true);

  const loadTeachers = useCallback(async () => {
    const res = await fetch('/api/admin/teachers');
    const json = await res.json();
    setTeachers(json.success && Array.isArray(json.data) ? json.data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  const filtered = teachers
    .filter((t) => {
      const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.email.toLowerCase().includes(search.toLowerCase());
      const matchTier = filterTier === 'all' || t.tier === filterTier;
      const matchStatus = filterStatus === 'all' || t.status === filterStatus;
      return matchSearch && matchTier && matchStatus;
    })
    .sort((a, b) => {
      const val = a[sortField] < b[sortField] ? -1 : a[sortField] > b[sortField] ? 1 : 0;
      return sortAsc ? val : -val;
    });

  function toggleSort(field: SortField) {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  }

  function exportCSV() {
    const headers = ['Name', 'Email', 'Phone', 'Tier', 'Status', 'Students', 'Joined'];
    const rows = filtered.map((t) => [
      t.name, t.email, t.phone || '', t.tier, t.status, t.students_count, new Date(t.created_at).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `teachers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-ink font-display">Teachers</h1>
        <button
          onClick={exportCSV}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wider bg-surface-cool text-ink/60 hover:bg-surface-sage hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-canvas border border-ink/10 p-4 mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-0 max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/50" />
          <input
            type="text"
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 ps-10 pe-3 border border-ink bg-canvas font-body focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <select
          value={filterTier}
          onChange={(e) => setFilterTier(e.target.value)}
          className="h-11 px-3 border border-ink bg-canvas font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="all">All Tiers</option>
          <option value="free">Free</option>
          <option value="basic">Basic</option>
          <option value="pro">Pro</option>
          <option value="center">Center</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-11 px-3 border border-ink bg-canvas font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="past_due">Past Due</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading teachers..." />
      ) : (
        <div className="bg-canvas border border-ink/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-ink/10">
              <tr>
                <SortableHeader field="name" sortField={sortField} sortAsc={sortAsc} onToggle={toggleSort}>Name</SortableHeader>
                <SortableHeader field="email" sortField={sortField} sortAsc={sortAsc} onToggle={toggleSort}>Email</SortableHeader>
                <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-ink/60">Tier</th>
                <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-ink/60">Status</th>
                <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-ink/60">Students</th>
                <SortableHeader field="created_at" sortField={sortField} sortAsc={sortAsc} onToggle={toggleSort}>Joined</SortableHeader>
                <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-ink/60">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-surface-sage/50 transition-colors">
                  <td className="px-4 py-3 font-medium font-body">{t.name}</td>
                  <td className="px-4 py-3 text-ink/60 font-body">{t.email}</td>
                  <td className="px-4 py-3">
                    <StatusBadge label={t.tier} variant={getTierVariant(t.tier)} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge label={t.status} variant={getStatusVariant(t.status)} />
                  </td>
                  <td className="px-4 py-3 font-body">{t.students_count}</td>
                  <td className="px-4 py-3 text-ink/60 font-body">{new Date(t.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/teachers/${t.id}`} className="text-primary hover:text-primary/80 text-xs font-mono uppercase tracking-wider font-medium">View</Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-ink/40 font-body">No teachers found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
