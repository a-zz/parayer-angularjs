'use strict';

angular.module('parayer.projectView', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
	
	$routeProvider.when('/project/:projectId', {
		templateUrl: 'project-view/project-view.html',
		controller: 'projectViewCtrl'
	});
}])
.controller('projectViewCtrl', ['$routeParams', '$scope', '$http', '$filter', function($routeParams, $scope, $http, $filter) {
		
	// UI setup
	// TODO Check tabindex-based navigation (may be faulty because of tabs)
	// TODO Add input fields validation (see: https://docs.angularjs.org/api/ng/input/input%5Bdate%5D#examples)
	ui.setLocation('Project');
	ui.showWait(true);
	$scope.tabs = [];		
			
	$scope.tabs.push(new mdc.tab.MDCTab(document.querySelector('.mdc-tab#tab-general')));
	new mdc.textField.MDCTextField(document.querySelector('.mdc-text-field#name'));
	new mdc.textField.MDCTextField(document.querySelector('.mdc-text-field#descr'));
	new mdc.textField.MDCTextField(document.querySelector('.mdc-text-field#date-start'));
	new mdc.textField.MDCTextField(document.querySelector('.mdc-text-field#date-end'));
	new mdc.textField.MDCTextField(document.querySelector('.mdc-text-field#effort-unit'));
	new mdc.textField.MDCTextField(document.querySelector('.mdc-text-field#effort-cap'));
	new mdc.ripple.MDCRipple(document.querySelector('.mdc-button#submit'));
	new mdc.ripple.MDCRipple(document.querySelector('.mdc-button#cancel'));
	
	$scope.tabs.push(new mdc.tab.MDCTab(document.querySelector('.mdc-tab#tab-notes')));
	$scope.tabs.push(new mdc.tab.MDCTab(document.querySelector('.mdc-tab#tab-tasks')));
	$scope.tabs.push(new mdc.tab.MDCTab(document.querySelector('.mdc-tab#tab-files')));
	$scope.tabs.push(new mdc.tab.MDCTab(document.querySelector('.mdc-tab#tab-appointments')));
	$scope.tabs.push(new mdc.tab.MDCTab(document.querySelector('.mdc-tab#tab-history')));
	
	for(let i = 0; i<$scope.tabs.length; i++)
		$scope.tabs[i].listen('MDCTab:interacted', function(e) {
			ui.showWait(true);
			$scope.showTab(e.detail.tabId);
			$scope.loadTabContent(e.detail.tabId);
		});
	
	// Scope initialization
	var _usrId_ = '36020490-2534-3d92-386f-90135b000f1e'; // TODO This should be global (or cookie-set?)
	$scope.loadTabContent = function(tabId) {
		switch(tabId) {
		case 'tab-notes':
			$scope.objDataUrl = `/_data/_design/global-scope/_view/notes-attached-to?key="${$routeParams.projectId}"`;
			$http.get($scope.objDataUrl).then(function(respNotes) {
				// TODO To be moved to /app.js
				$scope.projectNotes = [];
				let projectNotesFromDb = [];
				// TODO Short notes by date desc (or user-specified)
				for(let i = 0; i<respNotes.data.rows.length; i++) {
					projectNotesFromDb.push({
						"id": respNotes.data.rows[i].id, 
						"summary": respNotes.data.rows[i].value.summary, 
						"descr": respNotes.data.rows[i].value.descr, 
						"usr": respNotes.data.rows[i].value.usr, 
						"date": respNotes.data.rows[i].value.date
					});
				}
				$scope.projectNotes = sortItemsByField(projectNotesFromDb, 'date', true); 
				ui.showWait(false);
			});
			break;
		case 'tab-tasks':
			console.log('TODO To be implemented');
			ui.showWait(false);
			break;
		case 'tab-files':
			console.log('TODO To be implemented');
			ui.showWait(false);
			break;
		case 'tab-appointments':
			console.log('TODO To be implemented');
			ui.showWait(false);
			break;
		case 'tab-history':
			console.log('TODO To be implemented');
			ui.showWait(false);
			break;
		default:
			$scope.objDataUrl = `/_data/${$routeParams.projectId}`;
			$http.get($scope.objDataUrl).then(function(respProject) {
				$scope.project = {};
				for(const key in respProject.data) {
					if(key=='dateStart' || key=='dateEnd') {
						if(respProject.data[key])
							$scope.project[key] = new Date(respProject.data[key].substring(0, 4), 
								respProject.data[key].substring(5, 7), 
								respProject.data[key].substring(8, 10));
					}
					else if(key=='effortUnit' || key=='effortCap') {
						if(respProject.data[key]) {
							let today = new Date();
							$scope.project[key] = new Date(today.getFullYear(), today.getMonth(), today.getDate());							
							let effort = respProject.data[key].split(':');
							$scope.project[key].setHours(effort[0]); 
							$scope.project[key].setMinutes(effort[1]);
							// TODO Strip seconds and millis
						}
					}
					else
						$scope.project[key] = respProject.data[key];
				}
				ui.setLocation(`Project :: ${$scope.project.name}`);
				ui.showWait(false);
			});
		}
	};
	$scope.loadTabContent('tab-general');
	ui.showWait(false);
		
	// Event handlers
	$scope.showTab = function(tabId) {
		
		ui.showWait(true);
		for(let i = 0; i<$scope.tabs.length; i++) {
			if($scope.tabs[i].id==tabId) {
				$scope.tabs[i].activate();
				window.document.getElementById($scope.tabs[i].id + '-decntnr').style.display = 'contents';
			}
			else {
				$scope.tabs[i].deactivate();
				window.document.getElementById($scope.tabs[i].id + '-decntnr').style.display = 'none';
			}
		}
	};
	
	// TODO As global, note handling should be moved elsewhere	
	$scope.noteChanges = [];
	$scope.trackNoteChange = function(src) {
		
		if($scope.noteChanges.indexOf(src.note.id)==-1)
			$scope.noteChanges.push(src.note.id);
	}	
	
	$scope.updateNotes = function(src) {
		
		for(let i = 0; i<$scope.noteChanges.length; i++) {	
			if($scope.noteChanges[i]==src.note.id) {
				let dbObjUrl = `/_data/${src.note.id}`; 
				$http.get(dbObjUrl).then(function(qryResp) {					
					var note = qryResp.data;
					note.summary = src.note.summary;
					note.descr = src.note.descr;
					note.usr = _usrId_;
					note.date = $filter('date')(new Date(), 'yyyy-MM-dd HH:mm:ss');	
					$http.put(dbObjUrl, JSON.stringify(note)).then(function(putResp) {
						// TODO Check resp, warn of failures
						if(putResp.status==200) {
							if(putResp.statusText=='OK') {
								$scope.noteChanges.splice(i, 1);
								for(let j = 0; j<$scope.projectNotes.length; j++)
									if($scope.projectNotes[j].id==src.note.id)
										$scope.projectNotes[j] = note;
								$scope.projectNotes = sortItemsByField($scope.projectNotes, 'date', true);
							}
							else
								console.log('TODO statusText!="Ok" -> warn user!');
						}
						else
							console.log('TODO status!=200 -> warn user!');
					});					
				});				
				break;
			}
		}
	}	
	
	$scope.newNote = function() {
		
		$http.get('/_uuid').then(function(respUuid) {
			let uuid = respUuid.data.uuid;
			let note = {};
			note.id = uuid;
			note.type = 'Note';
			note.summary = 'New note';
			note.descr = '';
			note.usr = _usrId_;
			note.date = $filter('date')(new Date(), 'yyyy-MM-dd HH:mm:ss');
			note.attachedTo = $scope.project._id;
			let dbObjUrl = `/_data/${uuid}`;	
			$http.put(dbObjUrl, JSON.stringify(note)).then(function(putResp) {
				// TODO Check resp, warn of failures
				if(putResp.status==200) {
					if(putResp.statusText=='OK') {
						$scope.projectNotes.unshift(note);
						// TODO Focus to new note's summary input
					}
					else
						console.log('TODO statusText!="Ok" -> warn user!');
				}
				else
					console.log('TODO status!=200 -> warn user!');
					
			});
		});	
	}
	
	$scope.deleteNote = function(src) {
		
		// TODO Confirmation dialog before deleting!
		let dbObjUrl = `/_data/${src.note.id}`;
		$http.get(dbObjUrl).then(function(qryResp) {					
			var note = qryResp.data;
			$http.delete(`${dbObjUrl}?rev=${note._rev}`).then(function(delResp) {
				// TODO Check resp, warn of failures
				if(delResp.status==200) {
					if(delResp.statusText=='OK') {
						for(let j = 0; j<$scope.projectNotes.length; j++)
							if($scope.projectNotes[j].id==src.note.id) {
								$scope.projectNotes.splice(j, 1);
								break;
							}
						$scope.projectNotes = sortItemsByField($scope.projectNotes, 'date', true);
					}
					else
						console.log('TODO statusText!="Ok" -> warn user!');
				}
				else
					console.log('TODO status!=200 -> warn user!');
			});					
		});				

	}
}]);