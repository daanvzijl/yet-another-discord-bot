import { bootstrap } from "./bootstrap.ts";
import { loadConfig } from "./config.ts";

const usage = `Usage:
  alert list
  alert add <twitch-login> <discord-channel-id> [message-template]
  alert remove <id>

Restart the bot afterwards to apply changes.`;

const [command, action, ...args] = process.argv.slice(2);
if (command !== "alert" || !action) {
    console.log(usage);
    process.exit(1);
}

const { alerts } = await bootstrap(loadConfig());

switch (action) {
    case "list": {
        const rows = await alerts.list();
        console.table(rows.map(({ id, guildId, twitchLogin, channelId, enabled, messageTemplate }) => (
            { id, guildId, twitchLogin, channelId, enabled, template: messageTemplate ?? "(default)" }
        )));
        break;
    }
    case "add": {
        const [twitchLogin, channelId, messageTemplate] = args;
        if (!twitchLogin || !channelId) {
            console.log(usage);
            process.exit(1);
        }
        const alert = await alerts.create({ twitchLogin, channelId, messageTemplate });
        console.log(`Created alert #${alert.id}: ${alert.twitchLogin} → ${alert.channelId} (guild ${alert.guildId})`);
        break;
    }
    case "remove": {
        const id = Number(args[0]);
        console.log(await alerts.remove(id) ? `Removed alert #${id}` : `No alert with id ${args[0]}`);
        break;
    }
    default:
        console.log(usage);
        process.exit(1);
}

process.exit(0);
