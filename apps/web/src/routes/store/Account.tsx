import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../features/auth/AuthContext";
import { myOrders } from "../../features/orders/api";
import { inr } from "../../lib/format";
import AccountAuth from "./AccountAuth";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending payment",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
};

export default function Account() {
  const { user, logout } = useAuth();

  const { data: orders, isLoading, isError } = useQuery({
    queryKey: ["my-orders", user?.id],
    queryFn: myOrders,
    enabled: !!user && user.role !== "admin",
  });

  if (!user) return <AccountAuth />;

  if (user.role === "admin") {
    return (
      <section className="mx-auto max-w-[640px] px-4 pt-10 pb-[70px] sm:px-7">
        <h1 className="m-0 mb-2 font-display text-[28px] font-extrabold">Admin signed in</h1>
        <p className="mb-5 text-sm text-muted2">Use the admin panel for store management.</p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin"
            className="rounded-[11px] bg-cognac px-5 py-3 text-sm font-bold text-white no-underline"
          >
            Open admin
          </Link>
          <button
            type="button"
            onClick={() => logout()}
            className="cursor-pointer rounded-[11px] border border-border bg-card px-5 py-3 text-sm font-semibold"
          >
            Log out
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[760px] px-4 pt-8 pb-[70px] sm:px-7">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="m-0 font-display text-[26px] font-extrabold tracking-[-.02em] sm:text-[30px]">
            My orders
          </h1>
          <p className="m-0 mt-1 text-sm text-muted2">
            {user.name} · {user.email}
          </p>
        </div>
        <button
          type="button"
          onClick={() => logout()}
          className="cursor-pointer rounded-[10px] border border-border bg-card px-3.5 py-2 text-[13px] font-semibold text-text2"
        >
          Log out
        </button>
      </div>

      {isLoading && <p className="text-sm text-muted2">Loading orders…</p>}
      {isError && (
        <p className="text-sm text-danger">Could not load orders. Try refresh.</p>
      )}
      {!isLoading && !isError && (!orders || orders.length === 0) && (
        <div className="rounded-[15px] border border-border bg-card p-6 text-center sm:p-8">
          <p className="m-0 mb-4 text-sm text-muted2">No orders yet.</p>
          <Link
            to="/shop"
            className="inline-block rounded-[11px] bg-cognac px-5 py-3 text-sm font-bold text-white no-underline"
          >
            Shop bags
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {orders?.map((o) => {
          const title =
            o.items?.[0]?.name +
            (o.items && o.items.length > 1 ? ` +${o.items.length - 1} more` : "");
          return (
            <Link
              key={o._id}
              to={`/order/${o.orderNo}/track`}
              className="block rounded-[15px] border border-border bg-card p-4 text-ink no-underline transition-colors hover:border-cognac/50 sm:p-5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-mono text-[13px] text-cognac">{o.orderNo}</span>
                <span className="font-display text-lg font-extrabold">{inr(o.amounts?.total ?? 0)}</span>
              </div>
              <div className="mt-1.5 truncate text-sm font-semibold">{title || "Order"}</div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12.5px] text-muted2">
                <span>{STATUS_LABEL[o.status] ?? o.status}</span>
                <span>·</span>
                <span>{new Date(o.createdAt).toLocaleDateString()}</span>
                {o.payment?.status && (
                  <>
                    <span>·</span>
                    <span className="capitalize">{o.payment.status}</span>
                  </>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
