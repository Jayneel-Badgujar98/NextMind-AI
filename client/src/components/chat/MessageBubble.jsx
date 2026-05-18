import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import { useTheme } from "../../context/ThemeContext";
import { formatMessageTime } from '../../utils/helpers';


// Helper component for Code Block with Copy Button
const CodeBlock = ({ language, value }) => {
  const [isCopied, setIsCopied] = useState(false);


  const handleCopyCode = () => {
    navigator.clipboard.writeText(value);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="relative rounded-xl my-4 overflow-hidden border border-[#E4E4E7] dark:border-white/10 bg-[#1e1e1e] group">
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] text-[#A1A1AA] text-xs font-mono">
        <span>{language}</span>
        <button
          onClick={handleCopyCode}
          className="flex items-center gap-1.5 hover:text-white transition-colors"
        >
          {isCopied ? <Check size={14} className="text-[#10A37F]" /> : <Copy size={14} />}
          <span>{isCopied ? 'Copied!' : 'Copy code'}</span>
        </button>
      </div>
      <SyntaxHighlighter
        children={value}
        style={vscDarkPlus}
        language={language}
        PreTag="div"
        customStyle={{ margin: 0, padding: '16px', background: 'transparent' }}
        className="text-[14px]"
      />
    </div>
  );
};

const MessageBubble = ({ message, isAI, toolInvocations, timestamp }) => {
  const [isCopied, setIsCopied] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className={`flex w-full ${isAI ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] gap-4 ${isAI ? 'flex-row' : 'flex-row-reverse'}`}>

        {/* Avatar (Only for AI) */}
        {isAI && (
          <div className="flex-shrink-0 h-12 w-12 rounded-full overflow-hidden border border-[#E4E4E7] dark:border-white/10 bg-[#FFFFFF] dark:bg-black/40">

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
              className="h-full w-full items-center justify-center text-[#10A37F] font-bold text-sm"
            >
              N
            </span>

          </div>
        )}

        {/* Message Content & Meta */}
        <div className="flex flex-col gap-1 w-full overflow-hidden">
          <div className={`px-5 py-4 rounded-[20px] text-[15px] leading-relaxed overflow-hidden ${isAI
              ? 'bg-transparent dark:bg-[#141414] text-[#18181B] dark:text-white rounded-tl-none'
              : 'bg-[#DCFCE7] dark:bg-[#202020] text-[#18181B] dark:text-white'
            }`}>
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
            {isAI && message ? (
              <div className="prose dark:prose-invert max-w-none text-[#18181B] dark:text-white prose-p:leading-relaxed prose-pre:p-0">
                <ReactMarkdown
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '')
                      if (!inline && match) {
                        return (
                          <CodeBlock
                            language={match[1]}
                            value={String(children).replace(/\n$/, '')}
                          />
                        );
                      }

                      const { ref, ...safeProps } = props;
                      return (
                        <code className="bg-[#E4E4E7] dark:bg-[#202020] text-[#18181B] dark:text-[#A1A1AA] px-1.5 py-0.5 rounded-md text-[13.5px] font-mono" {...safeProps}>
                          {children}
                        </code>
                      )
                    },
                    p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc ml-6 mb-3 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal ml-6 mb-3 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    h3: ({ children }) => <h3 className="text-lg font-semibold mt-4 mb-2 text-[#18181B] dark:text-white">{children}</h3>,
                    h4: ({ children }) => <h4 className="text-md font-semibold mt-3 mb-2 text-[#18181B] dark:text-white">{children}</h4>,
                    strong: ({ children }) => <strong className="font-semibold text-[#18181B] dark:text-white">{children}</strong>,
                    a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#10A37F] hover:text-[#0E8F6E] underline underline-offset-2 break-all">{children}</a>
                  }}
                >
                  {message}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="whitespace-pre-wrap">{message}</div>
            )}
          </div>

          {/* Footer Meta (Timestamp & Copy) */}
          <div className={`flex items-center gap-3 px-2 ${isAI ? 'justify-start' : 'justify-end'} text-[#A1A1AA] dark:text-[#71717A]`}>
            {timestamp && (
              <span className="text-[11px] font-medium">
                {formatMessageTime(timestamp)}
              </span>
            )}
            <button
              onClick={handleCopy}
              className="p-1 rounded-md hover:bg-[#E4E4E7] dark:hover:bg-[#202020] hover:text-[#18181B] dark:hover:text-white transition-all-ease flex items-center gap-1 text-[11px]"
              title="Copy message"
            >
              {isCopied ? (
                <>
                  <Check size={14} className="text-[#10A37F]" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;