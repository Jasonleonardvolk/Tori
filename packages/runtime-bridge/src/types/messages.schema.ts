/**
 * WebSocket message schema definitions using Zod
 * 
 * These schemas can be shared between client and server
 * to ensure type safety for WebSocket communication.
 */

import { z } from 'zod';

/**
 * Base message schema
 */
export const BaseMessageSchema = z.object({
  v: z.number().default(1),
  kind: z.string(),
  timestamp: z.number().default(() => Date.now()),
  payload: z.any().optional(),
  id: z.string().optional(),
  correlationId: z.string().optional(),
});

/**
 * Ping message schema
 */
export const PingMessageSchema = BaseMessageSchema.extend({
  kind: z.literal('ping'),
  payload: z.object({
    timestamp: z.number(),
  }),
});

/**
 * Ping response message schema
 */
export const PingResponseMessageSchema = BaseMessageSchema.extend({
  kind: z.literal('ping_response'),
  payload: z.object({
    receivedAt: z.number(),
    respondedAt: z.number().default(() => Date.now()),
  }),
});

/**
 * User message schema
 */
export const UserMessageSchema = BaseMessageSchema.extend({
  kind: z.literal('user_msg'),
  payload: z.object({
    text: z.string(),
    metadata: z.record(z.any()).optional(),
  }),
});

/**
 * Assistant message schema
 */
export const AssistantMessageSchema = BaseMessageSchema.extend({
  kind: z.literal('assistant_msg'),
  payload: z.object({
    text: z.string(),
    concepts: z.array(z.string()).optional(),
    metadata: z.record(z.any()).optional(),
  }),
});

/**
 * Error message schema
 */
export const ErrorMessageSchema = BaseMessageSchema.extend({
  kind: z.literal('error'),
  payload: z.object({
    code: z.number(),
    message: z.string(),
    details: z.any().optional(),
  }),
});

/**
 * Union of all message schemas
 */
export const MessageSchema = z.discriminatedUnion('kind', [
  PingMessageSchema,
  PingResponseMessageSchema,
  UserMessageSchema,
  AssistantMessageSchema,
  ErrorMessageSchema,
]);

/**
 * Type definitions from schemas
 */
export type BaseMessage = z.infer<typeof BaseMessageSchema>;
export type PingMessage = z.infer<typeof PingMessageSchema>;
export type PingResponseMessage = z.infer<typeof PingResponseMessageSchema>;
export type UserMessage = z.infer<typeof UserMessageSchema>;
export type AssistantMessage = z.infer<typeof AssistantMessageSchema>;
export type ErrorMessage = z.infer<typeof ErrorMessageSchema>;
export type Message = z.infer<typeof MessageSchema>;

/**
 * Validate a message against the schema
 * 
 * @param data Message data to validate
 * @returns Validated message or null if invalid
 */
export function validateMessage(data: unknown): Message | null {
  try {
    return MessageSchema.parse(data);
  } catch (error) {
    console.error('Message validation failed:', error);
    return null;
  }
}
