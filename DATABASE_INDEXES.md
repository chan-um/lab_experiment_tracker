# Database Indexes Guide

## Current Indexes in Your Database

### Automatic Indexes (Already Present)

1. **Primary Key Indexes** - Automatically created for all `id` columns:
   - `User.id` (PRIMARY KEY)
   - `Group.id` (PRIMARY KEY)
   - `Experiment.id` (PRIMARY KEY)
   - `ExperimentLog.id` (PRIMARY KEY)
   - `ExperimentFile.id` (PRIMARY KEY)
   - `GroupMember.id` (PRIMARY KEY)
   - `Profile.id` (PRIMARY KEY)

2. **Unique Constraint Indexes** - Automatically created for unique columns:
   - `User.email` (UNIQUE INDEX) ✅
   - `Group.code` (UNIQUE INDEX) ✅
   - `Experiment.exp_id` (UNIQUE INDEX) ✅
   - `GroupMember(group_id, user_id)` (UNIQUE CONSTRAINT) ✅

### Foreign Key Columns (May Need Indexes)

Foreign keys are frequently used in JOINs and WHERE clauses but are **NOT automatically indexed** in SQLite:
- `User.current_group_id` → `Group.id`
- `Experiment.owner_id` → `User.id`
- `ExperimentLog.experiment_id` → `Experiment.id`
- `ExperimentFile.experiment_id` → `Experiment.id`
- `GroupMember.group_id` → `Group.id`
- `GroupMember.user_id` → `User.id`
- `Group.created_by_id` → `User.id`

## Recommended Indexes to Add

Based on your query patterns, here are indexes that will improve performance:

### High Priority Indexes

1. **GroupMember.user_id** - Queried frequently to find user's group memberships
2. **GroupMember.group_id** - Queried to get all members of a group
3. **Experiment.owner_id** - Queried to get user's experiments
4. **ExperimentLog.experiment_id** - Queried to get logs for an experiment
5. **ExperimentFile.experiment_id** - Queried to get files for an experiment

### Composite Indexes (For Multi-Column Queries)

1. **Experiment(exp_id, owner_id)** - Used in queries like `filter_by(exp_id=exp_id, owner_id=user_id)`
2. **ExperimentFile(experiment_id, id)** - Used in queries like `filter_by(id=file_id, experiment_id=experiment.id)`

### Optional Indexes (For Future Optimization)

1. **Experiment.status** - If you frequently filter by status
2. **Experiment.date_created** - If you frequently sort by creation date
3. **ExperimentLog.timestamp** - If you frequently sort logs by timestamp
4. **GroupMember.date_joined** - If you frequently sort by join date

## Types of Indexes Available

### 1. **Single Column Index**
```python
# Index on a single column
db.Index('idx_experiment_owner', Experiment.owner_id)
```

### 2. **Composite Index** (Multiple Columns)
```python
# Index on multiple columns (order matters!)
db.Index('idx_experiment_owner_exp', Experiment.owner_id, Experiment.exp_id)
```

### 3. **Unique Index** (Already have these via unique=True)
```python
# Automatically created when you use unique=True
email = db.Column(db.String(200), unique=True)  # Creates unique index
```

### 4. **Partial Index** (SQLite only - indexes subset of rows)
```python
# Only indexes rows where condition is true
db.Index('idx_active_experiments', Experiment.status, 
         postgresql_where=(Experiment.status == 'Active'))
```

## Performance Impact

### Without Indexes
- Full table scans (O(n) complexity)
- Slow queries as data grows
- Example: Finding user's experiments scans ALL experiments

### With Indexes
- Index lookups (O(log n) complexity)
- Fast queries even with large datasets
- Example: Finding user's experiments uses index on owner_id

## Query Patterns Analysis

Based on your code, here are the most frequent queries:

1. **`GroupMember.query.filter_by(user_id=user_id)`** - Needs index on `user_id`
2. **`GroupMember.query.filter_by(group_id=group_id)`** - Needs index on `group_id`
3. **`Experiment.query.filter_by(owner_id=user_id)`** - Needs index on `owner_id`
4. **`Experiment.query.filter_by(exp_id=exp_id, owner_id=user_id)`** - Could use composite index
5. **`ExperimentLog.query.filter_by(experiment_id=experiment.id)`** - Needs index on `experiment_id`
6. **`ExperimentFile.query.filter_by(experiment_id=experiment.id)`** - Needs index on `experiment_id`

## Best Practices

1. **Index Foreign Keys** - Always index foreign key columns used in WHERE/JOIN clauses
2. **Index Frequently Queried Columns** - Any column used in WHERE, ORDER BY, or JOIN
3. **Composite Index Order Matters** - Put most selective column first
4. **Don't Over-Index** - Too many indexes slow down INSERT/UPDATE operations
5. **Monitor Query Performance** - Use EXPLAIN QUERY PLAN to verify index usage

## SQLite Specific Notes

- SQLite doesn't automatically index foreign keys (unlike PostgreSQL)
- SQLite supports B-tree indexes (default)
- Indexes are automatically used when appropriate
- Use `EXPLAIN QUERY PLAN` to verify index usage:
  ```sql
  EXPLAIN QUERY PLAN SELECT * FROM experiment WHERE owner_id = 1;
  ```

