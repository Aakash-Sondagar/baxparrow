import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import { CATEGORIES } from "@baxparrow/shared";
import { tile } from "../../styles/tokens";
import { inr } from "../../lib/format";
import { useAdminProducts } from "../../features/products/hooks";
import { deleteProduct, updateProduct } from "../../features/products/mutations";

const PAGE_SIZE = 12;

type Row = {
  _id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  status: string;
  images?: string[];
};

export default function Products() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      setQ(qInput.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [qInput]);

  const params = useMemo(
    () => ({
      q: q || undefined,
      category: category !== "All" ? category : undefined,
      status: status !== "All" ? status : undefined,
      page: String(page),
      limit: String(PAGE_SIZE),
    }),
    [q, category, status, page]
  );

  const { data, isFetching } = useAdminProducts(params);
  const items = (data?.items ?? []) as Row[];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  const remove = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      setDeleteTarget(null);
      setDeleteError("");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (e: any) => {
      setDeleteError(e?.response?.data?.error ?? "Failed to delete");
    },
  });

  const activate = useMutation({
    mutationFn: (id: string) => updateProduct(id, { status: "active" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-products"] }),
  });

  return (
    <>
      <div className="mb-[18px] flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          type="search"
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          placeholder="⌕ Search products…"
          className="w-full max-w-[320px] rounded-[9px] border border-border bg-card px-3.5 py-2.5 text-[13px] text-ink outline-none placeholder:text-muted2 focus:border-cognac"
        />
        <div className="relative">
          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            className={`cursor-pointer rounded-[9px] border px-4 py-2.5 text-[13px] font-semibold transition-colors duration-200 ${
              category !== "All" || status !== "All"
                ? "border-cognac bg-cognac/10 text-cognac"
                : "border-border bg-card text-ink"
            }`}
          >
            Filter{(category !== "All" || status !== "All") ? " · on" : ""}
          </button>
          {filterOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setFilterOpen(false)} aria-hidden />
              <div className="absolute left-0 z-50 mt-2 w-[240px] rounded-[12px] border border-border bg-card p-3 shadow-lg sm:left-auto">
                <label className="mb-1 block text-[11px] font-mono text-muted2">CATEGORY</label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setPage(1);
                  }}
                  className="mb-3 w-full rounded-lg border border-border bg-bg px-2.5 py-2 text-[13px]"
                >
                  <option value="All">All</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <label className="mb-1 block text-[11px] font-mono text-muted2">STATUS</label>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                  }}
                  className="mb-3 w-full rounded-lg border border-border bg-bg px-2.5 py-2 text-[13px]"
                >
                  <option value="All">All</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                </select>
                <button
                  type="button"
                  className="w-full cursor-pointer rounded-lg border border-border bg-bg py-2 text-[12px] font-semibold"
                  onClick={() => {
                    setCategory("All");
                    setStatus("All");
                    setPage(1);
                    setFilterOpen(false);
                  }}
                >
                  Clear filters
                </button>
              </div>
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          <button
            type="button"
            onClick={() => nav("/admin/products/bulk")}
            className="cursor-pointer rounded-[9px] border border-border bg-card px-4 py-2.5 text-[13px] font-semibold transition-colors duration-200 hover:bg-subtle"
          >
            ⇪ Bulk upload
          </button>
          <button
            type="button"
            onClick={() => nav("/admin/products/new")}
            className="cursor-pointer rounded-[9px] border-none bg-cognac px-[18px] py-2.5 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-cognac-dark"
          >
            + Add product
          </button>
        </div>
      </div>

      <div className={`overflow-hidden rounded-[14px] border border-border bg-card transition-opacity duration-200 ${isFetching ? "opacity-70" : "opacity-100"}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-[13.5px]">
            <thead>
              <tr className="bg-[#FBFAF7] text-left font-mono text-[11px] text-muted2">
                {["PRODUCT", "SKU", "CATEGORY", "PRICE", "STOCK", "STATUS", ""].map((h, i) => (
                  <th key={h || `a${i}`} className="px-[22px] py-[13px] font-normal">{h || "ACTIONS"}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-[22px] py-10 text-center text-muted">
                    No products match.
                  </td>
                </tr>
              )}
              {items.map((p, i) => {
                const out = p.stock === 0;
                const low = p.stock > 0 && p.stock < 20;
                const draft = p.status === "draft";
                return (
                  <tr key={p._id} className="border-t border-t-[#F0EBE3]">
                    <td className="px-[22px] py-3">
                      <div className="flex items-center gap-3">
                        {p.images?.[0] ? (
                          <img
                            src={p.images[0]}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-[9px] object-cover"
                          />
                        ) : (
                          <span
                            className="h-10 w-10 shrink-0 rounded-[9px]"
                            style={{ background: tile(i) }}
                          />
                        )}
                        <span className="font-semibold">{p.name}</span>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-muted">{p.sku}</td>
                    <td className="p-3 text-text3">{p.category}</td>
                    <td className="p-3 font-body tabular-nums">{inr(p.price)}</td>
                    <td className={`p-3 font-mono ${out ? "text-danger" : low ? "text-amber" : "text-text3"}`}>
                      {out ? "Out" : p.stock}
                    </td>
                    <td className="px-[22px] py-3">
                      <span
                        className={`rounded-full px-[11px] py-1 text-xs font-bold ${
                          draft ? "bg-[#F3EFEA] text-muted" : "bg-green-bg text-green"
                        }`}
                      >
                        {draft ? "Draft" : "Active"}
                      </span>
                    </td>
                    <td className="px-[22px] py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          title="Edit"
                          onClick={() => nav(`/admin/products/${p._id}/edit`)}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[12px] font-semibold text-ink transition-colors duration-200 hover:bg-subtle"
                        >
                          <Pencil size={13} />
                          Edit
                        </button>
                        {draft && (
                          <>
                            <button
                              type="button"
                              title="Set active"
                              disabled={activate.isPending}
                              onClick={() => activate.mutate(p._id)}
                              className="inline-flex cursor-pointer items-center rounded-lg border border-green bg-green-bg px-2.5 py-1.5 text-[12px] font-semibold text-green transition-opacity duration-200 disabled:opacity-50"
                            >
                              Activate
                            </button>
                            <button
                              type="button"
                              title="Delete draft"
                              onClick={() => {
                                setDeleteError("");
                                setDeleteTarget(p);
                              }}
                              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[12px] font-semibold text-danger transition-colors duration-200 hover:bg-[#FDF2F0]"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-t-[#F0EBE3] px-[22px] py-3.5 text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing {from}–{to} of {total}
          </span>
          <div className="flex gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="cursor-pointer rounded-[7px] border border-border bg-card px-3 py-1.5 transition-opacity duration-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={page >= pages}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              className="cursor-pointer rounded-[7px] border border-cognac bg-cognac px-3 py-1.5 text-white transition-opacity duration-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {deleteTarget && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4"
          onClick={() => !remove.isPending && setDeleteTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-[14px] border border-border bg-card p-6 shadow-xl"
            role="alertdialog"
          >
            <h2 className="m-0 mb-2 font-display text-lg font-bold text-ink">Delete draft product?</h2>
            <p className="m-0 text-[14px] leading-relaxed text-text3">
              Remove <span className="font-semibold text-ink">“{deleteTarget.name}”</span> ({deleteTarget.sku}).
              Active products can’t be deleted.
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
                className="cursor-pointer rounded-[9px] border-none bg-danger px-4 py-2.5 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
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
