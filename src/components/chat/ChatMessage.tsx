import { motion } from "framer-motion";
import { HiOutlineUser } from "react-icons/hi2";
import { RiRobot2Line } from "react-icons/ri";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage as ChatMessageType } from "../../types";

interface ChatMessageProps {
  message: ChatMessageType;
  index: number;
}

export default function ChatMessage({ message, index }: ChatMessageProps) {
  const isUser = message.role === "user";

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
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => (
                  <p className="my-1.5 first:mt-0 last:mb-0 whitespace-pre-wrap">
                    <span className="text-neutral-400">{"> "}</span>
                    {children}
                  </p>
                ),
                strong: ({ children }) => (
                  <strong className="font-bold text-neutral-900">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-neutral-700">{children}</em>
                ),
                ul: ({ children }) => (
                  <ul className="my-2 ml-1 space-y-1">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="my-2 ml-4 list-decimal space-y-1">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="flex gap-1.5">
                    <span className="select-none text-neutral-400">{"- "}</span>
                    <span className="flex-1">{children}</span>
                  </li>
                ),
                code: ({ children, className }) => {
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
                h1: ({ children }) => (
                  <h1 className="my-2 text-base font-bold text-neutral-900">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="my-2 text-sm font-bold text-neutral-900">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="my-1.5 text-sm font-semibold text-neutral-900">{children}</h3>
                ),
              }}
            >
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
