'use strict';

angular.module('parayer.projectView', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
	
	$routeProvider.when('/project/:projectId', {
		templateUrl: 'project-view/project-view.html',
		controller: 'projectViewCtrl'
	});
}])
.controller('projectViewCtrl', ['$routeParams', '$scope', '$http', function($routeParams, $scope, $http) {
		
	// -- UI setup ---------------------------------------------------------------------------------------------------------------------------------------------
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
	
	// -- Scope initialization ---------------------------------------------------------------------------------------------------------------------------------
	$scope.loadTabContent = function(tabId) {
		
		switch(tabId) {
		case 'tab-notes':
			// TODO Optimize view: maybe not all fields are required to be emitted as we're using &include_docs=true
			$scope.objDataUrl = `/_data/_design/global-scope/_view/notes-attached-to?key="${$routeParams.projectId}"&include_docs=true`;
			$http.get($scope.objDataUrl).then(function(getResp) {
				// TODO As global, note handling should be moved elsewhere
				$scope.project.notes = [];
				for(let i = 0; i<getResp.data.rows.length; i++)
					$scope.project.notes.push(new VProjectNote(getResp.data.rows[i].doc));
				$scope.project.notes = _.reverse(_.sortBy($scope.project.notes, ['date', 'summary'])); 
				parayer.ui.showWait(false);
			});
			break;
		case 'tab-tasks':
			// TODO Optimize view: not all fields are required to be emitted as we're using &include_docs=true
			$scope.objDataUrl = `/_data/_design/project/_view/tasks-by-project?key="${$routeParams.projectId}"&include_docs=true`;
			$http.get($scope.objDataUrl).then(function(getResp) {				
				$scope.project.tasks = [];
				for(let i = 0; i<getResp.data.rows.length; i++)
					$scope.project.tasks.push(new VProjectTask(getResp.data.rows[i].doc));
				$scope.project.tasks = $scope.sortTasks($scope.project.tasks); 
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
			parayer.history.getFor($scope.project._id, $http, function(h) {
				$scope.project.history = h;
				// Compute date filters available
				let filtersAdded = [];
				$scope.historyDateFilterOptions = [];  
				$scope.historyDateFilterOptions.push({"value": "", "text": "At any time", order: 999})
				for(let i = 0; i<$scope.project.history.length; i++) {
					let entry = $scope.project.history[i];
					entry.dateFilterLabels = [];
					if(parayer.date.isToday(entry.timestamp)) {
						entry.dateFilterLabels.push('today');
						if(filtersAdded.indexOf('today')==-1) {
							filtersAdded.push('today');
							$scope.historyDateFilterOptions.push({"value": "today", "text": "Today", order: 0});
						}
					}
					if(parayer.date.isYesterday(entry.timestamp)) {
						entry.dateFilterLabels.push('yesterday');
						if(filtersAdded.indexOf('yesterday')==-1) {
							filtersAdded.push('yesterday');
							$scope.historyDateFilterOptions.push({"value": "yesterday", "text": "Yesterday", order: -1});
						}
					}
					if(parayer.date.isThisWeek(entry.timestamp)) {
						entry.dateFilterLabels.push('thisweek');
						if(filtersAdded.indexOf('thisweek')==-1) {
							filtersAdded.push('thisweek');
							$scope.historyDateFilterOptions.push({"value": "thisweek", "text": "This week", order: -7});
						}
					}
					if(parayer.date.isLastWeek(entry.timestamp)) {
						entry.dateFilterLabels.push('lastweek');
						if(filtersAdded.indexOf('lastweek')==-1) {
							filtersAdded.push('lastweek');
							$scope.historyDateFilterOptions.push({"value": "lastweek", "text": "Last week", order: -14});
						}
					}
					if(parayer.date.isThisMonth(entry.timestamp)) {
						entry.dateFilterLabels.push('thismonth');
						if(filtersAdded.indexOf('thismonth')==-1) {
							filtersAdded.push('thismonth');
							$scope.historyDateFilterOptions.push({"value": "thismonth", "text": "This month", order: -30});
						}
					}
					if(parayer.date.isLastMonth(entry.timestamp)) {
						entry.dateFilterLabels.push('lastmonth');
						if(filtersAdded.indexOf('lastmonth')==-1) {
							filtersAdded.push('lastmonth');
							$scope.historyDateFilterOptions.push({"value": "lastmonth", "text": "Last month", order: -60});
						}
					}
					if(entry.dateFilterLabels.length==0) { 
						let label = `${entry.timestamp.getFullYear()}-${String(entry.timestamp.getMonth()+1).padStart(2, '0')}`;
						entry.dateFilterLabels.push(label);
						if(filtersAdded.indexOf(label)==-1) {
							filtersAdded.push(label);
							// TODO "year-month" in current locale needed for text field
							$scope.historyDateFilterOptions.push({"value": label, "text": label, order: -90});
						}
					}
				}
				$scope.historyDateFilterOptions = _.reverse(_.sortBy($scope.historyDateFilterOptions, ['order', 'value']));
			});
			parayer.ui.showWait(false);
			break;
		default:
			// TODO Add input fields validation (see: https://docs.angularjs.org/api/ng/input/input%5Bdate%5D#examples)
			$scope.objDataUrl = `/_data/${$routeParams.projectId}`;
			$http.get($scope.objDataUrl).then(function(respProject) {
				$scope.project = new VProject(respProject.data);
				parayer.ui.setLocation(`Project :: ${$scope.project.name}`);
				parayer.ui.showWait(false);
			});
		}
	};
	$scope.loadTabContent('tab-general');
	parayer.ui.showWait(false);
		
	// -- View worker ------------------------------------------------------------------------------------------------------------------------------------------
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
	
	$scope.save = function() {
		
		let p = $scope.project;
		// TODO Consider effortUnit and effortCap fields validation as per https://docs.angularjs.org/api/ng/input/input%5Bdate%5D#examples
		let r = new RegExp('[0-9]+:[0-5]{1}[0-9]{1}');
		if(p.effortUnit.trim()!='' && !r.test(p.effortUnit)) {
			parayer.ui.showSnackbar('Effort unit should be set as hours:minutes', 'warn');
			return;
		}
		if(p.effortCap.trim()!='' && !r.test(p.effortCap)) {
			parayer.ui.showSnackbar('Effort cap should be set as hours:minutes', 'warn');
			return;
		}
		let dbObjUrl = `/_data/${p._id}`; 
		$http.put(dbObjUrl, p.stringify()).then(function(putResp) {
			if(putResp.status==200) {
				if(putResp.data.ok){
					p.refresh(putResp.data.rev);
					parayer.ui.goHome();
				}
				else // TODO Improve this message for (user-side) troubleshooting
					parayer.ui.showSnackbar(`Oops! ${putResp.data.reason}`); 
			}
			else
				parayer.ui.showSnackbar('Oops! Something went wrong, contact your system admin', 'error');			
		});
	}
	
	// -- Project NOTES management --
	// TODO As global, note handling should be moved elsewhere	
	// TODO User-selectable colours for notes would be fine!
	$scope.updateNote = function(src) {

		let n = src.note;
		if(n.changed) {			
			// TODO Consider summary field validation as per https://docs.angularjs.org/api/ng/input/input%5Bdate%5D#examples
			if(n.summary.trim()=='') {
				parayer.ui.showSnackbar('A note summary is required!', 'warn');
				return;
			}			
			let dbObjUrl = `/_data/${n._id}`; 
			$http.put(dbObjUrl, n.stringify()).then(function(putResp) {
				if(putResp.status==200) {
					if(putResp.data.ok) {						
						n.refresh(putResp.data.rev);
						$scope.project.notes = _.reverse(_.sortBy($scope.project.notes, ['date', 'summary']));
						parayer.history.make(`Updated note "${n.summary}"`, $scope.project._id, [n._id], false, $http);
					}
					else // TODO Improve this message for (user-side) troubleshooting
						parayer.ui.showSnackbar(`Oops! ${putResp.data.reason}`); 
				}
				else
					parayer.ui.showSnackbar('Oops! Something went wrong, contact your system admin', 'error');			
			});
		}		
	}	
	
	$scope.newNote = function() {
		
		$http.get('/_uuid').then(function(respUuid) {
			let n = new VProjectNote(respUuid.data.uuid);
			let dbObjUrl = `/_data/${n._id}`;	
			$http.put(dbObjUrl, n.stringify()).then(function(putResp) {
				if(putResp.status==200) {
					if(putResp.statusText=='OK') {
						n.refresh(putResp.data.rev);
						$scope.project.notes.unshift(n);
						// TODO Focus new note's summary input
						parayer.history.make(`Added a new note`, $scope.project._id, [n._id], false, $http);
					}
					else // TODO Improve this message for (user-side) troubleshooting
						parayer.ui.showSnackbar(`Oops! ${putResp.data.reason}`);
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
			let n = src.note;
			let dbObjUrl = `/_data/${n._id}`;
			$http.delete(`${dbObjUrl}?rev=${n._rev}`).then(function(delResp) {
				if(delResp.status==200) {
					if(delResp.statusText=='OK') {
						for(let j = 0; j<$scope.project.notes.length; j++)
							if($scope.project.notes[j]._id==n._id) {
								$scope.project.notes.splice(j, 1);
								break;
							}
						$scope.project.notes = _.reverse(_.sortBy($scope.project.notes, ['date', 'summary']));
						parayer.history.make(`Deleted note "${n.summary}"`, $scope.project._id, null, false, $http);
						parayer.ui.showSnackbar('Note deleted!	', 'info');
					}
					else // TODO Improve this message for (user-side) troubleshooting
						parayer.ui.showSnackbar(`Oops! ${delResp.data.reason}`);
				}
				else
					parayer.ui.showSnackbar('Oops! Something went wrong, contact your system admin', 'error');
			});
		}
	}
	
	$scope.filterNotesByText = function(src) {
		
		for(let i = 0; i<$scope.project.notes.length; i++) {
			let noteCntnr = document.getElementById(`project-note-${$scope.project.notes[i]._id}`);
			if($scope.project.notes[i].summary.toUpperCase().indexOf($scope.noteFilterText.toUpperCase())!=-1 || 
				$scope.project.notes[i].descr.toUpperCase().indexOf($scope.noteFilterText.toUpperCase())!=-1)
				noteCntnr.style.display = '';
			else
				noteCntnr.style.display = 'none';
		}
	}
	
	// -- Project TASKS management --
	// TODO Improvement: second click on a chip should reverse the sort
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
		
		$scope.project.tasksCompleted = 0;
		_.forEach(src, function(task) {
			if(task.pc=='100') 				
				$scope.project.tasksCompleted++; 
		});
		let sortBy = document.querySelector('div.mdc-chip--selected').id.substring(10);
		if(sortBy=='created.date' || sortBy=='dateDue')
			return _.sortBy(src, [sortBy])
		else if(sortBy=='pc') 
			return _.sortBy(src, [function(task) { return parseInt(task.pc); }]);
		else
			return _.reverse(_.sortBy(src, [sortBy]));
	}
		
	$scope.updateTask = function(src) {
	
		let t = src.task;
		if(t.changed) {			
			// TODO Consider summary field validation as per https://docs.angularjs.org/api/ng/input/input%5Bdate%5D#examples
			if(t.summary.trim()=='') {
				parayer.ui.showSnackbar('A task summary is required!', 'warn');
				return;
			}				
			t.setUpdateInfo();
			let dbObjUrl = `/_data/${t._id}`; 
			$http.put(dbObjUrl, t.stringify()).then(function(putResp) {
				if(putResp.status==200) {
					if(putResp.data.ok) {						
						t.refresh(putResp.data.rev);
						$scope.project.tasks = $scope.sortTasks($scope.project.tasks);
						parayer.history.make(`Updated task "${t.summary}"`, $scope.project._id, [t._id], false, $http);
					}
					else // TODO Improve this message for (user-side) troubleshooting
						parayer.ui.showSnackbar(`Oops! ${putResp.data.reason}`); 
				}
				else
					parayer.ui.showSnackbar('Oops! Something went wrong, contact your system admin', 'error');			
			});
		}
	}	
	
	$scope.newTask = function() {
		
		$http.get('/_uuid').then(function(respUuid) {
			let t = new VProjectTask(respUuid.data.uuid);
			let dbObjUrl = `/_data/${t._id}`;	
			$http.put(dbObjUrl, t.stringify()).then(function(putResp) {
				if(putResp.status==200) {
					if(putResp.data.ok) {
						t.refresh(putResp.data.rev);
						$scope.project.tasks.unshift(t);
						$scope.project.tasks = $scope.sortTasks($scope.project.tasks);
						// TODO Focus new task's summary input
						parayer.history.make(`Added a new task`, $scope.project._id, [t._id], false, $http);
					}
					else // TODO Improve this message for (user-side) troubleshooting
						parayer.ui.showSnackbar(`Oops! ${putResp.data.reason}`); 
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
			let t = src.task;
			let dbObjUrl = `/_data/${t._id}`;
			$http.delete(`${dbObjUrl}?rev=${t._rev}`).then(function(delResp) {
				if(delResp.status==200) {
					if(delResp.data.ok) {
						for(let j = 0; j<$scope.project.tasks.length; j++)
							if($scope.project.tasks[j]._id==t._id) {
								$scope.project.tasks.splice(j, 1);
								break;
							}
						$scope.project.tasks = $scope.sortTasks($scope.project.tasks);
						parayer.history.make(`Deleted task "${t.summary}"`, $scope.project._id, null, false, $http);
						parayer.ui.showSnackbar('Task deleted!	', 'info');
					}
					else // TODO Improve this message for (user-side) troubleshooting
						parayer.ui.showSnackbar(`Oops! ${delResp.data.reason}`); 
				}
				else
					parayer.ui.showSnackbar('Oops! Something went wrong, contact your system admin', 'error');
			});
		}
	}
	
	$scope.purgeTasks = function(confirmed) {
		
		if(!confirmed) {			
			parayer.ui.showSimpleConfirmDialog('Task deletion can\'t be undone, please confirm.', 
				function() { $scope.purgeTasks(true) }, function() { parayer.ui.showSnackbar('Task purge cancelled!') });
			return;
		}
		else {
			_.forEach($scope.project.tasks, function(task) {
				if(task.pc==100)
					$scope.deleteTask({"task": task}, true);
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
	
	// -- Project FILES management --
	// TODO To be implemented
	
	// -- Project APPOINTMENTS management --
	// TODO To be implemented
	
	// -- Project HISTORY tab --
	$scope.filterHistory = function(src) {
		
		let filter = document.getElementById('history-filter-date-select').value;
		for(let i = 0; i<$scope.project.history.length; i++) {
			let entryCntnr = document.getElementById(`project-hist-entry-${$scope.project.history[i]._id}`);
			let textFilter = $scope.historyFilterText!=''?$scope.historyFilterText.toUpperCase():'';
			if($scope.project.history[i].summary.toUpperCase().indexOf(textFilter)!=-1 &&
				(filter=='' || $scope.project.history[i].dateFilterLabels.indexOf(filter)!=-1))
				entryCntnr.style.display = '';
			else
				entryCntnr.style.display = 'none';
		}
	}
	
	// -- View objects -----------------------------------------------------------------------------------------------------------------------------------------
	class VProject {
		
		constructor(d) {
			
			this._id = d._id;
			this._rev = d._rev;
			this.type = d.type;
			this.name = d.name;
  			this.descr = d.descr;
			this.usrAdminList = d.usrAdminList;
			this.usrAssignList = d.usrAssignList;
			this.actGrp = d.actGrp;
			this.dateStart = d.dateStart!=''?new Date(Date.parse(d.dateStart)):null;
			this.dateEnd = d.dateEnd!=''?new Date(Date.parse(d.dateEnd)):null;
			this.effortUnit = d.effortUnit;
			this.effortCap = d.effortCap;
		}
		
		stringify() {
		
			 let o = {
				"_id": this.i_id,
				"_rev": this._rev,
				"type": this.type,
				"name": this.name,
	  			"descr": this.descr,
				"usrAdminList": this.usrAdminList,
				"usrAssignList": this.usrAssignList,
				"actGrp": this.actGrp,
				"dateStart": this.dateStart!=null?this.dateStart.toISOString():'',
				"dateEnd": this.dateEnd!=null?this.dateEnd.toISOString():'',
				"effortUnit": this.effortUnit,
	  			"effortCap": this.effortCap
			}; 
            return JSON.stringify(o);
		}
		
		refresh(rev) {
			
			this._rev = rev;	
		}
	}
	
	class VProjectNote {

		constructor(d) {
		
			if(typeof(d)==='object') {
				this._id = d._id;
				this._rev = d._rev; 
				this.type = d.type;
				this.summary = d.summary; 
				this.descr = d.descr;
				this.usr = d.usr;
				this.date = d.date!=''?new Date(Date.parse(d.date)):null;
				this.attachedTo = $scope.project._id;
			}
			else {
				this._id = d;
				this.type = 'Note';
				this.summary = 'New note';
				this.descr = '';
				this.usr = parayer.auth.getUsrId();
				this.date = new Date();
				this.attachedTo = $scope.project._id;
			}		
		}
		
        stringify() {
	
            let o = {
                "_id": this._id,
				"_rev": this._rev,
                "type": this.type,
                "summary": this.summary,
                "descr": this.descr,
				"usr": this.usr,
				"date": this.date.toISOString(),
				"attachedTo": this.attachedTo
            };
            return JSON.stringify(o);
        }

		refresh(rev) {
				
			this.changed = false;
			this._rev = rev;
		}		
	}
	
    class VProjectTask {
	
        constructor(d) {
	
            if (typeof(d)==='object') {
				// Object from db
                this._id = d._id;
                this._rev = d._rev;
				this.type = d.type;
                this.summary = d.summary;
                this.descr = d.descr;
                this.pc = `${d.pc}`;
                this.dateDue = d.dateDue!=''?new Date(Date.parse(d.dateDue)):null;
                this.created = {
                    "usr": d.created.usr,
                    "date": new Date(Date.parse(d.created.date))
                };
                this.updated = {
                	"usr": d.updated.usr,
                    "date": new Date(Date.parse(d.updated.date))
                };
                this.project = $scope.project._id;
                this.usrAssignList = d.usrAssignList;
            }
            else {
                // New project task
				let now = new Date();
                this._id = d;
                this.type = 'ProjectTask';
                this.summary = 'New task';
                this.descr = '';
                this.pc = '0';
                this.dateDue = null;
                this.created = { "usr": parayer.auth.getUsrId(), "date": now };
                this.updated = { "usr": parayer.auth.getUsrId(), "date": now };
                this.project = $scope.project._id;
                this.usrAssignList = [parayer.auth.getUsrId()];
            }
		}

		setUpdateInfo() {
				
			// TODO Maybe shouldn't' udpate for a given time-windoww after task creation (as they're usually inmmediately updated after that and thus is useless info)
			this.updated = {
				"usr": parayer.auth.getUsrId(),
				"date": new Date()
			}				
		}

        stringify() {
	
            let o = {
                "_id": this._id,
				"_rev": this._rev,
                "type": this.type,
                "summary": this.summary,
                "descr": this.descr,
                "pc": parseInt(this.pc),
                "dateDue": this.dateDue != null ? this.dateDue.toISOString() : '',
                "created": { "usr": this.created.usr, "date": this.created.date.toISOString() },
                "updated": { "usr": this.updated.usr, "date": this.updated.date.toISOString() },
                "project": this.project,
                "usrAssignList": this.usrAssignList
            };
            return JSON.stringify(o);
        }

		refresh(rev) {
				
			this.changed = false;
			this._rev = rev;
		}
    }
}]);