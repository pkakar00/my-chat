import { WebSockMsg } from "@repo/backend-api";

export class WebSock {
  private connection: WebSocket;
  private queue: Array<WebSockMsg>;
  private constructor(link: string) {
    this.connection = new WebSocket(link);
    this.queue = [];
  }
  public addEventListener(
    event: "close" | "error" | "message" | "open",
    eventHandler: () => void
  ):void {
    this.connection.addEventListener(event, eventHandler);
  }
  public removeEventListener(
    event: "close" | "error" | "message" | "open",
    eventHandler: () => void
  ):void {
    this.connection.removeEventListener(event, eventHandler);
  }
  public getOpen():number{
    return this.connection.OPEN;
  }
  public getClose():number{
    return this.connection.CLOSED;
  }
  public close():void{
    this.connection.close();
  }
  public send(data:string):void{
    this.connection.send(data);
  }
}
