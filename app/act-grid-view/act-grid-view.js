'use strict';

angular.module('parayer.actGridView', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
	
	$routeProvider.when('/act-grid-view', {
		templateUrl: 'act-grid-view/act-grid-view.html',
		controller: 'actGridViewCtrl'
	});
}])
.controller('actGridViewCtrl', ['$scope', '$http', function($scope, $http) {

	// TODO This should be global (or cookie-set?)
	var _usrId_ = 'usr~3602049025343d92386f90135b000f1e'; 
	
	$scope.myActList = [];	

	$scope.nAreas = 0;
	$scope.nGroups = 0;
	$scope.nProjects = 0;
	$http.get(`/_data/_design/activity/_view/activity-area-by-assign-usr` +
			`?key="${_usrId_}"`).then(function(respActAreas) {
		$http.get(`/_data/_design/activity/_view/activity-group-by-assign-usr` +
			`?key="${_usrId_}"`).then(function(respActGroups) {
			$http.get(`/_data/_design/activity/_view/project-by-assign-usr` +
			`?key="${_usrId_}"`).then(function(respActProjects) {
				let areas = sortItemsByField(respActAreas.data.rows, 'value.name');
				for(let iArea = 0; iArea<areas.length; iArea++) {
					$scope.myActList.push(['area', areas[iArea]]);
					$scope.nAreas++;
					let groups = [];
					for(let iGroup = 0; iGroup<respActGroups.data.rows.length; iGroup++) {
						if(respActGroups.data.rows[iGroup].value.actArea==areas[iArea].id)
							groups.push(respActGroups.data.rows[iGroup]);
					}
					groups = sortItemsByField(groups, 'value.name');
					for(let iGroup = 0; iGroup<groups.length; iGroup++) { 
						$scope.myActList.push(['group', groups[iGroup]]);
						$scope.nGroups++;
						let projects = [];
						for(let iProject = 0; iProject<respActProjects.data.rows.length; iProject++) {
							if(respActProjects.data.rows[iProject].value.actGrp==groups[iGroup].id)
								projects.push(respActProjects.data.rows[iProject]);
						}
						projects = sortItemsByField(projects, 'value.name');
						for(let iProject = 0; iProject<projects.length; iProject++) { 
							$scope.myActList.push(['project', projects[iProject]]);
							$scope.nProjects++;
							
						}
					}
				}
			});		
		});
	});
	
	$scope.activityChanges = [];
	$scope.trackActivityChange = function(src) {
		
		$scope.activityChanges.push(src.activity[1].id);
	}	
	
	$scope.updateActivity = function(src) {
				
		for(let i = 0; i<$scope.activityChanges.length; i++) {
			if($scope.activityChanges[i]==src.activity[1].id) {
				let dbObjUrl = `/_data/${src.activity[1].id}`; 
				$http.get(dbObjUrl).then(function(qryResp) {					
					var activity = qryResp.data;
					activity.name = src.activity[1].value.name;
					// TODO Other fields...
					$http.put(dbObjUrl, JSON.stringify(activity)).then(function(updResp) {
						// TODO Check resp, warn of failures
						console.log(updResp)
						$scope.activityChanges.splice(i, 1);	
					});					
				});				
				break;
			}
		}
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