import type { StreamEvent } from "../interfaces/monitor.ts";

export const DEFAULT_TEMPLATE = "🔴 **{username}** is live — **{title}** ({game})\nhttps://twitch.tv/{username}";

export function renderTemplate(template: string | null, event: Pick<StreamEvent, "username" | "title" | "game">): string {
    // a replacer function, so `$` in values isn't treated as a replacement pattern, and values are never re-scanned
    return (template ?? DEFAULT_TEMPLATE)
        .replace(/\\n/g, "\n")
        .replace(/{(username|title|game)}/g, (_, key: "username" | "title" | "game") => event[key]);
}
