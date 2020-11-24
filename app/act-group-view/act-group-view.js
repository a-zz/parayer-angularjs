'use strict';

angular.module('parayer.actGroupView', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
	
	$routeProvider.when('/act-group/:actGroupId', {
		templateUrl: 'act-group-view/act-group-view.html',
		controller: 'actGroupViewCtrl'
	});
}])
.controller('actGroupViewCtrl', ['$routeParams', '$scope', '$http', function($routeParams, $scope, $http) {

	$scope.objDataUrl = `/_data/${$routeParams.actGroupId}`; 

	$http.get($scope.objDataUrl).then(function(respActGrp) {
		$scope.actGroup = respActGrp.data;		
	})
	
	// TODO Set focus to name field
	
	$scope.save = function() {
		// TODO Form validation
		$http.put($scope.objDataUrl, JSON.stringify($scope.actGroup)).then(function(saveResp) {
			// TODO Parse response, warn on error
			window.location.href = '#!/act-grid';
		});
	}
}]);