import * as program from "commander";
import { Command } from "./command";

export type CLIClient = {
  cli: program.Command;
  commands: { [key: string]: Command };
  errorOut: (e: Error) => void;
  getCliCommand: (name: string) => program.Command | null;
  getCommand: (name: string) => Command | null;
};
