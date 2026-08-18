import { create } from "zustand";
import type { WorldBuilding } from "./types";

interface InputState { forward: boolean; back: boolean; left: boolean; right: boolean; run: boolean; jump: boolean }
interface WorldState {
  player: { x: number; y: number; z: number };
  selected: WorldBuilding | null;
  teleport: { x: number; z: number } | null;
  input: InputState;
  remotePlayers: Record<string,{userId:string;username:string;x:number;y:number;z:number;rotationY:number;movement:string}>;
  setPlayer: (player: WorldState["player"]) => void;
  select: (building: WorldBuilding | null) => void;
  teleportTo: (x: number, z: number) => void;
  consumeTeleport: () => void;
  setInput: (key: keyof InputState, value: boolean) => void;
  upsertRemote: (player: WorldState["remotePlayers"][string]) => void;
  removeRemote: (userId:string) => void;
}
export const useWorldStore = create<WorldState>((set) => ({
  player: { x: 0, y: 1, z: 14 }, selected: null, teleport: null, remotePlayers: {},
  input: { forward: false, back: false, left: false, right: false, run: false, jump: false },
  setPlayer: (player) => set({ player }), select: (selected) => set({ selected }), teleportTo: (x, z) => set({ teleport: { x, z } }), consumeTeleport: () => set({ teleport: null }),
  setInput: (key, value) => set((state) => ({ input: { ...state.input, [key]: value } })),
  upsertRemote: (player) => set((state) => ({ remotePlayers: { ...state.remotePlayers, [player.userId]: player } })),
  removeRemote: (userId) => set((state) => { const remotePlayers={...state.remotePlayers};delete remotePlayers[userId];return{remotePlayers}; }),
}));
