import { LeveldbPersistence } from "y-leveldb";

export const persistence = new LeveldbPersistence('./storage');
