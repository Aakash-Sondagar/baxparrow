import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "../../lib/api";
import { useAuth } from "../auth/AuthContext";

export type CartItem = {
  id: string;
  lineKey: string;
  name: string;
  cat: string;
  price: number;
  lineTotal: number;
  qty: number;
  toneIndex: number;
  color?: string;
  size?: string;
  image?: string;
};

export type CartAmounts = {
  subtotal: number;
  shipping: number;
  gst: number;
  total: number;
};

type AddOpts = { qty?: number; color?: string; size?: string };

type Ctx = {
  items: CartItem[];
  amounts: CartAmounts;
  count: number;
  loading: boolean;
  add: (productId: string, opts?: AddOpts) => Promise<void>;
  setQty: (lineKey: string, delta: number) => Promise<void>;
  remove: (lineKey: string) => Promise<void>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
};

const ZERO: CartAmounts = { subtotal: 0, shipping: 0, gst: 0, total: 0 };
const CartCtx = createContext<Ctx>(null!);
export const useCart = () => useContext(CartCtx);

const KEY = "bx_cart_key";

function getCartKey() {
  let k = localStorage.getItem(KEY);
  if (!k) {
    k =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `g_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(KEY, k);
  }
  return k;
}

function lineKeyOf(id: string, color?: string, size?: string) {
  return `${id}|${color ?? ""}|${size ?? ""}`;
}

function applyPayload(
  data: { items?: any[]; amounts?: CartAmounts; count?: number },
  setItems: (i: CartItem[]) => void,
  setAmounts: (a: CartAmounts) => void,
  setCount: (n: number) => void
) {
  const items = (data.items ?? []).map((x: any) => {
    const id = x.id ?? x.product;
    const color = x.color || undefined;
    const size = x.size || undefined;
    return {
      id,
      lineKey: x.lineKey ?? lineKeyOf(id, color, size),
      name: x.name,
      cat: x.cat,
      price: x.price,
      lineTotal: x.lineTotal ?? x.price * x.qty,
      qty: x.qty,
      toneIndex: x.toneIndex ?? 0,
      color,
      size,
      image: x.image || undefined,
    } as CartItem;
  });
  setItems(items);
  setAmounts(data.amounts ?? ZERO);
  setCount(data.count ?? items.reduce((a, x) => a + x.qty, 0));
}

function toPayload(items: CartItem[]) {
  return items.map((x) => ({
    product: x.id,
    qty: x.qty,
    ...(x.color ? { color: x.color } : {}),
    ...(x.size ? { size: x.size } : {}),
  }));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [amounts, setAmounts] = useState<CartAmounts>(ZERO);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data } = await api.get("/cart", {
      headers: { "X-Cart-Key": getCartKey() },
    });
    applyPayload(data, setItems, setAmounts, setCount);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const legacy = localStorage.getItem("bx_cart");
        if (legacy) {
          try {
            const local = JSON.parse(legacy) as { id: string; qty: number }[];
            if (Array.isArray(local) && local.length) {
              await api.patch(
                "/cart",
                { items: local.map((i) => ({ product: i.id, qty: i.qty })) },
                { headers: { "X-Cart-Key": getCartKey() } }
              );
            }
          } catch {
            /* ignore */
          }
          localStorage.removeItem("bx_cart");
        }
        if (!cancelled) await refresh();
      } catch {
        if (!cancelled) {
          setItems([]);
          setAmounts(ZERO);
          setCount(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, refresh]);

  const add = async (productId: string, opts: AddOpts = {}) => {
    const { data } = await api.post(
      "/cart",
      {
        product: productId,
        qty: opts.qty ?? 1,
        ...(opts.color ? { color: opts.color } : {}),
        ...(opts.size ? { size: opts.size } : {}),
      },
      { headers: { "X-Cart-Key": getCartKey() } }
    );
    applyPayload(data, setItems, setAmounts, setCount);
  };

  const setQty = async (lineKey: string, delta: number) => {
    const next = items
      .map((x) => (x.lineKey === lineKey ? { ...x, qty: x.qty + delta } : x))
      .filter((x) => x.qty > 0);
    const { data } = await api.patch(
      "/cart",
      { items: toPayload(next) },
      { headers: { "X-Cart-Key": getCartKey() } }
    );
    applyPayload(data, setItems, setAmounts, setCount);
  };

  const remove = async (lineKey: string) => {
    const next = items.filter((x) => x.lineKey !== lineKey);
    const { data } = await api.patch(
      "/cart",
      { items: toPayload(next) },
      { headers: { "X-Cart-Key": getCartKey() } }
    );
    applyPayload(data, setItems, setAmounts, setCount);
  };

  const clear = async () => {
    const { data } = await api.patch(
      "/cart",
      { items: [] },
      { headers: { "X-Cart-Key": getCartKey() } }
    );
    applyPayload(data, setItems, setAmounts, setCount);
  };

  return (
    <CartCtx.Provider
      value={{ items, amounts, count, loading, add, setQty, remove, clear, refresh }}
    >
      {children}
    </CartCtx.Provider>
  );
}
