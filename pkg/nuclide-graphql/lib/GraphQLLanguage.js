'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.graphqlLanguageService = undefined;
exports.resetGraphQLLanguageService = resetGraphQLLanguageService;

var _nuclideLanguageService;

function _load_nuclideLanguageService() {
  return _nuclideLanguageService = require('../../nuclide-language-service');
}

var _nuclideLanguageServiceRpc;

function _load_nuclideLanguageServiceRpc() {
  return _nuclideLanguageServiceRpc = require('../../nuclide-language-service-rpc');
}

var _nuclideOpenFiles;

function _load_nuclideOpenFiles() {
  return _nuclideOpenFiles = require('../../nuclide-open-files');
}

var _nuclideRemoteConnection;

function _load_nuclideRemoteConnection() {
  return _nuclideRemoteConnection = require('../../nuclide-remote-connection');
}

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 *
 *  strict-local
 * @format
 */

const GRAPHQL_SERVICE_NAME = 'GraphQLService';

async function connectionToGraphQLService(connection) {
  const graphqlService = (0, (_nuclideRemoteConnection || _load_nuclideRemoteConnection()).getServiceByConnection)(GRAPHQL_SERVICE_NAME, connection);
  const [fileNotifier, host] = await Promise.all([(0, (_nuclideOpenFiles || _load_nuclideOpenFiles()).getNotifierByConnection)(connection), (0, (_nuclideLanguageService || _load_nuclideLanguageService()).getHostServices)()]);
  const graphqlCommand = 'graphql-language-service/bin/graphql.js';
  const options = {
    env: Object.assign({}, process.env, { ELECTRON_RUN_AS_NODE: '1' })
  };

  const lspService = await graphqlService.initializeLsp(graphqlCommand, ['server', '--method', 'stream'], options, ['.graphqlconfig'], ['.js', '.graphql'], 'INFO', fileNotifier, host);
  return lspService || new (_nuclideLanguageServiceRpc || _load_nuclideLanguageServiceRpc()).NullLanguageService();
}

async function createLanguageService() {
  const diagnosticsConfig = {
    version: '0.2.0',
    analyticsEventName: 'graphql.observe-diagnostics'
  };

  const definitionConfig = {
    version: '0.1.0',
    priority: 1,
    definitionEventName: 'graphql.definition'
  };

  const autocompleteConfig = {
    inclusionPriority: 1,
    suggestionPriority: 3,
    excludeLowerPriority: false,
    analytics: {
      eventName: 'nuclide-graphql',
      shouldLogInsertedSuggestion: false
    },
    disableForSelector: null,
    autocompleteCacherConfig: null,
    supportsResolve: false
  };

  const atomConfig = {
    name: 'GraphQL',
    grammars: ['source.graphql', 'source.js.jsx', 'source.js'],
    diagnostics: diagnosticsConfig,
    definition: definitionConfig,
    autocomplete: autocompleteConfig
  };
  return new (_nuclideLanguageService || _load_nuclideLanguageService()).AtomLanguageService(connectionToGraphQLService, atomConfig);
}

let graphqlLanguageService = exports.graphqlLanguageService = createLanguageService();

function resetGraphQLLanguageService() {
  graphqlLanguageService.then(value => value.dispose());
  exports.graphqlLanguageService = graphqlLanguageService = createLanguageService();
}