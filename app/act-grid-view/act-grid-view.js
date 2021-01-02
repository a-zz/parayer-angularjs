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
	document.body.style.height = '100vh';
	document.body.style.overflow = 'hidden';
	document.querySelector('div#main-cntnr').style.height = '100%';
	document.querySelector('main#main-content').style.height = '100%';
	$scope.$on('$destroy', function() {
		document.body.style.height = '';
		document.body.style.overflow = '';
		document.querySelector('div#main-cntnr').style.height = '';
		document.querySelector('main#main-content').style.height = '';		
	});
	// TODO Resize event (and drawer close) -> gridLayout()
	parayer.ui.showWait(true);
	parayer.ui.setLocation('Activity grid');
	const actGrid = new mdc.dataTable.MDCDataTable(document.querySelector('.mdc-data-table'));
	$scope.gridLayout = function() {
		let sbw = parayer.ui.getScrollbarWidth();
		let twdth = document.querySelector('table.act-grid').offsetWidth;
		let cols = ['c01','c02', 'c03', 'c04']
		let wdthpc = [.20, .05, .10, .05];
		for(let i = 0; i<cols.length; i++) {
			_.forEach(document.querySelectorAll(`.${cols[i]}`), function(o) {
				o.style.width = `${(wdthpc[i]*twdth) + (_.indexOf(o.classList, 'sbph')!=-1?sbw:0)}px`;
				o.style.maxWidth = `${(wdthpc[i]*twdth) + (_.indexOf(o.classList, 'sbph')!=-1?sbw:0)}px`;
				if(_.indexOf(o.classList, 'sbph')!=-1)
					o.style.paddingRight = `${sbw}px`;
			});
		}
	}
		
	// Scope initialization	
	$scope.selectedDate = new Date();
	$scope.selectedWeek = parayer.date.computeWeek($scope.selectedDate);	
	$scope.myActList = [];	
	$scope.areas = [];
	$scope.groups = [];
	$scope.projects = [];
	$scope.loadFromDb = function() {
		
		// TODO View object implementation
		let usrId = parayer.auth.getUsrId();
		$http.get(`/_data/_design/activity/_view/activity-area-by-assign-usr` +
			`?key="${usrId}"`).then(function(respActAreas) {
			$http.get(`/_data/_design/activity/_view/activity-group-by-assign-usr` +
				`?key="${usrId}"`).then(function(respActGroups) {
				$http.get(`/_data/_design/activity/_view/project-by-assign-usr` +
				`?key="${usrId}"`).then(function(respActProjects) {
					let areas = _.sortBy(respActAreas.data.rows, ['value.name']); 
					for(let iArea = 0; iArea<areas.length; iArea++) {
						$scope.myActList.push(areas[iArea]);
						$scope.areas.push(areas[iArea]);
						let groups = [];
						for(let iGroup = 0; iGroup<respActGroups.data.rows.length; iGroup++) {
							if(respActGroups.data.rows[iGroup].value.actArea==areas[iArea].id)
								groups.push(respActGroups.data.rows[iGroup]);
						}
						groups = _.sortBy(groups, ['value.name']); 
						for(let iGroup = 0; iGroup<groups.length; iGroup++) { 
							$scope.myActList.push(groups[iGroup]);
							$scope.groups.push(groups[iGroup]);
							let projects = [];
							for(let iProject = 0; iProject<respActProjects.data.rows.length; iProject++) {
								if(respActProjects.data.rows[iProject].value.actGrp==groups[iGroup].id)
									projects.push(respActProjects.data.rows[iProject]);
							}
							projects = _.sortBy(projects, ['value.name']);
							for(let iProject = 0; iProject<projects.length; iProject++) { 
								$scope.myActList.push(projects[iProject]);
								$scope.projects.push(projects[iProject]);								
							}
						}
					}
					$scope.$$postDigest(function() {
						// TODO Improve this: there's a flash before grid layout
						$scope.gridLayout();
						document.querySelector('div.mdc-data-table#act-grid-cntnr-main').style.visibility = 'visible';
					});
					parayer.ui.showWait(false);
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
		// TODO Activity grid might need to be re-sorted after tree update 
	}
}]);