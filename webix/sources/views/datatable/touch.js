import env from "../../webix/env";
import Touch from "../../core/touch";
import {extend, delay} from "../../webix/helpers";
import {attachEvent} from "../../webix/customevents";


attachEvent("onDataTable", function(table, config){
	if (env.touch){
		Touch.$init();
		config.scrollSize = 0;

		// needed to show datatable scroll
		if (Touch._disabled) Touch.limit();

		table.$ready.push(table.$touch);
	}
});

const Mixin = {
	$touch:function(){
		var config = this._settings;
		config.scrollAlignY = false;

		extend(this, (config.prerender===true) ? this._touchNative : this._touch);
		
		var scrollMode = "";
		if (!config.autowidth && config.scrollX !== false)
			scrollMode += "x";
		if (!config.autoheight && config.scrollY !== false)
			scrollMode += "y";
		this._body.setAttribute("touch_scroll", scrollMode);
		
		Touch._init_scroll_node(this._body.childNodes[1].firstChild);
		this._sync_scroll(0, 0, "0ms");
	},

	$hasYScroll(){
		return this._dtable_height - this._dtable_offset_height > 2;
	},

	_touchNative:{
		_touch_scroll: true,
		_scrollTo_touch:function(x,y){
			// limit scroll
			const sizes = Touch._get_sizes(this._body.childNodes[1].firstChild);
			x = Math.max(0, Math.min(x, sizes.dx - sizes.px));
			y = Math.max(0, Math.min(y, sizes.dy - sizes.py));

			// no delay, important for autoscroll
			this.callEvent("onAfterScroll", [{ e: -x, f: -y}]);
		},
		_getScrollState_touch:function(){
			var temp = Touch._get_matrix(this._body.childNodes[1].firstChild);
			return { x: -temp.e, y: -temp.f };
		},
		$init:function(){
			this.attachEvent("onBeforeScroll", function(){
				Touch._scroll_node = this._body.childNodes[1].firstChild;
				Touch._scroll_stat = Touch._get_sizes(Touch._scroll_node);
				Touch._scroll_master = this;
			});
			this.attachEvent("onTouchEnd", function(){
				Touch._scroll_master = null;
			});
			this.attachEvent("onAfterScroll", function(result){
				//onAfterScroll may be triggered by some non-touch related logic
				if (!result) return;

				this._scrollLeft = -result.e;
				this._scrollTop = -result.f;

				this._sync_scroll(result.e, result.f, "0ms");
			});
		},
	},

	_touch:{
		_touch_scroll: true,
		_scrollTo_touch:function(x,y){
			delay(function(){
				this.callEvent("onAfterScroll", [{ e: -x, f: -y}]);
			}, this);
		},
		$scroll:{
			gravity: 0,
			elastic: false
		},
		$init:function(){
			//if the result column's width < container's width,
			this.attachEvent("onAfterColumnHide", function(){
				this._scrollTo_touch(0, 0);
			});
			this.attachEvent("onAfterRender", function(){
				if (this._x_scroll && this._settings.scrollX)
					this._x_scroll._fixSize();
				if (this._y_scroll && this._settings.scrollY)
					this._y_scroll._fixSize();
			});
			this.attachEvent("onBeforeScroll", function(){
				Touch._scroll_node = this._body.childNodes[1].firstChild;
				Touch._scroll_stat = Touch._get_sizes(Touch._scroll_node);
				Touch._scroll_stat.dy = this._dtable_height;
				Touch._scroll_master = this;
			});
			this.attachEvent("onTouchEnd", function(){
				Touch._scroll_master = null;
			});
			this.attachEvent("onAfterScroll", function(result){
				//onAfterScroll may be triggered by some non-touch related logic
				if (!result) return;

				this._scrollTop = 0;
				this._scrollLeft = 0;
				this._sync_scroll(0, 0, "0ms");

				this._scrollLeft = -result.e;
				this._scrollTop = -result.f;

				this._correctScrollSize();
				this.render();

				if (this._x_scroll){
					this._x_scroll._settings.scrollPos = -1;
					this._x_scroll.scrollTo(this._scrollLeft);
					this.callEvent("onScrollX",[]);
				}
				if (this._y_scroll){
					this._y_scroll._settings.scrollPos = -1;
					this._y_scroll.scrollTo(this._scrollTop);
					this.callEvent("onScrollY",[]);
				}
			});
		}
	},

	_sync_scroll:function(x,y,t){
		const diff = this._settings.prerender ? 0 : this._scrollTop;
		y += diff;

		Touch._set_matrix(this._body.childNodes[1].firstChild, x, y, t);
		if (this._settings.leftSplit)
			Touch._set_matrix(this._body.childNodes[0].firstChild,0,y,t);
		if (this._settings.rightSplit)
			Touch._set_matrix(this._body.childNodes[2].firstChild,0,y,t);
		if (this._settings.header)
			Touch._set_matrix(this._header.childNodes[1].firstChild,x,0,t);
		if (this._settings.footer)
			Touch._set_matrix(this._footer.childNodes[1].firstChild,x,0,t);

		const smooth = (t !== "0ms");
		if (this._x_scroll) this._x_scroll._sync(-x, smooth);
		if (this._y_scroll) this._y_scroll._sync(-y + diff, smooth);

		this.callEvent("onSyncScroll", [x,y,t]);
	},

	_sync_y_scroll:function(y,t){
		const x = -this.getScrollState().x;
		Touch._set_matrix(this._body.childNodes[1].firstChild, x, y, t);
		if (this._settings.leftSplit)
			Touch._set_matrix(this._body.childNodes[0].firstChild, 0, y, t);
		if (this._settings.rightSplit)
			Touch._set_matrix(this._body.childNodes[2].firstChild, 0, y, t);

		this.callEvent("onSyncScroll", [x,y,t]);
	},

	_sync_x_scroll:function(x,t){
		const y = this._settings.prerender ? -this.getScrollState().y : 0;

		Touch._set_matrix(this._body.childNodes[1].firstChild, x, y, t);
		if (this._settings.header)
			Touch._set_matrix(this._header.childNodes[1].firstChild,x,0,t);
		if (this._settings.footer)
			Touch._set_matrix(this._footer.childNodes[1].firstChild,x,0,t);

		this.callEvent("onSyncScroll", [x,y,t]);
	},

	_sync_pos:function(matrix){
		if (!this._settings.prerender)
			matrix.f -= this._scrollTop;
	}
};

export default Mixin;