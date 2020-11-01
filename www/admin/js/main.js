app.controller('Main', ['$scope', '$location', '$sce', 'Util', 'Notify', function ($scope, $location, $sce, Util, Notify) {

	sys.Tasks = nhm.DAO('tasks',{singular: 'task', plural: 'tasks', data});
	data.viewport = 'admin';
	const Sections = nhm.DAO('sections');
	Object.assign(sys, {Sections})
	sys.nextTick = Util.nextTick;

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

	sys.gotoEdit = async page => {
		data.page = Util.findRecord(data.pages, 'tag', 'editPage');
		// if(!data.page) return sys.goto('welcome');
	 	await sys.goto('editPage', page);
	 	data.edit = await sys.Pages.load(page);
	 	$location.path(`/editPage/${page}`);
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

	sys.gotoTask = async tag => {
		data.page = Util.findRecord(data.pages, 'tag', 'task');
		// if(!data.page) return sys.goto('welcome');
	 	await sys.goto('task', tag);
	 	await sys.Tasks.load(tag);
		 console.log(data.task);
		if(data.task.error) return sys.goto('tasks');
	 	$location.path(`/task/${tag}`);
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

}]);