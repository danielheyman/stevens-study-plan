var studyplanMap = {
	'Computer Science 2014': 'cs-2014'
};

$(document).ready(function() {
	if($("body").html().indexOf('Current Academic Program') === -1) return;
	
	
	var major = (/Admitted[\s\S]*?Major:\s+([ \S]+)/g.exec($("pre").html()))[1];
	var year = (/--(\d+)/.exec($("pre").html())[1]);
	studyplan = studyplanMap[major + " " + year];
	if(!studyplan) {
		return render('Sorry, unavailable for your major and year :( Contact dheyman@stevens.edu for a request.');
	}
	
	$.ajax({
	  	url: chrome.extension.getURL('/studyplans/' + studyplan + '.json'),
	  	dataType: 'json',
	  	success: function(res) {
			studyplan = res;
			parse();
		},
		error: function(err) {
			console.log('Error: invalid json');
		}
	});
});

var studyplan = null;
var filled = {};
var unassigned = [];

var parse = function() {
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
};

Array.prototype.prepend = function(x) {
	var temp = this.slice(0);
	temp.unshift(x);
	return temp;
};

var fill = function(period, classes) {
	classes.forEach(function(c) {
		if(c[3] == 'F' || c[3] == 'W') return unassigned.push(c.prepend(period));
		// class = c, try to match against all studyplan
		var assigned = false;
		studyplan.forEach(function(studygroup) { Object.keys(studygroup).forEach(function(key) {
			var plan;
			var isList = Array.isArray(studygroup[key]);
			if(isList) {
				plan = studygroup[key][0];
				if(filled.hasOwnProperty(key) && filled[key].length >= studygroup[key][1]) return;
			} else {
				plan = studygroup[key];
				if(filled.hasOwnProperty(key)) return;
			}
			if(assigned) return;
			
			var fillMe = function(toFill) {
				if(!toFill || assigned) return;
				var temp = c.prepend(period);
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
						(c[4] > '1.00' || opt.credits == c[4]) &&
						opt.except.indexOf(c.slice(0, 2).join(' ')) === -1
					);
				});
			}
		}); });
		if(!assigned) unassigned.push(c.prepend(period));
	});
};

var render = function(res) {
	$("body").append("<button id='showStudyPlan' style='position: fixed; background: #599e76; border: 0; color: #fff; line-height: 30px; padding: 0 10px; cursor: pointer; right: 30px; top: 30px; box-shadow: 0 0 10px #8a8a8a;'>SHOW STUDY PLAN</button>");
	$("body").append("<div id='studyPlan' style='position: fixed; top: 0; left: 0; height: 100%; width: 100%; background: rgba(0, 0, 0, .5); display: none;'><div style='box-sizing:border-box; padding: 20px; position: fixed; width: 90%; height: 90%; top: 5%; left: 5%; background: #fff; overflow: scroll;'>" + res + "</div></div>");
	$("#showStudyPlan").click(function() {
		$("#studyPlan").show();
		$("body").css("overflow", "hidden");
	});
	$("#studyPlan").click(function(e) {
		if($(e.target).attr("id") != "studyPlan") return;
		$("#studyPlan").hide();
		$("body").css("overflow", "auto");
	});
};



var printFilled = function() {
	var res = "";
	var addLine = function(r) {res += r + '<br>';};
	var courseString = function(c) {
		if(!c) return '<font color="red">TODO</font>';
		var val = c[1] + ' ' + c[2] + c[3] + ' (sem: ' + c[0] + ', grade: ';
		val += (c[4] == 'IP') ? '<font color="green">IP</font>' : c[4];
		val += ', credits: ' + c[5] + ')';
		return val;
	};
	
	studyplan.forEach(function(studygroup) { Object.keys(studygroup).forEach(function(key) {
		if(Array.isArray(studygroup[key])) {
			addLine('<b>' + key + '</b>: ');
			var count = 0;
			filled[key].forEach(function(c) {
				addLine(courseString(c));
				count++;
			});
			while(count++ < studygroup[key][1]) addLine(courseString(null));
		}
		else addLine('<b>' + key + '</b>: ' + courseString(filled[key]));
	}); addLine("<br><br><hr>"); });
	
	
	addLine('<b>General Elective Credits:</b>');
	unassigned.forEach(function(c) {
		if(c[4] == 'F' || c[4] == 'P' || c[4] == 'W') return;
		addLine(courseString(c));
	});
	
	addLine("<br><br><hr>");
	addLine('<b>Other Pass/Fail/Withdraw:</b>');
	unassigned.forEach(function(c) {
		if(c[4] != 'F' && c[4] != 'P' && c[4] != 'W') return;
		addLine(courseString(c));
	});
	
	res += '';
	
	render(res);
};
