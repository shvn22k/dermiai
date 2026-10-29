/** Conversation states from the handoff. In the real flow these come from the SSE streams. */
export const CONSULT_MODES = ["default", "camera", "analyzing", "closing", "redflag"] as const;
export type ConsultMode = (typeof CONSULT_MODES)[number];
