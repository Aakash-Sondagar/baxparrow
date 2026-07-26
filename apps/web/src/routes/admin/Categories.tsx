import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { tile } from "../../styles/tokens";
import { api } from "../../lib/api";

type Cat = {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  order: number;
  productCount: number;
};

export default function Categories() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () =>
      (await api.get("/admin/categories")).data as { items: Cat[]; totalProducts: number },
  });

  const [modal, setModal] = useState<"new" | "edit" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Cat | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const items = data?.items ?? [];
  const totalProducts = data?.totalProducts ?? 0;

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-categories"] });

  const create = useMutation({
    mutationFn: async () => (await api.post("/admin/categories", { name: name.trim() })).data,
    onSuccess: () => {
      setModal(null);
      setName("");
      setError("");
      invalidate();
    },
    onError: (e: any) => setError(e?.response?.data?.error ?? "Failed to create"),
  });

  const update = useMutation({
    mutationFn: async () =>
      (await api.patch(`/admin/categories/${editId}`, { name: name.trim() })).data,
    onSuccess: () => {
      setModal(null);
      setEditId(null);
      setName("");
      setError("");
      invalidate();
    },
    onError: (e: any) => setError(e?.response?.data?.error ?? "Failed to update"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/categories/${id}`);
    },
    onSuccess: () => {
      setMenuId(null);
      setDeleteTarget(null);
      setDeleteError("");
      invalidate();
    },
    onError: (e: any) => {
      setDeleteError(e?.response?.data?.error ?? "Failed to delete");
    },
  });

  const openNew = () => {
    setName("");
    setError("");
    setEditId(null);
    setModal("new");
  };

  const openEdit = (c: Cat) => {
    setName(c.name);
    setError("");
    setEditId(c._id);
    setMenuId(null);
    setModal("edit");
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }
    if (modal === "new") create.mutate();
    else update.mutate();
  };

  const busy = create.isPending || update.isPending;

  return (
    <>
      <div className="mb-[18px] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="m-0 text-sm text-muted">
          {isLoading
            ? "Loading…"
            : `${items.length} categories · organizing ${totalProducts.toLocaleString()} products`}
        </p>
        <button
          type="button"
          onClick={openNew}
          className="cursor-pointer rounded-[9px] border-none bg-cognac px-[18px] py-2.5 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-cognac-dark"
        >
          + New category
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((c, i) => (
          <div key={c._id} className="overflow-hidden rounded-[14px] border border-border bg-card">
            <div className="h-24" style={{ background: tile(i) }} />
            <div className="px-[18px] py-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 truncate font-display text-base font-bold">{c.name}</div>
                <span className="shrink-0 font-mono text-xs text-muted2">{c.productCount} items</span>
              </div>
              <div className="relative mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(c)}
                  className="flex-1 cursor-pointer rounded-lg border border-border bg-admin-canvas p-2 text-[13px] font-semibold transition-colors duration-200 hover:bg-subtle"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setMenuId(menuId === c._id ? null : c._id)}
                  className="cursor-pointer rounded-lg border border-border bg-card px-3 py-2 text-[13px] text-muted2 transition-colors duration-200 hover:bg-subtle"
                  aria-label="More"
                >
                  ⋯
                </button>
                {menuId === c._id && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuId(null)} aria-hidden />
                    <div className="absolute right-0 bottom-full z-50 mb-1 min-w-[140px] overflow-hidden rounded-lg border border-border bg-card shadow-lg">
                      <button
                        type="button"
                        className="w-full cursor-pointer border-0 bg-transparent px-3 py-2 text-left text-[13px] text-danger hover:bg-subtle"
                        onClick={() => {
                          setMenuId(null);
                          setDeleteError("");
                          setDeleteTarget(c);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        {!isLoading && items.length === 0 && (
          <div className="col-span-full rounded-[14px] border border-dashed border-border bg-card px-6 py-12 text-center text-sm text-muted">
            No categories yet. Click “+ New category” to add one.
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4" onClick={() => !busy && setModal(null)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={submit}
            className="w-full max-w-md rounded-[14px] border border-border bg-card p-6 shadow-xl"
          >
            <h2 className="m-0 mb-4 font-display text-lg font-bold text-ink">
              {modal === "new" ? "New category" : "Edit category"}
            </h2>
            <label className="mb-1 block text-[12px] font-semibold text-muted">Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Travel Bags"
              className="mb-2 w-full rounded-[9px] border border-border bg-bg px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-cognac"
            />
            {error && <p className="m-0 mb-3 text-[13px] text-danger">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setModal(null)}
                className="cursor-pointer rounded-[9px] border border-border bg-card px-4 py-2.5 text-[13px] font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="cursor-pointer rounded-[9px] border-none bg-cognac px-4 py-2.5 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-cognac-dark disabled:opacity-50"
              >
                {busy ? "Saving…" : modal === "new" ? "Create" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4"
          onClick={() => !remove.isPending && setDeleteTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-[14px] border border-border bg-card p-6 shadow-xl"
            role="alertdialog"
            aria-labelledby="delete-cat-title"
            aria-describedby="delete-cat-desc"
          >
            <h2 id="delete-cat-title" className="m-0 mb-2 font-display text-lg font-bold text-ink">
              Delete category?
            </h2>
            <p id="delete-cat-desc" className="m-0 text-[14px] leading-relaxed text-text3">
              Remove <span className="font-semibold text-ink">“{deleteTarget.name}”</span>
              {deleteTarget.productCount > 0
                ? ` — it still has ${deleteTarget.productCount} products. Reassign them first, or delete will fail.`
                : ". This can’t be undone."}
            </p>
            {deleteError && <p className="mt-3 mb-0 text-[13px] text-danger">{deleteError}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={remove.isPending}
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError("");
                }}
                className="cursor-pointer rounded-[9px] border border-border bg-card px-4 py-2.5 text-[13px] font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={remove.isPending}
                onClick={() => remove.mutate(deleteTarget._id)}
                className="cursor-pointer rounded-[9px] border-none bg-danger px-4 py-2.5 text-[13px] font-semibold text-white transition-opacity duration-200 hover:opacity-90 disabled:opacity-50"
              >
                {remove.isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
