import { Metadata } from 'next';
import LegacyClientManager from '@/components/admin/LegacyClientManager';

export const metadata: Metadata = {
  title: 'Legacy Client Manager | Wolthers Travel',
  description: 'Manage connections between legacy clients and current companies',
};

export default function LegacyClientManagerPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <LegacyClientManager />
    </div>
  );
}