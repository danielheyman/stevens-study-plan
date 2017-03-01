var studyplan = {
	"science I": {classes: ["PEP 111", "CH 115", "PEP 111"]},
	"science II": {classes: ["PEP 112", "CH 116", "CH 281"]},
	"science Lab": {classes: ["PEP 221", "CH 117", "CH 282"]},
	"MA 121": null,
	"MA 122": null,
	"MA 123": null,
	"MA 124": null,
	"MA 222": null,
	"MA 331": null,
	"BT 353": null,
	"PE 200 I": {groups: ["PE"]},
	"PE 200 II": {groups: ["PE"]},
	"PE 200 III": {groups: ["PE"]},
	"PE 200 IV": {groups: ["PE"]},
	"CS 115 / CS 181": {classes: ["CS 115", "CS 181"]},
	"CS 146": null,
	"CS 135": null,
	"CS 284 / CS 182": {classes: ["CS 284", "CS 182"]},
	"CS 334": null,
	"CS 383": null,
	"CS 385": null,
	"CS 347": null,
	"CS 392": null,
	"CS 496": null,
	"CS 442": null,
	"CS 443": null,
	"CS 511": null,
	"CS 492": null,
	"CS 522 / CS 546 / CS 548": {classes: ["CS 522", "CS 546", "CS 548"]},
	"CS 306": null,
	"CS 423": null,
	"CS 485": null,
	"CS 424": null,
	"Software Dev Electives": {
		classes: ["CS 516", "CS 521", "CS 522", "CS 526", "CS 537", "CS 541", "CS 546", "CS 548", "CS 549", "CS 558"]
	},
	"Tech Electives": [{ 
		groupsOpt: [
			{groups: ["CS"], levelMin: 300, except: [
				"CS 501", "CS 570", "CS 510", "CS 514", "CS 520", "CS 550", "CS 561", "CS 590"
			]},
			{groups: ["SSW"], levelMin: 500, except: ["SSW 540"]}
		],
		classes: ["CpE 358"]
	}, 2],
	"Science/Math Electives": [{
		groupsOpt: [
			{groups: ["MA"], except: ["MA 117", "MA 118", "MA 119", "MA 134", "MA 502"]}
		],
		groups: ["PEP", "CH"]
	}, 2],
	"CAL 103": null,
	"CAL 105": null,
	"HUM 100/200": {
		groupsOpt: [
			{groups: ["HUM", "HHS", "HSS", "HLI", "HST", "COMM", "HTH", "HPL"], levelMin: 100, levelMax: 299},
		],
		classes: [
			"HAR 180", "HAR 181", "HAR 280", "HAR 281", "HMU 101", "HMU 102", "HMU 192", "HMU 193", "HMU 195"
		]
	},
	"HUM 300": {
		groupsOpt: [
			{groups: ["HUM", "HHS", "HSS", "HLI", "HST", "COMM", "HTH", "HPL"], levelMin: 300, levelMax: 399},
		],
		classes: [
			"BT 243", "BT 244", "HAR 380", "HAR 389", "HMU 350"
		]
	},
	"HSS 371 / HPL 455": { classes: ["HSS 371", "HPL 455"] },
	"HUM": [{
		groups: ["HUM", "HHS", "HSS", "HLI", "HST", "COMM", "HTH", "HPL"],
		classes: [
			"HAR 180", "HAR 181", "HAR 280", "HAR 281", "HAR 380", "HAR 389", "HAR 485", "HMU 101", "HMU 102", "HMU 192", "HMU 193", "HMU 195", "HMU 350", "BT 243", "BT 244"
		]
	}, 3],
};

var filled = {};

$(document).ready(function()
{
	if($("body").html().indexOf('Unofficial Transcript') === -1) return;
	
	// Parse
	var matches = /;-+(\d+) ([\d \w]+)-+([\s\S]*?)AHRS/g;
	var body = $("pre").html();
	while((res = matches.exec(body)) !== null) {
		var year = res[1].slice(2);
		var session = ({
			Fall: "F",
			Spring: "S",
			"Summer Session 1": "A",
			"Summer Session 2": "B",
		})[res[2]];
		
		// Took already
		var classmatch = /;(\w+)\s*-(\d+)-([\d\w]+)[\s\S]*?([A-FPW+-]+)\s+\(?(\d.\d\d)\)?/g;
		var classes = [];
		while((c = classmatch.exec(res[3])) !== null) {
			classes.push(c.slice(1,6));
		}
		// IP
		if(!classes.length) {
			classmatch = /;(\w+)\s*-(\d+)-([\d\w]+)[\s\S]+?(\d.\d\d)/g;
			while((c = classmatch.exec(res[3])) !== null) {
				classes.push(c.slice(1,4).concat('IP').concat(c[4]));
			}
		}
		fill(year + session, classes);
	}	
	
	printFilled();
});

var unassigned = [];

var fill = function(period, classes) {
	classes.forEach(function(c) {
		if(c[3] == 'F' || c[3] == 'W') {
			var temp = c.slice(0);
			temp.unshift(period);
			unassigned.push(temp);
			return;
		}
		// class = c, try to match against all studyplan
		var assigned = false;
		Object.keys(studyplan).forEach(function(key) {
			var plan;
			var isList = Array.isArray(studyplan[key]);
			if(isList) {
				plan = studyplan[key][0];
				if(filled.hasOwnProperty(key) && filled[key].length >= studyplan[key][1]) return;
			} else {
				plan = studyplan[key];
				if(filled.hasOwnProperty(key)) return;
			}
			if(assigned) return;
			
			var fillMe = function(toFill) {
				if(!toFill || assigned) return;
				var temp = c.slice(0);
			  	temp.unshift(period);
				if(isList && filled[key]) filled[key].push(temp);
				else if(isList) filled[key] = [temp];
				else filled[key] = temp;
				assigned = true;
			};
			
			// Match null case
			if(plan === null) return fillMe(key == c.slice(0, 2).join(' '));
			// Match classes case
			if(plan.hasOwnProperty('classes')) {
				fillMe(plan.classes.indexOf(c.slice(0, 2).join(' ')) > -1);
			}
			// Match groups case
			if(plan.hasOwnProperty('groups')) {
				fillMe(plan.groups.indexOf(c[0]) > -1);
			}
			// Match groups with options case
			if(plan.hasOwnProperty('groupsOpt')) {
				plan.groupsOpt.forEach(function(opt) {
					if(!opt.levelMin) opt.levelMin = 100;
					if(!opt.levelMax) opt.levelMax = 900;
					if(!opt.except) opt.except = [];
					fillMe(
						opt.groups.indexOf(c[0]) > -1 && 
						c[1] >= opt.levelMin && 
						c[1] <= opt.levelMax && 
						opt.except.indexOf(c.slice(0, 2).join(' ')) === -1
					);
				});
			}
		});
		if(!assigned) {
			var temp = c.slice(0);
			temp.unshift(period);
			unassigned.push(temp);
		}
	});
};

var courseString = function(c) {
	if(!c) return '<font color="red">TODO</font>';
	return c[1] + ' ' + c[2] + c[3] + ' (sem: ' + c[0] + ', grade: ' + c[4] + ', credits: ' + c[5] + ')';
};



var printFilled = function() {
	var res = "<br><br>";
	var addRes = function(r) {res += r + '<br>';};
	
	var last = null;
	Object.keys(studyplan).forEach(function(key) {
		if(last && last != key.slice(0, 2)) addRes("<br><br><hr>");
		last = key.slice(0, 2);
		if(Array.isArray(studyplan[key])) {
			addRes('<b>' + key + '</b>: ');
			var count = 0;
			filled[key].forEach(function(c) {
				addRes(courseString(c));
				count++;
			});
			while(count++ < studyplan[key][1]) addRes(courseString(null));
		}
		else addRes('<b>' + key + '</b>: ' + courseString(filled[key]));
	});
	
	addRes("<br><br><hr>");
	addRes('<b>General Elective Credits:</b>');
	unassigned.forEach(function(c) {
		if(c[4] == 'F' || c[4] == 'P' || c[4] == 'W') return;
		addRes(courseString(c));
	});
	
	addRes("<br><br><hr>");
	addRes('<b>Other Pass/Fail/Withdraw:</b>');
	unassigned.forEach(function(c) {
		if(c[4] != 'F' && c[4] != 'P' && c[4] != 'W') return;
		addRes(courseString(c));
	});
	
	res += '<br>';
	
	$("body").append(res);
};
