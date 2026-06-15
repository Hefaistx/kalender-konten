const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  to_do: { label: 'To-Do', color: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200' },
  on_progress: { label: 'On Progress', color: 'bg-blue-100 text-blue-700 ring-1 ring-blue-200' },
  pending_approval: { label: 'Pending Approval', color: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200' },
  pending_manager_multimedia_approval: { label: 'Pending Manager Multimedia', color: 'bg-orange-100 text-orange-700 ring-1 ring-orange-200' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700 ring-1 ring-red-200' },
  waiting_publish: { label: 'Waiting Publish', color: 'bg-violet-100 text-violet-700 ring-1 ring-violet-200' },
  pending_head_publish_approval: { label: 'Pending Head Publish', color: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200' },
  pending_manager_publish_approval: { label: 'Pending Manager Publish', color: 'bg-orange-100 text-orange-700 ring-1 ring-orange-200' },
  rejected_publish: { label: 'Rejected Publish', color: 'bg-red-100 text-red-700 ring-1 ring-red-200' },
  done: { label: 'Done', color: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200' },
  taken_down: { label: 'Taken Down', color: 'bg-slate-700 text-white ring-1 ring-slate-800' },
  cancelled: { label: 'Cancelled', color: 'bg-slate-200 text-slate-600 ring-1 ring-slate-300' },
};

export default function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'bg-slate-100 text-slate-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}
