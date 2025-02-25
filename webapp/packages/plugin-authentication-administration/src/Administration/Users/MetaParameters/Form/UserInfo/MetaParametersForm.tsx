/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { ColoredContainer, Container, Group, InputField, useStyles, useTranslate } from '@cloudbeaver/core-blocks';
import type { UserInfo } from '@cloudbeaver/core-sdk';
import type { ComponentStyle } from '@cloudbeaver/core-theming';
import { AuthProvidersList } from '@cloudbeaver/plugin-user-profile';

import { MetaParameterInfoForm } from './MetaParameterInfoForm';

interface Props {
  user: UserInfo;
  className?: string;
  style?: ComponentStyle;
}

export const MetaParametersForm = observer<Props>(function MetaParametersForm({ user, className, style }) {
  const styles = useStyles(style);
  const translate = useTranslate();

  return styled(styles)(
    <ColoredContainer wrap overflow parent gap>
      <Container medium gap>
        <Group form gap>
          <Container wrap gap>
            <InputField type="text" name="userId" minLength={1} state={user} mod="surface" disabled readOnly required tiny fill>
              {translate('plugin_user_profile_info_id')}
            </InputField>
            <InputField type="text" name="displayName" minLength={1} state={user} mod="surface" disabled readOnly required tiny fill>
              {translate('plugin_user_profile_info_displayName')}
            </InputField>
          </Container>
          <MetaParameterInfoForm user={user} />
        </Group>
        <Group box medium overflow>
          <AuthProvidersList user={user} providers={user.linkedAuthProviders} />
        </Group>
      </Container>
    </ColoredContainer>,
  );
});
