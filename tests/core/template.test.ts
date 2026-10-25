import { expect, test } from "bun:test";
import { DEFAULT_TEMPLATE, renderTemplate } from "../../src/core/template.ts";

const event = { username: "John", title: "coding session", game: "Just Chatting" };

test("uses the default template when none is set", () => {
    expect(renderTemplate(null, event)).toBe(renderTemplate(DEFAULT_TEMPLATE, event));
    expect(renderTemplate(null, event)).toContain("https://twitch.tv/John");
});

test("inserts values literally", () => {
    const tricky = { username: "{title}", title: "Win $$$ and $& more", game: "$1" };
    expect(renderTemplate("{username} {title} {game}", tricky)).toBe("{title} Win $$$ and $& more $1");
});

test("replaces all placeholders and escaped newlines", () => {
    expect(renderTemplate("{username} {username}\\n{title} ({game})", event)).toBe("John John\ncoding session (Just Chatting)");
});
