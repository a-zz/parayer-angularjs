'use strict';

// Global objects
var parayer = {};	// Global namespace

var ui = {}; // TODO Maybe should be parayer.ui (and moved to file bottom)...?

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
parayer.auth = {};	// User-authentication and session handling
(function(context) {

	// FIXME Method contrat missing
	context.getUsrId = function() {
		
		// TODO Test code
		return '36020490-2534-3d92-386f-90135b000f1e';
	}

})(parayer.auth);

parayer.util = {};	// General utility sub-namespace
(function(context) { 

	// FIXME Method contrat missing
	context.sortItemsByField = function(items, field, desc) {
	
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
})(parayer.util);

parayer.date = {};	// Date-handling utilities namespace
(function (context) {
	
	let weekDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
	let months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dec'];

	// FIXME Method contrat missing
	context.computeWeek = function(selectedDate) {

		let week = [];
		for(let d = 1 - selectedDate.getDay(); d<=7-selectedDate.getDay(); d++) {
			let date = new Date(selectedDate);
			date.setDate(date.getDate() + d);		
			week.push({'dt': weekDays[date.getDay()], 'dm': date.getDate(), 'mn': date.getMonth()+1, 'mt': months[date.getMonth()], 'today': (d==0)});
		}	
		return week;
	}
})(parayer.date);
