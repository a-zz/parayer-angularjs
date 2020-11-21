'use strict';

angular.module('parayer.actGroupView', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
	
	$routeProvider.when('/act-group/:actGroupId', {
		templateUrl: 'act-group-view/act-group-view.html',
		controller: 'actGroupViewCtrl'
	});
}])
.controller('actGroupViewCtrl', ['$scope', '$http', function($scope, $http) {

	console.log('TODO To be implemented');
}]);