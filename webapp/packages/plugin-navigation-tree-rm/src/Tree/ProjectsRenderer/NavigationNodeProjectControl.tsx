/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React, { forwardRef, useContext } from 'react';
import styled, { css, use } from 'reshadow';

import { getComputed, TREE_NODE_STYLES, TreeNodeContext, TreeNodeControl, TreeNodeName, useMouseContextMenu } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { EventContext, EventStopPropagationFlag } from '@cloudbeaver/core-events';
import { NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';
import { ProjectInfoResource } from '@cloudbeaver/core-projects';
import { NAV_NODE_TYPE_RM_PROJECT } from '@cloudbeaver/core-resource-manager';
import { CaptureViewContext } from '@cloudbeaver/core-view';
import {
  ElementsTreeContext,
  isDraggingInsideProject,
  NavTreeControlComponent,
  NavTreeControlProps,
  TreeNodeMenuLoader,
} from '@cloudbeaver/plugin-navigation-tree';

import { getRmProjectNodeId } from '../../NavNodes/getRmProjectNodeId';
import { DATA_CONTEXT_RESOURCE_MANAGER_TREE_RESOURCE_TYPE_ID } from '../DATA_CONTEXT_RESOURCE_MANAGER_TREE_RESOURCE_TYPE_ID';
import { ResourceManagerService } from '@cloudbeaver/plugin-resource-manager';

const styles = css`
  TreeNodeControl {
    transition: opacity 0.3s ease;
    opacity: 1;

    &[|outdated] {
      opacity: 0.5;
    }
  }
  TreeNodeControl:hover > portal,
  TreeNodeControl:global([aria-selected='true']) > portal,
  portal:focus-within {
    visibility: visible;
  }
  TreeNodeName {
    composes: theme-text-text-hint-on-light theme-typography--caption from global;
    height: 100%;
    max-width: 250px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  portal {
    position: relative;
    box-sizing: border-box;
    margin-left: auto !important;
    margin-right: 8px !important;
    visibility: hidden;
  }
  name-box {
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

export const NavigationNodeProjectControl: NavTreeControlComponent = observer<NavTreeControlProps, HTMLDivElement>(
  forwardRef(function NavigationNodeProjectControl({ node, dndElement, dndPlaceholder, className }, ref) {
    const mouseContextMenu = useMouseContextMenu();
    const viewContext = useContext(CaptureViewContext);
    const elementsTreeContext = useContext(ElementsTreeContext);
    const treeNodeContext = useContext(TreeNodeContext);

    const projectInfoResource = useService(ProjectInfoResource);
    const navNodeInfoResource = useService(NavNodeInfoResource);
    const resourceManagerService = useService(ResourceManagerService);

    const outdated = getComputed(() => navNodeInfoResource.isOutdated(node.id) && !treeNodeContext.loading);
    const selected = treeNodeContext.selected;
    const resourceType = viewContext?.tryGet(DATA_CONTEXT_RESOURCE_MANAGER_TREE_RESOURCE_TYPE_ID);

    const isDragging = getComputed(() => {
      if (!node.projectId || !elementsTreeContext?.tree.activeDnDData) {
        return false;
      }

      return isDraggingInsideProject(node.projectId, elementsTreeContext.tree.activeDnDData);
    });

    let name = node.name;

    function handlePortalClick(event: React.MouseEvent<HTMLDivElement>) {
      EventContext.set(event, EventStopPropagationFlag);
      treeNodeContext.select();
    }

    function handleContextMenuOpen(event: React.MouseEvent<HTMLDivElement>) {
      mouseContextMenu.handleContextMenuOpen(event);
      treeNodeContext.select();
    }

    function handleClick(event: React.MouseEvent<HTMLDivElement>) {
      treeNodeContext.select(event.ctrlKey || event.metaKey);
    }

    if (node.projectId && resourceType !== undefined) {
      if (node.nodeType === NAV_NODE_TYPE_RM_PROJECT) {
        const project = projectInfoResource.get(node.projectId);
        if (project) {
          const resourceFolder = resourceManagerService.getRootFolder(project, resourceType);

          if (resourceFolder !== undefined) {
            return null;
          }
        }
      } else {
        const project = getRmProjectNodeId(node.projectId);
        const projectName = navNodeInfoResource.get(project)?.name;

        if (projectName) {
          name = projectName;
        }
      }
    }

    if (elementsTreeContext?.tree.settings?.projects === false && !isDragging) {
      return null;
    }

    return styled(
      TREE_NODE_STYLES,
      styles,
    )(
      <TreeNodeControl
        ref={ref}
        onClick={handleClick}
        onContextMenu={handleContextMenuOpen}
        {...use({ outdated, dragging: dndElement })}
        className={className}
      >
        <TreeNodeName title={name}>
          <name-box>{name}</name-box>
        </TreeNodeName>
        {!dndPlaceholder && (
          <portal onClick={handlePortalClick}>
            <TreeNodeMenuLoader mouseContextMenu={mouseContextMenu} node={node} selected={selected} />
          </portal>
        )}
      </TreeNodeControl>,
    );
  }),
);
