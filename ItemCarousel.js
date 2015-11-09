/**
 * Accordion
 * @author Donny de Vries
 */
(function ($, window, document) {

	$.fn.ItemCarousel = function(options)
	{
		var carousel;

		this.each(function(index) 
		{
			if (index == 0)
			{
				carousel = new Carousel(options, this);
			}
		});

		return carousel;
	}

	function Carousel(options, carousel)
	{
		var defaults = {
			index: 				0,
			items:				[
									[1280, 4],
									[1024, 3],
									[768, 2],
									[0, 1]
								],
			loop:				false,
			arrows:				true,
			paging:				'bullets', // false or [bullets, numbers, thumbnails]
			autoplay: 			false,
			autoplay_interval: 	4000,
			pauzeOnHover: 		true,
			stopAfterNav: 		false,
			draggable: 			false,
			swipeable: 			true,
			markup: 			(	
				'<div class="viewport_wrapper">' +
					'<div class="viewport" is="viewport"></div>' +
					'<div class="arrow left" is="arrow-left"></div>' +
					'<div class="arrow right" is="arrow-right"></div>' +
				'</div>' +
				'<div class="paging" is="paging"></div>'
			)
		};

		this.options = $.extend(defaults, options);

		this.elements = {
			carousel: 			$(carousel),
			viewport: 			$(),
			groups_wrapper: 	$(),
			groups: 			$(),
			groups_inner: 		$(),
			items: 				$()
		};

		this.controls = {
			arrow_left: 		$(),
			arrow_right: 		$(),
			paging: 			$(),
			paging_items: 		$()
		};

		this.data = {
			items_per_group: 	0,
			group_amount: 		0,
			active_index:		this.options.index
		};

		this.autoplay = {
			timer: 		null,
			stop: 		false
		}

		this.setMarkup();
	}

	Carousel.prototype = {

		setMarkup: function()
		{
			var _this = this;

			_this.elements.items = _this.elements.carousel.find('> *');

			_this.elements.carousel.append($(_this.options.markup));

			_this.elements.viewport = _this.elements.carousel.find('[is="viewport"]').removeAttr('is');

			if(_this.elements.viewport.length)
			{
				_this.elements.groups_wrapper = $('<div class="groups">');

				_this.elements.groups_wrapper.append(_this.elements.items);

				_this.elements.viewport.append(_this.elements.groups_wrapper);

				if (_this.options.arrows || _this.options.paging)
				{
					_this.controls.arrow_left 	= _this.elements.carousel.find('[is="arrow-left"]').removeAttr('is');
					_this.controls.arrow_right 	= _this.elements.carousel.find('[is="arrow-right"]').removeAttr('is');
					_this.controls.paging 		= _this.elements.carousel.find('[is="paging"]').removeAttr('is');

					if (!_this.options.arrows)
					{
						_this.controls.arrow_left.remove();
						_this.controls.arrow_right.remove();

						_this.controls.arrow_left 	= $();
						_this.controls.arrow_right 	= $();
					}

					if (!_this.options.paging)
					{
						_this.controls.paging.remove();

						_this.controls.paging = $();
					}
				}

				this.start();
			}
		},

		start: function()
		{
			var _this = this;

			var start = _this.arrangeGroups();

			if (start) _this.elements.carousel.addClass('start');

			if (_this.options.arrows)
			{
				_this.setArrows();
			}

			_this.setActiveGroup(false);

			if (_this.options.autoplay)
			{
				_this.autoPlay();

				if (_this.options.pauzeOnHover)
				{
					_this.elements.carousel.hover(
						function()
						{
							if (!_this.autoplay.stop) clearInterval(_this.autoplay.timer);
						},
						function()
						{
							if (!_this.autoplay.stop) _this.autoPlay();
						}
					);
				}
			}
			else
			{
				_this.autoplay.stop = true;
			}

			if (_this.options.draggable || _this.options.swipeable)
			{
				_this.setDragEvents();
			}

			$(window).resize(function()
			{
				_this.elements.viewport.addClass('dragging');

				if (_this.options.autoplay && !_this.autoplay.stop)
				{
					clearInterval(_this.autoplay.timer);
				}

				_this.arrangeGroups();

				_this.setActiveGroup(false);
			});

			$(window).resize(_this.debouncer(function(e) 
			{
				_this.elements.viewport.removeClass('dragging');

			    if (_this.options.autoplay && !_this.autoplay.stop)
				{
					_this.autoPlay();
				}
			}));
		},

		arrangeGroups: function(element)
		{
			var _this = this;

			var items_per_group;

			for (var i = 0; i < _this.options.items.length; i++)
			{
				var items_window_width 	= _this.options.items[i][0];
				var items_item_amount 	= _this.options.items[i][1];

				if ($(window).width() >= items_window_width)
				{
					items_per_group = items_item_amount;
					break;
				}
			}

			if (_this.data.items_per_group != items_per_group || element)
			{
				_this.data.items_per_group = items_per_group;

				if (_this.elements.groups.length)
				{
					_this.elements.items.unwrap();
					_this.elements.items.unwrap();
				}

				if (element)
				{
					_this.elements.groups_wrapper.append(element);

					_this.elements.items = _this.elements.groups_wrapper.find('> *');
				}

				_this.data.group_amount	= Math.ceil(_this.elements.items.length / _this.data.items_per_group);

				var group_arr 	= [];
				var counter		= 0;

				for (i = 0; i < _this.data.group_amount; i++)
				{
					var items = $(_this.elements.items);
					var group = $(items.splice(counter, _this.data.items_per_group));

					group_arr.push(group);

					counter += _this.data.items_per_group;
				}

				for (i = 0; i < group_arr.length; i++)
				{
					var group 		= $('<div class="group">');
					var group_inner = $('<div class="inner">');

					group_arr[i].wrapAll(group);
					group_arr[i].wrapAll(group_inner);
				}

				_this.elements.groups 		= _this.elements.groups_wrapper.find('.group');
				_this.elements.groups_inner = _this.elements.groups.find('.inner');

				if (_this.options.paging)
				{
					_this.setPaging();
				}
			}

			_this.elements.groups.css('width', _this.elements.viewport.outerWidth() + 'px');

			_this.elements.groups_wrapper.css('width', (_this.data.group_amount * _this.elements.viewport.outerWidth()));

			_this.data.wrapper_width = _this.elements.groups_wrapper.outerWidth();

			if (element)
			{
				_this.setActiveGroup();
			}

			return true;
		},

		setActiveGroup: function(nav)
		{
			var _this = this;

			if (_this.data.group_amount <= (_this.data.active_index + 1))
			{
				_this.data.active_index = (_this.data.group_amount - 1);
			}

			var active_group 				= _this.elements.groups.eq(_this.data.active_index);
			var active_group_left 			= (active_group.position().left == 0) ? 0 : -(active_group.position().left);

			if (_this.data.group_amount > 1 && _this.data.active_index >= (_this.data.group_amount -1))
			{
				var left_correction	= _this.elements.viewport.outerWidth();

				left_correction = left_correction - active_group.children().outerWidth();
			}
			else
			{
				var left_correction	= 0;
			}

			if (left_correction > 0)
			{
				var heights = [
					active_group.prev().outerHeight(),
					active_group.outerHeight()
				];

				var max_height = Math.max.apply(Math, heights);

				_this.elements.viewport.css('height', max_height);
			}
			else 
			{
				_this.elements.viewport.css('height', active_group.outerHeight());
			}

			_this.elements.groups_wrapper.css('left', active_group_left + left_correction);

			if (this.options.paging && _this.controls.paging_items.length)
			{
				_this.controls.paging_items.removeClass('active');

				_this.controls.paging_items.eq(_this.data.active_index).addClass('active');
			}

			if (this.options.arrows && !this.options.loop && _this.controls.arrow_left.length && _this.controls.arrow_right.length)
			{
				_this.controls.arrow_left.removeClass('disabled');
				_this.controls.arrow_right.removeClass('disabled');

				if (_this.data.active_index <= 0)
				{
					_this.controls.arrow_left.addClass('disabled');
				}

				if (_this.data.active_index >= (_this.data.group_amount - 1))
				{
					_this.controls.arrow_right.addClass('disabled');
				}
			}

			if (this.options.stopAfterNav && !_this.autoplay.stop && nav)
			{
				clearInterval(_this.autoplay.timer);

				_this.autoplay.stop = true;
			}

			if (!_this.autoplay.stop && !_this.elements.carousel.is(':hover') && nav)
			{
				_this.autoPlay();
			}
		},

		setArrows: function()
		{
			var _this = this;

			if (_this.controls.arrow_left.length)
			{
				_this.controls.arrow_left.bind('click touchstart', function()
				{
					if(!$(this).hasClass('disabled'))
					{
						_this.data.active_index = (_this.data.active_index <= 0) ? _this.data.group_amount : (_this.data.active_index - 1);

						_this.setActiveGroup(true);
					}
				});
			}

			if (_this.controls.arrow_right.length)
			{
				_this.controls.arrow_right.bind('click touchstart', function()
				{
					if(!$(this).hasClass('disabled'))
					{
						_this.data.active_index = (_this.data.active_index >= (_this.data.group_amount - 1)) ? 0 : (_this.data.active_index + 1);

						_this.setActiveGroup(true);
					}
				});
			}
		},

		setPaging: function()
		{
			var _this = this;

			if (_this.controls.paging.length)
			{
				if (_this.controls.paging_items.length)
				{
					_this.controls.paging_items.remove();
				}

				if (_this.data.group_amount)
				{
					var page_arr = [];

					for(var i = 0; i < _this.data.group_amount; i++)
					{
						var page 			= $('<div class="page"></div>');
						var page_inner 		= $('<span></span>');

						if(_this.options.paging == 'bullets')
						{
							page.addClass('bullet');
						}
						if(_this.options.paging == 'numbers')
						{
							page_inner.text((i + 1).toString());

							page.addClass('number');
						}
						if(_this.options.paging == 'thumbnails')
						{
							var img = _this.elements.groups.eq(i).find('img').first();

							if (img.length)
							{
								src = (!img.attr('src')) ? '' : img.attr('src');

								if (src)
								{
									page.css('background-image', 'url(' + src + ')');
								}
							}

							page.addClass('thumbnail');
						}

						page.append(page_inner);

						if (i == _this.data.active_index) page.addClass('active');

						page.on('click touchstart', function()
						{
							var index 				= $(this).index();
							_this.data.active_index = index;

							_this.setActiveGroup(true);
						});

						_this.controls.paging.append(page);
					}

					_this.controls.paging_items = _this.controls.paging.find('> *');
				}
			}
		},

		autoPlay: function()
		{
			var _this = this;

			clearInterval(_this.autoplay.timer);

			_this.autoplay.timer = setInterval(function()
			{
				_this.data.active_index = (_this.data.active_index >= (_this.data.group_amount - 1)) ? 0 : _this.data.active_index + 1;

				_this.setActiveGroup(false);

			}, _this.options.autoplay_interval);
		},

		setDragEvents: function()
		{
			var _this = this;

			if (_this.options.draggable && _this.options.swipeable)
			{
				var binds = {
					start: 	'mousedown touchstart',
					move: 	'mousemove touchmove',
					end: 	'mouseup touchend'
				}

				_this.elements.viewport.addClass('draggable');
			}
			else if(_this.options.draggable)
			{
				var binds = {
					start: 	'mousedown',
					move: 	'mousemove',
					end: 	'mouseup'
				}

				_this.elements.viewport.addClass('draggable');
			}
			else if(_this.options.swipeable)
			{
				var binds = {
					start: 	'touchstart',
					move: 	'touchmove',
					end: 	'touchend'
				}
			}

			_this.elements.groups_wrapper.on(binds.start, function(e)
			{
				$('html').addClass('dragging');
				_this.elements.viewport.addClass('dragging');

				if (_this.options.autoplay && !_this.autoplay.stop)
				{
					clearInterval(_this.autoplay.timer);
				}

				var wrapper_init_position 	= _this.elements.groups_wrapper.position().left;
				var mouse_wrapper_mouse_x 	= e.pageX - _this.elements.groups_wrapper.offset().left;

				var boundries = [];
				var left_position;

				$('html').bind(binds.move, function(e)
				{
					boundries = [];

					var mouse_viewport_mouse_x 	= (e.pageX - _this.elements.viewport.offset().left);
					var left_correction			= 0;

					if (_this.data.group_amount > 1)
					{
						left_correction	= _this.elements.viewport.outerWidth();
						
						left_correction = left_correction - _this.elements.groups.last().children().outerWidth();
					}

					left_position =  mouse_viewport_mouse_x - mouse_wrapper_mouse_x;

					if (left_position > 0)
					{
						left_position = 0;
					}
					
					if (left_position < (-_this.elements.groups_wrapper.outerWidth() + _this.elements.viewport.outerWidth()) + left_correction)
					{
						left_position = (-_this.elements.groups_wrapper.outerWidth() + _this.elements.viewport.outerWidth()) + left_correction;
					}

					var direction 	= ((wrapper_init_position - left_position) > 0) ? 'right' : ((wrapper_init_position - left_position) < 0) ? 'left' : 'neutral';

					for (i = 0; i < _this.data.group_amount; i++)
					{
						var group = _this.elements.groups.eq(i);

						if (direction == 'right')
						{
							var left_boundry = group.position().left - (group.outerWidth() * 0.4);

							boundries.push(left_boundry);
						}
						if (direction == 'left')
						{
							var left_boundry = group.position().left + (group.outerWidth() * 0.4);

							boundries.push(left_boundry);
						}
					}

					_this.elements.groups_wrapper.css('left', left_position);
			    });

				$('html').bind(binds.end, function()
				{
					$('html').unbind('mousemove touchmove');
					$('html').unbind('mouseup touchend');

					$('html').removeClass('dragging');
					_this.elements.viewport.removeClass('dragging');

					if (boundries.length)
					{
						var goal 	= Math.abs(left_position);
						var closest = boundries.reduce(function (prev, curr) 
						{
							return (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev);
						});

						var new_index 			= boundries.indexOf(closest);
						_this.data.active_index = new_index;
					}

					if (_this.options.autoplay && !_this.autoplay.stop && !_this.elements.carousel.is(':hover'))
					{
						_this.autoPlay();
					}

					_this.setActiveGroup(true);
				});
		    });
		},

		debouncer: function(func, timeout)
		{
			var timeoutID;
			var timeout = timeout || 200;

			return function () 
			{
				var scope 	= this;
				var args 		= arguments;

				clearTimeout(timeoutID);

				timeoutID = setTimeout( function () 
				{
					func.apply(scope, Array.prototype.slice.call(args));
				}, timeout);
			}
		},

		reset: function()
		{
			var _this = this;

			var items = _this.elements.items.clone();
			
			_this.elements.carousel.children().remove();

			_this.elements.carousel.append(items);

			_this.elements = {
				carousel: 			_this.elements.carousel,
				viewport: 			$(),
				groups_wrapper: 	$(),
				groups: 			$(),
				groups_inner: 		$(),
				items: 				$()
			};

			_this.controls = {
				arrow_left: 		$(),
				arrow_right: 		$(),
				paging: 			$(),
				paging_items: 		$()
			};

			_this.data = {
				items_per_group: 	0,
				group_amount: 		0,
				active_index:		_this.options.index
			};

			_this.autoplay = {
				timer: 		null,
				stop: 		false
			}

			_this.setMarkup();
		},

		goto: function(index)
		{
			var _this = this;

			if (index == 'last')
			{
				index = (_this.data.group_amount - 1);
			}

			_this.data.active_index = index;

			_this.setActiveGroup(false);
		},

		addItems: function(elements)
		{
			_this = this;

			$(elements).each(function()
			{
				var clone = $(this).clone();

				_this.arrangeGroups(clone);
			});
		}
	}
}(jQuery, window, document));