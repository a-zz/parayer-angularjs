'use strict';

angular.module('parayer.actAreaView', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
	
	$routeProvider.when('/act-area/:actAreaId', {
		templateUrl: 'act-area-view/act-area-view.html',
		controller: 'actAreaViewCtrl'
	});
}])
.controller('actAreaViewCtrl', ['$routeParams', '$scope', '$http', function($routeParams, $scope, $http) {

	// UI setup	
	// TODO Add input fields validation (see: https://docs.angularjs.org/api/ng/input/input%5Bdate%5D#examples)
	ui.setLocation('Activity area');
	new mdc.textField.MDCTextField(document.querySelector('.mdc-text-field#name'));
	new mdc.textField.MDCTextField(document.querySelector('.mdc-text-field#descr'));
	new mdc.ripple.MDCRipple(document.querySelector('.mdc-button#submit'));
	new mdc.ripple.MDCRipple(document.querySelector('.mdc-button#cancel'));

	// Scope initialization
	var _usrId_ = '36020490-2534-3d92-386f-90135b000f1e'; // TODO This should be global (or cookie-set?)
	$scope.objDataUrl = `/_data/${$routeParams.actAreaId}`; 
	$http.get($scope.objDataUrl).then(function(respActArea) {
		$scope.actArea = respActArea.data;
		ui.showWait(false);
	});
	
	// Event handlers
	$scope.save = function() {
		// TODO Form validation
		$http.put($scope.objDataUrl, JSON.stringify($scope.actArea)).then(function(putResp) {
			if(putResp.status!=200 || putResp.statusText!='OK')
				ui.showSnackbar('Oops! Something went wrong, contact your system admin', 'error');
			window.location.href = '#!/act-grid';
		});
	}
}]);