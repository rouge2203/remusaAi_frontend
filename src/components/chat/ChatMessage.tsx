import { motion } from "framer-motion";
import { HiArrowTopRightOnSquare } from "react-icons/hi2";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useNavigate } from "react-router-dom";
import type { ChatMessage as ChatMessageType, AssistantPart } from "../../types";
import type { Components } from "react-markdown";
import PartDetailCard, { parsePartDetail } from "./PartDetailCard";
import DocList from "./DocList";
import DocDetailCard, { parseDocDetail } from "./DocDetailCard";
import ChartBlock, { type ChartSpec } from "./ChartBlock";
import VehicleCard, { parseVehicle } from "./VehicleCard";

interface AdminUserLinkData {
  username: string;
  label: string;
}

interface ChatMessageProps {
  message: ChatMessageType;
  index: number;
  onPartClick?: (code: string) => void;
  onAskCompatible?: (code: string) => void;
  onDocClick?: (id: string, tipo: string) => void;
  isSuperUser?: boolean;
}

/** Parse a remusa-parts line: "- CODE — description" (leading list dash optional). */
function parsePartsLine(line: string): { code: string; description: string } | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  let rest = trimmed;
  if (rest.startsWith("- ")) rest = rest.slice(2);
  else if (rest.startsWith("-")) rest = rest.slice(1).trimStart();

  let codePart: string;
  let descPart: string;
  const emIdx = rest.search(/[—–]/); // em dash or en dash
  if (emIdx >= 0) {
    codePart = rest.slice(0, emIdx).trim();
    descPart = rest.slice(emIdx + 1).trim();
  } else {
    const gap = rest.lastIndexOf(" - ");
    if (gap >= 0) {
      codePart = rest.slice(0, gap).trim();
      descPart = rest.slice(gap + 3).trim();
    } else {
      return null;
    }
  }
  if (!codePart) return null;
  return { code: codePart, description: descPart || "" };
}

function PartsButtons({
  items,
  onPartClick,
}: {
  items: { code: string; description: string }[];
  onPartClick?: (code: string) => void;
}) {
  if (items.length === 0 || !onPartClick) {
    return null;
  }
  return (
    <div className="my-2 flex flex-col gap-2">
      {items.map(({ code, description }, i) => (
        <button
          key={`${code}-${i}`}
          type="button"
          onClick={() => onPartClick(code)}
          className="group flex w-full min-w-0 items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-left text-[13px] transition hover:border-[#75141C]/40 hover:bg-[#75141C]/5 active:scale-[0.99]"
        >
          <span className="shrink-0 font-mono font-semibold text-[#75141C]">{code}</span>
          <span className="min-w-0 flex-1 truncate text-neutral-700">{description}</span>
        </button>
      ))}
    </div>
  );
}

function RemusaPartsList({
  source,
  onPartClick,
}: {
  source: string;
  onPartClick?: (code: string) => void;
}) {
  const lines = source.split(/\r?\n/);
  const parsed = lines.map(parsePartsLine).filter((p): p is NonNullable<typeof p> => p !== null);

  if (parsed.length === 0 || !onPartClick) {
    return (
      <pre className="my-2 overflow-x-auto rounded-md bg-neutral-100 p-2 text-[12px] text-neutral-800">
        <code>{source}</code>
      </pre>
    );
  }
  return <PartsButtons items={parsed} onPartClick={onPartClick} />;
}

/**
 * Render a streamed remusa-parts block from the side-channel SSE event.
 * Data shape matches the `find_inventory_for_vehicle` tool result:
 * `{matches: [{oe_number, articulo?, desc?, ...}], matched, total_oe, ...}`.
 */
function RemusaPartsFromData({
  data,
  onPartClick,
}: {
  data: unknown;
  onPartClick?: (code: string) => void;
}) {
  if (!data || typeof data !== "object") return null;
  const matches = (data as { matches?: unknown[] }).matches;
  if (!Array.isArray(matches) || matches.length === 0) return null;
  const items = matches
    .map((m) => {
      if (!m || typeof m !== "object") return null;
      const obj = m as Record<string, unknown>;
      // Backend shapes the payload as `{code, description, ...}`; fall back to
      // raw Softland field names for safety.
      const code =
        (obj.code as string | undefined) ??
        (obj.articulo as string | undefined) ??
        (obj.oe_number as string | undefined);
      const desc =
        (obj.description as string | undefined) ??
        (obj.desc as string | undefined) ??
        (obj.descripcion as string | undefined) ??
        "";
      if (!code || typeof code !== "string") return null;
      return { code, description: typeof desc === "string" ? desc : "" };
    })
    .filter((p): p is { code: string; description: string } => p !== null);
  return <PartsButtons items={items} onPartClick={onPartClick} />;
}

/** Render a non-text streamed assistant part using the existing styled components. */
function renderBlockPart(
  part: Extract<AssistantPart, { kind: Exclude<AssistantPart["kind"], "text"> }>,
  opts: {
    onPartClick?: (code: string) => void;
    onAskCompatible?: (code: string) => void;
    onDocClick?: (id: string, tipo: string) => void;
  },
) {
  switch (part.kind) {
    case "remusa-parts":
      return <RemusaPartsFromData data={part.data} onPartClick={opts.onPartClick} />;
    case "remusa-part-detail": {
      const detail = parsePartDetail(part.data);
      if (!detail) return null;
      return <PartDetailCard data={detail} onAskCompatibleVehicles={opts.onAskCompatible} />;
    }
    case "remusa-doc-list": {
      // The doc-list parser expects the legacy line-format string; if a future
      // tool ships structured data here, swap to a data-aware component.
      if (typeof part.data === "string") {
        return <DocList source={part.data} onDocClick={opts.onDocClick} />;
      }
      return null;
    }
    case "remusa-doc-detail": {
      const docDetail = parseDocDetail(part.data);
      if (!docDetail) return null;
      return <DocDetailCard data={docDetail} onPartClick={opts.onPartClick} />;
    }
    case "remusa-chart": {
      return <ChartBlock spec={part.data as ChartSpec} />;
    }
    case "remusa-vehicle": {
      const vehicle = parseVehicle(part.data);
      if (!vehicle) return null;
      return <VehicleCard data={vehicle} />;
    }
    default:
      return null;
  }
}

export default function ChatMessage({ message, index, onPartClick, onAskCompatible, onDocClick, isSuperUser }: ChatMessageProps) {
  const isUser = message.role === "user";
  const navigate = useNavigate();

  // When the assistant message was streamed (parts[] present), the styled
  // cards for remusa-parts / remusa-part-detail were already rendered as
  // side-channel block parts. Hide any matching fence in the prose so we
  // never show raw JSON if the model accidentally emits one.
  const hideRemusaCardFences = Array.isArray(message.parts);

  const components: Partial<Components> = {
    p: ({ children }) => (
      <p className="my-1.5 first:mt-0 last:mb-0 whitespace-pre-wrap">
        <span className="text-neutral-400">{"> "}</span>
        {children}
      </p>
    ),
    strong: ({ children }) => <strong className="font-bold text-neutral-900">{children}</strong>,
    em: ({ children }) => <em className="italic text-neutral-700">{children}</em>,
    ul: ({ children }) => <ul className="my-2 ml-1 space-y-1">{children}</ul>,
    ol: ({ children }) => <ol className="my-2 ml-4 list-decimal space-y-1">{children}</ol>,
    li: ({ children }) => (
      <li className="flex gap-1.5">
        <span className="select-none text-neutral-400">{"- "}</span>
        <span className="flex-1">{children}</span>
      </li>
    ),
    code: ({ children, className }) => {
      const isRemusaParts = className === "language-remusa-parts";
      const isRemusaDetail = className === "language-remusa-part-detail";
      const isDocList = className === "language-remusa-doc-list";
      const isDocDetail = className === "language-remusa-doc-detail";
      const isChart = className === "language-remusa-chart";
      const isAdminUserLink = className === "language-admin-user-link";

      if (isChart) {
        const raw = Array.isArray(children)
          ? children.map((c) => (typeof c === "string" ? c : String(c))).join("")
          : String(children ?? "").replace(/\n$/, "");
        try {
          const spec = JSON.parse(raw.trim()) as ChartSpec;
          return <ChartBlock spec={spec} />;
        } catch {
          /* fall through to <pre> */
        }
        return (
          <pre className="my-2 overflow-x-auto rounded-md bg-neutral-100 p-2 text-[12px] text-neutral-800">
            <code>{raw}</code>
          </pre>
        );
      }

      if (isAdminUserLink && isSuperUser) {
        const raw = Array.isArray(children)
          ? children.map((c) => (typeof c === "string" ? c : String(c))).join("")
          : String(children ?? "").replace(/\n$/, "");
        try {
          const parsed = JSON.parse(raw.trim()) as AdminUserLinkData;
          return (
            <button
              type="button"
              onClick={() => navigate(`/admin/chats?username=${encodeURIComponent(parsed.username)}`)}
              className="my-1 flex items-center gap-2 rounded-xl border border-[#4A9ED1]/30 bg-[#4A9ED1]/8 px-3 py-2 text-[12px] font-medium text-[#2a7eb1] transition hover:bg-[#4A9ED1]/15 active:scale-[0.99]"
            >
              <HiArrowTopRightOnSquare className="shrink-0 text-sm" />
              {parsed.label || `Ver historial de ${parsed.username}`}
            </button>
          );
        } catch {
          /* fall through */
        }
      }

      if (isDocList) {
        const rawChildren = Array.isArray(children)
          ? children.map((c) => (typeof c === "string" ? c : String(c))).join("")
          : String(children ?? "").replace(/\n$/, "");
        return <DocList source={rawChildren} onDocClick={onDocClick} />;
      }

      if (isDocDetail) {
        const rawDetail = Array.isArray(children)
          ? children.map((c) => (typeof c === "string" ? c : String(c))).join("")
          : String(children ?? "").replace(/\n$/, "");
        try {
          const parsedJson = JSON.parse(rawDetail.trim()) as unknown;
          const detailData = parseDocDetail(parsedJson);
          if (detailData) {
            return (
              <DocDetailCard
                data={detailData}
                onPartClick={onPartClick}
              />
            );
          }
        } catch {
          /* fall through to pre */
        }
        return (
          <pre className="my-2 overflow-x-auto rounded-md bg-neutral-100 p-2 text-[12px] text-neutral-800">
            <code>{rawDetail}</code>
          </pre>
        );
      }

      if (isRemusaDetail) {
        if (hideRemusaCardFences) return null;
        const rawDetail = Array.isArray(children)
          ? children.map((c) => (typeof c === "string" ? c : String(c))).join("")
          : String(children ?? "").replace(/\n$/, "");
        try {
          const parsedJson = JSON.parse(rawDetail.trim()) as unknown;
          const detailData = parsePartDetail(parsedJson);
          if (detailData) {
            return (
              <PartDetailCard
                data={detailData}
                onAskCompatibleVehicles={onAskCompatible}
              />
            );
          }
        } catch {
          /* fall through to pre */
        }
        return (
          <pre className="my-2 overflow-x-auto rounded-md bg-neutral-100 p-2 text-[12px] text-neutral-800">
            <code>{rawDetail}</code>
          </pre>
        );
      }
      if (isRemusaParts) {
        if (hideRemusaCardFences) return null;
        const rawChildren = Array.isArray(children)
          ? children.map((c) => (typeof c === "string" ? c : String(c))).join("")
          : String(children ?? "").replace(/\n$/, "");
        return <RemusaPartsList source={rawChildren} onPartClick={onPartClick} />;
      }
      const isBlock = className?.includes("language-");
      if (isBlock) {
        return (
          <pre className="my-2 overflow-x-auto rounded-md bg-neutral-100 p-2 text-[12px] text-neutral-800">
            <code>{children}</code>
          </pre>
        );
      }
      return (
        <code className="rounded bg-neutral-100 px-1 py-0.5 text-[12px] text-neutral-800">
          {children}
        </code>
      );
    },
    a: ({ children, href }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#75141C] underline underline-offset-2 hover:text-[#5c1018]"
      >
        {children}
      </a>
    ),
    h1: ({ children }) => <h1 className="my-2 text-base font-bold text-neutral-900">{children}</h1>,
    h2: ({ children }) => <h2 className="my-2 text-sm font-bold text-neutral-900">{children}</h2>,
    h3: ({ children }) => (
      <h3 className="my-1.5 text-sm font-semibold text-neutral-900">{children}</h3>
    ),
  };

  // Every assistant message — streamed cards, plain prose, or a "Pensando…"
  // placeholder — lives inside the SAME bubble shape. Streamed cards get
  // 90% width so PartDetailCard / VehicleCard / parts buttons have room.
  // The "Pensando…" placeholder (streaming + no parts yet) collapses to its
  // content width so it doesn't pre-allocate empty real estate.
  const hasParts = Array.isArray(message.parts);
  const isAssistant = message.role === "assistant";
  const hasRenderedParts = hasParts && (message.parts?.length ?? 0) > 0;
  const isThinkingPlaceholder =
    isAssistant && hasParts && !!message.streaming && !hasRenderedParts;
  const bubbleMaxWidth = isUser
    ? "max-w-[85%]"
    : isThinkingPlaceholder
      ? "max-w-fit"
      : isAssistant && hasParts
        ? "max-w-[90%] w-[90%]"
        : "max-w-[90%]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: index * 0.04 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`${bubbleMaxWidth} min-w-0 rounded-2xl border px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
          isUser
            ? "border-[#75141C]/25 bg-white text-neutral-900 rounded-tr-md"
            : "border-neutral-200/90 bg-white text-neutral-800 rounded-tl-md"
        }`}
      >
        {isAssistant ? (
          <div className="font-mono text-[13px] leading-relaxed text-neutral-700">
            {hasParts ? (
              <>
                {(message.parts ?? []).map((part, i) =>
                  part.kind === "text" ? (
                    <ReactMarkdown
                      key={`text-${i}`}
                      remarkPlugins={[remarkGfm]}
                      components={components}
                    >
                      {part.text}
                    </ReactMarkdown>
                  ) : (
                    <div key={`block-${i}`} className="my-2 w-full min-w-0">
                      {renderBlockPart(part, {
                        onPartClick,
                        onAskCompatible,
                        onDocClick,
                      })}
                    </div>
                  ),
                )}
                {message.streaming && (message.parts?.length ?? 0) === 0 ? (
                  <span className="text-neutral-400 italic">
                    Pensando…{" "}
                    <span
                      aria-hidden="true"
                      className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-neutral-400 align-baseline"
                    />
                  </span>
                ) : message.streaming ? (
                  <span
                    aria-hidden="true"
                    className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-neutral-500 align-baseline"
                  />
                ) : null}
              </>
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                {message.content}
              </ReactMarkdown>
            )}
          </div>
        ) : (
          <span className="whitespace-pre-wrap">{message.content}</span>
        )}
      </div>
    </motion.div>
  );
}
