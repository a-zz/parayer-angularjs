'use strict';

angular.module('parayer.actGridView', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/actGridView', {
    templateUrl: 'actGridView/actGridView.html',
    controller: 'actGridViewCtrl'
  });
}])

.controller('actGridViewCtrl', ['$http', function($http) {

	$http.get('/_backend/_design/activity/_view/activity-area-by-assign-usr?key=%22usr~3602049025343d92386f90135b000f1e%22').then(function(response) {
        self.myActAreas = response.data;		
		console.log(self.myActAreas);
	});
}]);