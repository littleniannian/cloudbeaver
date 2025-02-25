/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { EditorView } from '@codemirror/view';
import { createContext } from 'react';

export interface IReactCodemirrorContext {
  view: EditorView | null;
  incomingView: EditorView | null;
}

export const ReactCodemirrorContext = createContext<IReactCodemirrorContext | null>(null);
