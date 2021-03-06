/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

test('fake timers are not available yet', () => {
  expect(() => {
    jest.useFakeTimers();
  }).toThrow('fakeTimers are not supproted in atom environment');
});
