import { Hono } from 'hono';
import type { DrizzleDb } from '../db';

export type Bindings = {
  DB: D1Database;
  IMAGES: R2Bucket;
};

export type Variables = {
  db: DrizzleDb;
};

export type AppContext = {
  Bindings: Bindings;
  Variables: Variables;
};

export function createRoute() {
  return new Hono<AppContext>();
}