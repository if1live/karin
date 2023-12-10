import amqplib from "amqplib";
import { Liquid } from "liquidjs";
import * as settings from "../settings.js";

export * from "./rdbms.js";
export * from "./aws.js";

export const engine = new Liquid({
  root: settings.viewPath,
  extname: ".liquid",
  cache: settings.NODE_ENV === "production",
});

export const rabbit = await amqplib.connect(settings.RABBITMQ_URL);
export const channel = await rabbit.createChannel();
