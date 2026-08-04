# Old Database Schema Introspection

## Tables Found: 
- export_shipments
- users
- hs_code_directory

### Table: export_shipments

#### Columns
| Column | Type | Max Length | Default | Nullable |
|---|---|---|---|---|
| id | bigint | NULL | nextval('export_shipments_id_seq'::regclass) | NO |
| period | text | NULL | NULL | NO |
| source_file | text | NULL | NULL | NO |
| ex_code | integer | NULL | NULL | YES |
| mltcd | text | NULL | NULL | YES |
| sb | bigint | NULL | NULL | YES |
| date | timestamp without time zone | NULL | NULL | YES |
| pct | double precision | NULL | NULL | YES |
| origin | text | NULL | NULL | YES |
| ntn | text | NULL | NULL | YES |
| exporter | text | NULL | NULL | YES |
| importer | text | NULL | NULL | YES |
| qty | double precision | NULL | NULL | YES |
| unit | text | NULL | NULL | YES |
| unit_prc | double precision | NULL | NULL | YES |
| curr | integer | NULL | NULL | YES |
| value_fc | double precision | NULL | NULL | YES |
| value_pkr | double precision | NULL | NULL | YES |
| description | text | NULL | NULL | YES |

#### Constraints
| Constraint Name | Type | Column | Foreign Table | Foreign Column |
|---|---|---|---|---|
| export_shipments_pkey | PRIMARY KEY | id | export_shipments | id |

#### Indexes
| Index Name | Definition |
|---|---|
| export_shipments_pkey | CREATE UNIQUE INDEX export_shipments_pkey ON public.export_shipments USING btree (id) |
| idx_export_shipments_period | CREATE INDEX idx_export_shipments_period ON public.export_shipments USING btree (period) |
| idx_export_shipments_date | CREATE INDEX idx_export_shipments_date ON public.export_shipments USING btree (date) |
| idx_export_shipments_pct | CREATE INDEX idx_export_shipments_pct ON public.export_shipments USING btree (pct) |
| idx_export_shipments_exporter | CREATE INDEX idx_export_shipments_exporter ON public.export_shipments USING btree (exporter) |
| idx_export_shipments_origin | CREATE INDEX idx_export_shipments_origin ON public.export_shipments USING btree (origin) |

### Table: users

#### Columns
| Column | Type | Max Length | Default | Nullable |
|---|---|---|---|---|
| id | integer | NULL | nextval('users_id_seq'::regclass) | NO |
| name | text | NULL | NULL | NO |
| email | text | NULL | NULL | NO |
| password_hash | text | NULL | NULL | NO |
| role | text | NULL | 'user'::text | NO |
| is_active | boolean | NULL | true | NO |
| created_at | timestamp with time zone | NULL | now() | NO |
| last_activated_at | timestamp with time zone | NULL | CURRENT_TIMESTAMP | YES |
| current_session_token | text | NULL | NULL | YES |
| download_count | integer | NULL | 0 | YES |
| downloads_today | integer | NULL | 0 | YES |
| last_download_date | date | NULL | NULL | YES |
| subscription_expires_at | timestamp without time zone | NULL | NULL | YES |
| subscription_status | text | NULL | 'ACTIVE'::text | YES |
| subscription_start_date | timestamp with time zone | NULL | NULL | YES |

#### Constraints
| Constraint Name | Type | Column | Foreign Table | Foreign Column |
|---|---|---|---|---|
| users_pkey | PRIMARY KEY | id | users | id |
| users_email_key | UNIQUE | email | users | email |

#### Indexes
| Index Name | Definition |
|---|---|
| users_pkey | CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id) |
| users_email_key | CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email) |

### Table: hs_code_directory

#### Columns
| Column | Type | Max Length | Default | Nullable |
|---|---|---|---|---|
| id | integer | NULL | nextval('hs_code_directory_id_seq'::regclass) | NO |
| section | text | NULL | NULL | NO |
| hs_code | text | NULL | NULL | NO |
| description | text | NULL | NULL | NO |
| parent | text | NULL | NULL | YES |
| level | integer | NULL | NULL | YES |

#### Constraints
| Constraint Name | Type | Column | Foreign Table | Foreign Column |
|---|---|---|---|---|
| hs_code_directory_pkey | PRIMARY KEY | id | hs_code_directory | id |

#### Indexes
| Index Name | Definition |
|---|---|
| hs_code_directory_pkey | CREATE UNIQUE INDEX hs_code_directory_pkey ON public.hs_code_directory USING btree (id) |
| idx_hs_code_directory_hscode | CREATE INDEX idx_hs_code_directory_hscode ON public.hs_code_directory USING btree (hs_code) |
| idx_hs_code_directory_desc_trgm | CREATE INDEX idx_hs_code_directory_desc_trgm ON public.hs_code_directory USING gin (description gin_trgm_ops) |

