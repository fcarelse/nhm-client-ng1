import { html } from "https://unpkg.com/lit-html/lit-html.js";
import { component } from "https://unpkg.com/haunted/haunted.js";

function App() {
	const days = [
		{name:'Monday'},
		{name:'Tuesday'},
		{name:'Wednesday'},
		{name:'Thursday'},
		{name:'Friday'},
		{name:'Saturday'},
		{name:'Sunday'}
	]
  
  return html`
    <style>
      /* Shadow DOM styles */
    </style>
    <div>
      ${days.map(day => html`
        <div>
           <span>
              ${day.name}
           </span>
        </div>
      `)}
    </div>
  `;
}

customElements.define("my-app", component(App));