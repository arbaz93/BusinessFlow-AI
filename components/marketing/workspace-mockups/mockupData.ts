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
  summary: "Refresh Northstar Studio's brand and website with a stronger visual system, improved content hierarchy, and responsive experience before the next campaign launch.",
  requirements: [
    { title: "Define updated brand direction", description: "A refreshed brand direction aligned with the studio's positioning.", importance: "HIGH" },
    { title: "Ensure responsive mobile experience", description: "All pages must work across mobile, tablet, and desktop.", importance: "HIGH" },
    { title: "Restructure homepage content hierarchy", description: "The current homepage needs clearer information architecture.", importance: "MEDIUM" },
    { title: "WCAG 2.1 AA compliance", description: "Ensure accessibility standards are met throughout.", importance: "MEDIUM" },
    { title: "CMS integration for content management", description: "Content team needs to manage pages post-launch.", importance: "MEDIUM" },
  ],
  deliverables: [
    { title: "Brand direction documentation", description: "Color palette, typography, and component specifications." },
    { title: "Homepage redesign", description: "New homepage layout with improved hierarchy." },
    { title: "Responsive page layouts", description: "Mobile-first layouts for all key pages." },
    { title: "Design system documentation", description: "Component library and usage guidelines." },
    { title: "Developer handoff package", description: "Spec files and assets for implementation." },
  ],
  risks: [
    { title: "Content requirements may need clarification", description: "Client feedback on copy is still pending.", severity: "MEDIUM" },
    { title: "Existing visual system needs broader refinement", description: "Current brand assets may not fully support the new direction.", severity: "LOW" },
  ],
  gaps: [
    { question: "What is the target launch date?", text: "A firm timeline is needed to plan sprint allocation." },
    { question: "Which pages are included in the initial release?", text: "Knowing scope prevents over-engineering." },
  ],
  suggestedTasks: [
    { title: "Review brand positioning", priority: "HIGH", req: "Define updated brand direction", risk: "Existing visual system needs broader refinement" },
    { title: "Audit current website", priority: "HIGH", req: "Ensure responsive mobile experience", risk: null },
    { title: "Define homepage structure", priority: "MEDIUM", req: "Restructure homepage content hierarchy", risk: "Content requirements may need clarification" },
    { title: "Prepare visual direction", priority: "MEDIUM", req: "Define updated brand direction", risk: null },
    { title: "Build responsive page layouts", priority: "MEDIUM", req: "Ensure responsive mobile experience", risk: null },
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

export const importanceStyles: Record<string, string> = {
  HIGH: "text-[var(--danger)]",
  MEDIUM: "text-[var(--warning)]",
  LOW: "text-[var(--muted-foreground)]",
};

export const severityStyles: Record<string, string> = {
  HIGH: "text-[var(--danger)]",
  MEDIUM: "text-[var(--warning)]",
  LOW: "text-[var(--muted-foreground)]",
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