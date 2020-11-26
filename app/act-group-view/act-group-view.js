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
	ui.setLocation('Activity group');
	new mdc.textField.MDCTextField(document.querySelector('.mdc-text-field#name'));	
	new mdc.textField.MDCTextField(document.querySelector('.mdc-text-field#descr'));
	new mdc.ripple.MDCRipple(document.querySelector('.mdc-button#submit'));
	new mdc.ripple.MDCRipple(document.querySelector('.mdc-button#cancel'));	
	document.querySelector('.mdc-text-field#name').focus();

	// Scope initialization
	var _usrId_ = '3602049025343d92386f90135b000f1e'; // TODO This should be global (or cookie-set?)
	$scope.objDataUrl = `/_data/${$routeParams.actGroupId}`; 
	$http.get($scope.objDataUrl).then(function(respActGroup) {
		$scope.actGroup = respActGroup.data;
		ui.showWait(false);
	})
	
	// Event handlers		
	$scope.save = function() {
		// TODO Form validation
		$http.put($scope.objDataUrl, JSON.stringify($scope.actGroup)).then(function(saveResp) {
			// TODO Parse response, warn on error
			window.location.href = '#!/act-grid';
		});
	}
}]);