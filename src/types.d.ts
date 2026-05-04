declare module "*.svg" {
  const content: string;
  export default content;
}

declare module "*.png" {
  const content: string;
  export default content;
}

declare module "*.jpg" {
  const content: string;
  export default content;
}

export interface OllamaStatus {
  installed: boolean;
  running: boolean;
  version: string | null;
}

export interface OllamaModel {
  name: string;
  size: number;
  modified_at: string;
  digest: string;
}

export interface PullProgress {
  status: string;
  completed: number | null;
  total: number | null;
}
