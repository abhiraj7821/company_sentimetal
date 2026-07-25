// src/graph/state.js
import { Annotation } from "@langchain/langgraph";

export const GraphAnnotation = Annotation.Root({
  company: Annotation({ default: () => "" }),
  task_queue: Annotation({ default: () => [] }),

  filing_data: Annotation({ default: () => "" }),
  news_data: Annotation({ default: () => "" }),
  sentiment_data: Annotation({ default: () => "" }),
  web_data: Annotation({ default: () => "" }),

  aggregated_findings: Annotation({ default: () => "" }),

  draft_report: Annotation({ default: () => "" }),
  critic_feedback: Annotation({ default: () => "" }),

  // The critic's OWN verdict on the current draft. ONLY critic.js writes
  // this. router.js's routeAfterCritic reads it to decide report_writer
  // (revise) vs human_approval (proceed) — it must NOT read approval_status
  // for that decision, since approval_status is reserved for the human.
  critic_verdict: Annotation({ default: () => "pending" }), // "pending" | "approved" | "revise"

  // Reserved EXCLUSIVELY for the human's decision. Only humanApproval.js
  // writes to this field. Previously the critic also wrote "approved"
  // here, which made the humanApproval UI card report "completed" the
  // instant the critic approved — before any human had actually reviewed
  // anything. critic_verdict above now carries the critic's own opinion;
  // this field only ever reflects what a human actually decided.
  approval_status: Annotation({ default: () => "pending" }), // "pending" | "approved" | "changes_requested"

  research_attempts: Annotation({ default: () => 0 }),
  revision_attempts: Annotation({ default: () => 0 }),

  messages: Annotation({
    reducer: (current, update) => current.concat(update),
    default: () => [],
  }),
});
