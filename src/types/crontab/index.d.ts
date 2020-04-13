declare module "crontab" {
  export class CronJob {
    isValid(): boolean;
    render(): string;
    clear(): void;
    minute: any;
    hour: any;
    dom: any;
    month: any;
    dow: any;
    command(c?: string): string;
    comment(c?: string): string;
  }
  export type JobsOptions = {
    command?: string;
    comment?: string;
  };
  export class CronTab {
    create(command: string, when: string, comment?: string);
    remove(jobs: CronJob[]);
    remove(jobs: JobsOptions);
    jobs(options?: JobsOptions): CronJob;
    save(callback: (err: Error, self: CronTab) => void): void;
  }
  export function load(callback: (err: Error, crontab: CronTab) => void): void;
}
