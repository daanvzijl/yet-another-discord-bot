import { asc, eq } from "drizzle-orm";
import type { Db } from "../db/client.ts";
import { guilds, streamAlerts, type StreamAlert } from "../db/schema.ts";
import type { Lookup } from "../interfaces/lookup.ts";

export interface NewAlert {
    twitchLogin: string;
    channelId: string;
    messageTemplate?: string | undefined;
}

export class AlertService {
    constructor(
        private readonly db: Db,
        private readonly lookup: Lookup,
    ) {}

    async create(input: NewAlert): Promise<StreamAlert> {
        const user = await this.lookup.findTwitchUser(input.twitchLogin);
        if (!user) throw new Error(`Twitch user not found: ${input.twitchLogin}`);

        const channel = await this.lookup.findDiscordChannel(input.channelId);
        if (!channel) throw new Error(`Discord channel not found or not in a guild: ${input.channelId}`);

        return this.db.transaction(async (tx) => {
            await tx.insert(guilds)
                .values({ id: channel.guildId, name: channel.guildName })
                .onConflictDoUpdate({ target: guilds.id, set: { name: channel.guildName } });

            const [alert] = await tx.insert(streamAlerts).values({
                guildId: channel.guildId,
                twitchUserId: user.id,
                twitchLogin: user.login,
                channelId: channel.id,
                messageTemplate: input.messageTemplate ?? null,
            }).returning();
            return alert!;
        });
    }

    async list(): Promise<StreamAlert[]> {
        return this.db.select().from(streamAlerts).orderBy(asc(streamAlerts.guildId), asc(streamAlerts.id));
    }

    async remove(id: number): Promise<boolean> {
        const deleted = await this.db.delete(streamAlerts).where(eq(streamAlerts.id, id)).returning({ id: streamAlerts.id });
        return deleted.length > 0;
    }

    async isEmpty(): Promise<boolean> {
        const rows = await this.db.select({ id: streamAlerts.id }).from(streamAlerts).limit(1);
        return rows.length === 0;
    }
}
