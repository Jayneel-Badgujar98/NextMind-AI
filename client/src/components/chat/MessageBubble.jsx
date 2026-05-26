import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Edit, RotateCcw, FileText, Download } from 'lucide-react';
import { useTheme } from "../../context/ThemeContext";
import { formatMessageTime } from '../../utils/helpers';

// Helper component for Code Block with Premium VS Code Theme & Font Stack
const CodeBlock = ({ language, value }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(value);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadCode = () => {
    const extensionMap = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      html: 'html',
      css: 'css',
      json: 'json',
      markdown: 'md',
      bash: 'sh',
      shell: 'sh',
      cpp: 'cpp',
      csharp: 'cs',
      java: 'java',
      rust: 'rs',
      go: 'go',
      sql: 'sql'
    };
    const ext = extensionMap[String(language).toLowerCase()] || 'txt';
    const blob = new Blob([value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code-snippet-${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative rounded-xl my-5 overflow-hidden border border-slate-200/60 dark:border-white/10 bg-[#1e1e1e] shadow-md group">
      {/* Premium Dark Header (Image 1 Style) */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#2d2d2d] text-[#A1A1AA] text-xs font-mono select-none">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          {language || 'text'}
        </span>
        <div className="flex items-center gap-1">
          {/* 1. Download snippet button */}
          <button
            type="button"
            onClick={handleDownloadCode}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer active:scale-95 outline-none"
            title="Download code snippet"
          >
            <Download size={14} />
          </button>
          
          {/* 2. Copy code button */}
          <button
            type="button"
            onClick={handleCopyCode}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer active:scale-95 outline-none"
            title="Copy code"
          >
            {isCopied ? <Check size={14} className="text-[#10A37F]" /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* Syntax Window with Premium Fonts and Custom Style Overrides */}
      <SyntaxHighlighter
        language={language || 'text'}
        style={vscDarkPlus}
        PreTag="div"
        customStyle={{
          margin: 0,
          padding: '18px 16px',
          background: '#1e1e1e', // Exact VS Code dark background
          overflowX: 'auto',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
        }}
        codeTagProps={{
          style: {
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            lineHeight: '1.6'
          }
        }}
        className="text-[13.5px] sm:text-[14px] tracking-normal font-normal"
        wrapLongLines={true}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
};

const MessageBubble = ({
  index,
  message,
  isAI,
  toolInvocations,
  timestamp,
  attachments,
  onEditMessage,
  onRegenerateResponse,
  isLastAI
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message);
  const { theme } = useTheme();

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (editText.trim() && editText !== message && onEditMessage) {
      onEditMessage(index, editText);
    }
    setIsEditing(false);
  };

  return (
    <div className={`flex w-full ${isAI ? 'justify-start' : 'justify-end'} group/bubble`}>
      <div className={`flex gap-2.5 sm:gap-4 ${isAI
        ? 'max-w-[98%] sm:max-w-[90%] md:max-w-[85%] flex-row'
        : 'max-w-[85%] sm:max-w-[75%] md:max-w-[70%] flex-row-reverse'
        }`}>

        {/* Avatar (Only for AI) */}
        {isAI && (
          <div className="hidden md:block flex-shrink-0 h-9 w-9 sm:h-12 sm:w-12 rounded-xl sm:rounded-full overflow-hidden border border-[#E4E4E7] dark:border-white/10 bg-[#FFFFFF] dark:bg-black/40 shadow-sm shrink-0">
            <img
              src={theme === "dark" ? "/LOGO_DARK.png" : "/LOGO_LIGHT.png"}
              alt="AI"
              className="h-full w-full object-contain p-1"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
            <span
              style={{ display: "none" }}
              className="h-full w-full items-center justify-center text-[#10A37F] font-bold text-xs sm:text-sm"
            >
              N
            </span>
          </div>
        )}

        {/* Message Content & Meta */}
        <div className={`flex flex-col gap-1.5 ${isAI ? 'w-full' : 'w-fit items-end'} overflow-hidden`}>

          {/* Previews / Attachments Container */}
          {attachments && attachments.length > 0 && (
            <div className={`flex flex-col gap-2 ${isAI ? 'items-start' : 'items-end'} mb-1`}>
              {attachments.map((att, idx) => (
                <div key={idx} className="max-w-[280px]">
                  {att.type && att.type.startsWith('image/') ? (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-zinc-900 p-1">
                      <a href={att.url || att.base64} target="_blank" rel="noopener noreferrer">
                        <img
                          src={att.url || att.base64}
                          alt={att.name || "Image attachment"}
                          className="max-w-full max-h-[160px] object-cover rounded-xl hover:scale-[1.03] transition-transform duration-350 cursor-pointer"
                        />
                      </a>
                    </div>
                  ) : (
                    <a
                      href={att.url || att.base64}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-white dark:bg-[#141414] hover:bg-slate-50 dark:hover:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm transition-all group/doc"
                    >
                      <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20 shrink-0">
                        <FileText size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover/doc:text-[#10A37F] group-hover/doc:underline transition-colors duration-200">
                          {att.name || "Attachment.pdf"}
                        </p>
                        <p className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500">
                          Open PDF Document
                        </p>
                      </div>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Text Bubble Card */}
          <div
            className={`overflow-hidden transition-all duration-200 ${isAI
                ? `
        w-full
        bg-transparent
        border-none
        shadow-none
        rounded-none
        px-0 py-0

        sm:px-5 sm:py-4
        sm:bg-white sm:dark:bg-[#141414]
        sm:border sm:border-slate-200/70 sm:dark:border-white/5
        sm:rounded-[24px]
        sm:rounded-tl-none
        sm:shadow-sm
      `
                : isEditing
                  ? 'bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 rounded-xl w-full max-w-[450px] px-4 py-3 sm:px-5 sm:py-4'
                  : 'bg-slate-900 dark:bg-[#202020] text-white rounded-[22px] rounded-tr-md border border-slate-900 dark:border-transparent px-4 py-3 sm:px-5 sm:py-4 shadow-sm max-w-[85%]'
              }`}
          >
            {toolInvocations && toolInvocations.length > 0 && (
              <div className="mb-3 flex flex-col gap-2">
                {toolInvocations.map(tool => (
                  <div key={tool.toolCallId} className="bg-[#F5F5F5] dark:bg-[#181818] border border-[#E4E4E7] dark:border-white/10 text-[#52525B] dark:text-[#A1A1AA] px-3 py-2 rounded-xl text-[13px] flex items-center gap-2 font-mono">
                    {tool.state === 'result' ? (
                      <span>✅ Used tool: {tool.toolName}</span>
                    ) : (
                      <span className="animate-pulse flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-t-[#10A37F] border-[#E4E4E7] dark:border-white/10 animate-spin"></span>
                        Consulting {tool.toolName}...
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Render Edit Mode or Normal Text */}
            {isEditing ? (
              <form onSubmit={handleEditSubmit} className="flex flex-col gap-3">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full h-24 p-2 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:border-[#10A37F] focus:ring-1 focus:ring-[#10A37F] text-[14px] resize-none"
                  required
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditText(message);
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!editText.trim() || editText === message}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-[#10A37F] hover:bg-[#0E8F6E] rounded-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Save & Submit
                  </button>
                </div>
              </form>
            ) : isAI && message ? (
              /* CRUCIAL FIX: Added Tailwind Prose resets to let SyntaxHighlighter style the code tokens independently */
              <div className="prose dark:prose-invert max-w-none text-slate-800 dark:text-[#E4E4E7] text-[15px] sm:text-[15.5px] leading-7 tracking-wide w-full break-words prose-p:mb-4 prose-p:last:mb-0 prose-headings:text-slate-900 dark:prose-headings:text-white prose-headings:font-bold prose-headings:tracking-tight prose-strong:font-bold prose-strong:text-slate-900 dark:prose-strong:text-white prose-pre:bg-transparent prose-pre:p-0 prose-code:before:content-none prose-code:after:content-none">
                <ReactMarkdown
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      if (!inline && match) {
                        return (
                          <CodeBlock
                            language={match[1]}
                            value={String(children).replace(/\n$/, '')}
                          />
                        );
                      } else if (!inline) {
                        return (
                          <CodeBlock
                            language="text"
                            value={String(children).replace(/\n$/, '')}
                          />
                        );
                      }

                      {/* Inline Code (e.g. `npm install`) */}
                      const { ref, ...safeProps } = props;
                      return (
                        <code className="bg-slate-100 dark:bg-white/[0.08] text-pink-600 dark:text-[#F472B6] px-1.5 py-0.5 rounded-md text-[13px] sm:text-[13.5px] font-mono font-medium border border-slate-200/60 dark:border-white/5 mx-0.5" {...safeProps}>
                          {children}
                        </code>
                      );
                    },
                    
                    /* Custom Paragraph Handler for spacing */
                    p: ({ children }) => <p className="mb-4 last:mb-0 leading-7 sm:leading-7.5">{children}</p>,
                    
                    /* Sleek Typography Headings */
                    h1: ({ children }) => <h1 className="text-2xl font-bold mt-7 mb-4 border-b border-slate-200 dark:border-white/10 pb-2">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl font-bold mt-6 mb-3">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-lg font-semibold mt-5 mb-2">{children}</h3>,
                    
                    /* Professional Clean Lists */
                    ul: ({ children }) => <ul className="list-disc ml-5 sm:ml-6 mb-4 space-y-1.5 marker:text-slate-400 dark:marker:text-zinc-500">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal ml-5 sm:ml-6 mb-4 space-y-1.5 marker:text-slate-400 dark:marker:text-zinc-500">{children}</ol>,
                    li: ({ children }) => <li className="pl-1 text-[15px] sm:text-[15.5px] leading-relaxed">{children}</li>,
                    
                    /* Highlighted Links with Smooth Underline */
                    a: ({ children, href }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#10A37F] hover:text-[#0E8F6E] font-medium underline underline-offset-4 decoration-1.5 decoration-[#10A37F]/30 hover:decoration-[#10A37F] transition-colors break-all">
                        {children}
                      </a>
                    ),
                    
                    /* Premium Blockquotes with Accent Borders */
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-[#10A37F] bg-slate-50 dark:bg-white/[0.03] px-4 py-2.5 my-4 rounded-r-xl italic text-slate-700 dark:text-zinc-300">
                        {children}
                      </blockquote>
                    ),

                    /* Pro-grade Fully Responsive Tables */
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-6 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                        <table className="w-full text-sm text-left border-collapse bg-transparent">
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children }) => <thead className="bg-slate-50 dark:bg-white/[0.04] text-slate-800 dark:text-zinc-200 font-semibold border-b border-slate-200 dark:border-white/10">{children}</thead>,
                    tbody: ({ children }) => <tbody className="divide-y divide-slate-200 dark:divide-white/5">{children}</tbody>,
                    tr: ({ children }) => <tr className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors">{children}</tr>,
                    th: ({ children }) => <th className="px-4 py-3 text-[13.5px] font-bold tracking-wider whitespace-nowrap">{children}</th>,
                    td: ({ children }) => <td className="px-4 py-3 text-[13.5px] sm:text-[14px] text-slate-600 dark:text-zinc-300 leading-relaxed">{children}</td>,
                  }}
                >
                  {message}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="whitespace-pre-wrap leading-relaxed text-[15px] sm:text-[15.5px] text-white">{message}</div>
            )}
          </div>

          {/* Footer Meta (Timestamp, Copy, Edit, Regenerate) */}
          {!isEditing && (
            <div className={`flex items-center gap-3 px-2 ${isAI ? 'justify-start' : 'justify-end'} text-slate-400 dark:text-[#71717A] opacity-0 group-hover/bubble:opacity-100 transition-opacity duration-200`}>
              {timestamp && (
                <span className="text-[11px] font-medium mr-1 select-none">
                  {formatMessageTime(timestamp)}
                </span>
              )}

              {/* Copy Action */}
              <button
                onClick={handleCopy}
                className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-[#202020] hover:text-slate-900 dark:hover:text-white transition-all duration-200 flex items-center gap-1 text-[11px] cursor-pointer"
                title="Copy message"
              >
                {isCopied ? (
                  <>
                    <Check size={13} className="text-[#10A37F]" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copy</span>
                  </>
                )}
              </button>

              {/* Edit Action (Only for User prompts) */}
              {!isAI && onEditMessage && (
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setEditText(message);
                  }}
                  className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-[#202020] hover:text-slate-900 dark:hover:text-white transition-all duration-200 flex items-center gap-1 text-[11px] cursor-pointer"
                  title="Edit prompt inline"
                >
                  <Edit size={13} />
                  <span>Edit</span>
                </button>
              )}

              {/* Regenerate Action (Only for the latest AI response) */}
              {isAI && isLastAI && onRegenerateResponse && (
                <button
                  onClick={() => onRegenerateResponse(index)}
                  className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-[#202020] hover:text-slate-900 dark:hover:text-white transition-all duration-200 flex items-center gap-1 text-[11px] cursor-pointer"
                  title="Regenerate response"
                >
                  <RotateCcw size={13} />
                  <span>Regenerate</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;