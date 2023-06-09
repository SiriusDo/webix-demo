import {create} from "../webix/html";
import {isArray, isUndefined, copy, toNode, delay, extend} from "../webix/helpers";
import {ui, $$} from "../ui/core";
import i18n from "../webix/i18n";
import {_event} from "../webix/htmlevents";
import {assert} from "../webix/debug";
import {callEvent} from "../webix/customevents";

function init_suggest(editor, input){
	const suggest = editor.config.suggest;
	if (suggest){
		const box = editor.config.suggest = create_suggest(suggest);
		const boxobj = $$(box);
		if (boxobj && input)
			boxobj.linkInput(input);
		return boxobj;
	}
}

function attach_editend(suggest){
	if (suggest && suggest.setMasterValue && !suggest._editor_initialized){
		suggest._editor_initialized = true;
		suggest.attachEvent("onValueSuggest", function(){
			delay(()=>callEvent("onEditEnd", []));
		});
	}
}

function create_suggest(config){
	if (typeof config == "string") return config;
	if (config.linkInput) return config._settings.id;

	if (typeof config == "object"){
		if (isArray(config))
			config = { data: config };
		config.view = config.view || "suggest";
	} else if (config === true)
		config = { view:"suggest" };

	const obj = ui(config);
	return obj.config.id;
}

function getLabel(config){
	const text = (config.header && config.header[0]) ? config.header[0].text : config.editValue||config.label;
	return (text || "").toString().replace(/<[^>]*>/g, "");
}

/*
this.node - html node, available after render call
this.config - editor config
this.value - original value
this.popup - id of popup 
*/
const editors = {
	"text":{
		focus:function(){
			this.getInputNode(this.node).focus();
			this.getInputNode(this.node).select();
		},
		getValue:function(){
			return this.getInputNode(this.node).value;
		},
		setValue:function(value){
			const input = this.getInputNode(this.node);
			input.value = value;

			const suggest = init_suggest(this, input);
			attach_editend(suggest);
		},
		getInputNode:function(){
			return this.node.firstChild;
		},
		render:function(){
			return create("div", {
				"class":"webix_dt_editor"
			}, "<input type='text' aria-label='"+getLabel(this.config)+"'>");
		}
	},
	"inline-checkbox":{
		render:function(){ return {}; },
		getValue:function(){
			return this.node.checked;
		},
		setValue:function(){},
		focus:function(){
			this.node.focus();
		},
		getInputNode:function(){},
		$inline:true
	},
	"inline-text":{
		render:function(){ return {}; },
		getValue:function(){
			return this.node.value;
		},
		setValue:function(){},
		focus:function(){
			this.node.focus();
			this.node.select();
		},
		getInputNode:function(){},
		$inline:true
	},
	"checkbox":{
		focus:function(){
			this.getInputNode().focus();
		},
		getValue:function(){
			return this.getInputNode().checked;
		},
		setValue:function(value){
			this.getInputNode().checked = !!value;
		},
		getInputNode:function(){
			return this.node.firstChild.firstChild;
		},
		render:function(){
			return create("div", {
				"class":"webix_dt_editor"
			}, "<div><input type='checkbox' aria-label='"+getLabel(this.config)+"'></div>");
		}
	},
	"select":{
		focus:function(){
			this.getInputNode().focus();
		},
		getValue:function(){
			return this.getInputNode().value;
		},
		setValue:function(value){
			this.getInputNode().value = value;
		},
		getInputNode:function(){
			return this.node.firstChild;
		},
		render:function(){
			let html = "";
			const options = this.config.options || this.config.collection;
			assert(options,"options not defined for select editor");

			if (options.data && options.data.each)
				options.data.each(function(obj){
					html +="<option value='"+obj.id+"'>"+obj.value+"</option>";
				});
			else {
				if (isArray(options)){
					for (let i = 0; i < options.length; i++){
						const rec = options[i];
						const isplain = isUndefined(rec.id);
						const id = isplain ? rec : rec.id;
						const label = isplain ? rec : rec.value;

						html +="<option value='"+id+"'>"+label+"</option>";
					}
				} else for (let key in options){
					html +="<option value='"+key+"'>"+options[key]+"</option>";
				}
			}

			return create("div", {
				"class":"webix_dt_editor"
			}, "<select aria-label='"+getLabel(this.config)+"'>"+html+"</select>");
		}
	},
	popup:{
		focus:function(){
			this.getInputNode().focus();
		},
		destroy:function(){
			this.getPopup().hide();
		},
		getValue:function(){
			return this.getInputNode().getValue()||"";
		},
		setValue:function(value){
			this.getPopup().show(this.node);
			this.getInputNode().setValue(value);
		},
		getInputNode:function(){
			return this.getPopup().getChildViews()[0];
		},
		getPopup:function(){
			let id = this.config.$popup;

			if (!(id && $$(id)))
				id = this.config.$popup = this.createPopup();

			return $$(id);
		},
		createPopup:function(){
			const popup = this.config.popup || this.config.suggest;
			if (popup){
				let pobj;
				if (typeof popup == "object" && !popup.name){
					popup.view = popup.view || "suggest";
					pobj = ui(copy(popup));
				} else
					pobj = $$(popup);

				//custom popup may be linked already
				if(!pobj._linked){
					if (pobj.linkInput)
						pobj.linkInput(document.body);
					else if(this.linkInput)
						this.linkInput(document.body);
					pobj._linked = true;
				}
				attach_editend(pobj);

				return pobj;
			}

			const editor = editors.$popup[this.popupType];
			let popupId = editor.$popup;

			if(!(popupId && $$(popupId))){
				const popup = ui(copy(editor));
				if(!popup.linkInput && !popupId)
					this.linkInput(document.body);
				editor.$popup = popupId = popup._settings.id;
				this.popupInit(popup);
			}

			return popupId;
		},
		linkInput:function(node){
			_event(toNode(node), "keydown", e => {
				//abort, when editor was not initialized yet
				if (!this.config.$popup) return;

				const code = e.which || e.keyCode, list = this.getInputNode();
				if(!list.isVisible()) return;

				if(list.moveSelection && code < 41 && code > 32){
					let dir;
					if(code == 33) dir = "pgup";
					else if(code == 34) dir = "pgdown";
					else if(code == 35) dir = "bottom";
					else if(code == 36) dir = "top";
					else if(code == 37) dir = "left";
					else if(code == 38) dir = "up";
					else if(code == 39) dir = "right";
					else if(code == 40) dir = "down";

					list.moveSelection(dir);
				}
				// shift+enter support for 'popup' editor
				else if(code === 13 && ( e.target.nodeName !=="TEXTAREA" || !e.shiftKey))
					callEvent("onEditEnd", []);
			
			});
		},

		popupInit:function(){},
		popupType:"text",
		render:function(){ return {}; },
		$inline:true
	}
};

editors.color = extend({
	focus:function(){},
	popupType:"color",
	popupInit:function(popup){
		popup.getChildViews()[0].attachEvent("onItemClick", function(value){
			callEvent("onEditEnd",[value]);
		});
	}
}, editors.popup);

editors.date = extend({
	focus:function(){},
	popupType:"date",
	setValue:function(value){
		this._is_string = this.config.stringResult || (value && typeof value == "string");
		editors.popup.setValue.call(this, value);
	},
	getValue:function(){
		return this.getInputNode().getValue(this._is_string?i18n.parseFormatStr:"")||"";
	},
	popupInit:function(popup){
		popup.getChildViews()[0].attachEvent("onAfterDateSelect", function(value){
			callEvent("onEditEnd",[value]);
		});
	}
}, editors.popup);

editors.combo = extend({
	_create_suggest:function(config){
		let suggest, id;
		if (this.config.popup){
			suggest = this.config.popup;
			id = suggest.config.id;
		}
		else if (config){
			id = create_suggest(config);
			suggest = $$(id);
		} else
			id = this._shared_suggest(config);

		attach_editend(suggest);
		return id;
	},
	_shared_suggest:function(){
		const e = editors.combo;

		if(e._suggest && $$(e._suggest))
			return e._suggest;

		return e._suggest = this._create_suggest(true);
	},
	render:function(){
		const node = create("div", {
			"class":"webix_dt_editor"
		}, "<input type='text' role='combobox' aria-label='"+getLabel(this.config)+"'>");

		//save suggest id for future reference		
		const suggest = this.config.suggest = this._create_suggest(this.config.suggest);

		if (suggest){
			$$(suggest).linkInput(node.firstChild, true);
			_event(node.firstChild, "click", () => this.showPopup());
		}
		return node;
	},
	getPopup:function(){
		return $$(this.config.suggest);
	},
	showPopup:function(){
		const popup = this.getPopup();
		const list = popup.getList();
		const input = this.getInputNode();
		const value = this._initial_value;

		popup.show(input);
		input.setAttribute("aria-expanded", "true");
		if (value){
			assert(list.exists(value), "Option with ID "+value+" doesn't exist");
			if (list.exists(value)){
				list.select(value);
				list.showItem(value);
			}
		} else {
			list.unselect();
			list.showItem(list.getFirstId());
		}
		popup._last_input_target = input;
	},
	afterRender:function(){
		this.showPopup();
	},
	setValue:function(value){
		this._initial_value = value;
		if (this.config.suggest){
			const sobj = $$(this.config.suggest);
			const data = this.config.collection || this.config.options;
			if (data)
				sobj.getList().data.importData(data);

			this.getInputNode(this.node).value = sobj.getItemText(value);
		}
	},
	getValue:function(){
		let value = this.getInputNode().value;
		if (this.config.suggest){
			const suggest = $$(this.config.suggest),
				list = suggest.getList();
			if (value || (list.getSelectedId && list.getSelectedId()))	
				value = suggest.getSuggestion(value);
		}
		return value;
	}
}, editors.text);

editors.richselect = extend({
	focus:function(){},
	getValue:function(){
		return this.getPopup().getValue();
	},
	setValue:function(value){
		const suggest = this.config.collection || this.config.options;
		this.getInputNode();
		if (suggest)
			this.getPopup().getList().data.importData(suggest);

		this.getPopup().show(this.node);
		this.getPopup().setValue(value);
	},
	getInputNode:function(){
		return this.getPopup().getList();
	},
	popupInit:function(popup){
		popup.linkInput(document.body);
		attach_editend(popup);
	},
	popupType:"richselect"
}, editors.popup);

editors.password = extend({
	render:function(){
		const node = create("div", {
			"class":"webix_dt_editor webix_password_editor"
		}, "<input type='password' aria-label='"+getLabel(this.config)+"'><span class='webix_icon wxi-eye'></span>");

		const icon = node.querySelector(".webix_icon");
		_event(icon, "click", () => {
			this.toggleInput();
			this.getInputNode(this.node).focus();
		});
		return node;
	},
	toggleInput:function(){
		const input = this.getInputNode(this.node);
		const isPassword = input.getAttribute("type") === "password";
		input.setAttribute("type", isPassword ? "text" : "password");

		const icon = input.nextSibling;
		icon.className = `webix_icon wxi-eye${isPassword ? "-slash" : ""}`;
	},
	masterFormat: function(value){
		return !value && value !== 0 ? "" : "&bull;".repeat(value.toString().length);
	}
}, editors.text);

editors.$popup = {
	text:{
		view:"popup", width:250, height:150,
		body:{ view:"textarea" }
	},
	color:{
		view:"popup",
		body:{ view:"colorboard" }
	},
	date:{
		view:"popup", width:250, height:250, padding:0,
		body:{ view:"calendar", icons:true, borderless:true }
	},
	richselect:{
		view:"suggest",
		body:{ view:"list", select:true }
	},
	multiselect:{
		view:"multisuggest",
		suggest:{
			button:true
		}
	}
};

export default editors;