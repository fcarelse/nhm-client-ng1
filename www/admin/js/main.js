app.controller('Main', ['$scope', '$location', '$sce', 'Util', 'Notify', function ($scope, $location, $sce, Util, Notify) {

	sys.Tasks = nhm.DAO('tasks',{singular: 'task', plural: 'tasks', data, watching: true});
	data.viewport = 'admin';
	const Sections = nhm.DAO('sections');
	Object.assign(sys, {Sections})
	sys.nextTick = Util.nextTick;
	if(!sys.edit) sys.edit = {};

	data.page = Util.findRecord(data.pages, 'tag', 'editPage');

	sys.navbar = {
		init: async ()=>{
			let [,page,tag] = $location.path().match(/\/([^\/]+)\/?([^\/]+)?/);
			switch(page){
				case 'editPage':{
					await sys.gotoEdit(tag);
				} break;
				case 'editArticle':{
					await sys.gotoEdArt(tag);
				} break;
				case 'task':{
					await sys.gotoTask(tag);
				} break;
				default: await sys.goto(page,tag);
			}
			Util.safeApply();
		},
	};

	sys.gotoEdit = async pageTag => {
		sys.page = Util.findRecord(sys.pages, 'tag', 'editPage');
	 	$location.path(`/editPage/${pageTag}`);
	 	data.edit = await sys.Pages.load(pageTag);
	 	Util.safeApply();
	}

	sys.gotoEdArt = async tag => {
		data.page = Util.findRecord(data.pages, 'tag', 'editArticle');
		// if(!data.page) return sys.goto('welcome');
	 	await sys.goto('editArticle', tag);
	 	data.edArt = await sys.Articles.load(tag);
	 	$location.path(`/editArticle/${tag}`);
	 	Util.safeApply();
	}

	sys.gotoTask = async id => {
		await sys.Tasks.reload();
		data.task = Util.findRecord(data.tasks, 'id', 'task');
		// if(!data.page) return sys.goto('welcome');
	 	await sys.goto('task', id);
	 	data.task = await sys.Tasks.load(id);
		console.log(data.task);
		if(data.task.error) return sys.goto('tasks');
	 	$location.path(`/task/${id}`);
	 	Util.safeApply();
	}

	sys.newPage = async ()=>{
		const tag = prompt('What is the tag of the new page?');
		if(!tag) return Notify.send('Tag required for new page.')
		if(tag.match(/\W/)) return Notify.send('Tag must be only lowercase letters.')
		const res = await nhm.Data('pages').create({tag, name: 'New Page'});
		if(res.error) return await sys.goto('pages');
		await sys.gotoEdit(res.record.tag);
	}

	sys.newArticle = async ()=>{
		const tag = prompt('What is the tag of the new article?');
		if(!tag) return Notify.send('Tag required for new article.')
		if(tag.match(/\W/)) return Notify.send('Tag must be only lowercase letters.')
		const res = await nhm.Data('articles').create({tag, name: 'New Article'});
		if(res.error) return await sys.goto('articles');
		await sys.gotoEdArt(res.record.tag);
	}

	sys.newTable = async ()=>{
		const tag = prompt('What is the tag of the new table?');
		if(!tag) return Notify.send('Tag required for new table.')
		if(!tag.match(/\w[\w\W\d]+/)) return Notify.send('Tag must be 2 or more characters starting with a lowercase letter.')
		const res = await nhm.Data('tables').create({tag, name: 'New Table', sort: {}});
		if(res.error) return await sys.goto('tables');
		data.table = res;
		sys.safeApply();
	}

	sys.Tables.formFields = [
		{
			name: 'Description',
			model: 'Tables.record.name',
			field: 'name'
		},
		{
			name: 'Sort By',
			model: 'Tables.record.sort.by',
			field: 'sort'
		},
		{
			name: 'Sort Order',
			model: 'Tables.record.sort.order',
			field: 'sort'
		},
	];

}]);