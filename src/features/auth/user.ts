import type { Contributor, Group } from "../users/models/contributor";

export interface User extends Contributor {
  token?: string;
  group?: Group;
}

export interface UserResponse {
  uri: string;
  token: string;
  color?: string;
  email?: string;
  groups?: Group[];
  nickname?: string;
}