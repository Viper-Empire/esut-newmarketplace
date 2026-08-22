import { useAuth } from "@/_core/hooks/useAuth";
import { CaseReportButton } from "@/components/CaseSubmissionDialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { isCloudflareStagingPreview } from "@/lib/stagingPreview";
import { ArrowLeft, CircleAlert, Loader2, MessageCircle, MoreVertical, Search, Send } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { toast } from "sonner";

export const ACTIVE_THREAD_REFRESH_MS = 5_000;
export const CONVERSATION_REFRESH_MS = 8_000;
const TYPING_EMIT_INTERVAL_MS = 4_000;
const TYPING_IDLE_MS = 6_000;

export type MessageConversation = {
  conversation: { id: number };
  listing: { title: string; slug: string };
  store: { name: string; slug: string };
  counterparty: { name: string | null; avatarUrl: string | null } | null;
  latestMessage: { body: string; createdAt: Date; isMine: boolean } | null;
};

export function conversationInitials(name?: string | null) {
  const words = (name ?? "Marketplace member").trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map(word => word[0]).join("").toUpperCase() || "EM";
}

export function filterMessageConversations<T extends MessageConversation>(rows: T[], query: string) {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return rows;
  return rows.filter(row => [row.counterparty?.name, row.listing.title, row.store.name, row.latestMessage?.body].filter(Boolean).some(value => String(value).toLocaleLowerCase().includes(normalized)));
}

function ConversationAvatar({ name, url, small = false }: { name?: string | null; url?: string | null; small?: boolean }) {
  return <span className={`marketplace-chat-avatar ${small ? "marketplace-chat-avatar--small" : ""}`}>{url ? <img src={url} alt="" /> : conversationInitials(name)}</span>;
}

function ChatAccessBoundary({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <main className="page-shell py-16 text-center text-slate-500">Loading your protected conversations…</main>;
  if (isAuthenticated) return <>{children}</>;
  return <main className="page-shell py-20 text-center"><MessageCircle className="mx-auto text-[#00843d]" size={40}/><p className="eyebrow mt-5 justify-center text-[#00843d]">PRIVATE MARKETPLACE MESSAGES</p><h1 className="mt-3 text-3xl font-extrabold">Sign in to open messages</h1><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600">Buyer and seller conversations are private to their verified participants. Sign in to view your own marketplace conversations.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/login"><Button className="bg-[#e31b23]">Log in</Button></Link><Link href="/register"><Button variant="outline">Create account</Button></Link></div></main>;
}

function ChatThreadEmpty({ hasConversations }: { hasConversations: boolean }) {
  return <div className="marketplace-chat-empty"><div className="marketplace-chat-empty-icon"><MessageCircle size={28}/></div><h2>{hasConversations ? "Choose a conversation" : "Your conversations will appear here"}</h2><p>{hasConversations ? "Select a buyer or seller conversation from the left to see its private marketplace thread." : "Ask a seller about an active product to start a secure marketplace conversation."}</p>{!hasConversations && <Link href="/explore"><Button className="mt-2 bg-[#e31b23]">Browse marketplace</Button></Link>}</div>
}

export function MarketplaceMessagesPage({ seller = false }: { seller?: boolean }) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [body, setBody] = useState("");
  const [, params] = useRoute(seller ? "/seller/messages/:id" : "/account/messages/:id");
  const [, navigate] = useLocation();
  const conversationId = Number(params?.id);
  const isThreadOpen = Number.isFinite(conversationId) && conversationId > 0;
  const typingEndpointAvailable = !isCloudflareStagingPreview();
  const base = seller ? "/seller/messages" : "/account/messages";
  const conversations = trpc.messaging.list.useQuery(undefined, { refetchInterval: CONVERSATION_REFRESH_MS, refetchIntervalInBackground: false });
  const detail = trpc.messaging.detail.useQuery({ conversationId }, { enabled: isThreadOpen, refetchInterval: ACTIVE_THREAD_REFRESH_MS, refetchIntervalInBackground: false });
  const peerTyping = trpc.messaging.peerTyping.useQuery({ conversationId }, { enabled: isThreadOpen && typingEndpointAvailable, refetchInterval: 3_000, refetchIntervalInBackground: false, staleTime: 1_000 });
  const utils = trpc.useUtils();
  const typing = trpc.messaging.setTyping.useMutation();
  const typingTimer = useRef<number | null>(null);
  const lastTypingEmission = useRef(0);
  const endRef = useRef<HTMLDivElement | null>(null);
  const rows = (conversations.data ?? []) as MessageConversation[];
  const visibleRows = useMemo(() => filterMessageConversations(rows, search), [rows, search]);
  const activeConversation = rows.find(row => row.conversation.id === conversationId) ?? null;

  const stopTyping = () => {
    if (!isThreadOpen || !typingEndpointAvailable) return;
    if (typingTimer.current) window.clearTimeout(typingTimer.current);
    typingTimer.current = null;
    typing.mutate({ conversationId, isTyping: false });
  };

  const onDraftChange = (next: string) => {
    setBody(next);
    if (!isThreadOpen || !typingEndpointAvailable) return;
    if (typingTimer.current) window.clearTimeout(typingTimer.current);
    if (!next.trim()) { stopTyping(); return; }
    const now = Date.now();
    if (now - lastTypingEmission.current >= TYPING_EMIT_INTERVAL_MS) {
      lastTypingEmission.current = now;
      typing.mutate({ conversationId, isTyping: true });
    }
    typingTimer.current = window.setTimeout(stopTyping, TYPING_IDLE_MS);
  };

  useEffect(() => () => { if (typingTimer.current) window.clearTimeout(typingTimer.current); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [detail.data?.messages.length, peerTyping.data?.isTyping]);

  const send = trpc.messaging.send.useMutation({
    onSuccess: () => {
      setBody("");
      stopTyping();
      void utils.messaging.detail.invalidate({ conversationId });
      void utils.messaging.list.invalidate();
      toast.success("Message sent.");
    },
    onError: error => toast.error(error.message),
  });
  const submit = (event: FormEvent) => { event.preventDefault(); if (body.trim() && isThreadOpen) send.mutate({ conversationId, body }); };

  const onComposerKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); if (body.trim() && isThreadOpen && !send.isPending) send.mutate({ conversationId, body }); } };
  return <ChatAccessBoundary><main className="page-shell py-6 sm:py-8"><div className="marketplace-chat-title"><p className="eyebrow">{seller ? "SELLER MESSAGES" : "PRIVATE MESSAGES"}</p><p>Your product conversations are visible only to authorised participants.</p></div><section className={`marketplace-chat ${isThreadOpen ? "marketplace-chat--thread-open" : ""}`} aria-label="Marketplace messages">
    <aside className="marketplace-chat-sidebar" aria-label="Conversation list"><div className="marketplace-chat-sidebar-header"><h1>Messages</h1><label className="marketplace-chat-search"><Search size={17}/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search conversations…" aria-label="Search your conversations"/></label></div><div className="marketplace-chat-list">{conversations.isLoading ? Array.from({ length: 5 }, (_, index) => <div key={index} className="marketplace-chat-row marketplace-chat-row--skeleton"><span/><div><i/><i/></div></div>) : conversations.isError ? <div className="marketplace-chat-list-state"><CircleAlert size={22}/><p>Conversations could not be loaded.</p><Button size="sm" variant="outline" onClick={() => conversations.refetch()}>Try again</Button></div> : visibleRows.length ? visibleRows.map(row => { const selected = row.conversation.id === conversationId; const name = row.counterparty?.name ?? "Marketplace member"; return <Link key={row.conversation.id} href={`${base}/${row.conversation.id}`} aria-current={selected ? "page" : undefined} className={`marketplace-chat-row ${selected ? "is-active" : ""}`}><ConversationAvatar name={name} url={row.counterparty?.avatarUrl}/><div className="marketplace-chat-row-copy"><div><strong>{name}</strong>{row.latestMessage ? <time>{new Date(row.latestMessage.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</time> : null}</div><span>{row.listing.title}</span><p>{row.latestMessage ? `${row.latestMessage.isMine ? "You: " : ""}${row.latestMessage.body}` : "No messages yet"}</p></div></Link>; }) : <div className="marketplace-chat-list-state"><MessageCircle size={22}/><p>{search ? "No conversations match this search." : "No marketplace conversations yet."}</p>{search ? <button type="button" onClick={() => setSearch("")}>Clear search</button> : null}</div>}</div></aside>
    <section className="marketplace-chat-thread">{!isThreadOpen ? <ChatThreadEmpty hasConversations={rows.length > 0}/> : detail.isLoading ? <div className="marketplace-chat-empty"><div className="marketplace-chat-loading-dots"><i/><i/><i/></div><p>Loading your private conversation…</p></div> : detail.isError || !detail.data || !activeConversation ? <div className="marketplace-chat-empty"><CircleAlert size={30}/><h2>This conversation is unavailable</h2><p>It may no longer be available to this account. Return to your conversation list and try another thread.</p><Button variant="outline" onClick={() => navigate(base)}>Back to messages</Button></div> : <><header className="marketplace-chat-thread-header"><button type="button" className="marketplace-chat-back" onClick={() => navigate(base)} aria-label="Back to conversations"><ArrowLeft size={19}/></button><ConversationAvatar name={activeConversation.counterparty?.name} url={activeConversation.counterparty?.avatarUrl}/><div className="marketplace-chat-thread-heading"><h2>{activeConversation.counterparty?.name ?? "Marketplace member"}</h2><p>{activeConversation.listing.title} <span>·</span> {activeConversation.store.name}</p></div><DropdownMenu><DropdownMenuTrigger asChild><button type="button" className="marketplace-chat-more" aria-label="Conversation options"><MoreVertical size={19}/></button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => navigate(`/product/${activeConversation.listing.slug}`)}>Open related product</DropdownMenuItem><DropdownMenuItem onSelect={() => navigate(`/store/${activeConversation.store.slug}`)}>Open seller storefront</DropdownMenuItem><DropdownMenuSeparator/><DropdownMenuItem onSelect={() => navigate(base)}>Close conversation</DropdownMenuItem></DropdownMenuContent></DropdownMenu></header><div className="marketplace-chat-scroll" aria-live="polite">{detail.data.messages.length ? detail.data.messages.map(({ message, sender }) => { const mine = message.senderUserId === user?.id; return <article key={message.id} className={`marketplace-chat-message ${mine ? "is-mine" : ""}`}>{!mine ? <ConversationAvatar name={sender.name} small/> : null}<div><div className="marketplace-chat-bubble"><p>{message.body}</p>{!mine ? <CaseReportButton targetType="MESSAGE" targetId={message.id} subjectLabel="A message in this private conversation" buttonLabel="Report" className="marketplace-chat-report"/> : null}</div><time>{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></div></article>; }) : <div className="marketplace-chat-thread-empty"><MessageCircle size={24}/><p>No messages have been sent yet. Send a clear, respectful marketplace question.</p></div>}{peerTyping.data?.isTyping ? <div className="marketplace-chat-message"><ConversationAvatar name={peerTyping.data.name} small/><div><div className="marketplace-chat-typing" aria-label={`${peerTyping.data.name} is typing`}><i/><i/><i/></div><span>{peerTyping.data.name} is typing…</span></div></div> : null}<div ref={endRef}/></div><form className="marketplace-chat-composer" onSubmit={submit}><textarea value={body} onChange={event => onDraftChange(event.target.value)} onKeyDown={onComposerKeyDown} onBlur={stopTyping} maxLength={2_000} rows={1} placeholder="Write a message…" aria-label="Write a marketplace message"/><Button type="submit" className="marketplace-chat-send" disabled={!body.trim() || send.isPending} aria-label={send.isPending ? "Sending message" : "Send message"}>{send.isPending ? <Loader2 className="animate-spin" size={18}/> : <Send size={18}/>}</Button><p><kbd>Enter</kbd> to send · <kbd>Shift + Enter</kbd> for a new line · {body.trim().length}/2000</p></form></>}</section>
  </section></main></ChatAccessBoundary>;
}
