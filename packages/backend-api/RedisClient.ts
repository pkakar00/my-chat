import type { RedisClientType } from "redis";
import { createClient } from "redis";
import { ChatMsg, getReceivedRequests, getSentRequests } from "./index.js";

interface WSUser {
  userId: string;
  ws: any;
}

export class RedisSubscriptionManager {
  private static instance: RedisSubscriptionManager;
  private subscriber: RedisClientType;
  public publisher: RedisClientType;
  public subscriptions: Map<string, string[]>; // userId, deviceId[]
  private reverseSubscriptions: Map<string, WSUser>; // deviceId, { userId, ws }
  private subscribedUserIds: Set<string>; // Track subscribed userIds

  private constructor() {
    this.subscriber = createClient({ url: process.env.REDIS_URL });
    this.publisher = createClient({ url: process.env.REDIS_URL });
    this.subscriptions = new Map<string, string[]>(); // userId, deviceId[]
    this.reverseSubscriptions = new Map<string, WSUser>(); // deviceId, { userId, ws }
    this.subscribedUserIds = new Set<string>(); // Track subscribed userIds

    this.connectRedisClients();
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new RedisSubscriptionManager();
    }
    return this.instance;
  }

  private async connectRedisClients() {
    try {
      await this.publisher.connect();
      await this.subscriber.connect();
    } catch (error) {
      console.error("Error connecting to Redis:", error);
      // Implement reconnection logic if needed
    }
  }

  subscribe(userId: string, deviceId: string, ws: any) {
    this.subscriptions.set(userId, [
      ...(this.subscriptions.get(userId) || []),
      deviceId,
    ]);

    this.reverseSubscriptions.set(deviceId, { userId, ws });

    if (!this.subscribedUserIds.has(userId)) {
      this.subscribedUserIds.add(userId);
      this.subscriber.subscribe(userId, (payload) => {
        try {
          console.log("Received message on subscription for user:", userId);

          const deviceIds = this.subscriptions.get(userId) || [];
          deviceIds.forEach((deviceId) => {
            const wsUserDetails = this.reverseSubscriptions.get(deviceId);
            if (wsUserDetails) {
              wsUserDetails.ws.send(payload);
            }
          });
        } catch (error) {
          console.error("Error handling subscription message:", error);
        }
      });
    }
  }

  unsubscribe(deviceId: string, userId: string) {
    if (this.subscriptions.has(userId)) {
      let devices = this.subscriptions.get(userId) || [];
      devices = devices.filter((d) => d !== deviceId);
      if (devices.length > 0) {
        this.subscriptions.set(userId, devices);
      } else {
        this.subscriptions.delete(userId);
        this.subscribedUserIds.delete(userId);
        this.subscriber.unsubscribe(userId);
      }
    }
    this.reverseSubscriptions.delete(deviceId);
  }

  async removeContact(userId: string, receiverId: string) {
    this.publish(userId, {
      type: "removed-contact",
      payload: { receiverId },
    });
  }

  async addChatMessage(userId: string, data: ChatMsg) {
    this.publish(userId, {
      type: "message",
      payload: { data },
    });
    console.log("Publish message");
  }

  async sendRequest(senderId: string, receiverId: string) {
    const recReqs = await getReceivedRequests(senderId);
    this.publish(receiverId, {
      type: "send-friend-request",
      payload: { receiverReq: recReqs },
    });
    this.publish(senderId, { type: "request-operation-successful" });
  }

  async acceptRequest(senderId: string, receiverId: string) {
    const sentReqs = await getSentRequests(senderId);
    this.publish(receiverId, {
      type: "accept-friend-request",
      payload: { senderReq: sentReqs },
    });
    this.publish(senderId, { type: "request-operation-successful" });
  }

  publish(userId: string, message: any) {
    console.log(`Publishing message to ${userId}`);
    this.publisher.publish(userId, JSON.stringify(message));
  }
}