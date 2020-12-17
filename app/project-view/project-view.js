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
	parayer.ui.setLocation('Project');
	parayer.ui.showWait(true);
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
			parayer.ui.showWait(true);
			$scope.showTab(e.detail.tabId);
			$scope.loadTabContent(e.detail.tabId);
		});
	
	// Scope initialization
	$scope.loadTabContent = function(tabId) {
		switch(tabId) {
		case 'tab-notes':
			$scope.objDataUrl = `/_data/_design/global-scope/_view/notes-attached-to?key="${$routeParams.projectId}"`;
			$http.get($scope.objDataUrl).then(function(respNotes) {
				// TODO As global, note handling should be moved elsewhere
				// TODO To be refactored: $scope.projectNotes should rather be $scope.project.notes
				$scope.projectNotes = [];
				let projectNotesFromDb = [];
				for(let i = 0; i<respNotes.data.rows.length; i++) {
					projectNotesFromDb.push({
						"_id": respNotes.data.rows[i].id, 
						"summary": respNotes.data.rows[i].value.summary, 
						"descr": respNotes.data.rows[i].value.descr, 
						"usr": respNotes.data.rows[i].value.usr, 
						"date": respNotes.data.rows[i].value.date
					});
				}
				$scope.projectNotes = _.reverse(_.sortBy(projectNotesFromDb, ['date', 'summary'])); 
				parayer.ui.showWait(false);
			});
			break;
		case 'tab-tasks':
			$scope.objDataUrl = `/_data/_design/project/_view/tasks-by-project?key="${$routeParams.projectId}"`;
			$http.get($scope.objDataUrl).then(function(getResp) {				
				$scope.project.tasks = [];
				let projectTasksFromDb = [];
				for(let i = 0; i<getResp.data.rows.length; i++) {
					projectTasksFromDb.push({
						"_id": getResp.data.rows[i].id, 
						"summary": getResp.data.rows[i].value.summary, 
						"descr": getResp.data.rows[i].value.descr, 
						"pc": getResp.data.rows[i].value.pc, 
						"dateDue": getResp.data.rows[i].value.dateDue,
						"created": getResp.data.rows[i].value.created,
						"updated": getResp.data.rows[i].value.updated,
						"usrAssignList": getResp.data.rows[i].value.usrAssignList
					});
				}
				$scope.project.tasks = $scope.sortTasks(projectTasksFromDb); 
				parayer.ui.showWait(false);
			});
			break;
		case 'tab-files':
			console.log('TODO To be implemented');
			parayer.ui.showWait(false);
			break;
		case 'tab-appointments':
			console.log('TODO To be implemented');
			parayer.ui.showWait(false);
			break;
		case 'tab-history':
			console.log('TODO To be implemented');
			parayer.ui.showWait(false);
			break;
		default:
			// TODO Add input fields validation (see: https://docs.angularjs.org/api/ng/input/input%5Bdate%5D#examples)
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
				parayer.ui.setLocation(`Project :: ${$scope.project.name}`);
				parayer.ui.showWait(false);
			});
		}
	};
	$scope.loadTabContent('tab-general');
	parayer.ui.showWait(false);
		
	// Event handlers
	$scope.showTab = function(tabId) {
		
		parayer.ui.showWait(true);
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
	
	// -- Project NOTES management --
	// TODO As global, note handling should be moved elsewhere	
	// TODO User-selectable colours for notes would be fine!
	$scope.noteChanges = [];
	$scope.trackNoteChange = function(src) {
		
		if($scope.noteChanges.indexOf(src.note._id)==-1)
			$scope.noteChanges.push(src.note._id);
	}	
	
	$scope.updateNotes = function(src) {
		
		for(let i = 0; i<$scope.noteChanges.length; i++) {	
			if($scope.noteChanges[i]==src.note._id) {
				let dbObjUrl = `/_data/${src.note._id}`; 
				$http.get(dbObjUrl).then(function(qryResp) {					
					var note = qryResp.data;
					note.summary = src.note.summary;
					note.descr = src.note.descr;
					note.usr = parayer.auth.getUsrId();
					note.date = $filter('date')(new Date(), 'yyyy-MM-dd HH:mm:ss');
					// TODO Consider summary field validation as per https://docs.angularjs.org/api/ng/input/input%5Bdate%5D#examples	
					if(note.summary.trim()=='') {
						parayer.ui.showSnackbar('A note summary is required!', 'warn');
						$scope.noteChanges.splice(i, 1);
						return;
					}
					$http.put(dbObjUrl, JSON.stringify(note)).then(function(putResp) {
						if(putResp.status==200) {
							if(putResp.statusText=='OK') {
								$scope.noteChanges.splice(i, 1);
								for(let j = 0; j<$scope.projectNotes.length; j++)
									if($scope.projectNotes[j]._id==src.note._id)
										$scope.projectNotes[j] = note;
								$scope.projectNotes = _.reverse(_.sortBy($scope.projectNotes, ['date', 'summary']));
							}
							else
								parayer.ui.showSnackbar('Oops! Something went wrong, contact your system admin', 'error');
						}
						else
							parayer.ui.showSnackbar('Oops! Something went wrong, contact your system admin', 'error');
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
			note._id = uuid;
			note.type = 'Note';
			note.summary = 'New note';
			note.descr = '';
			note.usr = parayer.auth.getUsrId();
			note.date = $filter('date')(new Date(), 'yyyy-MM-dd HH:mm:ss');
			note.attachedTo = $scope.project._id;
			let dbObjUrl = `/_data/${uuid}`;	
			$http.put(dbObjUrl, JSON.stringify(note)).then(function(putResp) {
				if(putResp.status==200) {
					if(putResp.statusText=='OK') {
						$scope.projectNotes.unshift(note);
						// TODO Focus new note's summary input
					}
					else
						parayer.ui.showSnackbar('Oops! Something went wrong, contact your system admin', 'error');
				}
				else
					parayer.ui.showSnackbar('Oops! Something went wrong, contact your system admin', 'error');
					
			});
		});	
	}
	
	$scope.deleteNote = function(src, confirmed) {
		
		if(!confirmed) {			
			parayer.ui.showSimpleConfirmDialog('Note deletion can\'t be undone, please confirm.', 
				function() { $scope.deleteNote(src, true) }, function() { parayer.ui.showSnackbar('Note deletion cancelled!') });
			return;
		}
		else {
			let dbObjUrl = `/_data/${src.note._id}`;
			$http.get(dbObjUrl).then(function(qryResp) {
				var note = qryResp.data;
				$http.delete(`${dbObjUrl}?rev=${note._rev}`).then(function(delResp) {
					if(delResp.status==200) {
						if(delResp.statusText=='OK') {
							for(let j = 0; j<$scope.projectNotes.length; j++)
								if($scope.projectNotes[j]._id==src.note._id) {
									$scope.projectNotes.splice(j, 1);
									break;
								}
							$scope.projectNotes = _.reverse(_.sortBy($scope.projectNotes, ['date', 'summary']));
							parayer.ui.showSnackbar('Note deleted!	', 'info');
						}
						else
							parayer.ui.showSnackbar('Oops! Something went wrong, contact your system admin', 'error');
					}
					else
						parayer.ui.showSnackbar('Oops! Something went wrong, contact your system admin', 'error');
				});
			});
		}
	}
	
	$scope.filterNotesByText = function(src) {
		
		for(let i = 0; i<$scope.projectNotes.length; i++) {
			let noteCntnr = document.getElementById(`project-note-${$scope.projectNotes[i]._id}`);
			if($scope.projectNotes[i].summary.toUpperCase().indexOf($scope.noteFilterText.toUpperCase())!=-1 || 
				$scope.projectNotes[i].descr.toUpperCase().indexOf($scope.noteFilterText.toUpperCase())!=-1)
				noteCntnr.style.display = '';
			else
				noteCntnr.style.display = 'none';
		}
	}
	
	// -- Project TASKS management --
	// TODO Second click on a chip should reverse the sort
	$scope.setTaskSort = function(selected) {
		
		let sortChips = document.querySelectorAll('div.mdc-chip');
		for(let i = 0; i<sortChips.length; i++)
			if(sortChips[i].id==`task-sort-${selected}`)
				sortChips[i].classList.add('mdc-chip--selected');
			else
				sortChips[i].classList.remove('mdc-chip--selected');
		$scope.project.tasks = $scope.sortTasks($scope.project.tasks);
	}
	 
	$scope.sortTasks = function(src) {
		
		let sortBy = document.querySelector('div.mdc-chip--selected').id.substring(10);
		if(sortBy=='created.date' || sortBy=='pc')
			return _.sortBy(src, [sortBy]);
		else
			return _.reverse(_.sortBy(src, [sortBy]));
	}
	
	$scope.taskChanges = [];
	$scope.trackTaskChange = function(src) {
		
		if($scope.taskChanges.indexOf(src.task._id)==-1)
			$scope.taskChanges.push(src.task._id);
	}	
	
	$scope.updateTasks = function(src) {
		
		for(let i = 0; i<$scope.taskChanges.length; i++) {	
			if($scope.taskChanges[i]==src.task._id) {
				let dbObjUrl = `/_data/${src.task._id}`; 
				$http.get(dbObjUrl).then(function(getResp) {					
					var task = getResp.data;
					task.summary = src.task.summary;
					task.descr = src.task.descr;
					task.pc = parseInt(src.task.pc);
					task.dateDue = src.task.dateDue;
					task.updated = {"usr": parayer.auth.getUsrId(), "date":  $filter('date')(new Date(), 'yyyy-MM-dd HH:mm:ss')};
					// TODO Consider summary field validation as per https://docs.angularjs.org/api/ng/input/input%5Bdate%5D#examples	
					if(task.summary.trim()=='') {
						parayer.ui.showSnackbar('A task summary is required!', 'warn');
						$scope.taskChanges.splice(i, 1);
						return;
					}
					$http.put(dbObjUrl, JSON.stringify(task)).then(function(putResp) {
						if(putResp.status==200) {
							if(putResp.statusText=='OK') {
								$scope.taskChanges.splice(i, 1);
								for(let j = 0; j<$scope.project.tasks.length; j++)
									if($scope.project.tasks[j]._id==src.task._id)
										$scope.project.tasks[j] = task;
								$scope.project.tasks = $scope.sortTasks($scope.project.tasks);
							}
							else
								parayer.ui.showSnackbar('Oops! Something went wrong, contact your system admin', 'error');
						}
						else
							parayer.ui.showSnackbar('Oops! Something went wrong, contact your system admin', 'error');
					});					
				});				
				break;
			}
		}
	}	
	
	$scope.newTask = function() {
		
		$http.get('/_uuid').then(function(respUuid) {
			let uuid = respUuid.data.uuid;
			let task = {};
			task._id = uuid;
			task.type = 'ProjectTask';
			task.summary = 'New task';
			task.descr = '';
			task.pc = 0;
			task.dateDue = '';
			task.created = {"usr": parayer.auth.getUsrId(), "date":  $filter('date')(new Date(), 'yyyy-MM-dd HH:mm:ss')};
			task.updated = {"usr": parayer.auth.getUsrId(), "date":  $filter('date')(new Date(), 'yyyy-MM-dd HH:mm:ss')};
			task.project = $scope.project._id;
			task.usrAssignList = [parayer.auth.getUsrId()];
			let dbObjUrl = `/_data/${uuid}`;	
			$http.put(dbObjUrl, JSON.stringify(task)).then(function(putResp) {
				if(putResp.status==200) {
					if(putResp.statusText=='OK') {
						$scope.project.tasks.unshift(task);
						$scope.project.tasks = $scope.sortTasks($scope.project.tasks);
						// TODO Focus new note's summary input
					}
					else
						parayer.ui.showSnackbar('Oops! Something went wrong, contact your system admin', 'error');
				}
				else
					parayer.ui.showSnackbar('Oops! Something went wrong, contact your system admin', 'error');
					
			});
		});
	}
	
	$scope.deleteTask = function(src, confirmed) {
		
		if(!confirmed) {			
			parayer.ui.showSimpleConfirmDialog('Task deletion can\'t be undone, please confirm.', 
				function() { $scope.deleteTask(src, true) }, function() { parayer.ui.showSnackbar('Task deletion cancelled!') });
			return;
		}
		else {
			let dbObjUrl = `/_data/${src.task._id}`;
			$http.get(dbObjUrl).then(function(qryResp) {
				var task = qryResp.data;
				$http.delete(`${dbObjUrl}?rev=${task._rev}`).then(function(delResp) {
					if(delResp.status==200) {
						if(delResp.statusText=='OK') {
							for(let j = 0; j<$scope.project.tasks.length; j++)
								if($scope.project.tasks[j]._id==src.task._id) {
									$scope.project.tasks.splice(j, 1);
									break;
								}
							$scope.project.tasks = $scope.sortTasks($scope.project.tasks);
							parayer.ui.showSnackbar('Task deleted!	', 'info');
						}
						else
							parayer.ui.showSnackbar('Oops! Something went wrong, contact your system admin', 'error');
					}
					else
						parayer.ui.showSnackbar('Oops! Something went wrong, contact your system admin', 'error');
				});
			});
		}
	}
	
	$scope.filterTasksByText = function(src) {
		
		for(let i = 0; i<$scope.project.tasks.length; i++) {
			let taskCntnr = document.getElementById(`project-task-${$scope.project.tasks[i]._id}`);
			if($scope.project.tasks[i].summary.toUpperCase().indexOf($scope.taskFilterText.toUpperCase())!=-1 || 
				$scope.project.tasks[i].descr.toUpperCase().indexOf($scope.taskFilterText.toUpperCase())!=-1)
				taskCntnr.style.display = '';
			else
				taskCntnr.style.display = 'none';
		}
	}
}]);