/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IConnectionInfoParams } from '@cloudbeaver/core-connections';
import type { SqlDataFilter } from '@cloudbeaver/core-sdk';

export interface IExportContext {
  connectionKey: IConnectionInfoParams;
  contextId?: string;
  resultId?: string | null;
  containerNodePath?: string;
  name?: string;
  query?: string;
  filter?: SqlDataFilter;
}
