'use strict';

angular.module('parayer.actAreaView', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
	
	$routeProvider.when('/act-area/:actAreaId', {
		templateUrl: 'act-area-view/act-area-view.html',
		controller: 'actAreaViewCtrl'
	});
}])
.controller('actAreaViewCtrl', ['$routeParams', '$scope', '$http', function($routeParams, $scope, $http) {

	$scope.objDataUrl = `/_data/${$routeParams.actAreaId}`; 

	$http.get($scope.objDataUrl).then(function(respActArea) {
		$scope.actArea = respActArea.data;		
	})
	
	// TODO Set focus to name field
	
	$scope.save = function() {
		// TODO Form validation
		$http.put($scope.objDataUrl, JSON.stringify($scope.actArea)).then(function(saveResp) {
			// TODO Parse response, warn on error
			window.location.href = '#!/act-grid';
		});
	}
}]);