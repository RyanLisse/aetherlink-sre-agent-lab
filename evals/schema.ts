import { z } from "zod";
/** The agent's output contract: what a diagnosis must contain. The agent proposes; it never executes. */
export const Diagnosis = z.object({
  incident: z.string(),
  service: z.string(),
  root_cause: z.object({
    category: z.enum(["config-change", "bad-deploy", "resource-leak", "upstream-dependency", "certificate", "capacity", "unknown"]),
    summary: z.string().min(20),
    trigger_deploy: z.string().nullable(),
  }),
  evidence: z.array(z.object({ log_id: z.string().regex(/^L\d{4}$/), quote: z.string() })).min(2),
  ruled_out: z.array(z.object({ hypothesis: z.string(), why: z.string() })),
  proposed_action: z.object({ runbook: z.string(), step: z.string(), executes: z.literal(false), needs_approval_from: z.string() }),
  confidence: z.enum(["low", "medium", "high"]),
  open: z.array(z.string()),
});
export type Diagnosis = z.infer<typeof Diagnosis>;
