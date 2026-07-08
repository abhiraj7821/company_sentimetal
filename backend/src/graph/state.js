// src/graph/state.js
import { Annotation } from "@langchain/langgraph";

export const GraphAnnotation = Annotation.Root({
  company: Annotation({
    default: () => "",
  }),

  task_queue: Annotation({
    default: () => [],
  }),

  filing_data: Annotation({
    default: () => "",
  }),
  news_data: Annotation({
    default: () => "",
  }),
  sentiment_data: Annotation({
    default: () => "",
  }),
  web_data: Annotation({
    default: () => "",
  }),

  aggregated_findings: Annotation({
    default: () => "",
  }),

  draft_report: Annotation({
    default: () => "",
  }),
  critic_feedback: Annotation({
    default: () => "",
  }),
  approval_status: Annotation({
    default: () => "pending",
  }),
  research_attempts: Annotation({
    default: () => 0,
  }),
  // Tracks how many times the report has gone report_writer -> critic
  // -> REVISE. Without a cap, a critic response that never matches the
  // exact "APPROVED" string sends the graph into an infinite loop.
  revision_attempts: Annotation({
    default: () => 0,
  }),

  messages: Annotation({
    reducer: (current, update) => current.concat(update),
    default: () => [],
  }),
});
