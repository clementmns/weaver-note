import debug from "debug";
import { EventEmitter } from "events";
import Y from "@/lib/yjs";
import * as awarenessProtocol from "y-protocols/awareness";
import { int4ToUint8Array } from "@/lib/utils";
import { SupabaseClient } from "@supabase/supabase-js";
import { RealtimeChannel } from "@supabase/supabase-js";
import { REALTIME_LISTEN_TYPES } from "@supabase/supabase-js";

export interface SupabaseProviderConfig {
  channel: string;
  tableName: string;
  columnName: string;
  idName?: string;
  id: string | number;
  awareness?: awarenessProtocol.Awareness;
  resyncInterval?: number | false;
  batchInterval?: number | false;
}

export default class SupabaseProvider extends EventEmitter {
  public awareness: awarenessProtocol.Awareness;
  public connected = false;
  private channel: RealtimeChannel | null = null;

  private _synced: boolean = false;
  private resyncInterval: NodeJS.Timeout | undefined;
  private batchTimeout: NodeJS.Timeout | undefined;
  protected logger: debug.Debugger;
  public readonly id: number;

  public version: number = 0;
  private messageQueue: Uint8Array[] = [];

  isOnline(online?: boolean): boolean {
    if (!online && online !== false) return this.connected;
    this.connected = online;
    return this.connected;
  }

  onDocumentUpdate(update: Uint8Array, origin: unknown) {
    if (origin !== this) {
      this.logger(
        "document updated locally, broadcasting update to peers",
        this.isOnline(),
      );

      this.version++;

      this.emit("message", update);

      if (this.isOnline()) {
        clearTimeout(this._debounceTimeout);
        this._debounceTimeout = setTimeout(() => {
          this.save();
        }, 1000);
      }
    }
  }

  private _debounceTimeout: NodeJS.Timeout | undefined;

  onAwarenessUpdate({
    added,
    updated,
    removed,
  }: {
    added: number[];
    updated: number[];
    removed: number[];
  }) {
    const changedClients = added.concat(updated).concat(removed);
    const awarenessUpdate = awarenessProtocol.encodeAwarenessUpdate(
      this.awareness,
      changedClients,
    );
    this.emit("awareness", awarenessUpdate);
  }

  removeSelfFromAwarenessOnUnload() {
    awarenessProtocol.removeAwarenessStates(
      this.awareness,
      [this.doc.clientID],
      "window unload",
    );
  }

  async save() {
    try {
      const update = Y.encodeStateAsUpdate(this.doc);

      const content = Array.from(update);

      const { error } = await this.supabase
        .from(this.config.tableName)
        .update({ [this.config.columnName]: content })
        .eq(this.config.idName || "id", this.config.id);

      if (error) {
        console.error("SupabaseProvider: error saving to Supabase", error);

        const { error: insertError } = await this.supabase
          .from(this.config.tableName)
          .insert({
            [this.config.idName || "id"]: this.config.id,
            [this.config.columnName]: content,
          });

        if (insertError) {
          console.error("SupabaseProvider: insert also failed", insertError);
          throw insertError;
        }
      }

      this.emit("save", this.version);
    } catch (err) {
      console.error("SupabaseProvider: save failed with exception", err);
      throw err;
    }
  }

  private async onConnect() {
    this.logger("connected");

    const { data, status } = await this.supabase
      .from(this.config.tableName)
      .select<string, Record<string, unknown>>(`${this.config.columnName}`)
      .eq(this.config.idName || "id", this.config.id)
      .single();

    console.log(
      "retrieved data from supabase",
      status,
      data?.[this.config.columnName],
    );

    if (data && data[this.config.columnName]) {
      this.logger("applying update to yjs");
      try {
        // Convert int4[] PostgreSQL array to Uint8Array
        const contentArray = data[this.config.columnName];
        const uint8Array = int4ToUint8Array(contentArray);

        this.applyUpdate(uint8Array);
      } catch (error) {
        console.error("Error decoding or applying update:", error);
        this.logger("Error data type:", typeof data[this.config.columnName]);
        this.logger("Error data:", data[this.config.columnName]);
      }
    }

    this.logger("setting connected flag to true");
    this.isOnline(true);

    this.emit("status", [{ status: "connected" }]);

    if (this.awareness.getLocalState() !== null) {
      const awarenessUpdate = awarenessProtocol.encodeAwarenessUpdate(
        this.awareness,
        [this.doc.clientID],
      );
      this.emit("awareness", awarenessUpdate);
    }
  }

  private applyUpdate(update: Uint8Array, origin?: unknown) {
    this.version++;
    Y.applyUpdate(this.doc, update, origin);
  }

  private disconnect() {
    if (this.channel) {
      this.supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }

  private connect() {
    this.channel = this.supabase.channel(this.config.channel);
    if (this.channel) {
      this.channel
        .on(
          REALTIME_LISTEN_TYPES.BROADCAST,
          { event: "message" },
          ({ payload }) => {
            if (payload && Array.isArray(payload) && payload.length > 0) {
              this.onMessage(int4ToUint8Array(payload), this);
            } else {
              console.warn(
                "SupabaseProvider: received empty broadcast message",
              );
            }
          },
        )
        .on(
          REALTIME_LISTEN_TYPES.BROADCAST,
          { event: "awareness" },
          ({ payload }) => {
            if (payload && Array.isArray(payload) && payload.length > 0) {
              this.onAwareness(int4ToUint8Array(payload));
            }
          },
        )
        .subscribe((status, err) => {
          if (status === "SUBSCRIBED") {
            this.emit("connect", this);
          }

          if (status === "CHANNEL_ERROR") {
            console.error("SupabaseProvider: channel error", err);
            this.logger("CHANNEL_ERROR", err);
            this.emit("error", this);
          }

          if (status === "TIMED_OUT") {
            console.warn("SupabaseProvider: channel connection timed out");
            this.emit("disconnect", this);
          }

          if (status === "CLOSED") {
            console.warn("SupabaseProvider: channel closed");
            this.emit("disconnect", this);
          }
        });
    }
  }

  private sendMessageBatch() {
    if (this.channel && this.messageQueue.length > 0) {
      try {
        const mergedUpdate = Y.mergeUpdates(this.messageQueue);
        const payload = Array.from(mergedUpdate);
        this.channel.send({
          type: "broadcast",
          event: "message",
          payload,
        });
        this.messageQueue = [];
        this.logger("Batch sent successfully");
      } catch (error) {
        console.error("Error merging updates for batch:", error);
        this.logger("Error merging updates for batch", error);
      }
    }
  }

  constructor(
    private doc: Y.Doc,
    private supabase: SupabaseClient,
    private config: SupabaseProviderConfig,
  ) {
    super();

    this.awareness =
      this.config.awareness || new awarenessProtocol.Awareness(doc);

    this.config = config || {};
    this.id = doc.clientID;

    this.supabase = supabase;
    this.on("connect", this.onConnect);
    this.on("disconnect", this.onDisconnect);

    this.logger = debug("y-" + doc.clientID);
    // turn on debug logging to the console
    this.logger.enabled = true;

    this.logger("constructor initializing");
    this.logger("connecting to Supabase Realtime", doc.guid);

    if (
      this.config.resyncInterval ||
      typeof this.config.resyncInterval === "undefined"
    ) {
      if (this.config.resyncInterval && this.config.resyncInterval < 3000) {
        throw new Error("resync interval of less than 3 seconds");
      }
      this.logger(
        `setting resync interval to every ${(this.config.resyncInterval || 5000) / 1000} seconds`,
      );
      this.resyncInterval = setInterval(() => {
        this.logger("resyncing (resync interval elapsed)");
        this.emit("message", Y.encodeStateAsUpdate(this.doc));
        if (this.channel)
          this.channel.send({
            type: "broadcast",
            event: "message",
            payload: Array.from(Y.encodeStateAsUpdate(this.doc)),
          });
      }, this.config.resyncInterval || 5000);
    }

    if (
      this.config.batchInterval ||
      typeof this.config.batchInterval === "undefined"
    ) {
      if (this.config.batchInterval && this.config.batchInterval < 1000) {
        throw new Error("batch interval of less than 1 second");
      }
      this.logger(
        `setting batch interval to every ${(this.config.batchInterval || 500) / 1000} seconds`,
      );
      this.batchTimeout = setInterval(() => {
        this.logger("sending message batch (batch interval elapsed)");
        this.sendMessageBatch();
      }, this.config.batchInterval || 500);
    }

    if (typeof window !== "undefined") {
      window.addEventListener(
        "beforeunload",
        this.removeSelfFromAwarenessOnUnload,
      );
    } else if (typeof process !== "undefined") {
      process.on("exit", () => this.removeSelfFromAwarenessOnUnload);
    }
    this.on("awareness", (update) => {
      if (this.channel)
        this.channel.send({
          type: "broadcast",
          event: "awareness",
          payload: Array.from(update),
        });
    });
    this.on("message", (update) => {
      if (this.channel) {
        this.messageQueue.push(update);
      } else {
        console.error(
          "SupabaseProvider: Cannot queue message, channel is null",
        );
      }
    });

    this.connect();
    this.doc.on("update", this.onDocumentUpdate.bind(this));
    this.awareness.on("update", this.onAwarenessUpdate.bind(this));
  }

  get synced() {
    return this._synced;
  }

  set synced(state) {
    if (this._synced !== state) {
      this.logger("setting sync state to " + state);
      this._synced = state;
      this.emit("synced", [state]);
      this.emit("sync", [state]);
    }
  }

  public onConnecting() {
    if (!this.isOnline()) {
      this.logger("connecting");
      this.emit("status", [{ status: "connecting" }]);
    }
  }

  public onDisconnect() {
    this.logger("disconnected");

    this.synced = false;
    this.isOnline(false);
    this.logger("set connected flag to false");
    if (this.isOnline()) {
      this.emit("status", [{ status: "disconnected" }]);
    }

    const states = Array.from(this.awareness.getStates().keys()).filter(
      (client) => client !== this.doc.clientID,
    );
    awarenessProtocol.removeAwarenessStates(this.awareness, states, this);
  }

  public onMessage(message: Uint8Array, origin: unknown) {
    if (!this.isOnline()) return;
    try {
      this.applyUpdate(message, this);

      this.synced = true;

      this.emit("update", [message, origin]);
    } catch (err) {
      console.error("Error applying remote update:", err);
      this.logger(err);
    }
  }

  public onAwareness(message: Uint8Array) {
    awarenessProtocol.applyAwarenessUpdate(this.awareness, message, this);
  }

  public onAuth(message: Uint8Array) {
    this.logger(`received ${message.byteLength} bytes from peer: ${message}`);

    if (!message) {
      this.logger(`Permission denied to channel`);
    }
    this.logger("processed message (type = MessageAuth)");
  }

  public destroy() {
    this.logger("destroying");

    if (this.resyncInterval) {
      clearInterval(this.resyncInterval);
    }

    if (this.batchTimeout) {
      clearInterval(this.batchTimeout);
    }

    if (typeof window !== "undefined") {
      window.removeEventListener(
        "beforeunload",
        this.removeSelfFromAwarenessOnUnload,
      );
    } else if (typeof process !== "undefined") {
      process.off("exit", () => this.removeSelfFromAwarenessOnUnload);
    }

    this.awareness.off("update", this.onAwarenessUpdate);
    this.doc.off("update", this.onDocumentUpdate);

    if (this.channel) this.disconnect();
  }
}
