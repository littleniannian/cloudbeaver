CREATE TABLE CB_SCHEMA_INFO
(
    VERSION     INTEGER   NOT NULL,
    UPDATE_TIME TIMESTAMP NOT NULL
);

CREATE TABLE CB_INSTANCE
(
    INSTANCE_ID     CHAR(36)     NOT NULL, -- Unique instance ID

    MAC_ADDRESS     CHAR(12)     NOT NULL,
    HOST_NAME       VARCHAR(128) NOT NULL,

    PRODUCT_NAME    VARCHAR(100) NOT NULL, -- Server product name
    PRODUCT_VERSION VARCHAR(32)  NOT NULL, -- Server product version

    UPDATE_TIME     TIMESTAMP    NOT NULL,

    PRIMARY KEY (INSTANCE_ID)
);


CREATE TABLE CB_INSTANCE_DETAILS
(
    INSTANCE_ID CHAR(36)    NOT NULL, -- Unique instance ID
    FIELD_NAME  VARCHAR(32) NOT NULL,
    FIELD_VALUE VARCHAR(255),

    PRIMARY KEY (INSTANCE_ID, FIELD_NAME),
    FOREIGN KEY (INSTANCE_ID) REFERENCES CB_INSTANCE (INSTANCE_ID)
);

CREATE TABLE CB_INSTANCE_EVENT
(
    EVENT_ID      BIGINT AUTO_INCREMENT NOT NULL,

    INSTANCE_ID   CHAR(36)    NOT NULL, -- Unique instance ID

    EVENT_TYPE    VARCHAR(16) NOT NULL,
    EVENT_TIME    TIMESTAMP   NOT NULL,

    EVENT_MESSAGE VARCHAR(255),

    PRIMARY KEY (EVENT_ID),
    FOREIGN KEY (INSTANCE_ID) REFERENCES CB_INSTANCE (INSTANCE_ID)
);

CREATE TABLE CB_WORKSPACE
(
    WORKSPACE_ID       VARCHAR(32)   NOT NULL, -- Workspace unique ID
    INSTANCE_ID        CHAR(36)      NOT NULL, -- Unique instance ID

    WORKSPACE_LOCATION VARCHAR(1024) NOT NULL,

    UPDATE_TIME        TIMESTAMP     NOT NULL,

    PRIMARY KEY (INSTANCE_ID, WORKSPACE_ID),
    FOREIGN KEY (INSTANCE_ID) REFERENCES CB_INSTANCE (INSTANCE_ID)
);

CREATE TABLE CB_AUTH_SUBJECT
(
    SUBJECT_ID   VARCHAR(128) NOT NULL,
    SUBJECT_TYPE VARCHAR(8)   NOT NULL,

    PRIMARY KEY (SUBJECT_ID)
);

CREATE TABLE CB_AUTH_PERMISSIONS
(
    SUBJECT_ID    VARCHAR(128) NOT NULL,
    PERMISSION_ID VARCHAR(64)  NOT NULL,

    GRANT_TIME    TIMESTAMP    NOT NULL,
    GRANTED_BY    VARCHAR(128) NOT NULL,

    PRIMARY KEY (SUBJECT_ID, PERMISSION_ID),
    FOREIGN KEY (SUBJECT_ID) REFERENCES CB_AUTH_SUBJECT (SUBJECT_ID) ON DELETE CASCADE
);

CREATE TABLE CB_OBJECT_PERMISSIONS
(
    OBJECT_ID   VARCHAR(128) NOT NULL,
    OBJECT_TYPE VARCHAR(128) NOT NULL,
    SUBJECT_ID  VARCHAR(128) NOT NULL,

    PERMISSION  VARCHAR(32)  NOT NULL,

    GRANT_TIME  TIMESTAMP    NOT NULL,
    GRANTED_BY  VARCHAR(128) NOT NULL,

    PRIMARY KEY (SUBJECT_ID, OBJECT_TYPE, OBJECT_ID, PERMISSION),
    FOREIGN KEY (SUBJECT_ID) REFERENCES CB_AUTH_SUBJECT (SUBJECT_ID) ON DELETE CASCADE
);

CREATE TABLE CB_USER
(
    USER_ID     VARCHAR(128) NOT NULL,

    IS_ACTIVE   CHAR(1)      NOT NULL,
    CREATE_TIME TIMESTAMP    NOT NULL,

    PRIMARY KEY (USER_ID),
    FOREIGN KEY (USER_ID) REFERENCES CB_AUTH_SUBJECT (SUBJECT_ID) ON DELETE CASCADE
);

-- Additional user properties (profile)
CREATE TABLE CB_USER_META
(
    USER_ID    VARCHAR(128) NOT NULL,
    META_ID    VARCHAR(32)  NOT NULL,
    META_VALUE VARCHAR(1024),

    PRIMARY KEY (USER_ID, META_ID),
    FOREIGN KEY (USER_ID) REFERENCES CB_USER (USER_ID) ON DELETE CASCADE
);

CREATE TABLE CB_USER_PARAMETERS
(
    USER_ID     VARCHAR(128) NOT NULL,
    PARAM_ID    VARCHAR(32)  NOT NULL,
    PARAM_VALUE VARCHAR(1024),

    PRIMARY KEY (USER_ID, PARAM_ID),
    FOREIGN KEY (USER_ID) REFERENCES CB_USER (USER_ID) ON DELETE CASCADE
);

CREATE TABLE CB_ROLE
(
    ROLE_ID          VARCHAR(128) NOT NULL,
    ROLE_NAME        VARCHAR(100) NOT NULL,
    ROLE_DESCRIPTION VARCHAR(255) NOT NULL,

    CREATE_TIME      TIMESTAMP    NOT NULL,

    PRIMARY KEY (ROLE_ID),
    FOREIGN KEY (ROLE_ID) REFERENCES CB_AUTH_SUBJECT (SUBJECT_ID) ON DELETE CASCADE
);

CREATE TABLE CB_USER_ROLE
(
    USER_ID    VARCHAR(128) NOT NULL,
    ROLE_ID    VARCHAR(128) NOT NULL,

    GRANT_TIME TIMESTAMP    NOT NULL,
    GRANTED_BY VARCHAR(128) NOT NULL,

    PRIMARY KEY (USER_ID, ROLE_ID),
    FOREIGN KEY (USER_ID) REFERENCES CB_USER (USER_ID) ON DELETE CASCADE,
    FOREIGN KEY (ROLE_ID) REFERENCES CB_ROLE (ROLE_ID) ON DELETE CASCADE
);

CREATE TABLE CB_AUTH_PROVIDER
(
    PROVIDER_ID VARCHAR(32) NOT NULL,
    IS_ENABLED  CHAR(1)     NOT NULL,

    PRIMARY KEY (PROVIDER_ID)
);

CREATE TABLE CB_AUTH_CONFIGURATION
(
    PROVIDER_ID VARCHAR(32) NOT NULL,
    PARAM_ID    VARCHAR(32) NOT NULL,
    PARAM_VALUE VARCHAR(1024),

    PRIMARY KEY (PROVIDER_ID, PARAM_ID),
    FOREIGN KEY (PROVIDER_ID) REFERENCES CB_AUTH_PROVIDER (PROVIDER_ID) ON DELETE CASCADE
);

CREATE TABLE CB_USER_CREDENTIALS
(
    USER_ID     VARCHAR(128)  NOT NULL,
    PROVIDER_ID VARCHAR(32)   NOT NULL,
    CRED_ID     VARCHAR(32)   NOT NULL,
    CRED_VALUE  VARCHAR(1024) NOT NULL,

    UPDATE_TIME TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (USER_ID, PROVIDER_ID, CRED_ID),
    FOREIGN KEY (USER_ID) REFERENCES CB_USER (USER_ID) ON DELETE CASCADE
);

CREATE INDEX CB_USER_CREDENTIALS_SEARCH_IDX ON CB_USER_CREDENTIALS (PROVIDER_ID, CRED_ID);

CREATE TABLE CB_USER_STATE
(
    USER_ID            VARCHAR(128) NOT NULL,

    USER_CONFIGURATION TEXT NULL,

    UPDATE_TIME        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (USER_ID),
    FOREIGN KEY (USER_ID) REFERENCES CB_USER (USER_ID) ON DELETE CASCADE
);

CREATE TABLE CB_SESSION
(
    SESSION_ID                 VARCHAR(64) NOT NULL,
    APP_SESSION_ID             VARCHAR(64) NULL,
    USER_ID                    VARCHAR(128) NULL,

    CREATE_TIME                TIMESTAMP   NOT NULL,
    LAST_ACCESS_REMOTE_ADDRESS VARCHAR(128) NULL,
    LAST_ACCESS_USER_AGENT     VARCHAR(255) NULL,
    LAST_ACCESS_TIME           TIMESTAMP   NOT NULL,

    LAST_ACCESS_INSTANCE_ID    CHAR(36),
    SESSION_TYPE               VARCHAR(64),

    PRIMARY KEY (SESSION_ID),
    FOREIGN KEY (USER_ID) REFERENCES CB_USER (USER_ID) ON DELETE CASCADE,
    FOREIGN KEY (LAST_ACCESS_INSTANCE_ID) REFERENCES CB_INSTANCE (INSTANCE_ID)
);

CREATE TABLE CB_SESSION_STATE
(
    SESSION_ID    VARCHAR(64) NOT NULL,

    SESSION_STATE TEXT        NOT NULL,
    UPDATE_TIME   TIMESTAMP   NOT NULL,

    PRIMARY KEY (SESSION_ID),
    FOREIGN KEY (SESSION_ID) REFERENCES CB_SESSION (SESSION_ID) ON DELETE CASCADE
);

CREATE TABLE CB_SESSION_LOG
(
    SESSION_ID  VARCHAR(64)  NOT NULL,

    LOG_TIME    TIMESTAMP    NOT NULL,
    LOG_ACTION  VARCHAR(128) NOT NULL,
    LOG_DETAILS VARCHAR(255) NOT NULL,

    FOREIGN KEY (SESSION_ID) REFERENCES CB_SESSION (SESSION_ID) ON DELETE CASCADE
);

CREATE TABLE CB_AUTH_TOKEN
(
    TOKEN_ID                      VARCHAR(128) NOT NULL,
    REFRESH_TOKEN_ID              VARCHAR(128),
    SESSION_ID                    VARCHAR(64)  NOT NULL,
    USER_ID                       VARCHAR(128),

    EXPIRATION_TIME               TIMESTAMP    NOT NULL,
    REFRESH_TOKEN_EXPIRATION_TIME TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CREATE_TIME                   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (TOKEN_ID),
    FOREIGN KEY (SESSION_ID) REFERENCES CB_SESSION (SESSION_ID) ON DELETE CASCADE,
    FOREIGN KEY (USER_ID) REFERENCES CB_USER (USER_ID) ON DELETE CASCADE
);

CREATE TABLE CB_AUTH_ATTEMPT
(
    AUTH_ID           VARCHAR(128) NOT NULL,
    AUTH_STATUS       VARCHAR(32)  NOT NULL,
    AUTH_ERROR        TEXT,
    APP_SESSION_ID    VARCHAR(64)  NOT NULL,
    SESSION_ID        VARCHAR(64),
    SESSION_TYPE      VARCHAR(64)  NOT NULL,
    APP_SESSION_STATE TEXT         NOT NULL,

    CREATE_TIME       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (AUTH_ID),
    FOREIGN KEY (SESSION_ID) REFERENCES CB_SESSION (SESSION_ID) ON DELETE CASCADE
);

CREATE TABLE CB_AUTH_ATTEMPT_INFO
(
    AUTH_ID                        VARCHAR(128) NOT NULL,
    AUTH_PROVIDER_ID               VARCHAR(128) NOT NULL,
    AUTH_PROVIDER_CONFIGURATION_ID VARCHAR(128),
    AUTH_STATE                     TEXT         NOT NULL,

    CREATE_TIME                    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (AUTH_ID, AUTH_PROVIDER_ID),
    FOREIGN KEY (AUTH_ID) REFERENCES CB_AUTH_ATTEMPT (AUTH_ID) ON DELETE CASCADE
);

CREATE INDEX CB_SESSION_LOG_INDEX ON CB_SESSION_LOG (SESSION_ID, LOG_TIME);

-- Secrets

CREATE TABLE CB_USER_SECRETS
(
    USER_ID                        VARCHAR(128) NOT NULL,
    SECRET_ID                      VARCHAR(512) NOT NULL,
    SECRET_VALUE                   VARCHAR(30000) NOT NULL,

    SECRET_LABEL                   VARCHAR(128),
    SECRET_DESCRIPTION             VARCHAR(1024),

    UPDATE_TIME                    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (USER_ID, SECRET_ID),
    FOREIGN KEY (USER_ID) REFERENCES CB_USER (USER_ID) ON DELETE CASCADE
);

CREATE INDEX CB_USER_SECRETS_ID ON CB_USER_SECRETS (USER_ID,SECRET_ID);

