import { supabase } from "@/lib/supabase/client";

export type PresenceEntry = {
  user?: {
    id?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type PresenceState = Record<string, PresenceEntry[]>;

export type PresenceDiffPayload = {
  key: string;
  newPresences?: PresenceEntry[];
  leftPresences?: PresenceEntry[];
};

export type PresenceHandler = (
  connectedUsers: number,
  state?: PresenceState,
) => void;

export type DocUpdatePayload = {
  type: string;
  content?: string;
  meta?: Record<string, unknown>;
};

export interface RealtimeChannel {
  // "on" is used with presence events in this file. Provide overloads for
  // the specific presence event shapes we use.
  on(
    eventSource: "presence",
    opts: { event: "sync" },
    callback: () => void,
  ): RealtimeChannel;
  on(
    eventSource: "presence",
    opts: { event: "join" | "leave" },
    callback: (payload: PresenceDiffPayload) => void,
  ): RealtimeChannel;
  on(
    eventSource: "broadcast",
    opts: { event: string },
    callback: (payload: { payload?: DocUpdatePayload }) => void,
  ): RealtimeChannel;

  // Methods used below
  presenceState(): PresenceState;
  subscribe(): void;
  send(message: { type: string; event?: string; payload?: unknown }): void;
  unsubscribe(): void;
  track(payload: PresenceEntry): void;
}

class ChannelService {
  constructor(private client: typeof supabase) {}

  async createPresenceChannel(
    docUrl: string,
    presenceKey?: string,
  ): Promise<RealtimeChannel | null> {
    if (presenceKey) {
      return this.client.channel(`presence:${docUrl}`, {
        config: { presence: { key: `${presenceKey}` } },
      });
    }

    const { data } = await this.client.auth.getUser();
    const user = data?.user;

    if (!user) {
      console.error(
        "No authenticated user and no presenceKey provided — cannot create presence channel",
      );
      return null;
    }

    return this.client.channel(`presence:${docUrl}`, {
      config: { presence: { key: `${user.id}` } },
    });
  }

  subscribeToPresence(
    channel: RealtimeChannel,
    onStateChange?: PresenceHandler,
  ) {
    if (!channel) return null;

    channel.on("presence", { event: "sync" }, () => {
      const state: PresenceState = channel.presenceState();

      const allPresences = Object.values(state) as PresenceEntry[][];
      const flat = allPresences.flat?.() ?? ([] as PresenceEntry[]);
      const userIds = new Set(
        flat.map((p: PresenceEntry) => p.user?.id).filter(Boolean),
      );
      const uniqueUserCount = userIds.size || 0;

      const sessionCount = Object.keys(state).length;
      const connectedCount =
        uniqueUserCount > 0 ? uniqueUserCount : sessionCount;

      if (onStateChange) onStateChange(connectedCount, state);
    });

    channel.on(
      "presence",
      { event: "join" },
      (payload: PresenceDiffPayload) => {
        const { key, newPresences } = payload || {};
        console.log("Presence join:", key, newPresences);
      },
    );

    channel.on(
      "presence",
      { event: "leave" },
      (payload: PresenceDiffPayload) => {
        const { key, leftPresences } = payload || {};
        console.log("Presence leave:", key, leftPresences);
      },
    );

    channel.subscribe();

    return channel;
  }

  broadcastDocUpdate(channel: RealtimeChannel, payload: DocUpdatePayload) {
    if (!channel) return;
    channel.send({ type: "broadcast", event: "doc:update", payload });
  }

  closeChannel(channel: RealtimeChannel) {
    if (!channel) return;
    try {
      channel.unsubscribe();
    } catch (e) {
      console.warn("Failed to unsubscribe channel", e);
    }
  }
}

const channelService = new ChannelService(supabase);

export const createPresenceChannel = (docUrl: string, presenceKey?: string) =>
  channelService.createPresenceChannel(docUrl, presenceKey);
export const subscribeToPresence = (
  channel: RealtimeChannel,
  onStateChange?: PresenceHandler,
) => channelService.subscribeToPresence(channel, onStateChange);
export const broadcastDocUpdate = (
  channel: RealtimeChannel,
  payload: DocUpdatePayload,
) => channelService.broadcastDocUpdate(channel, payload);
export const closeChannel = (channel: RealtimeChannel) =>
  channelService.closeChannel(channel);
