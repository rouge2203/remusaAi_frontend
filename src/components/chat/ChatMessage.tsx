import { motion } from "framer-motion";
import { HiOutlineUser, HiArrowTopRightOnSquare } from "react-icons/hi2";
import { RiRobot2Line } from "react-icons/ri";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useNavigate } from "react-router-dom";
import type { ChatMessage as ChatMessageType } from "../../types";
import type { Components } from "react-markdown";
import PartDetailCard, { parsePartDetail } from "./PartDetailCard";
import DocList from "./DocList";
import DocDetailCard, { parseDocDetail } from "./DocDetailCard";
import ChartBlock, { type ChartSpec } from "./ChartBlock";

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

function RemusaPartsList({
  source,
  onPartClick,
}: {
  source: string;
  onPartClick?: (code: string) => void;
}) {
  const lines = source.split(/\r?\n/);
  const parsed = lines.map(parsePartsLine).filter((p): p is NonNullable<typeof p> => p !== null);

  if (parsed.length === 0) {
    return (
      <pre className="my-2 overflow-x-auto rounded-md bg-neutral-100 p-2 text-[12px] text-neutral-800">
        <code>{source}</code>
      </pre>
    );
  }

  if (!onPartClick) {
    return (
      <pre className="my-2 overflow-x-auto rounded-md bg-neutral-100 p-2 text-[12px] text-neutral-800">
        <code>{source}</code>
      </pre>
    );
  }

  return (
    <div className="my-2 flex flex-col gap-2">
      {parsed.map(({ code, description }, i) => (
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

export default function ChatMessage({ message, index, onPartClick, onAskCompatible, onDocClick, isSuperUser }: ChatMessageProps) {
  const isUser = message.role === "user";
  const navigate = useNavigate();

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: index * 0.04 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          isUser ? "bg-[#75141C]/12 text-[#75141C]" : "bg-neutral-100 text-neutral-700"
        }`}
      >
        {isUser ? <HiOutlineUser className="text-base" /> : <RiRobot2Line className="text-base" />}
      </div>

      <div
        className={`max-w-[85%] rounded-2xl border px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
          isUser
            ? "border-[#75141C]/25 bg-white text-neutral-900 rounded-tr-md"
            : "border-neutral-200/90 bg-white text-neutral-800 rounded-tl-md"
        }`}
      >
        {message.role === "assistant" ? (
          <div className="font-mono text-[13px] leading-relaxed text-neutral-700">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
              {message.content}
            </ReactMarkdown>
          </div>
        ) : (
          <span className="whitespace-pre-wrap">{message.content}</span>
        )}
      </div>
    </motion.div>
  );
}
