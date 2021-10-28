/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IAction } from '../Action/IAction';
import type { IDataContextProvider } from '../DataContext/IDataContextProvider';
import type { IMenu } from './IMenu';
import type { IMenuItem } from './MenuItem/IMenuItem';

export interface IMenuItemsCreator {
  isApplicable?: (context: IDataContextProvider) => boolean;
  getItems: (
    context: IDataContextProvider,
    items: Array<IMenuItem | IAction | IMenu>
  ) => Array<IMenuItem | IAction | IMenu>;
  orderItems?: (
    context: IDataContextProvider,
    items: Array<IMenuItem | IAction | IMenu>
  ) => Array<IMenuItem | IAction | IMenu>;
}