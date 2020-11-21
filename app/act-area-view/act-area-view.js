'use strict';

angular.module('parayer.actAreaView', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
	
	$routeProvider.when('/act-area/:actAreaId', {
		templateUrl: 'act-area-view/act-area-view.html',
		controller: 'actAreaViewCtrl'
	});
}])
.controller('actAreaViewCtrl', ['$scope', '$http', function($scope, $http) {

	console.log('TODO To be implemented');
}]);