import api from './api';

// ── Departments ─────────────────────────────────────────────────────

export async function getDepartmentTree() {
  return api.get('/sys/departments/tree');
}

// Aliases used by DepartmentTabs and register pages
export { getDepartmentTree as getDepartments };

export async function createDepartment(data: {
  name: string;
  code: string;
  parentId?: number | null;
  sortOrder?: number;
}) {
  return api.post('/sys/departments', data);
}

export async function updateDepartment(id: number, data: {
  name?: string;
  code?: string;
  parentId?: number | null;
  sortOrder?: number;
}) {
  return api.put(`/sys/departments/${id}`, data);
}

export async function deleteDepartment(id: number) {
  return api.delete(`/sys/departments/${id}`);
}

// Alias used by DepartmentTabs
export { deleteDepartment as removeDepartment };

// ── Roles ───────────────────────────────────────────────────────────

export async function getRoles() {
  return api.get('/sys/roles');
}

export async function createRole(data: {
  code: string;
  name: string;
  description?: string;
}) {
  return api.post('/sys/roles', data);
}

export async function updateRole(id: number, data: {
  code?: string;
  name?: string;
  description?: string;
}) {
  return api.put(`/sys/roles/${id}`, data);
}

export async function deleteRole(id: number) {
  return api.delete(`/sys/roles/${id}`);
}

// ── Users (paginated) ───────────────────────────────────────────────

export async function getUsers(params: { pageNum?: number; pageSize?: number; keyword?: string } = {}) {
  return api.get('/sys/users', { params });
}

export async function createUser(data: Record<string, any>) {
  return api.post('/sys/users', data);
}

export async function updateUser(id: number, data: Record<string, any>) {
  return api.put(`/sys/users/${id}`, data);
}

export async function deleteUser(id: number) {
  return api.delete(`/sys/users/${id}`);
}

// ── Role Members ──────────────────────────────────────────────────

export async function getMembers(roleId: string) {
  return api.get('/sys/roles/members', { params: { roleId } });
}

export async function addMember(roleId: string, userId: string) {
  return api.post(`/sys/roles/${roleId}/members`, { userId });
}

export async function removeMember(userId: string) {
  return api.delete(`/sys/roles/members/${userId}`);
}

// ── Permissions ───────────────────────────────────────────────────

export interface PermissionEntry {
  id: string;
  name: string;
  code: string;
  type: string;
  enabled: boolean;
}

export async function getPermissions(roleId: string) {
  return api.get(`/sys/roles/${roleId}/permissions`);
}

export async function updatePermissions(roleId: string, data: { permissionIds: string[] }) {
  return api.put(`/sys/roles/${roleId}/permissions`, data);
}

// ── System Params ─────────────────────────────────────────────────

export interface SystemParam {
  id: string;
  key: string;
  value: string;
  description?: string;
}

export async function getSystemParams() {
  return api.get('/sys/params');
}

export async function updateSystemParams(data: Record<string, any>) {
  return api.put('/sys/params', data);
}

// ── Notification Settings ───────────────────────────────────────────

export async function getNotificationSettings() {
  return api.get('/notifications/settings');
}

export async function updateNotificationSettings(data: Record<string, any>) {
  return api.put('/notifications/settings', data);
}

// ── Module Library ──────────────────────────────────────────────────

export async function getModuleCategories() {
  return api.get('/config/modules/categories');
}

export async function getModules(categoryId?: number) {
  return api.get('/config/modules', { params: categoryId ? { categoryId } : {} });
}

export async function getModuleSpecs(moduleId: number) {
  return api.get(`/config/modules/${moduleId}/specs`);
}

export async function getSpecParams(specId: number) {
  return api.get(`/config/modules/specs/${specId}/params`);
}

export async function publishSpec(specId: number) {
  return api.post(`/config/modules/specs/${specId}/publish`);
}

// ── Order Config ────────────────────────────────────────────────────

export async function getOrderCategories() {
  return api.get('/config/orders/categories');
}

export async function getOrderProducts(categoryId?: number) {
  return api.get('/config/orders/products', { params: categoryId ? { categoryId } : {} });
}

// ── Role Permissions (4-dimension) ───────────────────────────────

export interface RolePermission {
  id: string;
  roleId: string;
  permType: 'function' | 'data' | 'app' | 'menu';
  permCode: string;
  permValue?: boolean | string | string[];
}

export async function getRolePermissions(roleId: string, permType?: string) {
  return api.get(`/sys/roles/${roleId}/permissions`, { params: permType ? { permType } : {} });
}

export async function updateRolePermissions(roleId: string, permType: string, permissions: { permCode: string; permValue?: boolean | string | string[] }[]) {
  return api.put(`/sys/roles/${roleId}/permissions/${permType}`, { permissions });
}

// ── Menu Management ──────────────────────────────────────────────

export interface MenuItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  parentId?: string | null;
  icon?: string;
  link?: string;
  page?: string;
  sortOrder: number;
  status: number;
  type: 'menu' | 'button' | 'link';
  children?: MenuItem[];
}

export async function getMenuTree() {
  return api.get('/sys/menus/tree');
}

export async function createMenuItem(data: Partial<MenuItem>) {
  return api.post('/sys/menus', data);
}

export async function updateMenuItem(id: string, data: Partial<MenuItem>) {
  return api.put(`/sys/menus/${id}`, data);
}

export async function deleteMenuItem(id: string) {
  return api.delete(`/sys/menus/${id}`);
}

export async function assignMenusToRole(roleId: string, menuIds: string[]) {
  return api.put(`/sys/roles/${roleId}/menus`, { menuIds });
}

// ── Dictionary Management ────────────────────────────────────────

export interface Dictionary {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: number;
}

export interface DictionaryValue {
  id: string;
  dictId: string;
  code: string;
  value: string;
  link?: string;
  type?: string;
  language?: string;
  sortOrder: number;
  status: number;
}

export async function getDictionaries() {
  return api.get('/sys/dictionaries');
}

export async function createDictionary(data: Partial<Dictionary>) {
  return api.post('/sys/dictionaries', data);
}

export async function updateDictionary(id: string, data: Partial<Dictionary>) {
  return api.put(`/sys/dictionaries/${id}`, data);
}

export async function deleteDictionary(id: string) {
  return api.delete(`/sys/dictionaries/${id}`);
}

export async function getDictionaryValues(dictId: string) {
  return api.get(`/sys/dictionaries/${dictId}/values`);
}

export async function createDictionaryValue(dictId: string, data: Partial<DictionaryValue>) {
  return api.post(`/sys/dictionaries/${dictId}/values`, data);
}

export async function updateDictionaryValue(dictId: string, valueId: string, data: Partial<DictionaryValue>) {
  return api.put(`/sys/dictionaries/${dictId}/values/${valueId}`, data);
}

export async function deleteDictionaryValue(dictId: string, valueId: string) {
  return api.delete(`/sys/dictionaries/${dictId}/values/${valueId}`);
}

// ── Data Permission ──────────────────────────────────────────────

export interface DataPermission {
  id: string;
  code: string;
  description: string;
  type: 'field' | 'record' | 'function';
  optional: boolean;
  status: number;
}

export async function getDataPermissions() {
  return api.get('/sys/data-permissions');
}

export async function createDataPermission(data: Partial<DataPermission>) {
  return api.post('/sys/data-permissions', data);
}

export async function updateDataPermission(id: string, data: Partial<DataPermission>) {
  return api.put(`/sys/data-permissions/${id}`, data);
}

export async function deleteDataPermission(id: string) {
  return api.delete(`/sys/data-permissions/${id}`);
}

// ── App Authorization ────────────────────────────────────────────

export interface AppAuthorization {
  id: string;
  keyName: string;
  description: string;
  type: 'api' | 'function' | 'data';
  scope?: string;
  status: number;
}

export async function getAppAuthorizations() {
  return api.get('/sys/app-authorizations');
}

export async function createAppAuthorization(data: Partial<AppAuthorization>) {
  return api.post('/sys/app-authorizations', data);
}

export async function updateAppAuthorization(id: string, data: Partial<AppAuthorization>) {
  return api.put(`/sys/app-authorizations/${id}`, data);
}

export async function deleteAppAuthorization(id: string) {
  return api.delete(`/sys/app-authorizations/${id}`);
}

// ── Code Management ──────────────────────────────────────────────

export interface CodeEntry {
  id: string;
  code: string;
  description: string;
  type: string;
  status: number;
  createdAt?: string;
  updatedAt?: string;
}

export async function getCodeEntries(params?: { type?: string; status?: number }) {
  return api.get('/sys/codes', { params });
}

export async function createCodeEntry(data: Partial<CodeEntry>) {
  return api.post('/sys/codes', data);
}

export async function updateCodeEntry(id: string, data: Partial<CodeEntry>) {
  return api.put(`/sys/codes/${id}`, data);
}

export async function deleteCodeEntry(id: string) {
  return api.delete(`/sys/codes/${id}`);
}
