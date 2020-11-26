'use strict';

angular.module('parayer.projectView', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
	
	$routeProvider.when('/project/:projectId', {
		templateUrl: 'project-view/project-view.html',
		controller: 'projectViewCtrl'
	});
}])
.controller('projectViewCtrl', ['$scope', '$http', function($scope, $http) {
		
	// UI setup
	ui.setLocation('Project');				
	const tabGeneral = new mdc.tab.MDCTab(document.querySelector('.mdc-tab#tab-general'));
	const tabNotes = new mdc.tab.MDCTab(document.querySelector('.mdc-tab#tab-notes'));
	const tabTasks = new mdc.tab.MDCTab(document.querySelector('.mdc-tab#tab-tasks'));
	const tabFiles = new mdc.tab.MDCTab(document.querySelector('.mdc-tab#tab-files'));
	const tabAppointments = new mdc.tab.MDCTab(document.querySelector('.mdc-tab#tab-appointments'));
	const tabHistory = new mdc.tab.MDCTab(document.querySelector('.mdc-tab#tab-history'));	

	// Scope initialization
	var _usrId_ = '3602049025343d92386f90135b000f1e'; // TODO This should be global (or cookie-set?)	
	console.log('TODO To be implemented');
	
	// Event handlers
}]);