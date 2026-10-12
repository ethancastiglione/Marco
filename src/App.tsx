import { useMemo, useState } from "react";

type IconName =
  | "archive"
  | "arrowDown"
  | "arrowLeft"
  | "arrowRight"
  | "calendar"
  | "check"
  | "chevron"
  | "clock"
  | "close"
  | "compose"
  | "dots"
  | "inbox"
  | "mail"
  | "menu"
  | "paperclip"
  | "reply"
  | "search"
  | "send"
  | "settings"
  | "sparkle"
  | "star"
  | "trash"
  | "users";

const paths: Record<IconName, React.ReactNode> = {
  archive: (
    <>
      <path d="M4 7.5h16M5.5 7.5v11h13v-11M3.5 4h17v3.5h-17z" />
      <path d="M9.5 12h5" />
    </>
  ),
  arrowDown: <path d="M12 5v14m-5-5 5 5 5-5" />,
  arrowLeft: <path d="m15 18-6-6 6-6" />,
  arrowRight: <path d="m9 18 6-6-6-6" />,
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M3.5 9.5h17" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  close: <path d="m6 6 12 12M18 6 6 18" />,
  compose: (
    <>
      <path d="M13.5 5.5 18.5 10.5M4 20l3.4-.8L19.6 7a1.8 1.8 0 0 0 0-2.6 1.8 1.8 0 0 0-2.6 0L4.8 16.6 4 20Z" />
    </>
  ),
  dots: (
    <>
      <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  inbox: (
    <>
      <path d="M4 5h16v14H4z" />
      <path d="M4 13h4l2 3h4l2-3h4" />
    </>
  ),
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4.5 7 7.5 6 7.5-6" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  paperclip: <path d="m8 12.5 6.8-6.8a3 3 0 0 1 4.2 4.2l-8.2 8.2a4.2 4.2 0 0 1-6-6l8-8" />,
  reply: <path d="m9.5 8-5 4 5 4v-3h4.2c3.3 0 5.2 1.2 6.3 4.5-.2-5.8-2.8-8.5-7.8-8.5H9.5V8Z" />,
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 4.5 4.5" />
    </>
  ),
  send: <path d="m21 3-7.5 18-3.2-7.3L3 10.5 21 3Zm-10.7 10.7L21 3" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
    </>
  ),
  sparkle: <path d="M12 2.8c.5 5 2.2 7 6.8 7.7-4.6.7-6.3 2.7-6.8 7.7-.5-5-2.2-7-6.8-7.7C9.8 9.8 11.5 7.8 12 2.8Z" />,
  star: <path d="m12 3.5 2.7 5.4 6 .9-4.4 4.2 1 6-5.3-2.8L6.7 20l1-6-4.4-4.2 6-.9L12 3.5Z" />,
  trash: (
    <>
      <path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="9" r="3" />
      <path d="M3.5 19c.5-3.2 2.3-5 5.5-5s5 1.8 5.5 5M15 7.2a3 3 0 0 1 0 5.6M16.5 14.2c2.3.5 3.6 2.1 4 4.8" />
    </>
  ),
};

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
    >
      {paths[name]}
    </svg>
  );
}

type Message = {
  id: number;
  sender: string;
  initials: string;
  avatar: string;
  subject: string;
  preview: string;
  time: string;
  unread?: boolean;
  starred?: boolean;
  label?: string;
  attachment?: boolean;
};

const initialMessages: Message[] = [
  {
    id: 1,
    sender: "Maya Chen",
    initials: "MC",
    avatar: "avatar-coral",
    subject: "Q3 Product strategy — final review",
    preview: "I incorporated the feedback from yesterday. The narrative feels much tighter now...",
    time: "10:32 AM",
    unread: true,
    starred: true,
    label: "Product",
    attachment: true,
  },
  {
    id: 2,
    sender: "Linear",
    initials: "L",
    avatar: "avatar-dark",
    subject: "Your workspace digest",
    preview: "12 issues completed, 8 created, and 4 projects updated across your workspace.",
    time: "9:48 AM",
    unread: true,
  },
  {
    id: 3,
    sender: "Jon Bell",
    initials: "JB",
    avatar: "avatar-blue",
    subject: "Re: Brand exploration",
    preview: "These directions are excellent. I left a few comments in the file, mostly around...",
    time: "9:16 AM",
    unread: true,
    label: "Design",
  },
  {
    id: 4,
    sender: "Priya & 3 others",
    initials: "PS",
    avatar: "avatar-violet",
    subject: "Offsite planning",
    preview: "The venue is confirmed for October 18–20. Please add your dietary preferences...",
    time: "Yesterday",
    starred: true,
  },
  {
    id: 5,
    sender: "Notion",
    initials: "N",
    avatar: "avatar-light",
    subject: "Maya mentioned you",
    preview: "Maya mentioned you in Launch Brief: “Could you take a look at the updated...”",
    time: "Yesterday",
  },
  {
    id: 6,
    sender: "Alex Morgan",
    initials: "AM",
    avatar: "avatar-green",
    subject: "Customer research notes",
    preview: "Sharing the synthesis from this week's calls. Three themes kept surfacing...",
    time: "Mon",
    label: "Research",
    attachment: true,
  },
  {
    id: 7,
    sender: "Figma",
    initials: "F",
    avatar: "avatar-pink",
    subject: "5 new comments in Workspace",
    preview: "There are new replies and mentions in your design files.",
    time: "Mon",
  },
  {
    id: 8,
    sender: "Sam Rivera",
    initials: "SR",
    avatar: "avatar-amber",
    subject: "Coffee next week?",
    preview: "Would love to catch up and hear how the new role is going. Are you free Tuesday?",
    time: "Fri",
  },
];

const navItems: { icon: IconName; label: string; count?: number }[] = [
  { icon: "inbox", label: "Inbox", count: 8 },
  { icon: "star", label: "Starred" },
  { icon: "clock", label: "Snoozed" },
  { icon: "send", label: "Sent" },
  { icon: "mail", label: "Drafts", count: 2 },
];

function App() {
  const [messages, setMessages] = useState(initialMessages);
  const [selectedId, setSelectedId] = useState(1);
  const [section, setSection] = useState("Inbox");
  const [query, setQuery] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [sentToast, setSentToast] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replies, setReplies] = useState<Record<number, string[]>>({});

  const selected = messages.find((message) => message.id === selectedId) ?? messages[0];
  const filtered = useMemo(
    () =>
      messages.filter((message) =>
        `${message.sender} ${message.subject} ${message.preview}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [messages, query],
  );

  const toggleStar = (id: number) => {
    setMessages((current) =>
      current.map((message) =>
        message.id === id ? { ...message, starred: !message.starred } : message,
      ),
    );
  };

  const archiveSelected = () => {
    const currentIndex = messages.findIndex((message) => message.id === selectedId);
    const next = messages.filter((message) => message.id !== selectedId);
    setMessages(next);
    setSelectedId(next[Math.min(currentIndex, next.length - 1)]?.id ?? 0);
  };

  const sendMessage = () => {
    setComposeOpen(false);
    setSentToast(true);
    window.setTimeout(() => setSentToast(false), 2600);
  };

  const sendReply = () => {
    const trimmedReply = replyText.trim();
    if (!selected || !trimmedReply) return;

    setReplies((current) => ({
      ...current,
      [selected.id]: [...(current[selected.id] ?? []), trimmedReply],
    }));
    setReplyText("");
    setSentToast(true);
    window.setTimeout(() => setSentToast(false), 2600);
  };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="workspace-row">
          <button className="app-mark" aria-label="Aster home">A</button>
          <div>
            <strong>Aster Labs</strong>
            <span className="eyebrow">Team workspace</span>
          </div>
          <button className="icon-button subtle" aria-label="Workspace options">
            <Icon name="dots" size={17} />
          </button>
        </div>

        <button className="compose-button" onClick={() => setComposeOpen(true)}>
          <Icon name="compose" size={17} />
          <span>Compose</span>
          <kbd>C</kbd>
        </button>

        <nav className="side-nav" aria-label="Mailbox">
          {navItems.map((item) => (
            <button
              className={`nav-item ${section === item.label ? "active" : ""}`}
              key={item.label}
              onClick={() => setSection(item.label)}
            >
              <Icon name={item.icon} size={17} />
              <span>{item.label}</span>
              {item.count && <span className="nav-count">{item.count}</span>}
            </button>
          ))}
        </nav>

        <div className="nav-divider" />
        <div className="nav-heading">
          <span>Labels</span>
          <button className="mini-add" aria-label="Add label">
            +
          </button>
        </div>
        <div className="labels">
          <button><span className="label-dot dot-blue" />Product</button>
          <button><span className="label-dot dot-violet" />Design</button>
          <button><span className="label-dot dot-green" />Research</button>
        </div>

        <div className="sidebar-spacer" />
        <div className="storage-card">
          <div className="storage-icon"><Icon name="sparkle" size={16} /></div>
          <div>
            <strong>Ask Aster AI</strong>
            <span>Search, summarize, write</span>
          </div>
          <kbd>⌘ J</kbd>
        </div>
        <button className="account-row">
          <span className="profile-avatar">NS<span className="presence-dot" /></span>
          <span><strong>Noah Smith</strong><small>noah@aster.ai</small></span>
          <Icon name="dots" size={16} />
        </button>
      </aside>

      <section className="mailbox">
        <header className="topbar">
          <button className="mobile-menu icon-button" aria-label="Open menu">
            <Icon name="menu" />
          </button>
          <label className="search-box">
            <Icon name="search" size={18} />
            <input
              aria-label="Search mail"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search mail"
            />
            <kbd>⌘ K</kbd>
          </label>
          <button className="help-button">?</button>
        </header>

        <div className="mail-layout">
          <section className="message-list">
            <div className="list-heading">
              <div>
                <span className="section-kicker">Mailbox</span>
                <h1>{section}</h1>
              </div>
              <div className="heading-actions">
                <button className="icon-button" title="Mark all as read">
                  <Icon name="check" size={17} />
                </button>
                <button className="icon-button" title="More options">
                  <Icon name="dots" size={19} />
                </button>
              </div>
            </div>
            <div className="filter-row">
              <button className="filter active">All</button>
              <button className="filter">Unread</button>
              <span className="message-total">{filtered.length} messages</span>
            </div>

            <div className="messages">
              {filtered.length ? (
                filtered.map((message) => (
                  <article
                    className={`message-card ${selectedId === message.id ? "selected" : ""} ${message.unread ? "unread" : ""}`}
                    key={message.id}
                    onClick={() => setSelectedId(message.id)}
                  >
                    <div className={`sender-avatar ${message.avatar}`}>{message.initials}</div>
                    <div className="message-main">
                      <div className="message-meta">
                        <strong>{message.sender}</strong>
                        <span>{message.time}</span>
                      </div>
                      <div className="subject-row">
                        <span>{message.subject}</span>
                        <button
                          className={`star-button ${message.starred ? "starred" : ""}`}
                          aria-label={message.starred ? "Unstar message" : "Star message"}
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleStar(message.id);
                          }}
                        >
                          <Icon name="star" size={15} />
                        </button>
                      </div>
                      <p>{message.preview}</p>
                      {(message.label || message.attachment) && (
                        <div className="message-badges">
                          {message.label && <span>{message.label}</span>}
                          {message.attachment && <Icon name="paperclip" size={13} />}
                        </div>
                      )}
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty-state">
                  <Icon name="search" size={24} />
                  <strong>No messages found</strong>
                  <span>Try a different name or keyword.</span>
                </div>
              )}
            </div>
          </section>

          {selected ? (
            <section className="reading-pane">
              <div className="message-toolbar">
                <div>
                  <button className="icon-button mobile-back" aria-label="Back">
                    <Icon name="arrowLeft" />
                  </button>
                  <button className="icon-button" title="Archive" onClick={archiveSelected}>
                    <Icon name="archive" size={17} />
                  </button>
                  <button className="icon-button" title="Snooze">
                    <Icon name="clock" size={17} />
                  </button>
                  <button className="icon-button" title="Delete">
                    <Icon name="trash" size={17} />
                  </button>
                </div>
                <div>
                  <span className="pagination">1 of {messages.length}</span>
                  <button className="icon-button" aria-label="Previous message">
                    <Icon name="arrowLeft" size={16} />
                  </button>
                  <button className="icon-button" aria-label="Next message">
                    <Icon name="arrowRight" size={16} />
                  </button>
                  <button className="icon-button" aria-label="More options">
                    <Icon name="dots" size={19} />
                  </button>
                </div>
              </div>

              <article className="email-content">
                <div className="email-title-row">
                  <div>
                    <div className="email-label">{selected.label ?? "Inbox"}</div>
                    <h2>{selected.subject}</h2>
                  </div>
                  <button
                    className={`large-star ${selected.starred ? "starred" : ""}`}
                    aria-label="Star message"
                    onClick={() => toggleStar(selected.id)}
                  >
                    <Icon name="star" size={18} />
                  </button>
                </div>

                <div className="thread">
                  <div className="thread-message">
                    <div className="sender-row">
                      <div className={`sender-avatar large ${selected.avatar}`}>
                        {selected.initials}
                      </div>
                      <div className="sender-details">
                        <strong>{selected.sender}</strong>
                        <button>
                          to me <Icon name="arrowDown" size={12} />
                        </button>
                      </div>
                      <div className="sender-actions">
                        <span>10:32 AM</span>
                        <button className="icon-button" aria-label="More">
                          <Icon name="dots" size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="email-body">
                      <p>Hi Noah,</p>
                      <p>
                        I incorporated the feedback from yesterday. The narrative feels much tighter
                        now, especially the transition from our customer insight into the product
                        pillars.
                      </p>
                      <p>Three things worth a final look:</p>
                      <ol>
                        <li>
                          <strong>Vision statement</strong>
                          <span>I simplified it to focus on the outcome, not the mechanism.</span>
                        </li>
                        <li>
                          <strong>Sequencing</strong>
                          <span>The enterprise work now follows the core experience improvements.</span>
                        </li>
                        <li>
                          <strong>Success metrics</strong>
                          <span>I added the leading indicators we discussed on page 18.</span>
                        </li>
                      </ol>
                      <p>
                        If this looks good to you, I'll share the final version with the broader team
                        before Thursday's review.
                      </p>
                      <p>
                        Thanks,
                        <br />
                        Maya
                      </p>
                    </div>

                    <button className="attachment-card">
                      <div className="file-icon">PDF</div>
                      <div>
                        <strong>Q3_Product_Strategy_v4.pdf</strong>
                        <span>4.2 MB · 24 pages</span>
                      </div>
                      <div className="download-icon">
                        <Icon name="arrowDown" size={17} />
                      </div>
                    </button>
                  </div>

                  {(replies[selected.id] ?? []).map((reply, index) => (
                    <div className="sent-thread-message" key={`${selected.id}-${index}`}>
                      <div className="sent-message-meta">
                        <span>You</span>
                        <span>Just now</span>
                      </div>
                      <p>{reply}</p>
                    </div>
                  ))}
                </div>

                <div className="reply-composer">
                  <textarea
                    aria-label={`Reply to ${selected.sender}`}
                    placeholder={`Reply to ${selected.sender.split(" ")[0]}...`}
                    rows={2}
                    value={replyText}
                    onChange={(event) => setReplyText(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) sendReply();
                    }}
                  />
                  <div className="reply-composer-actions">
                    <div>
                      <button className="composer-tool" aria-label="Attach file">
                        <Icon name="paperclip" size={17} />
                      </button>
                      <button
                        className="composer-tool ai-tool"
                        aria-label="Draft with AI"
                        onClick={() =>
                          setReplyText(
                            "This looks great, Maya. The narrative and sequencing are much clearer now. Please go ahead and share it with the broader team before Thursday's review.",
                          )
                        }
                      >
                        <Icon name="sparkle" size={16} />
                        <span>Draft with AI</span>
                      </button>
                    </div>
                    <div>
                      <span className="send-hint">⌘ ↵</span>
                      <button
                        className="reply-send"
                        aria-label="Send reply"
                        disabled={!replyText.trim()}
                        onClick={sendReply}
                      >
                        <Icon name="arrowRight" size={17} />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            </section>
          ) : (
            <section className="reading-pane no-selection">
              <Icon name="check" size={28} />
              <strong>Inbox zero, for now</strong>
              <span>You’ve cleared every message in this view.</span>
            </section>
          )}
        </div>
      </section>

      {composeOpen && (
        <div className="compose-window">
          <div className="compose-header">
            <strong>New message</strong>
            <div>
              <button className="icon-button" aria-label="Minimize">
                <span className="minimize-line" />
              </button>
              <button className="icon-button" aria-label="Close" onClick={() => setComposeOpen(false)}>
                <Icon name="close" size={16} />
              </button>
            </div>
          </div>
          <label className="compose-line">
            <span>To</span>
            <input autoFocus aria-label="Recipients" />
            <button>Cc Bcc</button>
          </label>
          <label className="compose-line">
            <span>Subject</span>
            <input aria-label="Subject" />
          </label>
          <textarea aria-label="Message body" placeholder="Write something thoughtful..." />
          <div className="compose-footer">
            <button className="send-button" onClick={sendMessage}>
              Send <kbd>⌘ ↵</kbd>
            </button>
            <div>
              <button className="icon-button" aria-label="Attach">
                <Icon name="paperclip" size={18} />
              </button>
              <button className="icon-button ai-write" aria-label="Write with AI">
                <Icon name="sparkle" size={17} />
              </button>
            </div>
            <button className="icon-button compose-trash" aria-label="Discard">
              <Icon name="trash" size={17} />
            </button>
          </div>
        </div>
      )}

      {sentToast && (
        <div className="toast">
          <span><Icon name="check" size={15} /></span>
          Message sent
          <button>Undo</button>
        </div>
      )}
    </main>
  );
}

export default App;
