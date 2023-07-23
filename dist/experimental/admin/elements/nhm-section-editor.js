/**
 * @author Francis Carelse
 * @git user: fcarelse
 * Section Editor for Node Hosting Manager system (NHM)
 */

(function(){
// Start of enclosed scope

class NHMSectionEditor extends HTMLElement {
	static get MODES(){
		return 'textarea ckeditor markdown ace'
	}
	static nextID = 1;
	static instances = [];
	constructor(){
		super()
		NHMSectionEditor.instances.push(this);
		const element = this;

		// Setup State
		const state = this.state = genState.apply(this);
		(function(_id){ // Set readonly _id on state and element. Ensuring Uniqueness
			Object.defineProperty(state, '_id', { get(){ return _id } })
			Object.defineProperty(element, '_id', { get(){ return _id } })
		})(NHMSectionEditor.nextID++);
		state.id = this.hasAttribute('id')?
			this.getAttribute('id'):
			'NHMSectionEditor' + this._id;

		// Update Properties
		state.editor = this.hasAttribute('editor')?
			this.getAttribute('editor'):
			state.editor;

		state.placeholder = this.hasAttribute('placeholder')?
			this.getAttribute('placeholder'):
			state.placeholder;

		// Declare Update Properties
		'title content editor'.split(' ').forEach(prop=>{
			Object.defineProperty(element, prop, {
				set: function(value) { element.state[prop] = value; element.update(prop)},
				get: function(){ return element.state[prop]; }
			});
		});

		setTimeout($=>this.render(), 2000);
		// this.render();
		// End of Constructor
	}

	update(prop){
		const {id} = this;
		const element = this;
		this.dispatchEvent(new CustomEvent('updating',{detail: {id, element, prop}}))
		this.dispatchEvent(new CustomEvent(`updating.${prop}`,{detail: {id, element, prop}}))
		switch(prop){
			case 'editor': {
				this.render();
			} break;
			case 'content': case 'placeholder': {
				// Just let the events be fired.
				// Content can be read from state.
			} break;
		}
		this.dispatchEvent(new CustomEvent(`updated.${prop}`,{detail: {id, element, prop}}))
		this.dispatchEvent(new CustomEvent('updated',{detail: {id, element, prop}}))
	}

	render(){
		const {id} = this;
		const element = this;
		const elementName = `NHMSectionEditor${id}`;
		switch(this.editor){
			case 'ckeditor':{
				this.innerHTML = html`${genStyles.apply(this)}
					<textarea name="${elementName}" class="nhm-section-editor nhm-section-editor-ck"></textarea>`;
				CKEDITOR.replace(elementName, this.state.config_ck);
			}break;
			case 'markdown':{
				this.innerHTML = html`${genStyles.apply(this)}
					<div id="${elementName}" class="nhm-section-editor nhm-section-editor-md"></div>`;
				this.Editor = tui.Editor.factory({
					...this.state.config_md,
					el: this.querySelector(`#${elementName}`),
					initialValue: this.state.content,
					events: {
						change: ()=>{
							this.state.content = this.Editor.getMarkdown();
							this.update('content');
						},
					},
				});
				// this.Editor.on('change',()=>{
				// 	this.state.content = this.Editor.getValue()
				// 	update('content');
				// })
			}break;
			case 'textarea':{}break;
			case 'ace':{}break;
			case '': case 'textarea': default:{}break;
		}
		console.log(`Rendered ${this.id} for ${this.editor}`)
		this.dispatchEvent(new CustomEvent('rendered',{detail: {id, element}}));
	}

	static DEF_CONFIG_CK = {
		forcePasteAsPlainText: true,
		language: 'en',
		allowedContent: true,
		entities: false,
		height: '90vh',
		contenteditable: true
	};

	static DEF_CONFIG_MD = {
		previewStyle: 'vertical',
		height: '90vh',
		width: '400px',
		initialEditType: 'markdown',
		usageStatistics: false,
	};

	static DEF_CONFIG_ACE = {
		forcePasteAsPlainText: true,
		language: 'en',
		allowedContent: true,
		entities: false,
		height: '50vh',
		contenteditable: true
	};

	// End of Class definition of NHMSectionEditor
}


// Technically does nothing, but triggers lit-plugin for vscode to treat template literal string as html code.
function html(strArr, ...args){
	let str = '';
	for(let i=0; i<strArr.length; str+=(args[i++] ?? '')) str+=strArr[i];
	return str;
}

function genState(){
	return {
		name: 'Section Editor',
		title: '',
		content: '',
		placeholder: 'Enter Page Content Here',
		config_ck: {...NHMSectionEditor.DEF_CONFIG_CK},
		config_md: {...NHMSectionEditor.DEF_CONFIG_MD},
		config_ace: {...NHMSectionEditor.DEF_CONFIG_ACE},
		hide: false,
		rendered: false,
	};
}

function genStyles(){ return html`<style>
	.nhm-section-editor{
		width: 100%;
		height: 90vh;
	}
</style>`}

function includeScript(url){
	const script = document.createElement('script');
	script.src = url;
	document.body.appendChild(script);
}

function includeSheet(url){
	const link = document.createElement('link');
	link.rel = 'stylesheet';
	link.href = url;
	document.head.appendChild(link);
}

try{
	if(window instanceof Object && document instanceof Object){
		if(!window.CKEDITOR)
			includeScript('https://cdn.ckeditor.com/4.13.1/standard/ckeditor.js');
		if(!window.tui)
			includeScript('https://uicdn.toast.com/tui-editor/latest/tui-editor-Editor-full.js');
		includeSheet('https://uicdn.toast.com/tui-editor/latest/tui-editor.css');
		includeSheet('https://uicdn.toast.com/tui-editor/latest/tui-editor-contents.css');
		includeSheet('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.48.4/codemirror.css');
		includeSheet('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/styles/github.min.css');
		
		// if(!window.)
		window.customElements.define('nhm-section-editor', NHMSectionEditor);
		window.NHMSectionEditor = NHMSectionEditor;
	}
} catch(e){} // Not in browser environment

try{
	if(module instanceof Object && module.exports instanceof Object)
		Object.assign(module.exports, {default: NHMSectionEditor, NHMSectionEditor});
} catch(e){} // Not in commonJS environment

// End of enclosed scope
})();
