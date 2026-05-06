"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Department } from "@/types";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [saving, setSaving] = useState(false);
  const [isManager, setIsManager] = useState(false);

  const loadData = async () => {
    try {
      const [{ getDepartments }, { getCurrentUserRole }] = await Promise.all([
        import("@/lib/actions/departments"),
        import("@/lib/actions/posts"),
      ]);

      const [deptResult, role] = await Promise.all([
        getDepartments(),
        getCurrentUserRole(),
      ]);

      if (deptResult.data) {
        setDepartments(deptResult.data);
      }
      if (deptResult.error) {
        setError(deptResult.error);
      }

      setIsManager(role === "manager" || role === "super_admin");
    } catch {
      setError("שגיאה בטעינת המחלקות");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;

    setCreating(true);
    setError(null);

    try {
      const { createDepartment } = await import("@/lib/actions/departments");
      const { error } = await createDepartment({ name: newName.trim() });

      if (error) {
        setError(error);
      } else {
        setNewName("");
        await loadData();
      }
    } catch {
      setError("שגיאה ביצירת מחלקה");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editingName.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const { updateDepartment } = await import("@/lib/actions/departments");
      const { error } = await updateDepartment(id, { name: editingName.trim() });

      if (error) {
        setError(error);
      } else {
        setEditingId(null);
        setEditingName("");
        await loadData();
      }
    } catch {
      setError("שגיאה בעדכון מחלקה");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`האם למחוק את המחלקה "${name}"?`)) return;

    setError(null);

    try {
      const { deleteDepartment } = await import("@/lib/actions/departments");
      const { error } = await deleteDepartment(id);

      if (error) {
        setError(error);
      } else {
        await loadData();
      }
    } catch {
      setError("שגיאה במחיקת מחלקה");
    }
  };

  const startEdit = (dept: Department) => {
    setEditingId(dept.id);
    setEditingName(dept.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">
        טוען מחלקות...
      </div>
    );
  }

  if (!isManager) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">אין לך הרשאה לנהל מחלקות</p>
        <Link href="/" className="text-blue-600 hover:text-blue-700">
          חזרה לדף הראשי
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">ניהול מחלקות</h2>

      <div className="bg-white dark:bg-[#171717] shadow dark:shadow-none dark:border dark:border-[#2a2a2a] rounded-lg p-4 sm:p-6 max-w-2xl">
        {/* Create new department */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="שם מחלקה חדשה"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-[#3a3a3a] rounded-md bg-background dark:bg-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {creating ? "יוצר..." : "הוסף מחלקה"}
          </button>
        </div>

        {error && (
          <div className="text-red-500 text-sm p-3 bg-red-50 dark:bg-red-900/20 rounded-md mb-4">
            {error}
          </div>
        )}

        {/* Departments list */}
        <div className="divide-y divide-gray-200 dark:divide-[#2a2a2a]">
          {departments.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 py-4 text-center">אין מחלקות</p>
          ) : (
            departments.map((dept) => (
              <div key={dept.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-2">
                {editingId === dept.id ? (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleUpdate(dept.id);
                        if (e.key === "Escape") cancelEdit();
                      }}
                      className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-[#3a3a3a] rounded-md bg-background dark:bg-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(dept.id)}
                        disabled={saving || !editingName.trim()}
                        className="px-3 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-md transition-colors disabled:opacity-50"
                      >
                        {saving ? "שומר..." : "שמור"}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                      >
                        ביטול
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{dept.name}</span>
                      {dept.is_default && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400 rounded-full">
                          ברירת מחדל
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(dept)}
                        className="px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                      >
                        עריכה
                      </button>
                      {!dept.is_default && (
                        <button
                          onClick={() => handleDelete(dept.id, dept.name)}
                          className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                        >
                          מחק
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
