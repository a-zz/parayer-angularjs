'use strict';

describe('parayer.version module', function() {
  beforeEach(module('parayer.version'));

  describe('version service', function() {
    it('should return current version', inject(function(version) {
      expect(version).toEqual('0.0.0');
    }));
  });
});
