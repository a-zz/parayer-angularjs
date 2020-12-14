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
	ui.snackbar = new mdc.snackbar.MDCSnackbar(document.querySelector('.mdc-snackbar'));
	
	ui.topAppBar.listen('MDCTopAppBar:nav', function() {
		ui.drawer.open = !ui.drawer.open;
	});
	ui.showWait = function(show) {
		window.document.getElementById('wait-icon').style.visibility=show?'visible':'hidden';
	};
	ui.setLocation = function(location) {
		window.document.getElementById('top-app-bar-nav-locator').innerHTML = location;
	};		
	ui.showSnackbar = function(txt, type) {
		
		switch(type) {
		case 'warn':
			document.querySelector('.mdc-snackbar__label').style = 'color: yellow;';
			break;
		case 'error':
			document.querySelector('.mdc-snackbar__label').style = 'color: red; font-weight: bold;';
			break;
		default:
			document.querySelector('.mdc-snackbar__label').style = '';
		}
		ui.snackbar.labelText = txt;
		ui.snackbar.open();
	}
}]);

// Global-scope and utility functions
// TODO Some kind of namespacing would be nice
function sortItemsByField(items, field, desc) {
	
	var r = [];
	for(let i = 0; i<items.length; i++) {
		var inserted = false;
		for(let j = 0; j<r.length; j++) {
			if((!desc && eval(`items[${i}].${field}`)<eval(`r[${j}].${field}`)) 
				|| (desc && eval(`items[${i}].${field}`)>eval(`r[${j}].${field}`))) {
				r.splice(j, 0, items[i]);
				inserted = true;
				break;
			}
		}
		if(!inserted)
			r.push(items[i]);
	}
	return r;
}