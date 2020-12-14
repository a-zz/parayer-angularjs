'use strict';

var parayer = {};	// Global namespace

angular.module('parayer', [
	'ngRoute',
	'parayer.actGridView',
	'parayer.actAreaView',
	'parayer.actGroupView',
	'parayer.projectView',
	'parayer.version'
]).
config(['$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {

	// View routing setup	
	$locationProvider.hashPrefix('!');
	$routeProvider.otherwise({redirectTo: '/act-grid'});

	// Initialize UI
	parayer.ui.init();		
}]);

// Global-scope and utility functions
parayer.auth = {};	// -- Authentication, identification and authorization sub-namespace --
(function(context) {

	// FIXME Method contract missing
	context.getUsrId = function() {
		
		// TODO Test code
		return '36020490-2534-3d92-386f-90135b000f1e';
	}

})(parayer.auth);

parayer.date = {};	// -- Date-handling utilities sub-namespace --
(function (context) {
	
	let weekDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
	let months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dec'];

	// FIXME Method contract missing
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

parayer.ui = {};	// -- UI management sub-namespace --
(function(context) {
	
	let topAppBar;	
	let drawer;
	let snackbar;
	
	// FIXME Method contract missing
	context.init = function () {
		
		topAppBar = new mdc.topAppBar.MDCTopAppBar(document.querySelector('.mdc-top-app-bar'));	
		topAppBar.setScrollTarget(document.getElementById('main-content'));
		topAppBar.listen('MDCTopAppBar:nav', function() {
			drawer.open = !drawer.open;
		});
		drawer = mdc.drawer.MDCDrawer.attachTo(document.querySelector('.mdc-drawer'));
		snackbar = new mdc.snackbar.MDCSnackbar(document.querySelector('.mdc-snackbar'));		
	}

	// FIXME Method contract missing
	context.showWait = function(show) {
		window.document.getElementById('wait-icon').style.visibility=show?'visible':'hidden';
	};
	
	// FIXME Method contract missing
	context.setLocation = function(location) {
		window.document.getElementById('top-app-bar-nav-locator').innerHTML = location;
	};		
	
	// FIXME Method contract missing
	context.showSnackbar = function(txt, type) {
		
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
		snackbar.labelText = txt;
		snackbar.open();
	}
})(parayer.ui);

parayer.util = {};	// -- General utility sub-namespace --
(function(context) { 

	// FIXME Method contract missing
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