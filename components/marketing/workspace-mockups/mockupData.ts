export const mockLead = {
  name: "Sarah Mitchell",
  company: "Northstar Studio",
  stage: "Qualified",
  source: "Referral",
  date: "Jan 12",
  email: "sarah@northstar.example",
  phone: "+1 (555) 014-2084",
  notes: "Looking for a brand refresh and responsive website redesign before the next campaign launch.",
  estimatedValue: 8500,
};

export const mockClient = {
  name: "Northstar Studio",
  email: "sarah@northstar.example",
  company: "Northstar Studio",
  contact: "Sarah Mitchell",
  phone: "+1 (555) 014-2084",
};

export const mockProject = {
  name: "Brand & Website Refresh",
  client: "Northstar Studio",
  status: "Planning",
  priority: "High",
  due: "2025-10-30",
  progress: { completed: 2, total: 6 },
};

export const mockBriefSections = [
  {
    title: "Objectives",
    content: "Refresh Northstar Studio's brand and website with a stronger visual system, improved content hierarchy, and responsive experience before the next campaign launch.",
  },
  {
    title: "Requirements",
    content: "• New brand direction and visual system\n• Restructured homepage content hierarchy\n• Responsive mobile experience\n• WCAG 2.1 AA compliance\n• CMS integration for content management",
  },
  {
    title: "Deliverables",
    content: "• Brand direction documentation\n• Homepage redesign\n• Responsive page layouts\n• Design system documentation\n• Developer handoff package",
  },
];

export const mockAIAnalysis = {
  source: "Brand & Website Refresh — Project Brief",
  status: "COMPLETED",
  summary: "Refresh Northstar Studio's brand and website with a stronger visual system, improved content hierarchy, and responsive experience before the next campaign launch.",
  requirements: [
    { priority: "High", text: "Define updated brand direction" },
    { priority: "High", text: "Ensure responsive mobile experience" },
    { priority: "Medium", text: "Restructure homepage content hierarchy" },
    { priority: "Medium", text: "WCAG 2.1 AA compliance" },
    { priority: "Medium", text: "CMS integration for content management" },
  ],
  risks: [
    "Content requirements may need clarification",
    "Existing visual system may require broader refinement",
  ],
  gaps: [
    "What is the target launch date?",
    "Which pages are included in the initial release?",
  ],
  suggestedTasks: [
    { title: "Review brand positioning", priority: "High", req: "Req-1: Define updated brand direction", risk: "Existing visual system may require broader refinement" },
    { title: "Audit current website", priority: "High", req: "Req-2: Responsive mobile experience", risk: null },
    { title: "Define homepage structure", priority: "Medium", req: "Req-3: Restructure homepage content", risk: "Content requirements may need clarification" },
    { title: "Prepare visual direction", priority: "Medium", req: "Req-1: Define updated brand direction", risk: null },
    { title: "Build responsive page layouts", priority: "Medium", req: "Req-2: Responsive mobile experience", risk: null },
  ],
};

export const mockApprovalTasks = [
  {
    title: "Review brand positioning",
    priority: "High",
    requirement: "Req-1: Define updated brand direction",
    risk: "Existing visual system may require broader refinement",
    status: "pending",
  },
  {
    title: "Audit current website",
    priority: "High",
    requirement: "Req-2: Responsive mobile experience",
    risk: null,
    status: "pending",
  },
  {
    title: "Define homepage structure",
    priority: "Medium",
    requirement: "Req-3: Restructure homepage content",
    risk: "Content requirements may need clarification",
    status: "expanded",
  },
  {
    title: "Prepare visual direction",
    priority: "Medium",
    requirement: "Req-1: Define updated brand direction",
    risk: null,
    status: "pending",
  },
  {
    title: "Build responsive page layouts",
    priority: "Medium",
    requirement: "Req-2: Responsive mobile experience",
    risk: null,
    status: "pending",
  },
];

export const mockTaskBoard = {
  tasks: [
    { title: "Review brand positioning", status: "COMPLETED", priority: "HIGH", assignee: "SM", due: "Oct 20" },
    { title: "Audit current website", status: "COMPLETED", priority: "HIGH", assignee: "MW", due: "Oct 22" },
    { title: "Define homepage structure", status: "IN_PROGRESS", priority: "MEDIUM", assignee: "PP", due: "Oct 28" },
    { title: "Prepare visual direction", status: "TODO", priority: "MEDIUM", assignee: "SM", due: "Nov 5" },
    { title: "Build responsive layouts", status: "TODO", priority: "MEDIUM", assignee: "MW", due: "Nov 12" },
    { title: "Configure CMS content models", status: "TODO", priority: "MEDIUM", assignee: "PP", due: "Nov 15" },
  ],
};

export const mockSearchResults = [
  { type: "Project", title: "Brand & Website Refresh", subtitle: "Northstar Studio • Active" },
  { type: "Task", title: "Define homepage structure", subtitle: "Medium priority • In Progress" },
  { type: "Document", title: "Brand & Website Refresh — Project Brief", subtitle: "Primary • Updated Oct 15" },
  { type: "Client", title: "Northstar Studio", subtitle: "1 project • Active" },
];

export const mockAssistantMessages = [
  {
    role: "user",
    content: "What needs attention on this project?",
  },
  {
    role: "assistant",
    content: "Two items need attention:\n\n• **Define homepage structure** is currently in progress\n• The project is still waiting on final content requirements from the client\n\nAll other tasks are on track. Would you like me to show the full task board?",
  },
];

export const stageStyles: Record<string, string> = {
  Qualified: "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20",
  Proposal: "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20",
  New: "bg-[var(--info)]/10 text-[var(--info)] border-[var(--info)]/20",
  Planning: "bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/20",
  "In Progress": "bg-[var(--info)]/10 text-[var(--info)] border-[var(--info)]/20",
  Review: "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20",
  Done: "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20",
};

export const priorityStyles: Record<string, string> = {
  High: "bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20",
  Medium: "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20",
  Low: "bg-[var(--info)]/10 text-[var(--info)] border-[var(--info)]/20",
};

export const taskStatusLabels: Record<string, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  BLOCKED: "Blocked",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const taskStatusTone: Record<string, string> = {
  TODO: "bg-[var(--info)]/10 text-[var(--info)] border-[var(--info)]/20",
  IN_PROGRESS: "bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/20",
  BLOCKED: "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20",
  COMPLETED: "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20",
  CANCELLED: "bg-[var(--muted)]/10 text-[var(--muted)] border-[var(--muted)]/20",
};

export const taskPriorityLabels: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};