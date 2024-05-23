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
  public subscriptions: Map<string, string[]>; //userId, deviceId[]
  private reverseSubscriptions: Map<string, WSUser>; //deviceId, {userId, ws}

  private constructor() {
    this.subscriber = createClient({ url: process.env.REDIS_URL });
    this.publisher = createClient({ url: process.env.REDIS_URL });
    //TODO: add reconnection and buffering logic here?
    this.publisher.connect();
    this.subscriber.connect();
    this.subscriptions = new Map<string, string[]>(); //userId, deviceId[]
    this.reverseSubscriptions = new Map<string, WSUser>(); //deviceId, {userId, ws}
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new RedisSubscriptionManager();
    }
    return this.instance;
  }
  subscribe(userId: string, deviceId: string, ws: any) {
    this.subscriptions.set(userId, [
      ...(this.subscriptions.get(userId) || []),
      deviceId,
    ]);

    this.reverseSubscriptions.set(deviceId, { userId, ws });

    this.subscriber.subscribe(userId, (payload) => {
      try {
        console.log("inside try subscribe");

        const deviceIds = this.subscriptions.get(userId) || [];
        deviceIds.forEach((deviceId) => {
          const wsUserDetails = this.reverseSubscriptions.get(deviceId) || {
            userId: "",
            ws: {
              send: (payload: string) => {
                console.log(payload);
              },
            },
          };
          wsUserDetails.ws.send(payload);
        });
      } catch (error) {
        console.log("Error in subscription");
      }
    });
    console.log("step 3");
  }

  unsubscribe(deviceId: string, userId: string) {
    console.log("Unsubscribe block subsriptions");
    console.log(this.subscriptions);
    console.log("reverse-subsriptions");
    console.log(this.reverseSubscriptions);

    if (this.subscriptions.has(userId)) {
      let devices = this.subscriptions.get(userId) || [];
      devices = devices.filter((d) => d !== deviceId);
      console.log(devices);
      console.log("DEVICE=" + deviceId);
      this.subscriptions.set(userId, devices);
    }
    if (this.reverseSubscriptions.has(deviceId)) {
      this.reverseSubscriptions.delete(deviceId);
      this.subscriber.unsubscribe(userId);
      console.log("REDIS unsubsribe");
    }
    console.log("After cleanup");
    console.log("subsriptions");
    console.log(this.subscriptions);
    console.log("reverse-subsriptions");
    console.log(this.reverseSubscriptions);
  }

  async removeContact(userId: string, receiverId: string) {
    this.publish(userId, {
      type: "removed-contact",
      payload: {
        receiverId,
      },
    });
  }
  async addChatMessage(userId: string, data: ChatMsg) {
    this.publish(userId, {
      type: "message",
      payload: {
        data,
      },
    });
    console.log("Publish message");
  }

  async sendRequest(senderId: string, receiverId: string) {
    const recReqs = await getReceivedRequests(senderId);
    this.publish(receiverId, {
      type: "send-friend-request",
      payload: {
        receiverReq: recReqs,
      },
    });
    this.publish(senderId, {
      type: "request-operation-successful",
    });
  }
  async acceptRequest(senderId: string, receiverId: string) {
    const sentReqs = await getSentRequests(senderId);
    this.publish(receiverId, {
      type: "accept-friend-request",
      payload: {
        senderReq: sentReqs,
      },
    });
    this.publish(senderId, {
      type: "request-operation-successful",
    });
  }
  publish(userId: string, message: any) {
    console.log(`publishing message to ${userId}`);
    this.publisher.publish(userId, JSON.stringify(message));
  }
}
