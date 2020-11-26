'use strict';

// Global objects
var ui = {};

// Declare app level module which depends on views, and core components
angular.module('parayer', [
	'ngRoute',
	'parayer.actGridView',
	'parayer.actAreaView',
	'parayer.actGroupView',
	'parayer.projectView',
	'parayer.version'
]).
config(['$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {
	
	$locationProvider.hashPrefix('!');
	$routeProvider.otherwise({redirectTo: '/act-grid'});
		
	ui.topAppBar = new mdc.topAppBar.MDCTopAppBar(document.querySelector('.mdc-top-app-bar'));	
	ui.topAppBar.setScrollTarget(document.getElementById('main-content'));
	ui.drawer = mdc.drawer.MDCDrawer.attachTo(document.querySelector('.mdc-drawer'));
	
	ui.topAppBar.listen('MDCTopAppBar:nav', function() {
		ui.drawer.open = !ui.drawer.open;
	});
	ui.showWait = function(show) {
		window.document.getElementById('wait-icon').style.visibility=show?'visible':'hidden';
	};
	ui.setLocation = function(location) {
		window.document.getElementById('top-app-bar-nav-locator').innerHTML = location;
	};		
}]);
