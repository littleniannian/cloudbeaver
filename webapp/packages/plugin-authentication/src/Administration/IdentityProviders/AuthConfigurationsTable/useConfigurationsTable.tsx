/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, observable } from 'mobx';

import { AuthConfigurationsResource, compareAuthConfigurations } from '@cloudbeaver/core-authentication';
import { TableState, useObservableRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialogDelete, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { AdminAuthProviderConfiguration, resourceKeyList } from '@cloudbeaver/core-sdk';

interface State {
  tableState: TableState;
  processing: boolean;
  configurations: AdminAuthProviderConfiguration[];
  update: () => Promise<void>;
  delete: () => Promise<void>;
}

export function useConfigurationsTable(): Readonly<State> {
  const notificationService = useService(NotificationService);
  const dialogService = useService(CommonDialogService);
  const resource = useService(AuthConfigurationsResource);

  return useObservableRef<State>(() => ({
    tableState: new TableState(),
    processing: false,
    get configurations() {
      return resource.values.slice().sort(compareAuthConfigurations);
    },
    async update() {
      if (this.processing) {
        return;
      }

      try {
        this.processing = true;
        await resource.refreshAll();
        notificationService.logSuccess({ title: 'administration_identity_providers_configuration_list_update_success' });
      } catch (exception) {
        notificationService.logException(exception, 'administration_identity_providers_configuration_list_update_fail');
      } finally {
        this.processing = false;
      }
    },
    async delete() {
      if (this.processing) {
        return;
      }

      const deletionList = this.tableState.selectedList;

      if (deletionList.length === 0) {
        return;
      }

      const configurationsNames = deletionList
        .map(id => resource.get(id)?.displayName)
        .filter(Boolean);

      const result = await dialogService.open(ConfirmationDialogDelete, {
        title: 'ui_data_delete_confirmation',
        message: `You're going to delete these configurations: ${configurationsNames.map(name => `"${name}"`).join(', ')}. Are you sure?`,
        confirmActionText: 'ui_delete',
      });

      if (result === DialogueStateResult.Rejected) {
        return;
      }

      try {
        this.processing = true;
        await resource.deleteConfiguration(resourceKeyList(deletionList));

        this.tableState.unselect();
        this.tableState.unexpand(deletionList);
      } catch (exception) {
        notificationService.logException(exception, 'Configurations delete failed');
      } finally {
        this.processing = false;
      }
    },
  }), {
    processing: observable.ref,
    configurations: computed,
  }, false, ['update', 'delete']);
}
