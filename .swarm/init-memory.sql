-- Snow-Flow Memory Database Schema
-- Based on claude-flow memory patterns

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    capabilities TEXT NOT NULL, -- JSON array
    status TEXT DEFAULT 'idle',
    current_task TEXT,
    memory_namespace TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    payload TEXT NOT NULL, -- JSON
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'pending',
    assigned_agent TEXT,
    dependencies TEXT, -- JSON array
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (assigned_agent) REFERENCES agents(id)
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    swarm_id TEXT NOT NULL,
    objective TEXT NOT NULL,
    strategy TEXT DEFAULT 'adaptive',
    mode TEXT DEFAULT 'hierarchical',
    agents_spawned INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME
);

-- Artifacts table
CREATE TABLE IF NOT EXISTS artifacts (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    path TEXT,
    servicenow_object_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id),
    FOREIGN KEY (agent_id) REFERENCES agents(id)
);

-- Workflows table
CREATE TABLE IF NOT EXISTS workflows (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    steps TEXT NOT NULL, -- JSON array
    dependencies TEXT, -- JSON array
    status TEXT DEFAULT 'draft',
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Memory table for cross-agent communication
CREATE TABLE IF NOT EXISTS memory (
    id TEXT PRIMARY KEY,
    namespace TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    ttl INTEGER,
    agent_id TEXT,
    session_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    UNIQUE(namespace, key),
    FOREIGN KEY (agent_id) REFERENCES agents(id),
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- Coordination table
CREATE TABLE IF NOT EXISTS coordination (
    id TEXT PRIMARY KEY,
    swarm_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    action TEXT NOT NULL,
    payload TEXT, -- JSON
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME,
    FOREIGN KEY (agent_id) REFERENCES agents(id)
);

-- ServiceNow Objects table
CREATE TABLE IF NOT EXISTS servicenow_objects (
    id TEXT PRIMARY KEY,
    sys_id TEXT,
    table_name TEXT NOT NULL,
    object_type TEXT NOT NULL, -- widget, workflow, script, etc.
    object_data TEXT NOT NULL, -- JSON
    agent_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    update_set TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES agents(id),
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- Update Sets table
CREATE TABLE IF NOT EXISTS update_sets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    state TEXT DEFAULT 'in_progress',
    application TEXT,
    agent_id TEXT,
    session_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (agent_id) REFERENCES agents(id),
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- Performance table
CREATE TABLE IF NOT EXISTS performance (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    agent_id TEXT,
    metric_type TEXT NOT NULL,
    metric_value REAL NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id),
    FOREIGN KEY (agent_id) REFERENCES agents(id)
);

-- Neural Patterns table
CREATE TABLE IF NOT EXISTS neural_patterns (
    id TEXT PRIMARY KEY,
    pattern_type TEXT NOT NULL,
    pattern_data TEXT NOT NULL, -- JSON
    agent_id TEXT,
    session_id TEXT,
    effectiveness REAL DEFAULT 0.0,
    usage_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_used DATETIME,
    FOREIGN KEY (agent_id) REFERENCES agents(id),
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- Batch Operations table
CREATE TABLE IF NOT EXISTS batch_operations (
    id TEXT PRIMARY KEY,
    operation_type TEXT NOT NULL,
    operation_data TEXT NOT NULL, -- JSON
    agent_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (agent_id) REFERENCES agents(id),
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agents_type ON agents(type);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_agent ON tasks(assigned_agent);
CREATE INDEX IF NOT EXISTS idx_memory_namespace ON memory(namespace);
CREATE INDEX IF NOT EXISTS idx_memory_key ON memory(key);
CREATE INDEX IF NOT EXISTS idx_memory_expires ON memory(expires_at);
CREATE INDEX IF NOT EXISTS idx_artifacts_session ON artifacts(session_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_agent ON artifacts(agent_id);
CREATE INDEX IF NOT EXISTS idx_coordination_swarm ON coordination(swarm_id);
CREATE INDEX IF NOT EXISTS idx_coordination_agent ON coordination(agent_id);
CREATE INDEX IF NOT EXISTS idx_servicenow_objects_agent ON servicenow_objects(agent_id);
CREATE INDEX IF NOT EXISTS idx_servicenow_objects_session ON servicenow_objects(session_id);
CREATE INDEX IF NOT EXISTS idx_performance_session ON performance(session_id);
CREATE INDEX IF NOT EXISTS idx_neural_patterns_type ON neural_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_batch_operations_agent ON batch_operations(agent_id);
CREATE INDEX IF NOT EXISTS idx_batch_operations_session ON batch_operations(session_id);