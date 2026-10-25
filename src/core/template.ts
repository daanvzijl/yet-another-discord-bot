import type { StreamEvent } from "../interfaces/monitor.ts";

export const DEFAULT_TEMPLATE = "🔴 **{username}** is live — **{title}** ({game})\nhttps://twitch.tv/{username}";

export function renderTemplate(template: string | null, event: Pick<StreamEvent, "username" | "title" | "game">): string {
    return (template ?? DEFAULT_TEMPLATE)
        .replace(/\\n/g, "\n")
        .replace(/{username}/g, event.username)
        .replace(/{title}/g, event.title)
        .replace(/{game}/g, event.game);
}
