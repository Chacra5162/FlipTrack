/**
 * backup.js — Full JSON backup/restore for all FlipTrack data
 * Exports inventory, sales, expenses, and supplies as a single JSON file.
 * Imports restore all data from a backup file.
 */

import { inv, sales, expenses, supplies, save, refresh, markDirty } from '../data/store.js';
import { toast } from '../utils/dom.js';
import { localDate } from '../utils/format.js';
import { autoSync } from '../data/sync.js';

/**
 * Download a full JSON backup of all user data.
 */
export function downloadBackup() {
  const backup = {
    version: 2,
    exportedAt: new Date().toISOString(),
    app: 'FlipTrack',
    data: {
      inventory: inv.map(i => ({ ...i })),
      sales: sales.map(s => ({ ...s })),
      expenses: expenses.map(e => ({ ...e })),
      supplies: supplies.map(s => ({ ...s })),
    },
    counts: {
      inventory: inv.length,
      sales: sales.length,
      expenses: expenses.length,
      supplies: supplies.length,
    }
  };

  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fliptrack-backup-${localDate()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('Backup downloaded ✓');
}

/**
 * Restore data from a JSON backup file.
 * Prompts user to confirm since it replaces all current data.
 */
export function restoreBackup(file) {
  if (!file) return;
  if (file.size > 50 * 1024 * 1024) {
    toast('Backup file too large (max 50MB)', true);
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const backup = JSON.parse(e.target.result);

      // Validate structure
      if (!backup.data || !backup.app || backup.app !== 'FlipTrack') {
        toast('Invalid backup file — not a FlipTrack backup', true);
        return;
      }

      const counts = {
        inventory: (backup.data.inventory || []).length,
        sales: (backup.data.sales || []).length,
        expenses: (backup.data.expenses || []).length,
        supplies: (backup.data.supplies || []).length,
      };

      const msg = `Restore backup from ${backup.exportedAt ? new Date(backup.exportedAt).toLocaleDateString() : 'unknown date'}?\n\n` +
        `${counts.inventory} inventory items\n` +
        `${counts.sales} sales\n` +
        `${counts.expenses} expenses\n` +
        `${counts.supplies} supplies\n\n` +
        `This will REPLACE all your current data.`;

      if (!confirm(msg)) return;

      // Replace data
      if (backup.data.inventory) {
        inv.length = 0;
        inv.push(...backup.data.inventory);
        for (const item of inv) markDirty('inv', item.id);
      }
      if (backup.data.sales) {
        sales.length = 0;
        sales.push(...backup.data.sales);
        for (const s of sales) markDirty('sales', s.id);
      }
      if (backup.data.expenses) {
        expenses.length = 0;
        expenses.push(...backup.data.expenses);
        for (const ex of expenses) markDirty('expenses', ex.id);
      }
      if (backup.data.supplies) {
        supplies.length = 0;
        supplies.push(...backup.data.supplies);
      }

      save();
      refresh();
      autoSync();
      toast(`Backup restored: ${counts.inventory} items, ${counts.sales} sales ✓`);

      // Re-render if available
      if (window.renderInv) window.renderInv();
      if (window.updateDashStats) window.updateDashStats();
    } catch (err) {
      toast('Failed to parse backup: ' + (err.message || 'unknown error'), true);
    }
  };
  reader.readAsText(file);
}
