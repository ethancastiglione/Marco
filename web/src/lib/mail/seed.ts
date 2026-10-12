import type { Account, Label, Person, Thread } from "./types";

export const me: Person = { name: "Noah Smith", email: "noah@aster.ai", avatar: "light" };

export const seedAccounts: Account[] = [
  { id: "work", name: "Aster Labs", email: "noah@aster.ai", initial: "A", color: "ink" },
  { id: "personal", name: "Personal", email: "noah.smith@gmail.com", initial: "N", color: "red" },
  { id: "studio", name: "Smith Studio", email: "hello@smith.studio", initial: "S", color: "blue" },
];

export const workspace = { name: "Aster Labs", kind: "Team workspace" };

const people = {
  maya: { name: "Maya Chen", email: "maya@aster.ai", avatar: "coral" },
  linear: { name: "Linear", email: "notifications@linear.app", avatar: "dark" },
  jon: { name: "Jon Bell", email: "jon@bellstudio.co", avatar: "blue" },
  priya: { name: "Priya Shah", email: "priya@aster.ai", avatar: "violet" },
  dana: { name: "Dana Ortiz", email: "dana@aster.ai", avatar: "green" },
  leo: { name: "Leo Park", email: "leo@aster.ai", avatar: "amber" },
  ines: { name: "Inès Morel", email: "ines@aster.ai", avatar: "pink" },
  notion: { name: "Notion", email: "notify@mail.notion.so", avatar: "light" },
  alex: { name: "Alex Morgan", email: "alex@aster.ai", avatar: "green" },
  figma: { name: "Figma", email: "comments@figma.com", avatar: "pink" },
  ruth: { name: "Ruth Alvarez", email: "ruth@fernandcoast.com", avatar: "violet" },
  mom: { name: "Mom", email: "linda.smith@gmail.com", avatar: "coral" },
  travel: { name: "Wanderly Travel", email: "trips@wanderly.com", avatar: "blue" },
  sam: { name: "Sam Rivera", email: "sam.rivera@gmail.com", avatar: "amber" },
} satisfies Record<string, Person>;

export const seedLabels: Label[] = [
  { id: "product", name: "Product", color: "blue" },
  { id: "design", name: "Design", color: "violet" },
  { id: "research", name: "Research", color: "green" },
];

/** Builds the demo mailbox with timestamps relative to `now`, so it always looks current. */
export function seedThreads(now = new Date()): Thread[] {
  const ago = (minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString();
  const day = 24 * 60;

  return [
    {
      id: "q3-strategy",
      accountId: "work",
      subject: "Q3 Product strategy — final review",
      participants: [people.maya],
      labelIds: ["product"],
      location: "inbox",
      unread: true,
      starred: true,
      messages: [
        {
          id: "q3-strategy-1",
          from: people.maya,
          to: [me],
          sentAt: ago(28),
          fromMe: false,
          body: [
            { type: "p", text: "Hi Noah," },
            {
              type: "p",
              text: "I incorporated the feedback from yesterday. The narrative feels much tighter now, especially the transition from our customer insight into the product pillars.",
            },
            { type: "p", text: "Three things worth a final look:" },
            {
              type: "ol",
              items: [
                { title: "Vision statement", text: "I simplified it to focus on the outcome, not the mechanism." },
                { title: "Sequencing", text: "The enterprise work now follows the core experience improvements." },
                { title: "Success metrics", text: "I added the leading indicators we discussed on page 18." },
              ],
            },
            {
              type: "p",
              text: "If this looks good to you, I'll share the final version with the broader team before Thursday's review.",
            },
            { type: "p", text: "Thanks,\nMaya" },
          ],
          attachments: [
            { id: "q3-pdf", name: "Q3_Product_Strategy_v4.pdf", kind: "pdf", size: "4.2 MB", detail: "24 pages" },
          ],
        },
      ],
    },
    {
      id: "linear-digest",
      accountId: "work",
      subject: "Your workspace digest",
      participants: [people.linear],
      labelIds: [],
      location: "inbox",
      unread: true,
      starred: false,
      messages: [
        {
          id: "linear-digest-1",
          from: people.linear,
          to: [me],
          sentAt: ago(72),
          fromMe: false,
          body: [
            { type: "p", text: "12 issues completed, 8 created, and 4 projects updated across your workspace." },
            {
              type: "ol",
              items: [
                { title: "Inbox Zero — Q3", text: "5 issues completed · on track for Oct 24." },
                { title: "AI Drafts", text: "3 issues moved to review · 1 blocked on evals." },
                { title: "Calendar sync", text: "New project created by Leo Park." },
              ],
            },
            { type: "p", text: "You're receiving this because you're a member of Aster Labs." },
          ],
          attachments: [],
        },
      ],
    },
    {
      id: "brand-exploration",
      accountId: "studio",
      subject: "Re: Brand exploration",
      participants: [people.jon],
      labelIds: ["design"],
      location: "inbox",
      unread: true,
      starred: false,
      messages: [
        {
          id: "brand-exploration-1",
          from: me,
          to: [people.jon],
          sentAt: ago(day + 200),
          fromMe: true,
          body: [{ type: "p", text: "Jon — the three directions are in the shared file. Curious which one you'd push further." }],
          attachments: [],
        },
        {
          id: "brand-exploration-2",
          from: people.jon,
          to: [me],
          sentAt: ago(104),
          fromMe: false,
          body: [
            { type: "p", text: "Hey Noah," },
            {
              type: "p",
              text: "These directions are excellent. I left a few comments in the file, mostly around the wordmark spacing and how the mark scales down to favicon size.",
            },
            {
              type: "p",
              text: "My vote is direction B — it's the only one that still feels calm at 16px. Happy to jam on it Thursday.",
            },
            { type: "p", text: "Jon" },
          ],
          attachments: [],
        },
      ],
    },
    {
      id: "offsite-planning",
      accountId: "work",
      subject: "Offsite planning",
      participants: [people.priya, people.dana, people.leo, people.ines],
      labelIds: [],
      location: "inbox",
      unread: false,
      starred: true,
      messages: [
        {
          id: "offsite-planning-1",
          from: people.priya,
          to: [me, people.dana, people.leo, people.ines],
          sentAt: ago(day + 95),
          fromMe: false,
          body: [
            { type: "p", text: "Hi all," },
            {
              type: "p",
              text: "The venue is confirmed for October 18–20. Please add your dietary preferences to the sheet by Friday so we can lock catering.",
            },
            {
              type: "ol",
              items: [
                { title: "Travel", text: "Book flights through Navan so they land on the team budget." },
                { title: "Agenda", text: "Day one is strategy, day two is hack day, day three is optional hiking." },
              ],
            },
            { type: "p", text: "Priya" },
          ],
          attachments: [{ id: "offsite-pdf", name: "Offsite_Agenda.pdf", kind: "pdf", size: "820 KB", detail: "3 pages" }],
        },
      ],
    },
    {
      id: "notion-mention",
      accountId: "work",
      subject: "Maya mentioned you",
      participants: [people.notion],
      labelIds: [],
      location: "inbox",
      unread: false,
      starred: false,
      messages: [
        {
          id: "notion-mention-1",
          from: people.notion,
          to: [me],
          sentAt: ago(day + 310),
          fromMe: false,
          body: [
            { type: "p", text: "Maya mentioned you in Launch Brief:" },
            { type: "p", text: "“Could you take a look at the updated positioning section before we send this to sales?”" },
          ],
          attachments: [],
        },
      ],
    },
    {
      id: "research-notes",
      accountId: "work",
      subject: "Customer research notes",
      participants: [people.alex],
      labelIds: ["research"],
      location: "inbox",
      unread: false,
      starred: false,
      messages: [
        {
          id: "research-notes-1",
          from: people.alex,
          to: [me],
          sentAt: ago(3 * day + 40),
          fromMe: false,
          body: [
            { type: "p", text: "Hi Noah," },
            { type: "p", text: "Sharing the synthesis from this week's calls. Three themes kept surfacing:" },
            {
              type: "ol",
              items: [
                { title: "Triage fatigue", text: "Most people spend the first hour of the day just sorting." },
                { title: "Trust in AI drafts", text: "They want to see why a draft says what it says." },
                { title: "Shared inboxes", text: "Teams keep forwarding threads instead of assigning them." },
              ],
            },
            { type: "p", text: "Full notes attached.\nAlex" },
          ],
          attachments: [
            { id: "research-doc", name: "Research_Synthesis_Week41.pdf", kind: "pdf", size: "1.6 MB", detail: "11 pages" },
          ],
        },
      ],
    },
    {
      id: "figma-comments",
      accountId: "work",
      subject: "5 new comments in Workspace",
      participants: [people.figma],
      labelIds: [],
      location: "inbox",
      unread: false,
      starred: false,
      messages: [
        {
          id: "figma-comments-1",
          from: people.figma,
          to: [me],
          sentAt: ago(3 * day + 180),
          fromMe: false,
          body: [
            { type: "p", text: "There are new replies and mentions in your design files." },
            {
              type: "ol",
              items: [
                { title: "Jon Bell in Brand — Directions", text: "“Wordmark kerning feels tight at small sizes.”" },
                { title: "Maya Chen in Inbox v3", text: "“Can we try the reading pane without the divider?”" },
              ],
            },
          ],
          attachments: [],
        },
      ],
    },
    {
      id: "coffee",
      accountId: "personal",
      subject: "Coffee next week?",
      participants: [people.sam],
      labelIds: [],
      location: "inbox",
      unread: false,
      starred: false,
      messages: [
        {
          id: "coffee-1",
          from: people.sam,
          to: [me],
          sentAt: ago(6 * day),
          fromMe: false,
          body: [
            { type: "p", text: "Hey Noah!" },
            {
              type: "p",
              text: "Would love to catch up and hear how the new role is going. Are you free Tuesday? There's a new place on Valencia I've been meaning to try.",
            },
            { type: "p", text: "Sam" },
          ],
          attachments: [],
        },
      ],
    },
    {
      id: "hiring-plan",
      accountId: "work",
      subject: "Hiring plan for H2",
      participants: [people.dana],
      labelIds: [],
      location: "archive",
      unread: false,
      starred: false,
      messages: [
        {
          id: "hiring-plan-1",
          from: people.dana,
          to: [me],
          sentAt: ago(9 * day),
          fromMe: false,
          body: [{ type: "p", text: "Attached is the draft headcount plan. Two design roles and one research role are approved." }],
          attachments: [],
        },
      ],
    },
    {
      id: "draft-leo",
      accountId: "work",
      subject: "Calendar sync scope",
      participants: [people.leo],
      labelIds: [],
      location: "drafts",
      unread: false,
      starred: false,
      messages: [
        {
          id: "draft-leo-1",
          from: me,
          to: [people.leo],
          sentAt: ago(5 * 60),
          fromMe: true,
          body: [{ type: "p", text: "Leo — before we commit to two-way sync, can we" }],
          attachments: [],
        },
      ],
    },
    {
      id: "draft-team",
      accountId: "work",
      subject: "Thursday review agenda",
      participants: [people.maya, people.priya],
      labelIds: ["product"],
      location: "drafts",
      unread: false,
      starred: false,
      messages: [
        {
          id: "draft-team-1",
          from: me,
          to: [people.maya, people.priya],
          sentAt: ago(day + 30),
          fromMe: true,
          body: [{ type: "p", text: "Proposed agenda: 1) strategy doc walkthrough 2) metrics 3) open questions" }],
          attachments: [],
        },
      ],
    },
    {
      id: "studio-inquiry",
      accountId: "studio",
      subject: "New inquiry: brand refresh for Fern & Coast",
      participants: [people.ruth],
      labelIds: ["design"],
      location: "inbox",
      unread: true,
      starred: false,
      messages: [
        {
          id: "studio-inquiry-1",
          from: people.ruth,
          to: [me],
          sentAt: ago(55),
          fromMe: false,
          body: [
            { type: "p", text: "Hi Noah," },
            {
              type: "p",
              text: "We're a small coastal hotel group looking to refresh our identity before spring. A friend pointed us to your studio. Would you have room for a project starting in November?",
            },
            { type: "p", text: "Best,\nRuth" },
          ],
          attachments: [{ id: "fern-brief", name: "Fern_Coast_Brief.pdf", kind: "pdf", size: "2.1 MB", detail: "6 pages" }],
        },
      ],
    },
    {
      id: "mom-dinner",
      accountId: "personal",
      subject: "Dinner Sunday?",
      participants: [people.mom],
      labelIds: [],
      location: "inbox",
      unread: true,
      starred: false,
      messages: [
        {
          id: "mom-dinner-1",
          from: people.mom,
          to: [me],
          sentAt: ago(140),
          fromMe: false,
          body: [
            { type: "p", text: "Hi sweetie," },
            { type: "p", text: "Dad's making his lasagna on Sunday. Come by around 6? Bring that friend from work if you like.\n\nLove, Mom" },
          ],
          attachments: [],
        },
      ],
    },
    {
      id: "flight-confirmation",
      accountId: "personal",
      subject: "Your trip to New York is confirmed",
      participants: [people.travel],
      labelIds: [],
      location: "inbox",
      unread: false,
      starred: false,
      messages: [
        {
          id: "flight-confirmation-1",
          from: people.travel,
          to: [me],
          sentAt: ago(2 * day + 60),
          fromMe: false,
          body: [
            { type: "p", text: "Confirmation WX4K9P — SFO → JFK, Oct 17, departing 8:05 AM." },
            {
              type: "ol",
              items: [
                { title: "Seat", text: "14A · window" },
                { title: "Hotel", text: "The Wythe, 3 nights · check-in Oct 17" },
              ],
            },
          ],
          attachments: [{ id: "itinerary", name: "Itinerary_WX4K9P.pdf", kind: "pdf", size: "310 KB", detail: "2 pages" }],
        },
      ],
    },
  ];
}
