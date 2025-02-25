/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import styled, { css } from 'reshadow';

import { getComputed, useResource, useUserData } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NavNodeInfoResource, NavTreeResource, ProjectsNavNodeService } from '@cloudbeaver/core-navigation-tree';
import { ProjectInfoResource, ProjectsService } from '@cloudbeaver/core-projects';
import { getRmResourcePath, ResourceManagerResource, RESOURCES_NODE_PATH } from '@cloudbeaver/core-resource-manager';
import { resourceKeyList } from '@cloudbeaver/core-sdk';
import { isArraysEqual } from '@cloudbeaver/core-utils';
import { CaptureView } from '@cloudbeaver/core-view';
import {
  createElementsTreeSettings,
  ElementsTreeLoader,
  getNavigationTreeUserSettingsId,
  IElementsTreeSettings,
  NavigationTreeService,
  validateElementsTreeSettings,
} from '@cloudbeaver/plugin-navigation-tree';

import { navigationTreeProjectFilter } from './ProjectsRenderer/navigationTreeProjectFilter';
import { navigationTreeProjectSearchCompare } from './ProjectsRenderer/navigationTreeProjectSearchCompare';
import { navigationTreeProjectsExpandStateGetter } from './ProjectsRenderer/navigationTreeProjectsExpandStateGetter';
import { navigationTreeProjectsRendererRenderer } from './ProjectsRenderer/navigationTreeProjectsRendererRenderer';
import { navigationTreeResourceTypeFilter } from './ProjectsRenderer/navigationTreeResourceTypeFilter';
import { ProjectsSettingsPlaceholderElement } from './ProjectsRenderer/ProjectsSettingsForm';
import { navigationTreeResourceExpandStateGetter } from './ResourceFolderRenderer/navigationTreeResourceExpandStateGetter';
import { ResourceManagerTreeCaptureViewContext } from './ResourceManagerTreeCaptureViewContext';
import { transformResourceNodeInfo } from './ResourceRenderer/transformResourceNodeInfo';
import { ResourceManagerService } from '@cloudbeaver/plugin-resource-manager';

const styles = css`
  CaptureView {
    outline: none;
    display: flex;
    flex: 1;
    flex-direction: column;
    overflow: auto;
  }
  ElementsTreeLoader {
    min-width: 100%;
    width: max-content;
  }
  Loader {
    display: flex;
    height: 100%;
    width: 100%;
    min-width: 240px;
  }
  center {
    height: 100%;
    width: 100%;
    display: flex;
  }
  message {
    padding: 24px;
    box-sizing: border-box;
    max-width: 240px;
    text-align: center;
    margin: auto;
  }
`;

interface Props extends React.PropsWithChildren {
  resourceTypeId?: string;
}

export const ResourceManagerTree: React.FC<Props> = observer(function ResourceManagerTree({ resourceTypeId, children }) {
  const root = RESOURCES_NODE_PATH;

  const projectsNavNodeService = useService(ProjectsNavNodeService);
  const projectsService = useService(ProjectsService);
  const navNodeInfoResource = useService(NavNodeInfoResource);
  const projectInfoResource = useService(ProjectInfoResource);
  const navTreeService = useService(NavigationTreeService);
  const resourceManagerService = useService(ResourceManagerService);
  const navTreeResource = useService(NavTreeResource);

  const key = getComputed<string[]>(() => projectsService.activeProjects.map(project => getRmResourcePath(project.id)), isArraysEqual);
  useResource(ResourceManagerTree, ResourceManagerResource, resourceKeyList(key));

  const settings = useUserData<IElementsTreeSettings>(
    getNavigationTreeUserSettingsId(root),
    createElementsTreeSettings,
    () => {},
    validateElementsTreeSettings,
  );

  const projectsRendererRenderer = useMemo(
    () => navigationTreeProjectsRendererRenderer(navNodeInfoResource, resourceManagerService, projectsNavNodeService, resourceTypeId),
    [navNodeInfoResource, resourceManagerService, projectsNavNodeService, resourceTypeId],
  );

  const resourceExpandStateGetter = useMemo(
    () => navigationTreeResourceExpandStateGetter(navNodeInfoResource, resourceManagerService, projectsNavNodeService, resourceTypeId),
    [navNodeInfoResource, resourceManagerService, projectsNavNodeService, resourceTypeId],
  );

  const projectsExpandStateGetter = useMemo(
    () => navigationTreeProjectsExpandStateGetter(navNodeInfoResource, projectsService, projectsNavNodeService),
    [navNodeInfoResource, projectsService, projectsNavNodeService],
  );
  const transformResourceNode = useMemo(
    () => transformResourceNodeInfo(projectInfoResource, projectsNavNodeService, navNodeInfoResource, resourceTypeId),
    [projectInfoResource, projectsNavNodeService, navNodeInfoResource, resourceTypeId],
  );
  const projectFilter = useMemo(
    () =>
      navigationTreeProjectFilter(
        projectsNavNodeService,
        projectsService,
        navNodeInfoResource,
        navTreeResource,
        resourceManagerService,
        resourceTypeId,
      ),
    [projectsNavNodeService, projectsService, navNodeInfoResource, navTreeResource, resourceManagerService, resourceTypeId],
  );
  const resourceTypeFilter = useMemo(
    () => navigationTreeResourceTypeFilter(navNodeInfoResource, projectsNavNodeService, projectInfoResource, resourceTypeId),
    [navNodeInfoResource, projectsNavNodeService, projectInfoResource, resourceTypeId],
  );

  const settingsElements = useMemo(() => [ProjectsSettingsPlaceholderElement], []);

  return styled(styles)(
    <CaptureView view={navTreeService}>
      <ResourceManagerTreeCaptureViewContext resourceTypeId={resourceTypeId} />
      <ElementsTreeLoader
        root={root}
        getChildren={navTreeService.getChildren}
        loadChildren={navTreeService.loadNestedNodes}
        settings={settings}
        nodeInfoTransformers={[transformResourceNode]}
        filters={[resourceTypeFilter, projectFilter]}
        renderers={[projectsRendererRenderer]}
        expandStateGetters={[projectsExpandStateGetter, resourceExpandStateGetter]}
        navNodeFilterCompare={navigationTreeProjectSearchCompare}
        settingsElements={settingsElements}
        emptyPlaceholder={() =>
          styled(styles)(
            <center>
              <message>{children}</message>
            </center>,
          )
        }
        onOpen={node => navTreeService.navToNode(node.id, node.parentId)}
      />
    </CaptureView>,
  );
});
