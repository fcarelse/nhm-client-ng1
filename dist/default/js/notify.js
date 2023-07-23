app.factory('Notify', ['Util', function(Util){

	const Notify = nhm.Notify = {notes: []};
	var noteIdIter = 1;

	Notify.send = Notify.add = function(note, type, delay){
		if(!delay) delay = 10000;
		if(!note) return;
		var prev = Util.findBone(nhm.Notify.notes, 'note', note);
		var newNotice = {
			note: note,
			type: type || 'warning',
			id: noteIdIter++,
			created: new Date(),
			count: prev? prev.count + 1: 1
		};
		if(prev) Notify.close(prev.id);
		nhm.Notify.notes.push(newNotice);
		newNotice.timer = setTimeout(function(){
			Notify.close(newNotice.id);
			sys.safeApply();
		}, delay);
		sys.safeApply();
		return newNotice.id;
	};

	Notify.clear = function(){
		nhm.Notify.notes.forEach(function(notice){
			clearTimeout(notice.timer);
		});
		nhm.Notify.notes.length = 0; // Use Splice for Vue
	};

	Notify.close = function(id){
		if(id === undefined || id === null) return;
		for(var i = 0; i < nhm.Notify.notes.length; i++)
			if(id.toString() === nhm.Notify.notes[i].id.toString()){
				for(var j = i + 1; j < nhm.Notify.notes.length; j++)
					nhm.Notify.notes[j - 1] = nhm.Notify.notes[j];
				nhm.Notify.notes.length--;
			}
		sys.safeApply();
	};


	return Notify
}]);