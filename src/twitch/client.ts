import { AppTokenAuthProvider } from "@twurple/auth";
import { ApiClient } from "@twurple/api";
import { config } from "../config.ts";

const authProvider = new AppTokenAuthProvider(
    config.twitch.clientId,
    config.twitch.clientSecret,
);

export const apiClient = new ApiClient({ authProvider });
