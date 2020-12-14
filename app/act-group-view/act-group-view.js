'use strict';

angular.module('parayer.actGroupView', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
	
	$routeProvider.when('/act-group/:actGroupId', {
		templateUrl: 'act-group-view/act-group-view.html',
		controller: 'actGroupViewCtrl'
	});
}])
.controller('actGroupViewCtrl', ['$routeParams', '$scope', '$http', function($routeParams, $scope, $http) {

	// UI setup	
	// TODO Add input fields validation (see: https://docs.angularjs.org/api/ng/input/input%5Bdate%5D#examples)
	ui.setLocation('Activity group');
	new mdc.textField.MDCTextField(document.querySelector('.mdc-text-field#name'));	
	new mdc.textField.MDCTextField(document.querySelector('.mdc-text-field#descr'));
	new mdc.ripple.MDCRipple(document.querySelector('.mdc-button#submit'));
	new mdc.ripple.MDCRipple(document.querySelector('.mdc-button#cancel'));	

	// Scope initialization
	$scope.objDataUrl = `/_data/${$routeParams.actGroupId}`; 
	$http.get($scope.objDataUrl).then(function(respActGroup) {
		$scope.actGroup = respActGroup.data;
		ui.showWait(false);
	})
	
	// Event handlers		
	$scope.save = function() {
		// TODO Form validation
		$http.put($scope.objDataUrl, JSON.stringify($scope.actGroup)).then(function(putResp) {
			if(putResp.status!=200 || putResp.statusText!='OK')
				ui.showSnackbar('Oops! Something went wrong, contact your system admin', 'error');
			window.location.href = '#!/act-grid';
		});
	}
}]);