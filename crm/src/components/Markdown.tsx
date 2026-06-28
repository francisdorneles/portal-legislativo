'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/** Renderiza markdown (saída da IA) com tipografia consistente — sem mostrar `**`/`#` crus. */
export function Markdown({ children, className = '' }: { children: string; className?: string }) {
  return (
    <div className={`text-sm leading-relaxed text-foreground ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="mb-2 mt-3 text-base font-semibold first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-2 mt-3 text-sm font-semibold first:mt-0">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-1 mt-3 text-sm font-semibold first:mt-0">{children}</h3>,
          p: ({ children }) => <p className="mb-2.5 text-pretty last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="mb-2.5 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2.5 list-decimal space-y-1.5 pl-5 last:mb-0">{children}</ol>,
          li: ({ children }) => <li className="text-pretty">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          a: ({ children, href }) => (
            <a href={href} className="text-blue-700 underline underline-offset-2" target="_blank" rel="noopener noreferrer">{children}</a>
          ),
          code: ({ children }) => <code className="rounded bg-muted px-1 py-0.5 text-[0.85em]">{children}</code>,
          blockquote: ({ children }) => <blockquote className="border-l-2 border-border pl-3 text-muted-foreground">{children}</blockquote>,
          hr: () => <hr className="my-3 border-border" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
