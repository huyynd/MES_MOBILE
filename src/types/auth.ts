export interface Role {
  id: number;
  name: string;
  is_admin: boolean;
  permissions?: Record<string, any>;
}

export interface User {
  id: number;
  username: string;
  full_name: string;
  status: string;
  team?: string;
  linked_worker?: string;
  employee_code?: string;
  role_id?: number;
  role_name?: string;
  is_admin: boolean;
  permissions: Record<string, any>;
}

export interface LoginResponse {
  token: string;
  user: User;
}
