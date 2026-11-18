


export interface Group {
  id: string;
  label: string;
  shorthand?: string;
}

export interface Contributor {
  uri: string;
  name?: string;
  email?: string;
  initials?: string;
  color?: string;
  frequency?: number;
  groups?: Group[];
}

