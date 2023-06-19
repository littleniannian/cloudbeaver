/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

const ua = navigator.userAgent.toLowerCase();

export const isSafari = ua.includes('safari') && !ua.includes('chrome');