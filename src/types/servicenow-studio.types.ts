export interface ServiceNowStudioConfig {
  instanceUrl: string;
  username: string;
  password: string;
  clientId?: string;
  clientSecret?: string;
  studioApiVersion?: string;
  timeout?: number;
}

export interface ServiceNowApplication {
  sys_id: string;
  name: string;
  scope: string;
  version: string;
  short_description: string;
  description: string;
  logo?: string;
  vendor: string;
  vendor_prefix: string;
  template?: string;
  trackable?: boolean;
  can_edit_in_studio?: boolean;
  sys_created_on: string;
  sys_updated_on: string;
}

export interface ServiceNowTable {
  sys_id: string;
  name: string;
  label: string;
  extends_table?: string;
  is_extendable: boolean;
  number_ref?: string;
  sys_class_name: string;
  access: string;
  read_access: boolean;
  create_access: boolean;
  update_access: boolean;
  delete_access: boolean;
  ws_access: boolean;
  caller_access: string;
  super_class?: string;
  sys_package?: string;
  sys_scope?: string;
}

export interface ServiceNowField {
  sys_id: string;
  element: string;
  column_label: string;
  internal_type: string;
  max_length: number;
  reference?: string;
  reference_qual?: string;
  reference_cascade_rule?: string;
  choice?: string;
  choice_field?: string;
  choice_table?: string;
  default_value?: string;
  dependent?: string;
  dependent_on_field?: string;
  mandatory: boolean;
  read_only: boolean;
  display: boolean;
  active: boolean;
  array: boolean;
  audit: boolean;
  calculated: boolean;
  spell_check: boolean;
  unique: boolean;
  virtual: boolean;
  sys_package?: string;
  sys_scope?: string;
  table: string;
}

export interface ServiceNowScript {
  sys_id: string;
  name: string;
  script: string;
  description?: string;
  active: boolean;
  api_name?: string;
  access?: string;
  sys_package?: string;
  sys_scope?: string;
  sys_class_name: string;
}

export interface ServiceNowBusinessRule extends ServiceNowScript {
  table: string;
  when: string; // before, after, async, display
  insert: boolean;
  update: boolean;
  delete: boolean;
  query: boolean;
  order: number;
  condition?: string;
  filter_condition?: string;
  role_conditions?: string;
  rest_service?: string;
  rest_service_version?: string;
  rest_method?: string;
  template?: string;
  sys_domain?: string;
  sys_overrides?: string;
}

export interface ServiceNowClientScript extends ServiceNowScript {
  table: string;
  type: string; // onLoad, onChange, onSubmit, onCellEdit
  field?: string;
  ui_type: string; // desktop, mobile, both
  view?: string;
  isolate_script: boolean;
  messages?: string;
  global: boolean;
  condition?: string;
  script_true?: string;
  script_false?: string;
}

export interface ServiceNowUIAction extends ServiceNowScript {
  table: string;
  action_name: string;
  hint?: string;
  form_button: boolean;
  form_context_menu: boolean;
  form_link: boolean;
  form_menu_button: boolean;
  form_style?: string;
  list_button: boolean;
  list_context_menu: boolean;
  list_choice: boolean;
  list_style?: string;
  order: number;
  condition?: string;
  show_insert: boolean;
  show_update: boolean;
  show_delete: boolean;
  show_multiple_update: boolean;
  onclick?: string;
  client: boolean;
  isolate_script: boolean;
}

export interface ServiceNowUIPage {
  sys_id: string;
  name: string;
  title: string;
  html: string;
  processing_script?: string;
  client_script?: string;
  css?: string;
  category: string;
  direct: boolean;
  endpoint?: string;
  sys_package?: string;
  sys_scope?: string;
  description?: string;
}

export interface ServiceNowWidget {
  sys_id: string;
  name: string;
  title: string;
  template: string;
  css: string;
  controller: string;
  link?: string;
  demo_data?: string;
  option_schema?: string;
  description?: string;
  docs?: string;
  public: boolean;
  roles?: string;
  sys_package?: string;
  sys_scope?: string;
  dependencies?: string;
  data_table?: string;
  script?: string;
  servicenow?: boolean;
  internal: boolean;
  has_preview: boolean;
}

export interface ServiceNowWorkflow {
  sys_id: string;
  name: string;
  table: string;
  description?: string;
  active: boolean;
  condition?: string;
  template?: string;
  sys_package?: string;
  sys_scope?: string;
  begin?: string;
  end?: string;
  expected_time?: number;
  publish?: boolean;
  relative_duration?: string;
  stage?: string;
  timeline_page?: string;
  due_date?: string;
  run_dayofweek?: string;
  run_date?: string;
  run_time?: string;
  run_period?: string;
  run_type?: string;
}

export interface ServiceNowUpdateSet {
  sys_id: string;
  name: string;
  description?: string;
  state: string; // build, complete, ignore, merged
  application?: string;
  release_date?: string;
  is_default: boolean;
  sys_created_on: string;
  sys_updated_on: string;
  sys_created_by: string;
  sys_updated_by: string;
  base_update_set?: string;
  merged_to?: string;
  merged_on?: string;
  install_date?: string;
  installed_from?: string;
  remote_base_update_set?: string;
  remote_sys_id?: string;
  origin_sys_id?: string;
}

export interface ServiceNowACL {
  sys_id: string;
  name: string;
  type: string;
  operation: string;
  table?: string;
  field?: string;
  condition?: string;
  script?: string;
  roles?: string;
  active: boolean;
  sys_package?: string;
  sys_scope?: string;
  admin_overrides: boolean;
  advanced: boolean;
  description?: string;
}

export interface AppGenerationRequest {
  appName: string;
  appScope: string;
  appDescription: string;
  appVersion?: string;
  requirements: {
    tables?: TableRequirement[];
    workflows?: WorkflowRequirement[];
    ui?: UIRequirement[];
    businessRules?: BusinessRuleRequirement[];
    security?: SecurityRequirement[];
    integrations?: IntegrationRequirement[];
  };
  preferences?: {
    useModernUI?: boolean;
    includeMobileSupport?: boolean;
    generateTests?: boolean;
    includeDocumentation?: boolean;
    followBestPractices?: boolean;
  };
}

export interface TableRequirement {
  name: string;
  label: string;
  description?: string;
  extendsTable?: string;
  fields: FieldRequirement[];
  accessControls?: string[];
  businessRules?: string[];
  workflows?: string[];
}

export interface FieldRequirement {
  name: string;
  label: string;
  type: string;
  maxLength?: number;
  mandatory?: boolean;
  readonly?: boolean;
  defaultValue?: string;
  reference?: string;
  choices?: string[];
  description?: string;
}

export interface WorkflowRequirement {
  name: string;
  description?: string;
  table: string;
  triggerCondition?: string;
  activities: WorkflowActivity[];
  approvals?: ApprovalRequirement[];
}

export interface WorkflowActivity {
  name: string;
  type: string;
  description?: string;
  script?: string;
  condition?: string;
  assignmentGroup?: string;
  assignedTo?: string;
  dueDate?: string;
  priority?: string;
}

export interface ApprovalRequirement {
  name: string;
  approver: string;
  condition?: string;
  dueDate?: string;
  escalation?: string;
}

export interface UIRequirement {
  type: string; // form, list, portal, mobile
  name: string;
  description?: string;
  table?: string;
  fields?: string[];
  layout?: string;
  widgets?: string[];
  permissions?: string[];
}

export interface BusinessRuleRequirement {
  name: string;
  table: string;
  when: string;
  actions: string[];
  condition?: string;
  description?: string;
  script?: string;
  active?: boolean;
}

export interface SecurityRequirement {
  type: string; // acl, role, group
  name: string;
  description?: string;
  table?: string;
  field?: string;
  operation?: string;
  condition?: string;
  roles?: string[];
  users?: string[];
  groups?: string[];
}

export interface IntegrationRequirement {
  name: string;
  type: string; // rest, soap, email, import
  description?: string;
  endpoint?: string;
  method?: string;
  authentication?: string;
  mapping?: Record<string, string>;
  schedule?: string;
}

export interface AppGenerationResult {
  success: boolean;
  appId?: string;
  updateSetId?: string;
  components: {
    tables?: ServiceNowTable[];
    fields?: ServiceNowField[];
    businessRules?: ServiceNowBusinessRule[];
    clientScripts?: ServiceNowClientScript[];
    uiActions?: ServiceNowUIAction[];
    uiPages?: ServiceNowUIPage[];
    workflows?: ServiceNowWorkflow[];
    acls?: ServiceNowACL[];
    widgets?: ServiceNowWidget[];
  };
  artifacts: {
    scripts?: string[];
    configurations?: string[];
    documentation?: string[];
    tests?: string[];
  };
  deploymentInstructions?: string[];
  errors?: string[];
  warnings?: string[];
  timestamp: string;
}

export interface StudioSession {
  sessionId: string;
  applicationId: string;
  userId: string;
  instanceUrl: string;
  isActive: boolean;
  lastActivity: string;
  capabilities: string[];
  context: Record<string, any>;
}