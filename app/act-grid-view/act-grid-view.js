'use strict';

angular.module('parayer.actGridView', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
	
	$routeProvider.when('/act-grid', {
		templateUrl: 'act-grid-view/act-grid-view.html',
		controller: 'actGridViewCtrl'
	});
}])
.controller('actGridViewCtrl', ['$scope', '$http', function($scope, $http) {

	// -- UI setup ---------------------------------------------------------------------------------------------------------------------------------------------
	document.body.style.height = '100vh';
	document.body.style.overflow = 'hidden';
	document.querySelector('div#main-cntnr').style.height = '100%';
	document.querySelector('main#main-content').style.height = '100%';
	$scope.$on('$destroy', function() {
		document.body.style.height = '';
		document.body.style.overflow = '';
		document.querySelector('div#main-cntnr').style.height = '';
		document.querySelector('main#main-content').style.height = '';
		parayer.ui.setOnDrawerChange(null);	
	});	
	parayer.ui.showWait(true);
	parayer.ui.setLocation('Activity grid');
	new mdc.dataTable.MDCDataTable(document.querySelector('.mdc-data-table'));
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
	window.onresize = $scope.gridLayout;
	parayer.ui.setOnDrawerChange($scope.gridLayout);
		
	// -- Scope initialization ---------------------------------------------------------------------------------------------------------------------------------	
	$scope.selectedDate = new Date();
	$scope.selectedWeek = parayer.date.computeWeek($scope.selectedDate);	
	$scope.myActList = [];	
	$scope.areas = [];
	$scope.groups = [];
	$scope.projects = [];
	$scope.loadFromDb = function() {
		
		let usrId = parayer.auth.getUsrId();
		$http.get(`/_data/_design/activity/_view/activity-area-by-assign-usr` +
			`?key="${usrId}"`).then(function(respActAreas) {
			let areas = [];
			_.forEach(_.sortBy(respActAreas.data.rows, ['value.name']), function(row) {
				areas.push(new VActivity(row));
			});
			$http.get(`/_data/_design/activity/_view/activity-group-by-assign-usr` +
				`?key="${usrId}"`).then(function(respActGroups) {
				let groups = [];
				_.forEach(_.sortBy(respActGroups.data.rows, ['value.name']), function(row) {
					groups.push(new VActivity(row));
				});
				$http.get(`/_data/_design/activity/_view/project-by-assign-usr` +
				`?key="${usrId}"`).then(function(respActProjects) {
					let projects = [];
					_.forEach(_.sortBy(respActProjects.data.rows, ['value.name']), function(row) {
						projects.push(new VActivity(row));
					});			
					_.forEach(areas, function(a) {
						$scope.areas.push(a);
						$scope.myActList.push(a);
						_.forEach(_.filter(groups, function(g) {
							return g.parent==a.id;
						}), function(g) {
							$scope.groups.push(g);
							$scope.myActList.push(g);
							_.forEach(_.filter(projects, function(p) {
								return p.parent==g.id;
							}), function(p) {
								$scope.projects.push(p);
								$scope.myActList.push(p);
							})
						});
					});	
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
		
	// -- View worker ------------------------------------------------------------------------------------------------------------------------------------------
	$scope.moreOrLess = function(src) {
		
		let btn = document.querySelector(`button#mol-btn-${src.activity.id}`);
		if(btn.innerHTML.indexOf('expand_more')!=-1)
			$scope.showMore(src.activity.id, btn); 
		else
			$scope.showLess(src.activity.id, btn);
	}
	
	$scope.showMore = function(id, btn) {
		
		btn.innerHTML = 'expand_less';
		btn.ariaLabel = 'Show less';
		btn.title = 'Show less';
		_.forEach(document.querySelectorAll(`tr.child-of-${id}`), function(tr) {
			tr.style.display = 'revert';
		});		
	}
	
	$scope.showLess = function(id, btn) {
		
		btn.innerHTML = 'expand_more';
		btn.ariaLabel = 'Show more';
		btn.title = 'Show more';
		_.forEach(document.querySelectorAll(`tr.child-of-${id}`), function(tr) {
			let btn2 = document.querySelector(`button#mol-btn-${tr.id}`);
			if(btn2!=null)
				$scope.showLess(tr.id, btn2);
			tr.style.display = 'none';
		});
	}

	// -- View objects -----------------------------------------------------------------------------------------------------------------------------------------
	class VActivity {
		
		constructor(d) {
			
			this.id = d.id;
			this.type = d.value.type;
			this.name = d.value.name;
			this.descr = d.value.descr;
			switch(d.value.type) {
			case 'ActGrp':
				this.parent = d.value.actArea;
				break;
			case 'Project':
				this.parent = d.value.actGrp;
				break;
			default:
				this.parent = null;
			} 
		}
	}
}]);