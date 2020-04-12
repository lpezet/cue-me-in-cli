import { defaultTo } from "lodash";

interface CueMeInErrorOptions {
  children?: unknown[];
  context?: unknown;
  exit?: number;
  original?: Error;
  status?: number;
}

const DEFAULT_CHILDREN: NonNullable<CueMeInErrorOptions["children"]> = [];
const DEFAULT_EXIT: NonNullable<CueMeInErrorOptions["exit"]> = 1;
const DEFAULT_STATUS: NonNullable<CueMeInErrorOptions["status"]> = 500;

export class CueMeInError extends Error {
  readonly children: unknown[];
  readonly context: unknown | undefined;
  readonly exit: number;
  readonly message: string;
  readonly name = "CueMeInError";
  readonly original: Error | undefined;
  readonly status: number;

  constructor(message: string, options: CueMeInErrorOptions = {}) {
    super();

    this.children = defaultTo(options.children, DEFAULT_CHILDREN);
    this.context = options.context;
    this.exit = defaultTo(options.exit, DEFAULT_EXIT);
    this.message = message;
    this.original = options.original;
    this.status = defaultTo(options.status, DEFAULT_STATUS);
  }
}
