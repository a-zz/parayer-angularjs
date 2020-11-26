'use strict';

angular.module('parayer.actGridView', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
	
	$routeProvider.when('/act-grid', {
		templateUrl: 'act-grid-view/act-grid-view.html',
		controller: 'actGridViewCtrl'
	});
}])
.controller('actGridViewCtrl', ['$scope', '$http', function($scope, $http) {

	// UI setup
	ui.showWait(true);
	ui.setLocation('Activity grid');
		
	// Scope initialization	
	var _usrId_ = '3602049025343d92386f90135b000f1e'; // TODO This should be global (or cookie-set?)
	$scope.selectedDate = new Date();
	$scope.selectedWeek = computeWeek($scope.selectedDate); 	
	$scope.myActList = [];	
	$scope.areas = [];
	$scope.groups = [];
	$scope.projects = [];
	$scope.loadFromDb = function() {
		
		$http.get(`/_data/_design/activity/_view/activity-area-by-assign-usr` +
			`?key="${_usrId_}"`).then(function(respActAreas) {
			$http.get(`/_data/_design/activity/_view/activity-group-by-assign-usr` +
				`?key="${_usrId_}"`).then(function(respActGroups) {
				$http.get(`/_data/_design/activity/_view/project-by-assign-usr` +
				`?key="${_usrId_}"`).then(function(respActProjects) {
					let areas = sortItemsByField(respActAreas.data.rows, 'value.name');
					for(let iArea = 0; iArea<areas.length; iArea++) {
						$scope.myActList.push(areas[iArea]);
						$scope.areas.push(areas[iArea]);
						let groups = [];
						for(let iGroup = 0; iGroup<respActGroups.data.rows.length; iGroup++) {
							if(respActGroups.data.rows[iGroup].value.actArea==areas[iArea].id)
								groups.push(respActGroups.data.rows[iGroup]);
						}
						groups = sortItemsByField(groups, 'value.name');
						for(let iGroup = 0; iGroup<groups.length; iGroup++) { 
							$scope.myActList.push(groups[iGroup]);
							$scope.groups.push(groups[iGroup]);
							let projects = [];
							for(let iProject = 0; iProject<respActProjects.data.rows.length; iProject++) {
								if(respActProjects.data.rows[iProject].value.actGrp==groups[iGroup].id)
									projects.push(respActProjects.data.rows[iProject]);
							}
							projects = sortItemsByField(projects, 'value.name');
							for(let iProject = 0; iProject<projects.length; iProject++) { 
								$scope.myActList.push(projects[iProject]);
								$scope.projects.push(projects[iProject]);								
							}
						}
					}
					window.document.getElementById('act-grid').style.visibility = 'visible';
					ui.showWait(false);
				});		
			});
		});
	}	
	$scope.loadFromDb();
		
	// Event handlers
	$scope.activityChanges = [];
	$scope.trackActivityChange = function(src) {
		
		$scope.activityChanges.push(src.activity.id);
	}	
	
	$scope.updateActivity = function(src) {
				
		for(let i = 0; i<$scope.activityChanges.length; i++) {
			if($scope.activityChanges[i]==src.activity.id) {
				let dbObjUrl = `/_data/${src.activity.id}`; 
				$http.get(dbObjUrl).then(function(qryResp) {					
					var activity = qryResp.data;
					activity.name = src.activity.value.name;
					// TODO Other fields...
					$http.put(dbObjUrl, JSON.stringify(activity)).then(function(updResp) {
						// TODO Check resp, warn of failures
						$scope.activityChanges.splice(i, 1);	
					});					
				});				
				break;
			}
		}
		// TODO View reload might be needed for sorting 
	}
}]);

// TODO This should be global
function sortItemsByField(items, field) {
	
	var r = [];
	for(let i = 0; i<items.length; i++) {
		var inserted = false;
		for(let j = 0; j<r.length; j++) {
			if(eval(`items[${i}].${field}`)<eval(`r[${j}].${field}`)) {
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

function computeWeek(selectedDate) {

	// TODO These should be global
	let weekDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
	let months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dec'];
	
	let week = [];
	for(let d = 1 - selectedDate.getDay(); d<=7-selectedDate.getDay(); d++) {
		let date = new Date(selectedDate);
		date.setDate(date.getDate() + d);		
		week.push({'dt': weekDays[date.getDay()], 'dm': date.getDate(), 'mn': date.getMonth()+1, 'mt': months[date.getMonth()], 'today': (d==0)});
	}	
	return week;
}