### Control Plane 

#### Management Service:
- UI and API to create, manage and toggle flags
- Standard web app with a frontend

### Data Plane

#### Evaluation Service:
- Quick and reliable way to check: *Is flag X enabled for Y environment?*
- Low latency (<50ms) and high availability
- High performance API with in-memory DB like redis

### Data Stores
- PostgreSQL: Stores flag config, environments, projects, audit logs etc.
- Redis: read only cache of current state of all flags


## DATA FLOW

1. User toggles a flag in UI
2. Control Plane updates `is_enabled` in `environment_flag_states` table **AND** write new state in redis

3. Redis Key
```
flag:{sdk_key}:{flag_key} -> "true" or "false"

Example: flag:prod_abc123:new-checkout-flow -> "true"
```