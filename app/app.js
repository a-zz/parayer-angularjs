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
	
	// FIXME Method contract missing
	// See: https://stackoverflow.com/a/6117889s
	context.getWeekNumber = function(d) {
	   	
		d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
	    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
	    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
	    var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
	    return [d.getUTCFullYear(), weekNo];
	}
	
	// FIXME Method contract missing
	context.diff = function(d1, d2) {
		
		let u1 = Date.UTC(d1.getYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes(), d1.getSeconds(), d1.getMilliseconds());
		let u2 = Date.UTC(d2.getYear(), d2.getMonth(), d2.getDate(), d2.getHours(), d2.getMinutes(), d2.getSeconds(), d2.getMilliseconds());
		return u1-u2;
	}
	
	// FIXME Method contract missing
	context.isToday = function(d) {
		
		return new Date().toLocaleDateString()==d.toLocaleDateString();			
	}
	
	// FIXME Method contract missing
	context.isYesterday = function(d) {
		
		let y = new Date(); 
		y.setDate(new Date().getDate()-1);
		return y.toLocaleDateString()==d.toLocaleDateString();
	}
	
	// FIXME Method contract missing
	context.isThisWeek = function(d) {
		
		let tw = parayer.date.getWeekNumber(new Date());
		let dw = parayer.date.getWeekNumber(d);
		return tw[0]==dw[0] && tw[1]==dw[1];
	}	
	
	// FIXME Method contract missing
	context.isLastWeek = function(d) {
		
		let tw = parayer.date.getWeekNumber(new Date());
		let dw = parayer.date.getWeekNumber(d);
		return (tw[0]==dw[0] && tw[1]==dw[1]+1) || (tw[0]==dw[0]+1 && tw[1]==1);   
	}
	
	// FIXME Method contract missing
	context.isThisMonth = function(d) {
		
		let tm1 = new Date(); tm1.setDate(1); tm1.setHours(0); tm1.setMinutes(0); tm1.setSeconds(0);
		let dm1 = new Date(d.getFullYear(), d.getMonth(), 1);
		
		return tm1.toLocaleDateString()==dm1.toLocaleDateString();
	}
	
	// FIXME Method contract missing
	context.isLastMonth = function(d) {
		
		let lm1;
		let t = new Date();
		if(d.getMonth()>0)
			lm1 = new Date(t.getFullYear(), t.getMonth()-1, 1);
		else
		 	lm1 = new Date(t.getFullYear()-1, 11, 1);
		lm1.setHours(0); lm1.setMinutes(0); lm1.setSeconds(0);
		let dm1 = new Date(d.getFullYear(), d.getMonth(), 1); 
		return lm1.toLocaleDateString()==dm1.toLocaleDateString();
	}
})(parayer.date);

parayer.history = {};	// -- App-wide history management sub-namespace --
(function(context) {
	
	// FIXME Method contract missing
	class VHistEntry {
		
		constructor(d) {
			
			this._id = d._id;
			this._rev = d._rev;
			this.type = 'HistEntry';
			this.summary = d.summary;
			this.attachedTo = d.attachedTo;
			this.relatedTo = d.relatedTo;
			this.usr = d.usr;
			this.timestamp = new Date(Date.parse(d.timestamp)); 
		}
		
		stringify() {
			
			let o = {
				"_id": this._id,
				"_rev_": this._rev,
				"type": 'HistEntry',
				"summary": this.summary,
				"attachedTo": this.attachedTo,
				"relatedTo": this.relatedTo,
				"usr": this.usr,
				"timestamp": this.timestamp.toISOString()
			};
			return JSON.stringify(o);
		}
	}
	
	// FIXME Method contract missing
	context.getFor = function(objectId, $http) {
		
		let p = new Promise(function (resolve, reject) {
			let objDataUrl = `/_data/_design/global-scope/_view/history-for?key="${objectId}"&include_docs=true`;
			$http.get(objDataUrl).then(function(getResp) {				
				let r = [];
				for(let i = 0; i<getResp.data.rows.length; i++)
					r.push(new VHistEntry(getResp.data.rows[i].doc));
				resolve(_.reverse(_.sortBy(r, ['timestamp']))); 
			});
		});
		return p;
	}
	
	// FIXME Method contract missing
	context.make = function(summary, attachedTo, relatedTo, aggregate, $http) {
		
		if(aggregate==null) {
			$http.get('/_uuid').then(function(respUuid) {
				let e = new VHistEntry({
					"_id": respUuid.data.uuid,	
					"type": "HistEntry",
					"summary": summary,
					"attachedTo": attachedTo,
					"relatedTo": Array.isArray(relatedTo)?relatedTo:[],
					"usr": parayer.auth.getUsrId(),
					"timestamp": new Date()
				});
				let dbObjUrl = `/_data/${e._id}`;	
				$http.put(dbObjUrl, e.stringify()).then(function(putResp) {
					if(putResp.status==200) {
						if(!putResp.data.ok) 
							parayer.ui.showSnackbar(`History saving failed! ${putResp.data.reason}`);
					 } 
					else
						parayer.ui.showSnackbar('History saving failed! Contact your system admin', 'error');
						
				});
			});
		}
		else {
			parayer.history.getFor(attachedTo, $http).then(function(h) {
				h = _.filter(h, { "usr": parayer.auth.getUsrId(), "relatedTo": relatedTo });
				let now = new Date();
				h = _.filter(h, function(o) { 
						return parayer.date.diff(now, o.timestamp) <= aggregate;					
				 });
				if(h.length==0) //Can't aggregate, new entry
					parayer.history.make(summary, attachedTo, relatedTo, null, $http);
				else {
					h = _.sortBy(h, ['timestamp']);
					// TODO Improve summary on aggregation (figure out how)
					parayer.history.make(`${h[0].summary}`, attachedTo, relatedTo, null, $http);
					for(let i = 0; i<h.length; i++) {
						let dbObjUrl = `/_data/${h[i]._id}`;
						$http.delete(`${dbObjUrl}?rev=${h[i]._rev}`);
					}
				}
			});	
		}
	}
})(parayer.history);

parayer.notes = {}; 	// -- App-wide note management sub-namespace --
(function(context) {

	class VNote {

		// FIXME Method contract missing
		constructor(d) {
		
			this._id = d._id;
			this._rev = d._rev; 
			this.type = d.type;
			this.summary = d.summary; 
			this.descr = d.descr;
			this.usr = d.usr;
			this.date = d.date!=''?new Date(Date.parse(d.date)):null;
			this.attachedTo = d.attachedTo;
		}

		// FIXME Method contract missing
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

		// FIXME Method contract missing
		refresh(rev) {
				
			this.changed = false;
			this._rev = rev;
		}

		// FIXME Method contract missing
		delete($http) {
			
			let n = this;
			let p = new Promise(function(resolve, reject) {
				let dbObjUrl = `/_data/${n._id}`;
				$http.delete(`${dbObjUrl}?rev=${n._rev}`).then(function(delResp) {
					if(delResp.status==200) {
						if(delResp.statusText=='OK') {
							parayer.ui.showSnackbar('Note deleted!	', 'info');
							resolve();
						}
						else {
							parayer.ui.showSnackbar(`Note deletion failed! ${delResp.data.reason}`);
							reject();
						}
					}
					else
						parayer.ui.showSnackbar('Note deletion failed! Contact your system admin', 'error');
				});
			});
			return p;
		}

		// FIXME Method contract missing
		update($http) {

			let n = this;
			let p = new Promise(function(resolve, reject) {
				if(n.summary.trim()=='') {
					parayer.ui.showSnackbar('A note summary is required!', 'warn');
					reject();
				}
				let dbObjUrl = `/_data/${n._id}`; 
				$http.put(dbObjUrl, n.stringify()).then(function(putResp) {
					if(putResp.status==200) {
						if(putResp.data.ok) {						
							n.refresh(putResp.data.rev);
							resolve();
						}
						else {
							parayer.ui.showSnackbar(`Note update failed! ${putResp.data.reason}`);
							reject();
						} 
					}
					else {
						parayer.ui.showSnackbar('Note udpate failed! Contact your system admin', 'error');
						reject();
					}
				});
			});
			return p;
		}
	}
	
	// FIXME Method contract missing
	context.getFor = function(objectId, $http) {

		let p = new Promise(function (resolve, reject) {
			// TODO Optimize view: maybe not all fields are required to be emitted as we're using &include_docs=true
			let objDataUrl = `/_data/_design/global-scope/_view/notes-attached-to?key="${objectId}"&include_docs=true`;
			$http.get(objDataUrl).then(function(getResp) {
				let r = [];
				for(let i = 0; i<getResp.data.rows.length; i++)
					r.push(new VNote(getResp.data.rows[i].doc));
				resolve(r); 
			});
		});
		return p;
	}
	
	// FIXME Method contract missing
	context.create = function(attachedTo, $http) {

		let p = new Promise(function (resolve, reject) {
			$http.get('/_uuid').then(function(respUuid) {
				let n = new VNote({
					"_id": respUuid.data.uuid,
					"type": "Note",
					"summary": "New note",
					"descr": "",
					"usr": parayer.auth.getUsrId(),
					"date": new Date().toISOString(),
					"attachedTo": attachedTo
				});
				let dbObjUrl = `/_data/${n._id}`;	
				$http.put(dbObjUrl, n.stringify()).then(function(putResp) {
					if(putResp.status==200) {
						if(!putResp.data.ok) {
							parayer.ui.parayer.ui.showSnackbar(`Note creation failed! ${putResp.data.reason}`);
							reject();
						}
						else {
							n.refresh(putResp.data.rev);
							resolve(n);
						}
					 } 
					else {
						parayer.ui.showSnackbar('Note creation failed! Contact your system admin', 'error');
						reject();
					}
				});
			});
		});
		return p;
	}
})(parayer.notes);

parayer.refchips = {}; 	// -- App-wide reference chips management sub-namespace --
(function(context) {
	
	var rccache = [];
	
	// FIXME Method contract missing
	// TODO Add click event on chips and redirect accordingly (not so immediate if relatedTo) 
	context.fillInAll = function($http) {
		
		let chips = document.querySelectorAll(".refchip");
		_.forEach(chips, function(chip) {
			let cached = parayer.refchips.getCached(chip.id);
			if(cached)
				parayer.refchips.fillIn(chip, cached.data);
			else {
				let dbObjUrl = `/_data/${chip.id}`;
				$http.get(dbObjUrl).then(function(getResp) {
					if(getResp.status==200)
						if(getResp.statusText=="OK")
							if(!getResp.data.error) {
								parayer.refchips.fillIn(chip, getResp.data);
								parayer.refchips.cacheIn(getResp.data);
							}
						else
							parayer.refchips.fillIn(chip, { "type": "error", "reason": `(${getResp.data.reason})` });
				});
			}
		});
	}
	
	context.getCached = function(_id) {
		
		let cached = _.find(rccache, function(o) {
				return o.data._id==_id;
		});
		if(cached) {
			if(cached.expiry>=_.now())
				return cached;
			else {
				_.remove(rccache, function(o) {
					return o.data._id==_id;
				});
				return null;
			}
		}
		else
			return null;
	}
	
	context.cacheIn = function(data) {
		
		_.remove(rccache, function(o) {
					return o.data._id==data._id;
		});
		let expiry = _.now();
		switch(data.type) {
			case "Note":
			case "ProjectTask":
				expiry += 10 * 60 * 1000; // 10 minutes
				break;
			default:
				expiry += 60 * 60 * 1000; // default: 1 hour 
		}
		rccache.push({ "expiry": expiry, "data": data })
	}
		
	// FIXME Method contract missing
	context.fillIn = function(chip, data) {
		
		switch(data.type) {
		case "Usr":
			chip.innerHTML = data.email;
			break;
		case "Note":
		case "ProjectTask":
			chip.innerHTML = data.summary;
			break;
		case "error":
			chip.innerHTML = data.reason;
			break;
		default:
			chip.innerHTML = '???';
		}
	}
})(parayer.refchips);

parayer.ui = {};	// -- UI management sub-namespace --
(function(context) {
	
	let topAppBar;	
	let drawer;
	let drawerOnChange = null;
	let snackbar;
	let simpleConfirmDialog;
	
	// FIXME Method contract missing
	context.init = function () {
		
		topAppBar = new mdc.topAppBar.MDCTopAppBar(document.querySelector('.mdc-top-app-bar'));	
		topAppBar.setScrollTarget(document.getElementById('main-content'));
		topAppBar.listen('MDCTopAppBar:nav', function() {
			drawer.open = !drawer.open;
		});
		drawer = mdc.drawer.MDCDrawer.attachTo(document.querySelector('.mdc-drawer'));
		snackbar = new mdc.snackbar.MDCSnackbar(document.querySelector('.mdc-snackbar'));
		simpleConfirmDialog = new mdc.dialog.MDCDialog(document.getElementById('simple-confirm-dialog'));
		// FIXME setEscapeKeyAction('cancel') and simpleConfirmDialog.setScrimClickAction('cancel') not working?!
		//simpleConfirmDialog.setEscapeKeyAction('cancel');
		//simpleConfirmDialog.setScrimClickAction('cancel');
	}
	
	context.setOnDrawerChange = function(fn) {
		
		if(fn!=null) {			
			drawer.listen('MDCDrawer:opened', fn);
			drawer.listen('MDCDrawer:closed', fn);
			drawerOnChange = fn;
		}
		else {
			drawer.unlisten('MDCDrawer:opened', drawerOnChange);
			drawer.unlisten('MDCDrawer:closed', drawerOnChange);
			drawerOnChange = null;			
		}
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
	
	// FIXME Method contract missing
	// TODO Make ok action available on Enter key (hint: data-mdc-dialog-button-default) 
	context.showSimpleConfirmDialog = function(innerHTML, okCallback, cancelCallBack) {
		
		document.getElementById('simple-confirm-dialog-content').innerHTML = innerHTML;
		document.querySelector('div#simple-confirm-dialog-actions button[data-mdc-dialog-action="ok"]').addEventListener('click', okCallback);
		document.querySelector('div#simple-confirm-dialog-actions button[data-mdc-dialog-action="cancel"]').addEventListener('click', cancelCallBack);		
		simpleConfirmDialog.open();
	}
	
	// FIXME Method contract missing
	context.goHome = function() {
		
		// TODO Currently inconditional redirect to activity grid, but maybe a finer logic would be fine
		location.href='#!/act-grid';
	}
	
	// FIXME Method contract missing
	context.txtFitContents = function(t) {
		
		t.style.height = '1px'; 
		t.style.height = (25 + t.scrollHeight) + 'px';
	}
	
	// FIXME Method contract missing
	// See: https://stackoverflow.com/a/13382873
	context.getScrollbarWidth = function() {

		const outer = document.createElement('div');
		outer.style.visibility = 'hidden';
		outer.style.overflow = 'scroll'; 
		outer.style.msOverflowStyle = 'scrollbar'; 
		document.body.appendChild(outer);
		const inner = document.createElement('div');
		outer.appendChild(inner);
		const scrollbarWidth = (outer.offsetWidth - inner.offsetWidth);
		outer.parentNode.removeChild(outer);
		return scrollbarWidth;
	}
})(parayer.ui);

parayer.util = {};	// -- General utility sub-namespace --
(function(context) { 

	// (nothing here yet)
	context.nothingHereYet = function() {
	
	}
})(parayer.util);