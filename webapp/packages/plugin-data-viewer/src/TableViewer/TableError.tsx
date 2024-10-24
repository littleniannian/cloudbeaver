/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import styled, { css, use } from 'reshadow';

import { Button, IconOrImage, useErrorDetails, useObservableRef, useStateDelay, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ServerErrorType, ServerInternalError } from '@cloudbeaver/core-sdk';
import { errorOf } from '@cloudbeaver/core-utils';
import { ConnectionSchemaManagerService } from '@cloudbeaver/plugin-datasource-context-switch';
import { NavigationTabsService } from '@cloudbeaver/plugin-navigation-tabs';
import { SqlDataSourceService } from '@cloudbeaver/plugin-sql-editor';

import type { IDatabaseDataModel } from '../DatabaseDataModel/IDatabaseDataModel';

const style = css`
  error {
    composes: theme-background-surface theme-text-on-surface from global;
    position: absolute;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    padding: 16px;
    overflow: auto;
    pointer-events: none;
    bottom: 0;
    right: 0;
    z-index: 1;
    opacity: 0;
    transition: opacity 0.3s ease-in-out, width 0.3s ease-in-out, height 0.3s ease-in-out, background 0.3s ease-in-out;

    &[|animated] {
      overflow: hidden;
      pointer-events: auto;
      opacity: 1;
    }
    &[|collapsed] {
      pointer-events: auto;
      width: 92px;
      height: 72px;
      background: transparent !important;

      & IconOrImage {
        cursor: pointer;
      }

      & error-message,
      & controls {
        display: none;
      }
    }
    &[|errorHidden] {
      pointer-events: none;
      overflow: hidden;
    }
  }
  error-body {
    display: flex;
    gap: 24px;
    align-items: center;
    margin-bottom: 24px;
  }
  error-message {
    white-space: pre-wrap;
  }
  IconOrImage {
    width: 40px;
    height: 40px;
  }
  controls {
    display: flex;
    gap: 16px;
    & > Button {
      flex-shrink: 0;
    }
  }
`;

interface Props {
  model: IDatabaseDataModel;
  loading: boolean;
  className?: string;
}

interface ErrorInfo {
  error: Error | null;
  display: boolean;
  hide: () => void;
  show: () => void;
}

export const TableError = observer<Props>(function TableError({ model, loading, className }) {
  const translate = useTranslate();

  const connectionSchemaManagerService = useService(ConnectionSchemaManagerService);
  const sqlDataSourceService = useService(SqlDataSourceService);
  const navigationTabsService = useService(NavigationTabsService);

  const errorInfo = useObservableRef<ErrorInfo>(
    () => ({
      error: null,
      display: false,
      hide() {
        this.display = false;
      },
      show() {
        this.display = true;
      },
    }),
    {
      display: observable.ref,
    },
    false,
  );

  if (errorInfo.error !== model.source.error) {
    errorInfo.error = model.source.error || null;
    errorInfo.display = !!model.source.error;
  }

  const internalServerError = errorOf(model.source.error, ServerInternalError);
  const error = useErrorDetails(model.source.error);
  const animated = useStateDelay(!!errorInfo.error && !loading, 1);

  const errorHidden = errorInfo.error === null;
  const quote = internalServerError?.errorType === ServerErrorType.QUOTE_EXCEEDED;

  const compress = (input: string) => {
    function encodeNumbers(numbers: number[]): string {
      // 将数字转换为二进制字符串
      const binaryStr = numbers
        .map(num => {
          let bin = num.toString(2);
          while (bin.length < 16) bin = '0' + bin; // 使用 16 位表示每个数字
          return bin;
        })
        .join('');

      // 将二进制字符串按 6 位分组并转换为 Base64URL
      const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
      let result = '';

      for (let i = 0; i < binaryStr.length; i += 6) {
        let chunk = binaryStr.slice(i, i + 6);
        while (chunk.length < 6) chunk += '0'; // 补齐最后一组
        result += base64Chars[parseInt(chunk, 2)];
      }

      return result;
    }

    const dictionary: { [key: string]: number } = {};
    const result: number[] = [];
    let dictSize = 256;

    // 初始化字典
    for (let i = 0; i < 256; i++) {
      dictionary[String.fromCharCode(i)] = i;
    }

    let current = '';
    for (let i = 0; i < input.length; i++) {
      const char = input.charAt(i);
      const combined = current + char;

      if (dictionary.hasOwnProperty(combined)) {
        current = combined;
      } else {
        result.push(dictionary[current]);
        dictionary[combined] = dictSize++;
        current = char;
      }
    }

    if (current !== '') {
      result.push(dictionary[current]);
    }

    // 将数字数组转换为 URL 安全的字符串
    return encodeNumbers(result);
  };

  const onCreateWorkflowNavigate = () => {
    const [projectName, instanceName] = connectionSchemaManagerService.currentConnection?.name.split(':') ?? [];
    const schema = connectionSchemaManagerService.currentObjectCatalog?.name;
    const sql = sqlDataSourceService.get(navigationTabsService.getView()?.context.id ?? '')?.script;

    const data = {
      instanceName,
      schema,
      sql,
    };

    window.open(`/transit?from=cloudbeaver&to=create-workflow&projectName=${projectName}&compression_data=${compress(JSON.stringify(data))}`);
  };

  let icon = '/icons/error_icon.svg';

  if (quote) {
    icon = '/icons/info_icon.svg';
  }

  let onRetry = () => model.retry();

  if (error.refresh) {
    const retry = onRetry;
    const refresh = error.refresh;
    onRetry = async () => {
      refresh();
      await retry();
    };
  }

  return styled(style)(
    <error {...use({ animated, collapsed: !errorInfo.display, errorHidden })} className={className}>
      <error-body>
        <IconOrImage icon={icon} title={error.message} onClick={() => errorInfo.show()} />
        <error-message>{error.message}</error-message>
      </error-body>
      <controls>
        <Button type="button" mod={['outlined']} onClick={() => errorInfo.hide()}>
          {translate('ui_error_close')}
        </Button>
        {error.hasDetails && (
          <Button type="button" mod={['outlined']} onClick={error.open}>
            {translate('ui_errors_details')}
          </Button>
        )}
        <Button type="button" mod={['unelevated']} onClick={onRetry}>
          {translate('ui_processing_retry')}
        </Button>
        <Button type="button" mod={['unelevated']} onClick={onCreateWorkflowNavigate}>
          {translate('ui_create_workflow')}
        </Button>
      </controls>
    </error>,
  );
});
