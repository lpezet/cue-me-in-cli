export type CueType = {
  id: string;
  what: string;
  how: string;
  deleted: boolean;
  createdAt: number;
  updatedAt?: number;
  deletedAt?: number;
};

export type CueStateType = {
  id: string;
  state: string;
  updatedAt: number;
};

export type CueStateMapType = {
  [key: string]: CueStateType;
};
