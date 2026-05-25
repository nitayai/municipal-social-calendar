"use client";

import { useState } from "react";
import type { OpenTask } from "@/types";

const PRIORITY_STYLES = {
  high: { label: "גבוה", chip: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800" },
  normal: { label: "רגיל", chip: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700" },
  low: { label: "נמוך", chip: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800" },
};

interface OpenTasksClientProps {
  initialTasks: OpenTask[];
  error: string | null;
}

interface EditState {
  id: string;
  title: string;
  notes: string;
  priority: "high" | "normal" | "low";
}

export function OpenTasksClient({ initialTasks, error }: OpenTasksClientProps) {
  const [tasks, setTasks] = useState<OpenTask[]>(initialTasks);
  const [saving, setSaving] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(error);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);

  // New task form
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newPriority, setNewPriority] = useState<"high" | "normal" | "low">("normal");

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setSaving(true);
    setGlobalError(null);
    try {
      const { createOpenTask } = await import("@/lib/actions/open-tasks");
      const { data, error: e } = await createOpenTask({ title: newTitle.trim(), notes: newNotes.trim() || null, priority: newPriority });
      if (e || !data) { setGlobalError(e || "שגיאה"); }
      else {
        setTasks(prev => [data, ...prev]);
        setNewTitle(""); setNewNotes(""); setNewPriority("normal"); setShowNew(false);
      }
    } catch { setGlobalError("שגיאה"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("למחוק משימה זו?")) return;
    setDeletingId(id);
    try {
      const { deleteOpenTask } = await import("@/lib/actions/open-tasks");
      const { error: e } = await deleteOpenTask(id);
      if (e) setGlobalError(e);
      else setTasks(prev => prev.filter(t => t.id !== id));
    } catch { setGlobalError("שגיאה במחיקה"); }
    finally { setDeletingId(null); }
  };

  const handleStartEdit = (task: OpenTask) => {
    setEditState({ id: task.id, title: task.title, notes: task.notes || "", priority: task.priority ?? "normal" });
  };

  const handleSaveEdit = async () => {
    if (!editState || !editState.title.trim()) return;
    setSaving(true);
    setGlobalError(null);
    try {
      const { updateOpenTask } = await import("@/lib/actions/open-tasks");
      const { data, error: e } = await updateOpenTask(editState.id, {
        title: editState.title.trim(),
        notes: editState.notes.trim() || null,
        priority: editState.priority,
      });
      if (e || !data) { setGlobalError(e || "שגיאה"); }
      else {
        setTasks(prev => prev.map(t => t.id === data.id ? data : t));
        setEditState(null);
      }
    } catch { setGlobalError("שגיאה"); }
    finally { setSaving(false); }
  };

  const priorityCounts = {
    high: tasks.filter(t => t.priority === "high").length,
    normal: tasks.filter(t => t.priority === "normal").length,
    low: tasks.filter(t => t.priority === "low").length,
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">רעיונות ומשימות פתוחות</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {tasks.length} נושאים · {priorityCounts.high > 0 && <span className="text-red-600 dark:text-red-400">{priorityCounts.high} דחופים</span>}
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          נושא חדש
        </button>
      </div>

      {globalError && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          {globalError}
        </div>
      )}

      {/* New task form */}
      {showNew && (
        <div className="mb-4 bg-white dark:bg-[#141414] rounded-xl border border-blue-200 dark:border-blue-800 p-4 space-y-3 shadow-sm">
          <input
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="נושא חדש..."
            autoFocus
            className="w-full px-3 py-2 border border-gray-300 dark:border-[#3a3a3a] rounded-lg bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={e => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setShowNew(false); }}
          />
          <textarea
            value={newNotes}
            onChange={e => setNewNotes(e.target.value)}
            placeholder="הערות נוספות..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-[#3a3a3a] rounded-lg bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">עדיפות:</span>
            {(["high", "normal", "low"] as const).map(p => (
              <button key={p} type="button" onClick={() => setNewPriority(p)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${newPriority === p ? PRIORITY_STYLES[p].chip + " ring-2 ring-offset-1" : "border-gray-200 dark:border-[#3a3a3a] text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                {PRIORITY_STYLES[p].label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={!newTitle.trim() || saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
              {saving ? "שומר..." : "הוסף"}
            </button>
            <button onClick={() => { setShowNew(false); setNewTitle(""); setNewNotes(""); }}
              className="px-4 py-2 border border-gray-300 dark:border-[#3a3a3a] text-gray-600 dark:text-gray-400 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              ביטול
            </button>
          </div>
        </div>
      )}

      {/* Tasks list */}
      {tasks.length === 0 && !showNew ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 mx-auto mb-4 opacity-30">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
          </svg>
          <p className="text-lg font-medium mb-2">אין נושאים פתוחים</p>
          <p className="text-sm">הוסף נושאים שצריכים פרסום עתידי</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => (
            <div key={task.id}
              className={`bg-white dark:bg-[#141414] rounded-xl border transition-all ${
                deletingId === task.id ? "opacity-50" : ""
              } ${(task.priority ?? "normal") === "high" ? "border-red-200 dark:border-red-900" : "border-gray-200 dark:border-[#2a2a2a]"}`}>

              {editState?.id === task.id ? (
                /* Edit mode */
                <div className="p-4 space-y-3">
                  <input type="text" value={editState.title} onChange={e => setEditState({ ...editState, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#3a3a3a] rounded-lg bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <textarea value={editState.notes} onChange={e => setEditState({ ...editState, notes: e.target.value })}
                    rows={2} placeholder="הערות..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#3a3a3a] rounded-lg bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">עדיפות:</span>
                    {(["high", "normal", "low"] as const).map(p => (
                      <button key={p} type="button" onClick={() => setEditState({ ...editState, priority: p })}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${editState.priority === p ? PRIORITY_STYLES[p].chip + " ring-2 ring-offset-1" : "border-gray-200 dark:border-[#3a3a3a] text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                        {PRIORITY_STYLES[p].label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSaveEdit} disabled={!editState.title.trim() || saving}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium disabled:opacity-50 transition-colors">
                      {saving ? "שומר..." : "שמור"}
                    </button>
                    <button onClick={() => setEditState(null)}
                      className="px-3 py-1.5 border border-gray-300 dark:border-[#3a3a3a] text-gray-600 dark:text-gray-400 rounded-lg text-xs hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      ביטול
                    </button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <div className="p-4 flex items-start gap-3 group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <span className="font-medium text-gray-900 dark:text-gray-100 leading-snug">{task.title}</span>
                      <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_STYLES[task.priority ?? "normal"].chip}`}>
                        {PRIORITY_STYLES[task.priority ?? "normal"].label}
                      </span>
                    </div>
                    {task.notes && (
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 whitespace-pre-wrap">{task.notes}</p>
                    )}
                    <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-600">
                      {new Date(task.created_at).toLocaleDateString("he-IL")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => handleStartEdit(task)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="ערוך">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                    <button onClick={() => handleDelete(task.id)} disabled={deletingId === task.id}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="מחק">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
