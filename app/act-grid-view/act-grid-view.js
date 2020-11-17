'use strict';

angular.module('parayer.actGridView', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/act-grid-view', {
    templateUrl: 'act-grid-view/act-grid-view.html',
    controller: 'actGridViewCtrl'
  });
}])

.controller('actGridViewCtrl', ['$http', function($http) {

	$http.get('/_data/_design/activity/_view/activity-area-by-assign-usr?key="usr~3602049025343d92386f90135b000f1e"').then(function(response) {
        self.myActAreas = response.data;		
	});
}]);