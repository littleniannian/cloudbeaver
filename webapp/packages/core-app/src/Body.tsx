/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useLayoutEffect, useRef, useState } from 'react';
import styled, { css } from 'reshadow';

import { AuthInfoService } from '@cloudbeaver/core-authentication';
import { Loader, useResource, useStyles, Watermark } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { DialogsPortal } from '@cloudbeaver/core-dialogs';
import { Notifications } from '@cloudbeaver/core-notifications';
import { ProjectInfoResource } from '@cloudbeaver/core-projects';
import { SessionPermissionsResource } from '@cloudbeaver/core-root';
import { ScreenService } from '@cloudbeaver/core-routing';
import { CachedMapAllKey } from '@cloudbeaver/core-sdk';
import { ThemeService } from '@cloudbeaver/core-theming';
import { DNDProvider } from '@cloudbeaver/core-ui';
import { useAppVersion } from '@cloudbeaver/plugin-version';

const bodyStyles = css`
  theme {
    composes: theme-background-surface theme-text-on-surface theme-typography from global;
    height: 100vh;
    display: flex;
    padding: 0 !important; /* fix additional padding with modal reakit menu */
    flex-direction: column;
    overflow: hidden;
  }
  Loader {
    height: 100vh;
  }
`;

export const Body = observer(function Body() {
  const [edition, setEdition] = useState();
  // const serverConfigLoader = useResource(Body, ServerConfigResource, undefined);
  const themeService = useService(ThemeService);
  const style = useStyles(bodyStyles);
  const ref = useRef<HTMLDivElement>(null);
  useResource(Body, SessionPermissionsResource, undefined);
  const screenService = useService(ScreenService);
  const Screen = screenService.screen?.component;
  const { backendVersion } = useAppVersion();
  const authInfoService = useService(AuthInfoService);
  const userInfo = authInfoService.userInfo;

  // TODO: must be loaded in place where it is used
  useResource(Body, ProjectInfoResource, CachedMapAllKey, { silent: true });

  // sync classes from theme with body for popup components and etc
  useLayoutEffect(() => {
    if (ref.current) {
      document.body.className = ref.current.className;
    }
    document.documentElement.dataset.backendVersion = backendVersion;
  });

  useLayoutEffect(() => {
    const handleEvent = (event: any) => {
      if (event.origin === window.location.origin && event.data.type === 'SQLE_EDITION') {
        setEdition(event.data.edition);
      }
    };
    window.opener.postMessage({ type: 'CB_LOADED' }, '/');
    window.addEventListener('message', handleEvent);

    return () => {
      window.removeEventListener('message', handleEvent);
    };
  }, []);

  return styled(style)(
    <DNDProvider>
      <Loader suspense>
        <theme ref={ref} className={`theme-${themeService.currentTheme.id}`}>
          <Loader suspense>{Screen && <Screen {...screenService.routerService.params} />}</Loader>
          <DialogsPortal />
          <Notifications />
        </theme>
        {userInfo && edition === 'ee' && (
          <Watermark theme={userInfo.configurationParameters?.['app.theme']} text={userInfo.displayName || userInfo.userId} />
        )}
      </Loader>
    </DNDProvider>,
  );
});
