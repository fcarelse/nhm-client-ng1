app.controller('Tasks', ['$scope', function ($scope) {

	const Tasks = sys.Tasks;
	Tasks.reload().then(loadTasks);
	Tasks.watch('tasks', loadTasks);

	sys.loadTasks = loadTasks;
	async function loadTasks(){
		Tasks.stages = nhm.Select.taskStages
			.filter(stage=>!stage.hide)
			.map(stage=>stage.id);
		Tasks.statuses = nhm.Select.taskStatuses
			.filter(status=>!status.hide)
			.map(status=>status.id);
		Tasks.stageStatuses = [];
		// For each stage
		Tasks.stages.forEach(stage=>{
			// Make a stage object with an 'all' parameter containing all tasks for that stage
			data[stage]={all: data.tasks.filter(t=>t.stage==stage)};
			// For each status
			Tasks.statuses.forEach(status=>{
				// In each stage make a status parameter with a list of tasks with that status for this stage.
				data[stage][status]=data[stage].all.filter(t=>t.status==status)
				// Create entry in stageStatuses
				Tasks.stageStatuses.push({
					id: 1 + Tasks.stageStatuses.length,
					stage: stage,
					status: status,
				})
			});
		});
		sys.safeApply();
	}
	
	sys.newTask = async ss =>{
		let name;
		if(!(name = prompt('Title of new Task')))
			return nhm.Notify.add('Cancelling creating new Task');
		const res = await nhm.Data('tasks').create({stage: ss.stage, status: ss.status, name});
		if(res.error) return await sys.goto('tasks');
		await sys.gotoTask(res.record.id);
	}

}]);

