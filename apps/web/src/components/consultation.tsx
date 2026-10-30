"use client";

import type { CNNOutput } from "@dermiai/schemas";
import Link from "next/link";
import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";

import { Dermi, type DermiMood } from "@/components/dermi";
import { CloseButton, Modal } from "@/components/modal";
import {
  Arrow,
  Avatar,
  Breadcrumb,
  Button,
  buttonClass,
  cx,
  Hatch,
  PainFace,
  StatusChip,
} from "@/components/ui";
import { classify, consult, processFile, processImage } from "@/demo/client";
import { firstNameOf, initialsOf } from "@/demo/gate";
import { SCENARIOS } from "@/demo/scenarios";
import { clockLabel, demo, getState, makeEvent, newId, now, whenLabel } from "@/demo/store";
import { trace } from "@/demo/trace";
import type {
  CasePatch,
  ConsultBody,
  DemoCase,
  DemoMetaEvent,
  DemoProfile,
  Source,
  Turn,
  UserEvent,
} from "@/demo/types";
import { STATUS_LABEL } from "@/components/ui";

const SATISFIED_Q = "? Are you satisfied with your care?";
const ANALYSIS_STEPS = ["Checking photo quality", "Mapping the affected area", "Comparing with your profile"];

function painBand(n: number) {
  if (n <= 3) return "Mild — noticeable but easy to ignore";
  if (n <= 6) return "Moderate — noticeably uncomfortable";
  if (n <= 8) return "Severe — hard to focus on other things";
  return "Very severe — it feels overwhelming";
}

function transcriptOf(c: DemoCase) {
  return c.turns
    .filter((t) => t.role === "user" && t.text)
    .map((t) => t.text)
    .join("\n");
}

function freshCase(id: string) {
  return getState().cases.find((c) => c.id === id);
}

/* ---------- Bubbles ---------- */

function Meta({ children }: { children: ReactNode }) {
  return <span className="caps text-[11px] tracking-[0.08em] text-muted">{children}</span>;
}

function DermiTurn({
  mood = "happy",
  meta,
  wide,
  className,
  children,
  live,
}: {
  mood?: DermiMood;
  meta?: ReactNode;
  wide?: boolean;
  className?: string;
  children: ReactNode;
  live?: boolean;
}) {
  return (
    <li className="flex items-start gap-2 sm:gap-3" aria-live={live ? "polite" : undefined}>
      <Dermi size={38} mood={mood} className="size-8 sm:size-[38px]" />
      <div className={cx("flex min-w-0 flex-col gap-1.5", wide ? "max-w-[640px] flex-1" : "max-w-[78%]")}>
        <div
          className={cx(
            "rounded-[4px_14px_14px_14px] px-4 py-3.5 text-[15px] leading-relaxed sm:px-[18px]",
            className ?? "bg-merino",
          )}
        >
          {children}
        </div>
        {meta && <Meta>{meta}</Meta>}
      </div>
    </li>
  );
}

function UserTurn({
  meta,
  initials,
  children,
}: {
  meta?: ReactNode;
  initials: string;
  children: ReactNode;
}) {
  return (
    <li className="flex items-start justify-end gap-2 sm:gap-3">
      <div className="flex max-w-[78%] flex-col items-end gap-1.5">
        {children}
        {meta && <Meta>{meta}</Meta>}
      </div>
      <span className="hidden sm:block">
        <Avatar initials={initials} />
      </span>
    </li>
  );
}

function UserText({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[14px_4px_14px_14px] bg-rock-tint px-4 py-3.5 text-[15px] leading-relaxed whitespace-pre-wrap sm:px-[18px]">
      {children}
    </div>
  );
}

/** Renders the engine's light markup ("? question", "01 item", "! headline") as it streams. */
function RichText({ text, hide }: { text: string; hide?: string }) {
  const lines = text.split("\n").filter((l) => l !== hide);
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length === 0) return;
    const items = list;
    blocks.push(
      <ol key={`l${blocks.length}`} className="m-0 flex list-none flex-col p-0">
        {items.map((item) => (
          <li key={item} className="grid grid-cols-[30px_1fr] border-t border-line py-2">
            <span className="caps text-xs text-venice">{item.slice(0, 2)}</span>
            {item.slice(3)}
          </li>
        ))}
      </ol>,
    );
    list = [];
  };
  lines.forEach((line, i) => {
    if (/^\d\d /.test(line)) {
      list.push(line);
      return;
    }
    flush();
    if (line.startsWith("? ")) {
      blocks.push(
        <span
          key={i}
          className="display border-t border-line pt-2.5 text-[21px] leading-snug tracking-normal text-venice first:border-t-0 first:pt-0"
        >
          {line.slice(2)}
        </span>,
      );
    } else if (line.startsWith("! ")) {
      blocks.push(
        <span
          key={i}
          className="display text-[30px] leading-[1.12] tracking-[-0.01em] text-alert-deep"
        >
          {line.slice(2)}
        </span>,
      );
    } else if (line.trim()) {
      blocks.push(<span key={i}>{line}</span>);
    }
  });
  flush();
  return <div className="flex flex-col gap-2.5">{blocks}</div>;
}

function Sources({ sources }: { sources: Source[] }) {
  if (sources.length === 0) return null;
  return (
    <details className="group text-[13px]">
      <summary className="caps cursor-pointer list-none text-[10.5px] text-muted hover:text-venice">
        Looked up {sources.length} {sources.length === 1 ? "note" : "notes"} ·{" "}
        {sources.map((s) => s.title).join(" · ")} <span className="group-open:hidden">+</span>
      </summary>
      <ul className="m-0 mt-2 flex list-none flex-col gap-2 border-l-2 border-rock pl-3">
        {sources.map((s) => (
          <li key={s.id}>
            <span className="font-normal">{s.title}</span>
            <span className="text-muted"> — {s.snippet}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

/* ---------- Pain scale ---------- */

function PainScale({
  value,
  onChange,
  disabled,
}: {
  value: number | null;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3.5 pt-1">
      <div role="group" aria-label="Discomfort from 1 to 10" className="grid grid-cols-5 gap-1 sm:grid-cols-10">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const on = n === value;
          return (
            <button
              key={n}
              type="button"
              aria-pressed={on}
              aria-label={`${n} out of 10`}
              disabled={disabled}
              onClick={() => onChange(n)}
              className={cx(
                "flex min-h-[58px] cursor-pointer flex-col items-center gap-0.5 rounded-[6px] py-1.5 disabled:cursor-default sm:min-h-[72px] sm:py-2",
                on
                  ? "border-[1.5px] border-venice bg-venice text-merino"
                  : "border border-line bg-paper text-venice enabled:hover:border-venice",
              )}
            >
              <PainFace n={n} />
              <span className="font-display text-[17px] font-normal">{n}</span>
            </button>
          );
        })}
      </div>
      <div className="caps hidden justify-between gap-3 text-[11px] tracking-[0.08em] text-muted sm:flex">
        <span>Barely noticeable</span>
        <span>Worst imaginable</span>
      </div>
      {value !== null && (
        <span className="text-[15px] font-normal text-venice" aria-live="polite">
          {value} — {painBand(value)}
        </span>
      )}
    </div>
  );
}

/* ---------- Live summary ---------- */

function LiveSummary({ c, updating }: { c: DemoCase; updating: boolean }) {
  const isRed = c.status === "see-dermatologist";
  const pain = c.pains.at(-1)?.value ?? null;
  const preds = c.cnn ? c.cnn.top_k.slice(0, isRed ? 2 : 3) : [];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2.5">
        <span className="caps text-[11px] text-muted">Possible conditions</span>
        {isRed && <ConditionBar name="Needs a doctor's review" value="review" pct={100} tone="alert" />}
        {preds.map((p, i) => (
          <ConditionBar
            key={p.condition}
            name={p.condition}
            value={`${Math.round(p.confidence * 100)}%`}
            pct={p.confidence * 100}
            tone={i === 0 && !isRed ? "strong" : "soft"}
          />
        ))}
        {preds.length === 0 && !isRed && (
          <span className="text-[13px] text-muted">
            {updating ? "Analysing your photo…" : "Add a photo and I'll compare it with similar cases."}
          </span>
        )}
        <span className="text-xs text-muted">Likelihoods, not a diagnosis.</span>
      </div>

      <div className="flex flex-col gap-2">
        <span className="caps text-[11px] text-muted">Key symptoms</span>
        {c.symptoms.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {c.symptoms.map((s) => (
              <span
                key={s}
                className={cx(
                  "rounded-tag px-[9px] py-1 text-[13px] font-normal",
                  ["Fever", "Spreading fast", "Warm to touch", "Pus", "Facial swelling", "Trouble breathing", "Bleeding"].includes(s)
                    ? "bg-alert-tint text-alert-text"
                    : "bg-rock-tint",
                )}
              >
                {s}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-[13px] text-muted">They&apos;ll appear as you describe them.</span>
        )}
      </div>

      <div className="grid grid-cols-2 border-t border-line">
        <div className="flex flex-col gap-1 border-r border-line pt-3 pr-3">
          <span className="caps text-[11px] text-muted">Discomfort</span>
          <span className="display text-[38px] leading-none tracking-normal text-venice">
            {pain ?? "–"}
            <span className="text-lg text-muted">/10</span>
          </span>
        </div>
        <div className="flex flex-col gap-2 pt-3 pl-3.5">
          <span className="caps text-[11px] text-muted">Status</span>
          <StatusChip
            status={updating ? "open" : c.status}
            label={updating ? "Updating" : undefined}
            className="self-start"
          />
        </div>
      </div>
      {c.trigger && (
        <p className="m-0 border-t border-line pt-3 text-[13px] leading-normal">
          <span className="caps text-[11px] text-venice">Suspected trigger · </span>
          {c.trigger}
        </p>
      )}
    </div>
  );
}

function ConditionBar({
  name,
  value,
  pct,
  tone,
}: {
  name: string;
  value: string;
  pct: number;
  tone: "alert" | "strong" | "soft";
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className={cx("flex justify-between gap-2 text-sm", tone === "alert" ? "text-alert-text" : "text-ink")}>
        <span className="font-normal">{name}</span>
        <span className="font-display text-base font-normal">{value}</span>
      </div>
      <div className="h-[5px] overflow-hidden rounded-[2px] bg-track">
        <div
          className={cx("h-full", tone === "alert" ? "bg-alert" : tone === "strong" ? "bg-venice" : "bg-rock")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ---------- Camera ---------- */

const NO_CAMERA = "Camera isn't available here. You can upload a photo instead.";

function CameraDialog({
  open,
  onClose,
  onCapture,
  onUpload,
}: {
  open: boolean;
  onClose: () => void;
  onCapture: (img: { dataUrl: string; brightness: number }) => void;
  onUpload: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [streamError, setError] = useState<string | null>(null);
  const unsupported = typeof navigator !== "undefined" && !navigator.mediaDevices;
  const error = unsupported ? NO_CAMERA : streamError;

  useEffect(() => {
    if (!open) return;
    let stream: MediaStream | null = null;
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: facing, width: { ideal: 1280 } }, audio: false })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        if (video.current) video.current.srcObject = s;
        setError(null);
      })
      .catch(() => setError(NO_CAMERA));
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [open, facing]);

  const shutter = async () => {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    onCapture(await processImage(v, v.videoWidth, v.videoHeight));
  };

  return (
    <Modal open={open} onClose={onClose} labelledBy="cam-h">
      <section className="flex flex-col gap-[18px] p-5 sm:p-6">
        <div className="flex items-center justify-between border-b border-venice pb-3.5">
          <h2 id="cam-h" className="display m-0 text-[30px] tracking-normal text-venice">
            Capture photo
          </h2>
          <CloseButton onClick={onClose} label="Close camera" />
        </div>
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[6px] bg-ink">
          <video ref={video} autoPlay playsInline muted className="absolute inset-0 size-full object-cover" />
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-merino">
              <span className="text-[15px]">{error}</span>
              <Button variant="on-rock" className="border-merino text-merino hover:text-merino" onClick={onUpload}>
                Upload a photo
              </Button>
            </div>
          )}
          <span className="absolute top-[20%] left-[24%] size-10 rounded-tl-[6px] border-t-2 border-l-2 border-merino" />
          <span className="absolute top-[20%] right-[24%] size-10 rounded-tr-[6px] border-t-2 border-r-2 border-merino" />
          <span className="absolute bottom-[20%] left-[24%] size-10 rounded-bl-[6px] border-b-2 border-l-2 border-merino" />
          <span className="absolute right-[24%] bottom-[20%] size-10 rounded-br-[6px] border-r-2 border-b-2 border-merino" />
          <span className="caps absolute inset-x-4 top-4 text-center text-[11px] text-merino [text-shadow:0_0_6px_rgb(15_61_86)] sm:text-xs">
            Fit the patch and a little healthy skin inside the corners
          </span>
        </div>
        <div className="grid grid-cols-1 border-y border-line text-sm sm:grid-cols-3">
          {["Natural light, no flash", "About 15 cm away", "Hold still for a second"].map((tip, i) => (
            <span
              key={tip}
              className="border-line py-3 max-sm:border-b max-sm:last:border-b-0 sm:border-r sm:px-3 sm:first:pl-0 sm:last:border-r-0"
            >
              <span className="caps text-[11px] text-venice">0{i + 1} </span>
              {tip}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <button
            type="button"
            aria-label="Take photo"
            onClick={shutter}
            disabled={Boolean(error)}
            className="size-[76px] cursor-pointer rounded-full border-2 border-venice bg-paper p-1.5 disabled:opacity-40"
          >
            <span className="block size-full rounded-full bg-venice" />
          </button>
          <Button variant="secondary" onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}>
            Flip
          </Button>
        </div>
      </section>
    </Modal>
  );
}

/* ---------- Main view ---------- */

type Streaming = { status: string | null; text: string; mood: DermiMood };
type Analyzing = { photoId: string; steps: string[] };

/** Core consultation (design/screens/Consultation + ConsultMobile), driven by the demo engine. */
export function ConsultationView({ c, profile }: { c: DemoCase; profile: DemoProfile | null }) {
  const id = c.id;
  const [streaming, setStreaming] = useState<Streaming | null>(null);
  const [analyzing, setAnalyzing] = useState<Analyzing | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [enlarged, setEnlarged] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const initials = initialsOf(profile?.name ?? "");
  const busy = streaming !== null || analyzing !== null;
  const lastTurn = c.turns.at(-1);
  const lightbox = c.photos.find((p) => p.id === enlarged);

  /* ----- talking to Dermi ----- */

  function applyTurn(text: string, meta: DemoMetaEvent | null) {
    const patch: CasePatch = meta?.patch ?? {};
    const at = now();
    let reminderEvent = null;
    if (patch.reminder) {
      const exists = getState().reminders.some((r) => r.caseId === id && r.title === patch.reminder!.title);
      if (!exists) {
        const scenario = patch.scenario ?? freshCase(id)?.scenario;
        demo.addReminder({
          ...patch.reminder,
          caseId: id,
          caseLabel: scenario ? SCENARIOS[scenario].titlePrefix : undefined,
          enabled: true,
        });
        reminderEvent = makeEvent({
          kind: "Reminder",
          title: `${patch.reminder.title}, ${patch.reminder.time} ${patch.reminder.repeat.toLowerCase()}`,
          detail: "Added by Dermi at the end of the consultation.",
          photoIds: [],
          pain: null,
        });
      }
    }
    demo.updateCase(id, (cur) => {
      const status = patch.status ?? cur.status;
      const events = [...cur.events];
      if (status !== cur.status) {
        events.unshift(
          makeEvent({
            kind: "Status",
            title: `${STATUS_LABEL[cur.status]} → ${STATUS_LABEL[status]}`,
            detail:
              status === "see-dermatologist"
                ? "Dermi noticed warning signs and recommended seeing a doctor."
                : "You confirmed you were satisfied with your care. Dermi kept the case open for check-ins.",
            photoIds: [],
            pain: cur.pains.at(-1)?.value ?? null,
          }),
        );
      }
      if (reminderEvent) events.unshift(reminderEvent);
      const symptoms = [...new Set([...(patch.symptoms ?? []), ...cur.symptoms])];
      return {
        ...cur,
        title: patch.title ?? cur.title,
        area: patch.area ?? cur.area,
        scenario: patch.scenario ?? cur.scenario,
        trigger: patch.trigger ?? cur.trigger,
        status,
        symptoms,
        events,
        context: meta?.context ?? cur.context,
        turns: [
          ...cur.turns,
          {
            id: newId(),
            role: "dermi",
            text,
            at,
            mood: meta?.mood,
            widget: meta?.widget ?? null,
            sources: meta?.sources ?? [],
          },
        ],
      };
    });
  }

  async function talk(event: UserEvent, signal?: AbortSignal) {
    const cur = freshCase(id);
    if (!cur) return;
    setError(null);
    const messages = cur.turns
      .filter((t) => t.text)
      .map((t) => ({ role: t.role === "user" ? ("user" as const) : ("assistant" as const), content: t.text }));
    const body: ConsultBody = {
      request: {
        messages: messages.length ? (messages as ConsultBody["request"]["messages"]) : [{ role: "system", content: "Start the consultation." }],
        cnn_result: cur.cnn,
        case_id: cur.id,
      },
      demo: {
        context: cur.context,
        event,
        profile: {
          name: profile?.name ?? "",
          allergies: profile?.allergies ?? [],
          skinType: profile?.skinType ?? "",
        },
        transcript: transcriptOf(cur),
      },
    };
    setStreaming({ status: null, text: "", mood: "thinking" });
    let meta: DemoMetaEvent | null = null;
    let final: string | null = null;
    try {
      await consult(
        body,
        (e) => {
          if (e.type === "status") setStreaming((s) => s && { ...s, status: e.message });
          else if (e.type === "delta") setStreaming((s) => s && { ...s, status: null, text: s.text + e.content });
          else if (e.type === "demo") {
            meta = e;
            setStreaming((s) => s && { ...s, mood: e.mood });
          } else if (e.type === "done") final = e.response.message.content;
          else if (e.type === "error") throw new Error(e.message);
        },
        signal,
      );
    } catch (err) {
      if (signal?.aborted) return;
      console.error(err);
      setError("Dermi couldn't reply just now. Please try again.");
    } finally {
      if (!signal?.aborted) setStreaming(null);
    }
    if (final !== null && !signal?.aborted) applyTurn(final, meta);
  }

  const onStart = useEffectEvent((signal: AbortSignal) => {
    if ((freshCase(id)?.turns.length ?? 0) === 0) void talk({ kind: "start" }, signal);
  });

  useEffect(() => {
    const ac = new AbortController();
    abortRef.current = ac;
    // Kick off the greeting stream asynchronously (it updates state as events arrive).
    void Promise.resolve().then(() => {
      if (!ac.signal.aborted) onStart(ac.signal);
    });
    return () => ac.abort();
  }, [id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [c.turns.length, streaming?.text.length, analyzing?.steps.length]);

  function addUserTurn(turn: Omit<Turn, "id" | "at" | "role">, eventDetail: string, photoIds: string[] = []) {
    demo.updateCase(id, (cur) => ({
      ...cur,
      started: true,
      turns: [...cur.turns, { id: newId(), role: "user", at: now(), ...turn }],
      events: cur.started
        ? photoIds.length
          ? [
              makeEvent({ kind: "Consultation", title: "Photo added", detail: eventDetail, photoIds, pain: null }),
              ...cur.events,
            ]
          : cur.events
        : [
            makeEvent({ kind: "Consultation", title: "Consultation started", detail: eventDetail, photoIds, pain: null }),
            ...cur.events,
          ],
    }));
  }

  const send = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;
    setDraft("");
    addUserTurn({ text }, text);
    void talk({ kind: "message", text }, abortRef.current?.signal);
  };

  async function addPhoto(img: { dataUrl: string; brightness: number }) {
    setCameraOpen(false);
    const cur = freshCase(id);
    if (!cur) return;
    const photoId = newId();
    const label = cur.photos.length === 0 ? cur.area || "First photo" : `Close-up ${cur.photos.length}`;
    demo.updateCase(id, (x) => ({
      ...x,
      photos: [...x.photos, { id: photoId, dataUrl: img.dataUrl, label, at: now() }],
    }));
    addUserTurn({ text: "", photoId }, label, [photoId]);

    setAnalyzing({ photoId, steps: [] });
    let output: CNNOutput | null = null;
    try {
      await classify(
        {
          request: {
            image_url: `https://storage.demo.invalid/skin-images/${id}/${photoId}.jpg`,
            request_id: photoId,
          },
          demo: { brightness: img.brightness, hint: transcriptOf(cur), override: trace.override },
        },
        (e) => {
          if (e.type === "status") setAnalyzing((a) => a && { ...a, steps: [...a.steps, e.message] });
          else if (e.type === "result") output = e.output;
        },
        abortRef.current?.signal,
      );
    } catch (err) {
      console.error(err);
    }
    setAnalyzing(null);
    const result = output as CNNOutput | null;
    if (!result) {
      setError("I couldn't analyse that photo. Please try again.");
      return;
    }
    const usable = result.image_quality === "good" || result.image_quality === "acceptable";
    demo.updateCase(id, (x) => ({
      ...x,
      cnn: usable || !x.cnn ? result : x.cnn,
      turns: x.turns.map((t) =>
        t.photoId === photoId
          ? { ...t, analysis: { quality: result.image_quality, top: result.top_k[0].condition } }
          : t,
      ),
    }));
    await talk({ kind: "photo", quality: result.image_quality }, abortRef.current?.signal);
  }

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      await addPhoto(await processFile(file));
    } catch {
      setError("That file couldn't be read as an image.");
    }
  };

  const pickPain = (turn: Turn, n: number) => {
    const firstAnswer = !turn.answer;
    demo.updateCase(id, (x) => ({
      ...x,
      turns: x.turns.map((t) => (t.id === turn.id ? { ...t, answer: String(n) } : t)),
      pains: firstAnswer ? [...x.pains, { at: now(), value: n }] : [...x.pains.slice(0, -1), { at: now(), value: n }],
      context: { ...x.context, pain: n },
    }));
    if (firstAnswer) void talk({ kind: "pain", value: n }, abortRef.current?.signal);
  };

  const answerSatisfied = (turn: Turn, value: "yes" | "no") => {
    demo.updateCase(id, (x) => ({
      ...x,
      turns: x.turns.map((t) => (t.id === turn.id ? { ...t, answer: value } : t)),
    }));
    addUserTurn({ text: value === "yes" ? "Yes, I'm satisfied." : "Not yet." }, "");
    void talk({ kind: "satisfied", value }, abortRef.current?.signal);
  };

  const openUpload = () => {
    setCameraOpen(false);
    fileInput.current?.click();
  };

  /* ----- rendering ----- */

  const renderTurn = (t: Turn) => {
    const isLast = t.id === lastTurn?.id;
    if (t.role === "user") {
      const photo = t.photoId ? c.photos.find((p) => p.id === t.photoId) : undefined;
      const isAnalyzing = analyzing?.photoId === t.photoId && t.photoId;
      return (
        <UserTurn key={t.id} initials={initials} meta={`You · ${clockLabel(t.at)}`}>
          {t.text && <UserText>{t.text}</UserText>}
          {t.photoId && (
            <button
              type="button"
              onClick={() => setEnlarged(t.photoId!)}
              aria-label={`Enlarge ${photo?.label ?? "photo"}`}
              className="relative block w-[240px] max-w-full cursor-zoom-in overflow-hidden rounded-[6px] p-0"
            >
              {photo?.dataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- data URL from browser storage
                <img src={photo.dataUrl} alt="" className="block aspect-[24/17] w-full object-cover" />
              ) : (
                <Hatch className="aspect-[24/17] w-full" />
              )}
              {isAnalyzing && (
                <span className="absolute inset-x-0 h-0.5 animate-scan bg-venice shadow-[0_0_8px_var(--color-venice)]" />
              )}
              <span className="caps absolute bottom-2.5 left-2.5 rounded-[3px] bg-paper px-[7px] py-[3px] text-[10px]">
                Photo · {photo?.label}
                {t.analysis && ` · ${t.analysis.quality}`}
              </span>
            </button>
          )}
        </UserTurn>
      );
    }

    if (t.widget === "redflag") {
      return (
        <li key={t.id} className="flex items-start gap-2 sm:gap-3">
          <Dermi size={38} mood="concerned" className="size-8 sm:size-[38px]" />
          <div
            role="alert"
            className="flex max-w-[640px] flex-col gap-3.5 rounded-[4px_14px_14px_14px] border border-alert-border bg-alert-tint p-[22px] text-alert-ink"
          >
            <span className="caps text-xs font-semibold tracking-[0.12em] text-alert-text">
              Please read · this needs a doctor
            </span>
            <RichText text={t.text} />
            <div className="flex flex-wrap gap-2.5">
              <a
                href="https://www.google.com/maps/search/dermatologist+near+me"
                target="_blank"
                rel="noreferrer"
                className={buttonClass("alert")}
              >
                Find a dermatologist nearby <Arrow />
              </a>
              <Link href={`/cases/${id}#report`} className={buttonClass("alert-outline")}>
                Case report for your doctor <Arrow>↓</Arrow>
              </Link>
            </div>
            <Sources sources={t.sources ?? []} />
            <span className="text-[13px] text-alert-deep">
              I&apos;m still here if you have questions while you arrange this.
            </span>
          </div>
        </li>
      );
    }

    const satisfaction = t.widget === "satisfaction";
    return (
      <div key={t.id} className="contents">
        <DermiTurn
          mood={t.mood ?? "happy"}
          wide={t.widget === "pain" || satisfaction || (t.sources?.length ?? 0) > 0}
          meta={`Dermi · ${clockLabel(t.at)}${t.widget === "pain" ? " · tap a face, you can change it later" : ""}`}
        >
          <div className="flex flex-col gap-3">
            <RichText text={t.text} hide={satisfaction ? SATISFIED_Q : undefined} />
            {t.widget === "pain" && (
              <PainScale
                value={t.answer ? Number(t.answer) : null}
                onChange={(n) => pickPain(t, n)}
                disabled={busy}
              />
            )}
            {t.widget === "photo" && isLast && (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => setCameraOpen(true)} disabled={busy}>
                  Take a photo
                </Button>
                <Button size="sm" variant="secondary" onClick={openUpload} disabled={busy}>
                  Upload
                </Button>
              </div>
            )}
            <Sources sources={t.sources ?? []} />
          </div>
        </DermiTurn>
        {satisfaction && (
          <DermiTurn wide className="bg-rock p-5">
            <div className="flex flex-col gap-3.5 text-ink">
              <span className="display text-[28px] leading-[1.15] tracking-[-0.01em]">
                Are you satisfied with your care?
              </span>
              {!t.answer && isLast ? (
                <>
                  <div className="flex flex-wrap gap-2.5">
                    <Button onClick={() => answerSatisfied(t, "yes")} disabled={busy}>
                      Yes, I&apos;m satisfied
                    </Button>
                    <Button variant="on-rock" onClick={() => answerSatisfied(t, "no")} disabled={busy}>
                      Not yet
                    </Button>
                  </div>
                  <span className="text-sm">I&apos;ll keep this consultation open until you decide.</span>
                </>
              ) : (
                <span className="text-sm">
                  {t.answer === "yes" ? "You said yes." : t.answer === "no" ? "You said not yet." : "You can tell me any time."}
                </span>
              )}
            </div>
          </DermiTurn>
        )}
      </div>
    );
  };

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-venice pb-[18px]">
        <div className="flex flex-col gap-2">
          <Breadcrumb
            items={[{ label: "Cases", href: "/cases" }, { label: `Consultation · ${whenLabel(c.createdAt)}` }]}
          />
          <div className="flex flex-wrap items-center gap-3.5">
            <h1 className="display m-0 text-[28px] leading-[1.05] tracking-[-0.03em] text-venice sm:text-[40px]">
              {c.title}
            </h1>
            <StatusChip status={analyzing ? "open" : c.status} label={analyzing ? "Updating" : undefined} />
          </div>
        </div>
        {c.started && (
          <Link href={`/cases/${id}#report`} className={buttonClass("secondary", "sm")}>
            Case &amp; report <Arrow />
          </Link>
        )}
      </header>

      <div className="lg:hidden">
        <button
          type="button"
          aria-expanded={summaryOpen}
          aria-controls="m-summary"
          onClick={() => setSummaryOpen((o) => !o)}
          className="flex w-full cursor-pointer items-center gap-2.5 rounded-btn bg-rock px-3.5 py-3 text-left text-ink"
        >
          <span className="flex flex-1 flex-col gap-0.5">
            <span className="caps text-[10px] tracking-[0.12em]">Live summary</span>
            <span className="text-sm font-normal">
              {c.status === "see-dermatologist"
                ? "Needs a doctor's review"
                : c.cnn
                  ? `${c.cnn.top_k[0].condition} · ${Math.round(c.cnn.top_k[0].confidence * 100)}%`
                  : "Waiting for a photo"}
            </span>
          </span>
          <span className="display text-2xl tracking-normal">
            {c.pains.at(-1)?.value ?? "–"}
            <span className="text-[13px]">/10</span>
          </span>
          <span aria-hidden="true" className="caps w-4 text-center text-lg">
            {summaryOpen ? "–" : "+"}
          </span>
        </button>
        {summaryOpen && (
          <div id="m-summary" className="mt-2 rounded-card border border-line bg-paper p-4">
            <LiveSummary c={c} updating={analyzing !== null} />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <section
          aria-label="Conversation with Dermi"
          className="flex min-w-0 flex-[999_1_520px] flex-col rounded-card border border-line bg-paper"
        >
          <ol className="m-0 flex list-none flex-col gap-5 px-[clamp(12px,2.5vw,32px)] py-7">
            {c.turns.map(renderTurn)}

            {analyzing && (
              <li className="flex items-start gap-2 sm:gap-3" aria-live="polite">
                <Dermi size={38} mood="thinking" className="size-8 sm:size-[38px]" />
                <div className="flex max-w-[620px] flex-1 flex-col gap-2.5 rounded-[4px_14px_14px_14px] bg-merino p-[18px]">
                  <span className="display text-2xl tracking-normal text-venice">Looking closely at your photo…</span>
                  <ol className="m-0 flex list-none flex-col border-b border-line p-0 text-sm">
                    {ANALYSIS_STEPS.map((step, i) => {
                      const reached = analyzing.steps.length > i;
                      const current = analyzing.steps.length === i + 1;
                      return (
                        <li key={step} className="grid grid-cols-[28px_1fr_auto] border-t border-line py-[7px]">
                          <span className="caps text-[11px] text-venice">0{i + 1}</span>
                          <span className={reached ? "" : "text-muted"}>{step}</span>
                          <span className={cx("caps text-[11px] text-venice", current && "animate-breathe")}>
                            {current ? "Now" : reached ? "Done" : ""}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                  <span className="text-[13px] text-muted">Usually takes a few seconds.</span>
                </div>
              </li>
            )}

            {streaming && (
              <DermiTurn mood={streaming.mood} wide live>
                {streaming.text ? (
                  <RichText text={streaming.text} hide={SATISFIED_Q} />
                ) : (
                  <span className="caps animate-breathe text-[11px] text-venice">
                    {streaming.status ?? "Dermi is thinking"}…
                  </span>
                )}
              </DermiTurn>
            )}

            {error && (
              <li role="alert" className="rounded-btn border border-alert-border bg-alert-tint px-4 py-3 text-sm text-alert-text">
                {error}
              </li>
            )}
            <div ref={endRef} />
          </ol>

          <form
            onSubmit={send}
            className="mt-auto flex items-center gap-2.5 border-t border-line px-[clamp(12px,2.5vw,24px)] pt-4 pb-[18px]"
          >
            <Button
              variant="secondary"
              className="min-h-[46px] shrink-0 px-3.5 text-xs"
              onClick={() => setCameraOpen(true)}
              disabled={busy}
              aria-label="Add a photo"
            >
              <span aria-hidden="true">+</span>
              <span className="hidden sm:inline">Photo</span>
            </Button>
            <label htmlFor="composer" className="sr-only">
              Message Dermi
            </label>
            <input
              id="composer"
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={busy ? "Dermi is replying…" : "Tell Dermi more…"}
              autoComplete="off"
              className="min-h-[46px] min-w-0 flex-1 border-0 border-b-[1.5px] border-venice bg-transparent px-1 text-base font-light text-ink outline-none placeholder:text-muted/70"
            />
            <Button type="submit" className="min-h-[46px] shrink-0 px-[18px] text-xs" disabled={busy || !draft.trim()}>
              Send <Arrow />
            </Button>
          </form>
        </section>

        <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-4">
          <section aria-label="You" className="flex flex-col gap-4 rounded-card border border-line bg-paper p-5">
            <div className="flex items-center gap-3.5">
              <Avatar initials={initials} size={58} />
              <div className="flex flex-col gap-[3px]">
                <span className="display text-2xl tracking-normal text-venice">
                  {profile?.name ?? firstNameOf(undefined)}
                </span>
                <span className="text-[13px] text-muted">
                  {[profile?.skinType, ...(profile?.allergies.map((a) => `${a} allergy`) ?? [])]
                    .filter(Boolean)
                    .join(" · ") || "No profile yet"}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => setCameraOpen(true)} disabled={busy}>
                Capture photo
              </Button>
              <Button variant="secondary" onClick={openUpload} disabled={busy}>
                Upload
              </Button>
            </div>
          </section>

          <section aria-labelledby="gal-h" className="flex flex-col gap-3.5 rounded-card border border-line bg-paper p-5">
            <div className="flex items-baseline justify-between">
              <h2 id="gal-h" className="caps m-0 text-[13px] tracking-[0.12em] text-venice">
                Uploaded images
              </h2>
              <span className="text-[13px] text-muted">
                {c.photos.length} {c.photos.length === 1 ? "photo" : "photos"}
              </span>
            </div>
            {c.photos.length === 0 ? (
              <p className="m-0 text-[13px] text-muted">Photos you add appear here.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {c.photos.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    aria-label={`Enlarge ${p.label}`}
                    onClick={() => setEnlarged(p.id)}
                    className="flex cursor-zoom-in flex-col gap-1.5 bg-transparent p-0 text-left text-ink"
                  >
                    <span className="relative block aspect-[4/3] w-full overflow-hidden rounded-[5px]">
                      {p.dataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- data URL from browser storage
                        <img src={p.dataUrl} alt="" className="size-full object-cover" />
                      ) : (
                        <Hatch className="size-full" />
                      )}
                      {analyzing?.photoId === p.id && (
                        <span className="caps absolute top-1.5 left-1.5 rounded-[3px] bg-venice px-1.5 py-[3px] text-[9px] text-merino">
                          Analyzing
                        </span>
                      )}
                    </span>
                    <span className="flex justify-between gap-1.5 text-xs">
                      <span className="font-normal">{p.label}</span>
                      <span className="text-muted">{clockLabel(p.at)}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section
            aria-labelledby="sum-h"
            className={cx(
              "hidden flex-col gap-4 rounded-card bg-paper p-5 lg:flex",
              c.status === "see-dermatologist" ? "border-[1.5px] border-alert-border" : "border border-line",
            )}
          >
            <div className="flex items-center justify-between gap-2 border-b border-venice pb-3">
              <h2 id="sum-h" className="display m-0 text-[26px] tracking-normal text-venice">
                Live case summary
              </h2>
              <span className="caps animate-breathe-slow text-[10px] text-venice">
                {busy ? "Updating…" : "Live"}
              </span>
            </div>
            <LiveSummary c={c} updating={analyzing !== null} />
          </section>
        </aside>
      </div>

      <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={onFile} />

      <CameraDialog
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(img) => void addPhoto(img)}
        onUpload={openUpload}
      />

      <Modal
        open={lightbox !== undefined}
        onClose={() => setEnlarged(null)}
        label={lightbox?.label}
        className="w-[min(820px,calc(100%-32px))]"
      >
        {lightbox && (
          <section className="flex flex-col gap-3.5 p-5">
            <div className="flex items-center justify-between">
              <span className="flex flex-col gap-0.5">
                <span className="display text-[26px] tracking-normal text-venice">{lightbox.label}</span>
                <span className="caps text-[11px] text-muted">{whenLabel(lightbox.at)}</span>
              </span>
              <CloseButton onClick={() => setEnlarged(null)} />
            </div>
            {lightbox.dataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- data URL from browser storage
              <img src={lightbox.dataUrl} alt={lightbox.label} className="w-full rounded-[6px]" />
            ) : (
              <Hatch angle={-45} step={9} className="aspect-[4/3] w-full rounded-[6px]" />
            )}
          </section>
        )}
      </Modal>
    </>
  );
}
