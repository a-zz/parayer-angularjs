'use strict';

// Declare app level module which depends on views, and core components
angular.module('parayer', [
	'ngRoute',
	'parayer.actGridView',
	'parayer.view1',
	'parayer.view2',
	'parayer.version'
]).
config(['$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {
	$locationProvider.hashPrefix('!');

	$routeProvider.otherwise({redirectTo: '/actGridView'});
}]);
