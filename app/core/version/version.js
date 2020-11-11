'use strict';

angular.module('parayer.version', [
  'parayer.version.interpolate-filter',
  'parayer.version.version-directive'
])

.value('version', '0.0.0');
