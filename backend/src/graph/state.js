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

  // The critic's OWN verdict on the draft — separate from whether a human
  // has approved the final report. Previously both were conflated into
  // `approval_status`, which made the humanApproval UI card show
  // "completed" the instant the critic approved, even before any human
  // had actually reviewed anything.
  critic_verdict: Annotation({ default: () => "pending" }), // "pending" | "approved"

  // Reserved EXCLUSIVELY for the human's decision now. Only humanApproval.js
  // writes to this field.
  approval_status: Annotation({ default: () => "pending" }), // "pending" | "approved" | "changes_requested"

  research_attempts: Annotation({ default: () => 0 }),
  revision_attempts: Annotation({ default: () => 0 }),

  messages: Annotation({
    reducer: (current, update) => current.concat(update),
    default: () => [],
  }),
});
