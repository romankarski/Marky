export interface FileNode {
  name: string;
  type: 'file' | 'dir';
  path: string;      // relative to ROOT_DIR, forward-slash separated
  children?: FileNode[]; // only present when type === 'dir'
}

export interface ListResponse {
  items: FileNode[];
}

export interface FileContentResponse {
  content: string;
}

export interface ApiError {
  error: string;
  code: string;
}

export interface CreateFileBody {
  content?: string;
}

export interface WriteFileBody {
  content?: string;
  newPath?: string;
}
