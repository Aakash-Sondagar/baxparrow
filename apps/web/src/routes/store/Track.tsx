import { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import {
  returnWindowOpen,
  RETURN_WINDOW_DAYS,
  RETURN_REASONS,
  RETURN_OTHER,
  MAX_RETURN_IMAGES,
  MAX_RETURN_IMAGE_BYTES,
} from "@baxparrow/shared";
import { requestReturn, trackOrder } from "../../features/orders/api";
import { uploadImage } from "../../lib/cloudinary";

const FALLBACK = [
  ["Order confirmed","16 Jul, 10:24 AM","Payment received via Razorpay (UPI)","done"],
  ["Packed & ready","16 Jul, 4:10 PM","Dispatched from Byculla warehouse","done"],
  ["Shipped","17 Jul, 9:02 AM","Picked up by Shiprocket · AWB 3491028847","active"],
  ["Out for delivery","Expected 21 Jul","Mumbai, 400008","pend"],
  ["Delivered","Expected 21–23 Jul","","pend"],
];

const RETURN_LABEL: Record<string, string> = {
  requested: "Return requested — awaiting approval",
  approved: "Return approved — pickup scheduled",
  received: "Return received — processing refund",
  refunded: "Refund issued",
  rejected: "Return request rejected",
};

function deliveredAt(timeline: Array<{ status: string; at: string }> | undefined) {
  const hit = timeline?.filter((t) => t.status === "delivered").pop();
  return hit?.at ? new Date(hit.at) : null;
}

export default function Track() {
  const { no } = useParams();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [reason, setReason] = useState("");
  const [reasonDetail, setReasonDetail] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProg, setUploadProg] = useState("");
  const [pickErr, setPickErr] = useState("");
  const [err, setErr] = useState("");

  const { data } = useQuery({ queryKey: ["track", no], retry: false, queryFn: () => trackOrder(no!) });

  const order = data?.order;
  const timeline: Array<{ status: string; at: string; note?: string }> = [
    ...(order?.timeline ?? []),
    ...(order?.return?.timeline ?? []),
  ];

  const rows = timeline.length
    ? timeline.map((s, i) => [s.status, new Date(s.at).toLocaleString(), s.note, i === timeline.length - 1 ? "active" : "done"])
    : FALLBACK;

  const canReturn =
    order?.status === "delivered" &&
    order?.payment?.status === "paid" &&
    !order?.return?.status &&
    returnWindowOpen(deliveredAt(order?.timeline));

  const isOther = reason === RETURN_OTHER;
  const step1Ok = reason !== "" && (!isOther || reasonDetail.trim().length >= 5);

  const resetWizard = () => {
    setStep(1);
    setReason("");
    setReasonDetail("");
    setImages([]);
    setUploading(false);
    setUploadProg("");
    setPickErr("");
    setErr("");
  };
  const close = () => {
    setOpen(false);
    resetWizard();
  };

  const submit = useMutation({
    mutationFn: () =>
      requestReturn(no!, {
        reason,
        reasonDetail: isOther ? reasonDetail.trim() : undefined,
        images,
      }),
    onSuccess: () => {
      close();
      qc.invalidateQueries({ queryKey: ["track", no] });
    },
    onError: (e: any) => {
      const fields = e?.response?.data?.fields as Record<string, string> | undefined;
      setErr(fields?.reasonDetail ?? e?.response?.data?.error ?? "Could not request return — please try again.");
    },
  });

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    setPickErr("");
    const room = MAX_RETURN_IMAGES - images.length;
    if (room <= 0) {
      setPickErr(`You can attach up to ${MAX_RETURN_IMAGES} photos.`);
      return;
    }
    const picked = [...list].slice(0, room);
    const valid: File[] = [];
    for (const f of picked) {
      if (!f.type.startsWith("image/")) {
        setPickErr(`${f.name}: only image files are allowed.`);
        continue;
      }
      if (f.size > MAX_RETURN_IMAGE_BYTES) {
        setPickErr(`${f.name}: too large (max 5 MB).`);
        continue;
      }
      valid.push(f);
    }
    if (!valid.length) {
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setUploading(true);
    let done = 0;
    const urls: string[] = [];
    for (const f of valid) {
      try {
        setUploadProg(`${done + 1}/${valid.length}`);
        const url = await uploadImage(f, "/uploads/sign");
        urls.push(url);
        done++;
      } catch {
        setPickErr("One or more photos failed to upload. Please try again.");
      }
    }
    if (urls.length) setImages((prev) => [...prev, ...urls].slice(0, MAX_RETURN_IMAGES));
    setUploading(false);
    setUploadProg("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeImage = (url: string) => setImages((prev) => prev.filter((u) => u !== url));

  const submitDisabled = images.length < 1 || uploading || submit.isPending;

  return (
    <section className="mx-auto max-w-[760px] px-4 pt-8 pb-[70px] sm:px-7">
      <h1 className="m-0 mb-1 font-display text-[26px] font-extrabold tracking-[-.02em] sm:text-[30px]">Track your order</h1>
      <p className="m-0 mb-[26px] break-all font-mono text-sm text-cognac">Order #{no}{data?.order?.shipment?.awb ? " · AWB " + data.order.shipment.awb : ""}</p>
      <div className="rounded-[15px] border border-border bg-card p-5 sm:p-8">
        {rows.map(([title, time, note, state]: any, i: number) => {
          const dotClass = state === "pend" ? "bg-[#D6CFC4]" : state === "active" ? "bg-cognac" : "bg-green";
          return <div key={i} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className={`grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full text-[13px] text-white ${dotClass}`}>{state === "pend" ? "" : "✓"}</span>
              {i < rows.length - 1 && <span className={`w-0.5 min-h-[34px] flex-1 ${state === "done" ? "bg-green" : "bg-border"}`} />}
            </div>
            <div className="pb-[26px]">
              <div className={`text-[15px] font-bold ${state === "pend" ? "text-muted2" : "text-ink"}`}>{title}</div>
              <div className="font-mono text-[13px] text-muted2">{time}</div>
              {note && <div className="mt-0.5 text-[13.5px] text-muted">{note}</div>}
            </div>
          </div>;
        })}
      </div>

      {canReturn && (
        <div className="mt-5 rounded-[15px] border border-border bg-card p-5 sm:p-6">
          <div className="text-[15px] font-bold text-ink">Happy with your order?</div>
          <p className="m-0 mt-1 text-[13.5px] text-muted">
            You can request a return within {RETURN_WINDOW_DAYS} days of delivery.
          </p>
          <button
            type="button"
            onClick={() => { setErr(""); setOpen(true); }}
            className="mt-3.5 cursor-pointer rounded-[10px] border border-border bg-card px-5 py-2.5 text-[13.5px] font-semibold text-ink hover:border-cognac"
          >
            Request return
          </button>
        </div>
      )}

      {order?.return?.status && (
        <div className="mt-5 rounded-[15px] border border-border bg-card p-5 sm:p-6">
          <div className="text-[15px] font-bold text-ink">Return · {RETURN_LABEL[order.return.status] ?? order.return.status}</div>
          {order.return.reason && (
            <p className="m-0 mt-1 text-[13.5px] text-muted">Reason: {order.return.reason}{order.return.reasonDetail ? ` — ${order.return.reasonDetail}` : ""}</p>
          )}
          {order.return.images?.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {order.return.images.map((url: string) => (
                <a key={url} href={url} target="_blank" rel="noreferrer">
                  <img src={url} alt="Return item" className="h-[64px] w-[64px] rounded-[8px] object-cover" />
                </a>
              ))}
            </div>
          )}
          {order.return.status === "refunded" && order.return.refundAmount != null && (
            <p className="m-0 mt-1 text-[13.5px] text-green">
              ₹{Math.round(order.return.refundAmount / 100)} refunded to your original payment method.
            </p>
          )}
          {order.return.status === "rejected" && order.return.rejectionNote && (
            <p className="m-0 mt-1 text-[13.5px] text-danger">{order.return.rejectionNote}</p>
          )}
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Request return"
        >
          <div
            className="w-full max-w-md rounded-[14px] border border-border bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-2 text-[13px]">
              {[1, 2].map((n) => (
                <div key={n} className="flex items-center gap-2">
                  <span
                    className={`grid h-7 w-7 place-items-center rounded-full font-mono text-xs font-bold ${
                      step === n ? "bg-cognac text-white" : step > n ? "bg-green text-white" : "bg-bg text-muted2"
                    }`}
                  >
                    {n}
                  </span>
                  <span className={step === n ? "font-semibold text-ink" : "text-muted"}>
                    {n === 1 ? "Reason" : "Photos"}
                  </span>
                  {n === 1 && <span className="mx-1 text-[#D6CFC4]">—</span>}
                </div>
              ))}
            </div>

            {step === 1 && (
              <>
                <div className="mb-1 font-display text-[17px] font-bold text-ink">Why are you returning?</div>
                <p className="m-0 mb-4 text-[13.5px] text-muted">Order #{no} · full order · refund to original payment method.</p>
                <div className="flex flex-col gap-2">
                  {RETURN_REASONS.map((r) => (
                    <label
                      key={r}
                      className={`flex cursor-pointer items-center gap-2.5 rounded-[10px] border px-3.5 py-2.5 text-[14px] ${
                        reason === r ? "border-cognac bg-[#FBF1E5] font-semibold text-ink" : "border-border bg-bg text-text3"
                      }`}
                    >
                      <input
                        type="radio"
                        name="return-reason"
                        value={r}
                        checked={reason === r}
                        onChange={() => { setReason(r); setErr(""); }}
                        className="accent-[#A94D28]"
                      />
                      {r}
                    </label>
                  ))}
                </div>
                {isOther && (
                  <div className="mt-3">
                    <label className="text-[13px] font-semibold text-text3" htmlFor="return-detail">Please describe</label>
                    <textarea
                      id="return-detail"
                      value={reasonDetail}
                      onChange={(e) => { setReasonDetail(e.target.value.slice(0, 500)); setErr(""); }}
                      rows={3}
                      maxLength={500}
                      placeholder="Tell us what went wrong"
                      className="mt-1.5 w-full rounded-[10px] border border-border bg-bg px-3.5 py-3 text-sm outline-none focus:border-cognac"
                    />
                  </div>
                )}
                {err && <div className="mt-2.5 text-[13px] text-danger">{err}</div>}
                <div className="mt-5 flex justify-end gap-2.5">
                  <button type="button" onClick={close} className="cursor-pointer rounded-[10px] border border-border bg-card px-5 py-2.5 text-[13.5px] font-semibold text-ink">Cancel</button>
                  <button
                    type="button"
                    disabled={!step1Ok}
                    onClick={() => { setErr(""); setStep(2); }}
                    className="cursor-pointer rounded-[10px] border-none bg-cognac px-5 py-2.5 text-[13.5px] font-bold text-white disabled:opacity-60"
                  >
                    Continue
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="mb-1 font-display text-[17px] font-bold text-ink">Add photos of the item</div>
                <p className="m-0 mb-4 text-[13.5px] text-muted">
                  Upload up to {MAX_RETURN_IMAGES} clear photos so we can verify the item. At least 1 is required.
                </p>
                <label className="block cursor-pointer rounded-[14px] border-2 border-dashed border-[#D6CFC4] bg-[#FBFAF7] p-8 text-center">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(e) => onFiles(e.target.files)}
                    className="hidden"
                  />
                  <div className="mb-2 text-[30px] text-muted2">⇪</div>
                  <div className="mb-1 font-semibold">{uploading ? `Uploading ${uploadProg}…` : "Add photos"}</div>
                  <div className="text-[12.5px] text-muted">{images.length}/{MAX_RETURN_IMAGES} · jpg / png / webp · max 5 MB each</div>
                </label>
                {(pickErr || err) && <div className="mt-2.5 text-[13px] text-danger">{pickErr || err}</div>}
                {images.length > 0 && (
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {images.map((url) => (
                      <div key={url} className="relative aspect-square overflow-hidden rounded-[9px]">
                        <img src={url} alt="Upload" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(url)}
                          aria-label="Remove photo"
                          className="absolute right-1 top-1 grid h-5 w-5 cursor-pointer place-items-center rounded-full border-0 bg-ink/80 text-white"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-5 flex justify-between gap-2.5">
                  <button type="button" onClick={() => setStep(1)} className="cursor-pointer rounded-[10px] border border-border bg-card px-5 py-2.5 text-[13.5px] font-semibold text-ink">Back</button>
                  <button
                    type="button"
                    disabled={submitDisabled}
                    onClick={() => submit.mutate()}
                    className="cursor-pointer rounded-[10px] border-none bg-cognac px-5 py-2.5 text-[13.5px] font-bold text-white disabled:opacity-60"
                  >
                    {submit.isPending ? "Submitting…" : "Submit request"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
