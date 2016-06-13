'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import type {HgRepositoryClient} from '../../nuclide-hg-repository-client';
import type {ConflictsApi} from '../';

import {MercurialConflictContext} from './MercurialConflictContext';
import {CompositeDisposable} from 'atom';
import {getLogger} from '../../nuclide-logging';

export class MercurialConflictDetector {
  _subscriptions: CompositeDisposable;
  _conflictsApi: ?ConflictsApi;
  _repositorySubscriptions: Map<HgRepositoryClient, CompositeDisposable>;
  _mercurialConflictContext: MercurialConflictContext;

  constructor() {
    this._subscriptions = new CompositeDisposable();
    this._repositorySubscriptions = new Map();
    this._mercurialConflictContext = new MercurialConflictContext();
    this._subscriptions.add(atom.project.onDidChangePaths(this._updateRepositories.bind(this)));
  }

  setConflictsApi(conflictsApi: ConflictsApi): void {
    this._conflictsApi = conflictsApi;
    conflictsApi.registerContextApi({
      getContext: () => Promise.resolve(this._mercurialConflictContext),
    });
    this._updateRepositories();
  }

  _updateRepositories(): void {
    const repositories = new Set(
      atom.project.getRepositories().filter(
        repository => repository != null && repository.getType() === 'hg'
      )
    );
    // Dispose removed projects repositories, if any.
    for (const [repository, repositorySubscription] of this._repositorySubscriptions) {
      if (repositories.has(repository)) {
        continue;
      }
      repositorySubscription.dispose();
      this._repositorySubscriptions.delete(repository);
    }

    // Add the new project repositories, if any.
    for (const repository of repositories) {
      if (this._repositorySubscriptions.has(repository)) {
        continue;
      }
      this._watchRepository(repository);
    }
  }

  _watchRepository(repository: HgRepositoryClient): void {
    const subscriptions = new CompositeDisposable();
    this._conflictStateChanged(repository);
    subscriptions.add(
      repository.onDidChangeConflictState(() => this._conflictStateChanged(repository)),
    );
    this._repositorySubscriptions.set(repository, subscriptions);
  }

  _conflictStateChanged(repository: HgRepositoryClient): void {
    const conflictsApi = this._conflictsApi;
    if (conflictsApi == null || conflictsApi.showForContext == null) {
      getLogger().info('No compatible "merge-conflicts" API found.');
      return;
    }
    if (repository.isInConflict()) {
      this._mercurialConflictContext.setConflictingRepository(repository);
      conflictsApi.showForContext(this._mercurialConflictContext);
    } else {
      const cleared = this._mercurialConflictContext.clearConflictingRepository(repository);
      if (cleared) {
        conflictsApi.hideForContext(this._mercurialConflictContext);
        getLogger().info('Conflicts resolved outside of Nuclide');
      }
    }
  }

  dispose(): void {
    this._subscriptions.dispose();
    for (const repositorySubscription of this._repositorySubscriptions.values()) {
      repositorySubscription.dispose();
    }
    this._repositorySubscriptions.clear();
  }

}
