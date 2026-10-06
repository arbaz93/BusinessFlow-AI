import { Fragment } from "react";
import { parseAssistantMarkdown } from "@/lib/assistant/markdown";

function renderInline(text: string, keyPrefix: string) {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={key} className="rounded bg-[var(--panel)] px-1 py-0.5 font-mono text-[0.9em] text-[var(--accent-muted)]">{part.slice(1, -1)}</code>;
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={key} className="font-semibold text-[var(--foreground)]">{part.slice(2, -2)}</strong>;
    }
    return <Fragment key={key}>{part}</Fragment>;
  });
}

export function AssistantMessageContent({ content }: { content: string }) {
  return (
    <div className="space-y-3 break-words text-sm leading-7 text-[var(--muted)] [overflow-wrap:anywhere]">
      {parseAssistantMarkdown(content).map((block, index) => {
        if (block.type === "heading") {
          const className = block.level === 1
            ? "text-lg font-semibold text-[var(--foreground)]"
            : block.level === 2
              ? "text-base font-semibold text-[var(--foreground)]"
              : "text-sm font-semibold text-[var(--foreground)]";
          return <p key={index} className={className}>{renderInline(block.text, `heading-${index}`)}</p>;
        }
        if (block.type === "unordered-list" || block.type === "ordered-list") {
          const List = block.type === "unordered-list" ? "ul" : "ol";
          return (
            <List key={index} className={`space-y-1 pl-6 ${block.type === "unordered-list" ? "list-disc" : "list-decimal"}`}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="pl-1">{renderInline(item, `list-${index}-${itemIndex}`)}</li>
              ))}
            </List>
          );
        }
        if (block.type === "code") {
          return <pre key={index} className="max-w-full overflow-x-auto rounded-md border border-[var(--line)] bg-[var(--surface)] p-3 font-mono text-xs leading-5 text-[var(--foreground)]"><code>{block.text}</code></pre>;
        }
        return (
          <p key={index} className="whitespace-pre-wrap">
            {block.lines.map((line, lineIndex) => (
              <Fragment key={lineIndex}>
                {lineIndex > 0 && <br />}
                {renderInline(line, `paragraph-${index}-${lineIndex}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

