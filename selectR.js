/*!
 * selectR.js - v1.2.0
 * A Bootstrap 5 native select enhancement library for ASP.NET Core MVC Razor views.
 * Supports: single/multiple select, tags, search (frontend & server-side),
 *           infinite scroll, checkbox/tick/circle markers, clear button, and more.
 *
 * Dependencies: Bootstrap 5, jQuery (optional — works with both vanilla JS and jQuery)
 * Usage:  selectR('#mySelect', { options })
 *         $('#mySelect').selectR({ options })       // jQuery plugin
 *
 * MIT License
 */
; (function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.selectR = factory();
    // jQuery plugin
    if (typeof jQuery !== 'undefined') {
      jQuery.fn.selectR = function (options) {
        return this.each(function () {
          selectR(this, options);
        });
      };
    }
  }
}(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  /* ─── Defaults ────────────────────────────────────────────── */
  var DEFAULTS = {
    // Core
    mode: 'single',              // 'single' | 'multiple'
    placeholder: 'Select…',
    disabled: false,
    readonly: false,
    creatable: false,
    createController: '',
    createAction: '',
    createParam: 'data',

    // Appearance
    size: '',                    // '' | 'sm' | 'lg'
    marker: 'checkbox',          // 'checkbox' | 'tick' | 'circle' | 'none'
    showClearButton: true,       // show ✕ to clear selection (single mode)
    maxHeight: 240,              // dropdown list max-height in px
    dropdownWidth: null,         // null = 100% of control, or px/string e.g. '300px'
    position: 'auto',            // 'auto' | 'down' | 'up'
    allowHtml: false,            // allow HTML in option label (XSS-risk: only enable for trusted data)

    // Tags / display style (multiple mode)
    maxSelected: null,           // max number of selections, null = unlimited
    displayStyle: 'pill',        // how selected items appear in the control:
    //   'pill'  — coloured badge tags with individual ✕ remove buttons (default)
    //   'plain' — label text with ✕ remove, no background / border
    //   'comma' — all labels joined by commaSeparator, no per-item remove
    commaSeparator: ', ',        // separator used when displayStyle = 'comma'
    tagLimit: 2,                 // visible items before overflow pill (null = show all)
    summaryThreshold: 0,         // once selected >= N collapse to "N Items Selected" pill (0 = off)
    summaryLabel: 'Items Selected',
    closeOnSelect: false,        // multiple only — close dropdown after each pick (single always closes)

    // Drawer (overflow panel)
    showDrawer: true,            // show inline drawer when overflow pill is clicked
    drawerTitle: 'Selected Items', // drawer header title

    // Search
    searchable: true,            // enable search input
    searchPlaceholder: 'Search…',
    searchMinLength: 0,          // min chars to trigger search
    searchDebounce: 300,         // ms debounce for server search
    highlightMatch: true,        // bold matched text in results

    // Server-side / AJAX
    ajax: null,                  // ajax config object (see below) or null for frontend-only
    /*
      ajax: {
        url: '/api/options',          // required
        method: 'GET',                // default GET
        dataType: 'json',             // default json
        data: function(params) {      // extra data to send (optional)
          return { extraField: 'val' };
        },
        processResults: function(data) {  // transform server response
          return { results: data.items, hasMore: data.hasMore };
        },
        headers: {},                  // extra request headers
        delay: 300,                   // debounce ms (overrides searchDebounce)
        cache: true,                  // cache identical requests
      }
    */

    // Infinite Scroll
    infiniteScroll: false,       // enable infinite scroll in dropdown
    pageSize: 20,                // items per page (for server-side)

    // Toolbar (multiple mode)
    showToolbar: true,           // show "Select all / Clear all" toolbar
    selectAllLabel: 'Select all',
    clearAllLabel: 'Clear all',

    // Groups
    // (auto-detected from <optgroup> or data.group field)

    // Custom rendering
    renderOption: null,          // function(item) → HTML string for option row
    renderTag: null,             // function(item) → HTML string for tag
    renderEmpty: null,           // function(query) → HTML string for no-results
    renderLoading: null,         // function() → HTML string while loading

    // Callbacks / Events
    onChange: null,              // function(value, selectedItems)
    onOpen: null,
    onClose: null,
    onSearch: null,              // function(query)
    onScrollEnd: null,           // function(page) — for infinite scroll

    // Accessibility
    ariaLabel: null,             // override aria-label on control

    // Validation integration
    validationClass: '',         // 'is-valid' | 'is-invalid' passed programmatically
  };

  /* ─── Utility helpers ─────────────────────────────────────── */
  function merge() {
    var out = {};
    for (var i = 0; i < arguments.length; i++) {
      var obj = arguments[i];
      if (!obj) continue;
      for (var k in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, k)) out[k] = obj[k];
      }
    }
    return out;
  }

  function escHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function debounce(fn, ms) {
    var t;
    var debounced = function () {
      clearTimeout(t);
      var args = arguments, ctx = this;
      t = setTimeout(function () { fn.apply(ctx, args); }, ms);
    };
    debounced.cancel = function () { clearTimeout(t); };
    return debounced;
  }

  function uid() {
    return 'sr-' + Math.random().toString(36).slice(2, 9);
  }

  /* ─── SVG icons ───────────────────────────────────────────── */
  var ICONS = {
    chevronDown: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>',
    search: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    close: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    tick: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
  };

  /* ─── Read options from <select> element ─────────────────── */
  function parseSelectElement(el) {
    var items = [];
    var children = el.children;
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      if (child.tagName === 'OPTGROUP') {
        var groupLabel = child.getAttribute('label') || '';
        var opts = child.children;
        for (var j = 0; j < opts.length; j++) {
          items.push(parseOption(opts[j], groupLabel));
        }
      } else if (child.tagName === 'OPTION') {
        items.push(parseOption(child, null));
      }
    }
    return items;
  }

  function parseOption(opt, group) {
    return {
      value: opt.value,
      label: opt.text,
      selected: opt.selected,
      disabled: opt.disabled,
      group: group,
      icon: opt.dataset.icon || null,
      avatar: opt.dataset.avatar || null,
      badge: opt.dataset.badge || null,
      badgeClass: opt.dataset.badgeClass || 'bg-secondary',
      description: opt.dataset.description || null,
      data: opt.dataset,
    };
  }

  /* ═══════════════════════════════════════════════════════════
     SelectR constructor
  ═══════════════════════════════════════════════════════════ */
  function SelectR(el, userOpts) {
    if (!(this instanceof SelectR)) return new SelectR(el, userOpts);

    this.el = typeof el === 'string' ? document.querySelector(el) : el;
    if (!this.el) { console.warn('selectR: element not found'); return; }

    // Prevent double-init
    if (this.el._selectR) { this.el._selectR.destroy(); }
    this.el._selectR = this;

    this.opts = merge(DEFAULTS, userOpts);
    this.id = uid();

    // Inherit attrs from <select>
    if (this.el.multiple) this.opts.mode = 'multiple';
    if (this.el.disabled) this.opts.disabled = true;

    // Internal state
    this._items = [];            // all loaded items (frontend mode)
    this._selected = [];         // array of selected item values
    this._isOpen = false;
    this._query = '';
    this._page = 1;
    this._hasMore = false;
    this._loading = false;
    this._highlighted = -1;
    this._filteredItems = [];
    this.ajaxCache = {};

    this._build();
    this._bindEvents();
    this._syncFromOriginal();
    this._render();
  }

  /* ─── Build DOM ───────────────────────────────────────────── */
  SelectR.prototype._build = function () {
    var o = this.opts;

    // Hide original <select>
    this.el.style.display = 'none';
    this.el.setAttribute('aria-hidden', 'true');
    this.el.setAttribute('tabindex', '-1');

    // Wrapper
    var wrapper = document.createElement('div');
    wrapper.className = 'selectr-wrapper' +
      (o.size ? ' selectr-' + o.size : '') +
      (o.disabled ? ' selectr-disabled' : '') +
      (o.validationClass ? ' ' + o.validationClass : '');
    this.wrapper = wrapper;

    // Control
    var control = document.createElement('div');
    control.className = 'selectr-control';
    control.setAttribute('role', 'combobox');
    control.setAttribute('aria-expanded', 'false');
    control.setAttribute('aria-haspopup', 'listbox');
    control.setAttribute('aria-label', o.ariaLabel || this.el.getAttribute('aria-label') || 'Select option');
    control.setAttribute('tabindex', o.disabled ? '-1' : '0');
    control.id = this.id + '-control';
    this.control = control;

    // Value display area
    var valueArea = document.createElement('div');
    valueArea.className = 'selectr-value-area';
    valueArea.style.cssText = 'flex:1;min-width:0;display:flex;flex-wrap:wrap;gap:4px;align-items:center;';
    this.valueArea = valueArea;

    // Placeholder
    var placeholder = document.createElement('span');
    placeholder.className = 'selectr-placeholder';
    placeholder.textContent = o.placeholder;
    this.placeholder = placeholder;
    valueArea.appendChild(placeholder);

    control.appendChild(valueArea);

    // Indicators (clear + chevron)
    var indicators = document.createElement('div');
    indicators.className = 'selectr-indicators';

    if (o.showClearButton) {
      var clearBtn = document.createElement('button');
      clearBtn.type = 'button';
      clearBtn.className = 'selectr-clear-btn';
      clearBtn.setAttribute('aria-label', 'Clear selection');
      clearBtn.innerHTML = ICONS.close;
      this.clearBtn = clearBtn;
      indicators.appendChild(clearBtn);
    }

    var chevron = document.createElement('span');
    chevron.className = 'selectr-chevron';
    chevron.innerHTML = ICONS.chevronDown;
    indicators.appendChild(chevron);
    control.appendChild(indicators);

    // Dropdown
    var dropdown = document.createElement('div');
    dropdown.className = 'selectr-dropdown selectr-drop-down';
    dropdown.setAttribute('role', 'listbox');
    dropdown.setAttribute('aria-multiselectable', o.mode === 'multiple' ? 'true' : 'false');
    if (o.dropdownWidth) dropdown.style.width = o.dropdownWidth;
    this.dropdown = dropdown;

    // Search
    if (o.searchable) {
      var searchWrap = document.createElement('div');
      searchWrap.className = 'selectr-search-wrap';

      var searchIcon = document.createElement('span');
      searchIcon.className = 'selectr-search-icon';
      searchIcon.innerHTML = ICONS.search;
      searchWrap.appendChild(searchIcon);

      var searchInput = document.createElement('input');
      searchInput.type = 'text';
      searchInput.className = 'selectr-search';
      searchInput.placeholder = o.searchPlaceholder;
      searchInput.autocomplete = 'off';
      searchInput.spellcheck = false;
      searchInput.setAttribute('aria-label', 'Search options');
      searchInput.setAttribute('aria-autocomplete', 'list');
      this.searchInput = searchInput;
      searchWrap.appendChild(searchInput);

      dropdown.appendChild(searchWrap);
    }

    // Toolbar (multiple only)
    if (o.mode === 'multiple' && o.showToolbar) {
      var toolbar = document.createElement('div');
      toolbar.className = 'selectr-toolbar';

      var count = document.createElement('span');
      count.className = 'selectr-toolbar-count';
      this.toolbarCount = count;

      // Single toggle button: shows "Select All" or "Clear All" depending on state
      var toggleAllBtn = document.createElement('button');
      toggleAllBtn.type = 'button';
      toggleAllBtn.className = 'selectr-toggle-all-btn';
      toggleAllBtn.textContent = o.selectAllLabel;
      this.toggleAllBtn = toggleAllBtn;

      toolbar.appendChild(count);
      toolbar.appendChild(toggleAllBtn);
      dropdown.appendChild(toolbar);
      this.toolbar = toolbar;
    }

    // Options list
    var optionsList = document.createElement('div');
    optionsList.className = 'selectr-options';
    optionsList.setAttribute('role', 'presentation');
    optionsList.style.maxHeight = o.maxHeight + 'px';
    this.optionsList = optionsList;
    dropdown.appendChild(optionsList);

    // Load more indicator (infinite scroll)
    if (o.infiniteScroll) {
      var loadMore = document.createElement('div');
      loadMore.className = 'selectr-load-more';
      loadMore.style.display = 'none';
      loadMore.innerHTML = '<span class="selectr-load-more-spinner"></span>';
      this.loadMore = loadMore;
      dropdown.appendChild(loadMore);
    }

    // ── Drawer (multiple mode overflow panel) ──────────────────
    if (o.mode === 'multiple' && o.showDrawer) {
      var drawer = document.createElement('div');
      drawer.className = 'selectr-drawer';

      var drawerHeader = document.createElement('div');
      drawerHeader.className = 'selectr-drawer-header';

      var drawerTitle = document.createElement('span');
      drawerTitle.className = 'selectr-drawer-title';
      drawerTitle.textContent = o.drawerTitle;

      var drawerClose = document.createElement('button');
      drawerClose.type = 'button';
      drawerClose.className = 'selectr-drawer-close';
      drawerClose.setAttribute('aria-label', 'Close drawer');
      drawerClose.innerHTML = ICONS.close + '<span style="margin-left:4px;font-size:.75rem;">Close</span>';
      drawerHeader.appendChild(drawerTitle);
      drawerHeader.appendChild(drawerClose);
      drawer.appendChild(drawerHeader);

      var drawerTags = document.createElement('div');
      drawerTags.className = 'selectr-drawer-tags';
      this.drawerTags = drawerTags;
      drawer.appendChild(drawerTags);

      var drawerFooter = document.createElement('div');
      drawerFooter.className = 'selectr-drawer-footer';

      var drawerCount = document.createElement('span');
      drawerCount.className = 'selectr-drawer-count';
      this.drawerCount = drawerCount;

      // Single toggle button in drawer footer
      var drawerToggleAll = document.createElement('button');
      drawerToggleAll.type = 'button';
      drawerToggleAll.className = 'selectr-toggle-all-btn';
      drawerToggleAll.textContent = o.selectAllLabel;
      this.drawerToggleAllBtn = drawerToggleAll;

      drawerFooter.appendChild(drawerCount);
      drawerFooter.appendChild(drawerToggleAll);
      drawer.appendChild(drawerFooter);

      this.drawer = drawer;
      this.drawerCloseBtn = drawerClose;
    }

    // Assemble
    wrapper.appendChild(control);
    wrapper.appendChild(dropdown);
    if (this.drawer) wrapper.appendChild(this.drawer);
    this.el.parentNode.insertBefore(wrapper, this.el.nextSibling);

    // Debounced search handler
    var self = this;
    if (o.ajax) {
      this._debouncedAjax = debounce(function (q) { self._ajaxSearch(q); }, o.ajax.delay || o.searchDebounce);
    } else {
      this._debouncedFilter = debounce(function (q) { self._filterItems(q); }, 100);
    }
  };

  /* ─── Sync initial state from original <select> ─────────── */
  SelectR.prototype._syncFromOriginal = function () {
    var o = this.opts;
    // Load static items from <select> if not ajax
    if (!o.ajax) {
      this._items = parseSelectElement(this.el);
    }
    // Gather selected values
    var opts = this.el.options;
    for (var i = 0; i < opts.length; i++) {
      if (opts[i].selected && opts[i].value !== '') {
        this._selected.push(opts[i].value);
      }
    }
  };

  /* ─── Bind events ─────────────────────────────────────────── */
  SelectR.prototype._bindEvents = function () {
    var self = this;
    var o = this.opts;

    // Form reset
    if (this.el.form) {
      this._onFormReset = function () {
        setTimeout(function () {
          var defaultVals = [];
          for (var i = 0; i < self.el.options.length; i++) {
            if (self.el.options[i].selected && self.el.options[i].value !== '') {
              defaultVals.push(self.el.options[i].value);
            }
          }
          self.setValue(defaultVals);
        }, 0);
      };
      this.el.form.addEventListener('reset', this._onFormReset);
    }

    // Toggle dropdown on control click
    this.control.addEventListener('click', function (e) {
      if (o.disabled || o.readonly) return;
      if (self.clearBtn && self.clearBtn.contains(e.target)) return;
      self._toggle();
    });

    // Keyboard nav on control
    this.control.addEventListener('keydown', function (e) {
      self._onControlKey(e);
    });

    // Search input
    if (this.searchInput) {
      this.searchInput.addEventListener('input', function () {
        var q = self.searchInput.value.trim();
        self._query = q;
        self._page = 1;
        self._highlighted = -1;
        if (o.onSearch) o.onSearch(q);

        if (o.ajax) {
          if (q.length >= o.searchMinLength || q.length === 0) {
            self._showLoading();
            self._debouncedAjax(q);
          } else {
            if (self._debouncedAjax) self._debouncedAjax.cancel();
            self._renderOptions([], false, q); // Clear stale results
          }
        } else {
          self._debouncedFilter(q);
        }
      });

      this.searchInput.addEventListener('keydown', function (e) {
        self._onSearchKey(e);
      });
    }

    // Clear button
    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        self.clearAll();
      });
    }

    // Toolbar & drawer — single toggle button (Select All / Clear All)
    function onToggleAll() {
      if (self._isAllSelected()) { self.clearAll(); } else { self.selectAll(); }
    }
    if (this.toggleAllBtn) this.toggleAllBtn.addEventListener('click', onToggleAll);
    if (this.drawerToggleAllBtn) this.drawerToggleAllBtn.addEventListener('click', onToggleAll);

    // Drawer close button
    if (this.drawerCloseBtn) {
      this.drawerCloseBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        self._closeDrawer();
      });
    }

    // Infinite scroll
    if (o.infiniteScroll && this.optionsList) {
      this.optionsList.addEventListener('scroll', function () {
        var el = self.optionsList;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
          if (!self._loading && self._hasMore) {
            self._page++;
            if (o.ajax) {
              self._ajaxSearch(self._query, true);
            } else if (o.onScrollEnd) {
              o.onScrollEnd(self._page);
            }
          }
        }
      });
    }

    // Close on outside click
    this._onDocumentClick = function (e) {
      if (self._isOpen && !self.wrapper.contains(e.target)) {
        self._close();
      }
      if (self.wrapper.classList.contains('drawer-open') && !self.wrapper.contains(e.target)) {
        self._closeDrawer();
      }
    };
    document.addEventListener('click', this._onDocumentClick);

    // Reposition on scroll/resize
    this._onWindowResize = function () {
      if (self._isOpen) self._positionDropdown();
    };
    window.addEventListener('resize', this._onWindowResize);
  };

  /* ─── Open / Close ────────────────────────────────────────── */

  SelectR.prototype._toggle = function () {
    if (this._isOpen) { this._close(); } else { this._openDropdown(); }
  };

  SelectR.prototype._openDropdown = function () {
    if (this._isOpen || this.opts.disabled) return;
    this._isOpen = true;
    this._closeDrawer(); // close drawer when dropdown opens

    this.wrapper.classList.add('selectr-open');
    this.control.classList.add('selectr-open');
    this.control.setAttribute('aria-expanded', 'true');
    this.dropdown.classList.add('open');

    this._positionDropdown();

    if (this.opts.ajax) {
      // Always call ajaxSearch on open to ensure options are reset to current query
      this._ajaxSearch(this._query);
    } else {
      this._filterItems(this._query);
    }

    if (this.searchInput) {
      setTimeout(function () { this.searchInput && this.searchInput.focus(); }.bind(this), 10);
    }

    if (this.opts.onOpen) this.opts.onOpen();
  };

  SelectR.prototype._close = function () {
    if (!this._isOpen) return;
    this._isOpen = false;
    this.wrapper.classList.remove('selectr-open');
    this.control.classList.remove('selectr-open');
    this.control.setAttribute('aria-expanded', 'false');
    this.dropdown.classList.remove('open');
    this._highlighted = -1;

    // Clear search and pagination on close so it reinitializes on next open
    if (this.searchInput) {
      this.searchInput.value = '';
      this._query = '';
    }
    this._page = 1;

    // Cancel any pending debounced searches
    if (this._debouncedAjax) this._debouncedAjax.cancel();
    if (this._debouncedFilter) this._debouncedFilter.cancel();

    if (this.opts.onClose) this.opts.onClose();
    this.control.focus();
  };

  /* ─── Position dropdown ───────────────────────────────────── */
  SelectR.prototype._positionDropdown = function () {
    var pos = this.opts.position;
    if (pos === 'up') {
      this.wrapper.classList.remove('selectr-drop-down');
      this.wrapper.classList.add('selectr-drop-up');
      this.dropdown.classList.remove('selectr-drop-down');
      this.dropdown.classList.add('selectr-drop-up');
      return;
    }
    if (pos === 'down') {
      this.wrapper.classList.remove('selectr-drop-up');
      this.wrapper.classList.add('selectr-drop-down');
      this.dropdown.classList.remove('selectr-drop-up');
      this.dropdown.classList.add('selectr-drop-down');
      return;
    }
    // auto
    var rect = this.wrapper.getBoundingClientRect();
    var spaceBelow = window.innerHeight - rect.bottom;
    var spaceAbove = rect.top;
    var ddHeight = Math.min(this.opts.maxHeight + 100, 320);
    if (spaceBelow < ddHeight && spaceAbove > spaceBelow) {
      this.wrapper.classList.remove('selectr-drop-down');
      this.wrapper.classList.add('selectr-drop-up');
      this.dropdown.classList.remove('selectr-drop-down');
      this.dropdown.classList.add('selectr-drop-up');
    } else {
      this.wrapper.classList.remove('selectr-drop-up');
      this.wrapper.classList.add('selectr-drop-down');
      this.dropdown.classList.remove('selectr-drop-up');
      this.dropdown.classList.add('selectr-drop-down');
    }
  };

  /* ─── Keyboard navigation ─────────────────────────────────── */
  SelectR.prototype._onControlKey = function (e) {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!this._isOpen) { this._openDropdown(); }
        else { this._selectHighlighted(); }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!this._isOpen) { this._openDropdown(); }
        else { this._moveHighlight(1); }
        break;
      case 'ArrowUp':
        e.preventDefault();
        this._moveHighlight(-1);
        break;
      case 'Escape':
        this._close();
        break;
      case 'Tab':
        if (this._isOpen) this._close();
        break;
    }
  };

  SelectR.prototype._onSearchKey = function (e) {
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); this._moveHighlight(1); break;
      case 'ArrowUp': e.preventDefault(); this._moveHighlight(-1); break;
      case 'Enter': e.preventDefault(); this._selectHighlighted(); break;
      case 'Escape': this._close(); break;
    }
  };

  SelectR.prototype._moveHighlight = function (dir) {
    var items = Array.prototype.slice.call(
      this.optionsList.querySelectorAll('.selectr-option:not(.selectr-disabled-opt)')
    );
    if (!items.length) return;
    this._highlighted = Math.max(0, Math.min(items.length - 1, this._highlighted + dir));
    var highlighted = this._highlighted;
    items.forEach(function (el, i) {
      el.classList.toggle('selectr-highlighted', i === highlighted);
    });
    if (items[this._highlighted]) {
      items[this._highlighted].scrollIntoView({ block: 'nearest' });
    }
  };

  SelectR.prototype._selectHighlighted = function () {
    var items = Array.prototype.slice.call(
      this.optionsList.querySelectorAll('.selectr-option:not(.selectr-disabled-opt)')
    );
    if (this._highlighted >= 0 && items[this._highlighted]) {
      items[this._highlighted].click();
    }
  };

  /* ─── Frontend filter ─────────────────────────────────────── */
  SelectR.prototype._filterItems = function (q) {
    q = (q || '').toLowerCase();
    if (!q || q.length < this.opts.searchMinLength) {
      this._filteredItems = this._items;
    } else {
      var exact = [];
      var startsWith = [];
      var contains = [];

      this._items.forEach(function (item) {
        var label = item.label.toLowerCase();
        var idx = label.indexOf(q);

        if (idx !== -1) {
          if (label === q) {
            exact.push(item);
          } else if (idx === 0) {
            startsWith.push(item);
          } else {
            contains.push(item);
          }
        }
      });

      this._filteredItems = exact.concat(startsWith, contains);
    }
    this._renderOptions(this._filteredItems, false, q);
    this._updateToolbar();
  };

  /* ─── AJAX search ─────────────────────────────────────────── */
  SelectR.prototype._ajaxSearch = function (q, append) {
    var self = this;
    var cfg = this.opts.ajax;
    if (!cfg || !cfg.url) return;

    var reqId = ++this._ajaxRequestId || (this._ajaxRequestId = 1);

    var cacheKey = q + '_p' + this._page;
    if (cfg.cache !== false && self.ajaxCache[cacheKey] && !append) {
      var cached = self.ajaxCache[cacheKey];
      self._handleAjaxResults(cached, append);
      return;
    }

    this._loading = true;
    if (!append) this._showLoading();
    else if (this.loadMore) this.loadMore.style.display = 'flex';

    var params = {
      q: q,
      search: q,
      query: q,
      term: q,
      page: self._page,
      pageSize: self.opts.pageSize,
    };
    if (cfg.data) {
      var extra = cfg.data(params);
      params = merge(params, extra);
    }

    var url = cfg.url;
    var method = (cfg.method || 'GET').toUpperCase();
    var body = null;
    if (method === 'GET') {
      var qs = Object.keys(params).map(function (k) {
        return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
      }).join('&');
      url = url + (url.indexOf('?') >= 0 ? '&' : '?') + qs;
    } else {
      body = JSON.stringify(params);
    }

    var headers = merge({ 'Content-Type': 'application/json' }, cfg.headers || {});

    // Prefer fetch if available, fallback to XMLHttpRequest
    if (typeof fetch !== 'undefined') {
      fetch(url, { method: method, headers: headers, body: body })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (self._ajaxRequestId !== reqId) return;
          if (cfg.cache !== false) self.ajaxCache[cacheKey] = data;
          self._handleAjaxResults(data, append);
        })
        .catch(function () {
          if (self._ajaxRequestId !== reqId) return;
          self._loading = false;
          self._showError('Failed to load options.');
        });
    } else {
      var xhr = new XMLHttpRequest();
      xhr.open(method, url, true);
      Object.keys(headers).forEach(function (h) { xhr.setRequestHeader(h, headers[h]); });
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (self._ajaxRequestId !== reqId) return;
          if (xhr.status >= 200 && xhr.status < 300) {
            var data;
            try { data = JSON.parse(xhr.responseText); } catch (e) { data = {}; }
            if (cfg.cache !== false) self.ajaxCache[cacheKey] = data;
            self._handleAjaxResults(data, append);
          } else {
            self._loading = false;
            self._showError('Failed to load options.');
          }
        }
      };
      xhr.send(body);
    }
  };

  SelectR.prototype._handleAjaxResults = function (raw, append) {
    this._loading = false;
    if (this.loadMore) this.loadMore.style.display = 'none';

    var processed = raw;
    if (this.opts.ajax && typeof this.opts.ajax.processResults === 'function') {
      processed = this.opts.ajax.processResults(raw);
    }

    var results = processed.results || processed.items || processed.data || (Array.isArray(processed) ? processed : []);
    var hasMore = processed.hasMore || processed.has_more || processed.more || false;
    this._hasMore = hasMore;

    // Normalize items
    results = results.map(function (r) {
      if (typeof r === 'string') return { value: r, label: r };
      return {
        value: r.value != null ? String(r.value) : String(r.id || r.text),
        label: r.label || r.text || r.name || String(r.value || r.id),
        disabled: r.disabled || false,
        group: r.group || r.category || null,
        icon: r.icon || null,
        avatar: r.avatar || null,
        badge: r.badge || null,
        badgeClass: r.badgeClass || 'bg-secondary',
        description: r.description || null,
        data: r,
      };
    });

    if (append) {
      this._items = this._items.concat(results);
      this._appendOptions(results, this._query);
    } else {
      this._items = results;
      this._renderOptions(results, false, this._query);
    }
    this._updateToolbar();
  };

  SelectR.prototype._showLoading = function () {
    var html = this.opts.renderLoading
      ? this.opts.renderLoading()
      : '<div class="selectr-loading"><span class="selectr-loading-spinner"></span> Loading…</div>';
    this.optionsList.innerHTML = html;
  };

  SelectR.prototype._showError = function (msg) {
    this.optionsList.innerHTML = '<div class="selectr-no-results">' + escHtml(msg) + '</div>';
  };

  /* ─── Render options list ─────────────────────────────────── */
  SelectR.prototype._renderOptions = function (items, append, query) {
    if (!append) this.optionsList.innerHTML = '';

    var self = this;
    var origQuery = this._query || query || '';
    var hasExactMatch = false;

    if (origQuery) {
      var qLower = origQuery.toLowerCase();
      if (items && items.length > 0) {
        hasExactMatch = items.some(function(item) {
          return item.label.toLowerCase() === qLower;
        });
      }
    }

    var showCreate = this.opts.creatable && origQuery && !hasExactMatch;

    if (!items || items.length === 0) {
      var emptyHtml = this.opts.renderEmpty
        ? this.opts.renderEmpty(query)
        : '<div class="selectr-no-results">No options found.</div>';
      
      if (showCreate) {
        emptyHtml += '<button type="button" class="selectr-create-btn">+ Add "' + escHtml(origQuery) + '"</button>';
        this.optionsList.innerHTML = emptyHtml;
        var btn = this.optionsList.querySelector('.selectr-create-btn');
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          self._handleCreateClick(origQuery, btn);
        });
      } else {
        this.optionsList.innerHTML = emptyHtml;
      }
      return;
    }

    var fragment = document.createDocumentFragment();
    var groups = {};
    var groupOrder = [];
    var noGroup = [];

    items.forEach(function (item) {
      if (item.group) {
        if (!groups[item.group]) { groups[item.group] = []; groupOrder.push(item.group); }
        groups[item.group].push(item);
      } else {
        noGroup.push(item);
      }
    });

    function renderGroup(groupItems) {
      groupItems.forEach(function (item) {
        fragment.appendChild(self._buildOptionEl(item, query));
      });
    }

    if (noGroup.length) renderGroup(noGroup);

    groupOrder.forEach(function (gLabel) {
      var gDiv = document.createElement('div');
      gDiv.className = 'selectr-group';

      var gLbl = document.createElement('div');
      gLbl.className = 'selectr-group-label';
      gLbl.textContent = gLabel;
      gDiv.appendChild(gLbl);

      groups[gLabel].forEach(function (item) {
        gDiv.appendChild(self._buildOptionEl(item, query));
      });
      fragment.appendChild(gDiv);
    });

    if (showCreate) {
      var createBtn = document.createElement('button');
      createBtn.type = 'button';
      createBtn.className = 'selectr-create-btn';
      createBtn.innerHTML = '+ Add "' + escHtml(origQuery) + '"';
      createBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        self._handleCreateClick(origQuery, createBtn);
      });
      fragment.appendChild(createBtn);
    }

    this.optionsList.appendChild(fragment);
    
    // Smart Highlight first item automatically
    if (query && query.length > 0) {
      this._moveHighlight(1);
    }
  };

  SelectR.prototype._handleCreateClick = function(origQuery, btn) {
    var self = this;
    if (this.opts.createController && this.opts.createAction) {
      btn.innerHTML = '<span class="selectr-loading-spinner" style="width:14px;height:14px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:8px;"></span> Adding...';
      btn.disabled = true;
      var url = '/' + this.opts.createController + '/' + this.opts.createAction;
      
      var paramName = this.opts.createParam || 'data';
      var bodyParams = [ encodeURIComponent(paramName) + '=' + encodeURIComponent(origQuery) ];
      var token = document.querySelector('input[name="__RequestVerificationToken"]');
      if (token) {
        bodyParams.push(encodeURIComponent('__RequestVerificationToken') + '=' + encodeURIComponent(token.value));
      }
      var body = bodyParams.join('&');

      var resetBtn = function() {
        btn.innerHTML = 'Error';
        setTimeout(function() { btn.innerHTML = '+ Add "' + escHtml(origQuery) + '"'; btn.disabled = false; }, 2000);
      };
      var onSuccess = function(res) {
        // Map common ASP.NET responses if standard value/label is missing
        if (res && res.isSuccess !== false) {
          if (!res.value && res.lastId) res.value = res.lastId;
          if (!res.label) res.label = origQuery;
        }

        if (res && res.value) {
          self.addOption(res).setValue(res.value);
          self._close();
        } else if (self.opts.ajax) {
          self._ajaxSearch(origQuery);
        } else {
          var newItem = { value: origQuery, label: origQuery };
          self.addOption(newItem).setValue(newItem.value);
          self._close();
        }
      };
      if (typeof fetch !== 'undefined') {
        fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body })
          .then(function(r) { return r.json(); })
          .then(onSuccess)
          .catch(resetBtn);
      } else {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
              var res;
              try { res = JSON.parse(xhr.responseText); } catch(e) { res = {}; }
              onSuccess(res);
            } else {
              resetBtn();
            }
          }
        };
        xhr.send(body);
      }
    } else {
      var newItem = { value: origQuery, label: origQuery };
      self.addOption(newItem).setValue(newItem.value);
      self._close();
    }
  };

  SelectR.prototype._appendOptions = function (items, query) {
    var self = this;
    items.forEach(function (item) {
      if (item.group) {
        // Find existing group container
        var groupDivs = Array.prototype.slice.call(self.optionsList.querySelectorAll('.selectr-group'));
        var targetGroup = null;
        for (var i = 0; i < groupDivs.length; i++) {
          var labelEl = groupDivs[i].querySelector('.selectr-group-label');
          if (labelEl && labelEl.textContent === item.group) {
            targetGroup = groupDivs[i];
            break;
          }
        }

        if (targetGroup) {
          targetGroup.appendChild(self._buildOptionEl(item, query));
        } else {
          // Create new group if it doesn't exist
          var gDiv = document.createElement('div');
          gDiv.className = 'selectr-group';
          var gLbl = document.createElement('div');
          gLbl.className = 'selectr-group-label';
          gLbl.textContent = item.group;
          gDiv.appendChild(gLbl);
          gDiv.appendChild(self._buildOptionEl(item, query));
          self.optionsList.appendChild(gDiv);
        }
      } else {
        self.optionsList.appendChild(self._buildOptionEl(item, query));
      }
    });
  };

  SelectR.prototype._buildOptionEl = function (item, query) {
    var self = this;
    var o = this.opts;
    var isSelected = this._selected.indexOf(String(item.value)) !== -1;

    var div = document.createElement('div');
    div.className = 'selectr-option' +
      (isSelected ? ' selectr-selected' : '') +
      (item.disabled ? ' selectr-disabled-opt' : '');
    div.setAttribute('role', 'option');
    div.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    div.setAttribute('data-value', item.value);

    // Custom render
    if (o.renderOption) {
      div.innerHTML = o.renderOption(item);
    } else {
      // Marker
      div.appendChild(self._buildMarker(item, isSelected));

      // Icon / Avatar
      if (item.avatar) {
        var img = document.createElement('img');
        img.src = item.avatar;
        img.className = 'selectr-option-avatar';
        img.alt = '';
        div.appendChild(img);
      } else if (item.icon) {
        var ico = document.createElement('img');
        ico.src = item.icon;
        ico.className = 'selectr-option-icon';
        ico.alt = '';
        div.appendChild(ico);
      }

      // Text
      var textWrap = document.createElement('span');
      textWrap.className = 'selectr-option-text';

      var labelStr = escHtml(item.label);
      if (o.highlightMatch && query && query.length >= o.searchMinLength) {
        var rx = new RegExp('(' + query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
        labelStr = labelStr.replace(rx, '<span class="selectr-match">$1</span>');
      }
      textWrap.innerHTML = labelStr;

      if (item.description) {
        var desc = document.createElement('small');
        desc.className = 'selectr-option-desc';
        desc.textContent = item.description;
        textWrap.appendChild(desc);
      }
      div.appendChild(textWrap);

      // Badge
      if (item.badge) {
        var badge = document.createElement('span');
        badge.className = 'selectr-option-badge badge ' + (item.badgeClass || 'bg-secondary');
        badge.textContent = item.badge;
        div.appendChild(badge);
      }
    }

    // Click handler
    div.addEventListener('click', function (e) {
      e.stopPropagation();
      if (item.disabled) return;
      self._selectItem(item.value);
    });

    return div;
  };

  SelectR.prototype._buildMarker = function (item, isSelected) {
    var markerWrap = document.createElement('span');
    markerWrap.className = 'selectr-marker';

    var m = this.opts.marker;
    if (m === 'checkbox') {
      var box = document.createElement('span');
      box.className = 'selectr-marker-checkbox';
      markerWrap.appendChild(box);
    } else if (m === 'tick') {
      var tick = document.createElement('span');
      tick.className = 'selectr-marker-tick';
      tick.innerHTML = ICONS.tick;
      markerWrap.appendChild(tick);
    } else if (m === 'circle') {
      var circ = document.createElement('span');
      circ.className = 'selectr-marker-circle';
      markerWrap.appendChild(circ);
    } else {
      markerWrap.className = 'selectr-marker-none';
    }

    return markerWrap;
  };

  /* ─── Select / deselect item ──────────────────────────────── */
  SelectR.prototype._selectItem = function (value) {
    value = String(value);
    var o = this.opts;
    var idx = this._selected.indexOf(value);

    if (o.mode === 'single') {
      this._selected = [value];
      this._close(); // single always closes after selection
    } else {
      if (idx !== -1) {
        // deselect
        this._selected.splice(idx, 1);
      } else {
        // select
        if (o.maxSelected && this._selected.length >= o.maxSelected) return;
        this._selected.push(value);
      }
      if (o.closeOnSelect === true) this._close(); // multiple: only close if explicitly set
    }

    // Clear search box after selection
    if (this.searchInput && this.searchInput.value) {
      this.searchInput.value = '';
      this._query = '';
      if (this._isOpen) {
        this._page = 1;
        if (o.ajax) this._ajaxSearch('');
        else this._filterItems('');
      }
    }

    this._syncToOriginal();
    this._render();
    this._refreshOptionStates();

    if (o.onChange) {
      o.onChange(o.mode === 'single' ? (this._selected[0] || null) : this._selected.slice(), this._getSelectedItems());
    }
  };

  /* ─── Refresh option states without re-render ────────────── */
  SelectR.prototype._refreshOptionStates = function () {
    var self = this;
    var optEls = Array.prototype.slice.call(this.optionsList.querySelectorAll('.selectr-option'));
    optEls.forEach(function (el) {
      var val = el.getAttribute('data-value');
      var sel = self._selected.indexOf(val) !== -1;
      el.classList.toggle('selectr-selected', sel);
      el.setAttribute('aria-selected', sel ? 'true' : 'false');
      // Update marker
      var checkbox = el.querySelector('.selectr-marker-checkbox');
      if (checkbox) el.querySelector('.selectr-marker-checkbox').parentElement.parentElement.classList.toggle('selectr-selected', sel);
    });
    this._updateToolbar();
  };

  /* ─── Sync back to native <select> ───────────────────────── */
  SelectR.prototype._syncToOriginal = function () {
    var self = this;
    var opts = this.el.options;
    
    // Ensure all selected items exist as <option> elements (crucial for AJAX)
    this._selected.forEach(function (val) {
      var exists = false;
      for (var i = 0; i < opts.length; i++) {
        if (opts[i].value === val) {
          exists = true;
          break;
        }
      }
      if (!exists) {
        var opt = document.createElement('option');
        opt.value = val;
        var item = self._findItem(val);
        opt.text = item ? item.label : val;
        self.el.appendChild(opt);
      }
    });

    // Update selection state
    for (var i = 0; i < opts.length; i++) {
      opts[i].selected = self._selected.indexOf(opts[i].value) !== -1;
    }
    
    // Fire native change
    var ev = document.createEvent('HTMLEvents');
    ev.initEvent('change', true, true);
    this.el.dispatchEvent(ev);
  };

  /* ─── Render control value area ───────────────────────────── */
  SelectR.prototype._render = function () {
    var o = this.opts;
    var valueArea = this.valueArea;
    valueArea.innerHTML = '';

    var hasValue = this._selected.length > 0;
    this.wrapper.classList.toggle('has-value', hasValue);

    if (!hasValue) {
      valueArea.appendChild(this.placeholder);
      return;
    }

    if (o.mode === 'single') {
      var item = this._findItem(this._selected[0]);
      if (o.renderTag) {
        valueArea.innerHTML = o.renderTag(item);
      } else {
        var span = document.createElement('span');
        span.className = 'selectr-single-value';
        span.textContent = item ? item.label : this._selected[0];
        valueArea.appendChild(span);
      }
    } else {
      // ═══ Multiple mode ════════════════════════════════════════
      var o2 = this.opts;
      var total = this._selected.length;
      var self = this;
      var ds = o2.displayStyle || 'pill';  // 'pill' | 'plain' | 'comma'

      // ── SUMMARY MODE (overrides displayStyle) ─────────────────
      var useSummary = o2.summaryThreshold > 0 && total >= o2.summaryThreshold;
      if (useSummary) {
        var summaryPill = document.createElement('button');
        summaryPill.type = 'button';
        summaryPill.className = 'selectr-summary-pill';
        summaryPill.setAttribute('aria-label', total + ' ' + o2.summaryLabel + ' — click to view');
        summaryPill.innerHTML =
          '<span>' + total + ' ' + escHtml(o2.summaryLabel) + '</span>' +
          '<span class="selectr-overflow-pill-caret" aria-hidden="true">▾</span>';
        summaryPill.addEventListener('click', function (e) {
          e.stopPropagation();
          self._toggleDrawer();
        });
        valueArea.appendChild(summaryPill);
        if (this.wrapper.classList.contains('drawer-open')) this._renderDrawer();
        return;
      }

      // ── COMMA style ───────────────────────────────────────────
      if (ds === 'comma') {
        var limit2 = (o2.tagLimit != null) ? o2.tagLimit : total;
        var vis2 = this._selected.slice(0, limit2);
        var over2 = this._selected.slice(limit2);
        var labels = vis2.map(function (v) {
          var it = self._findItem(v);
          return it ? it.label : v;
        });

        var commaSpan = document.createElement('span');
        commaSpan.className = 'selectr-comma-value';
        commaSpan.textContent = labels.join(o2.commaSeparator);
        valueArea.appendChild(commaSpan);

        if (over2.length > 0) {
          var commaOverflow = document.createElement('button');
          commaOverflow.type = 'button';
          commaOverflow.className = 'selectr-overflow-pill selectr-overflow-pill-plain';
          commaOverflow.setAttribute('aria-label', over2.length + ' more items selected');
          commaOverflow.innerHTML =
            '<span>+' + over2.length + ' more</span>' +
            '<span class="selectr-overflow-pill-caret" aria-hidden="true">▾</span>';
          commaOverflow.addEventListener('click', function (e) {
            e.stopPropagation();
            self._toggleDrawer();
          });
          valueArea.appendChild(commaOverflow);
          if (this.wrapper.classList.contains('drawer-open')) this._renderDrawer();
        } else {
          this._closeDrawer();
        }
        return;
      }

      // ── PILL or PLAIN style ───────────────────────────────────
      var limit = (o2.tagLimit != null) ? o2.tagLimit : total;
      var visible = this._selected.slice(0, limit);
      var overflow = this._selected.slice(limit);

      visible.forEach(function (val) {
        var it = self._findItem(val);
        valueArea.appendChild(self._buildTag(it || { value: val, label: val }, ds));
      });

      if (overflow.length > 0) {
        var overflowPill = document.createElement('button');
        overflowPill.type = 'button';
        overflowPill.className = 'selectr-overflow-pill' + (ds === 'plain' ? ' selectr-overflow-pill-plain' : '');
        overflowPill.setAttribute('aria-label', overflow.length + ' more items selected — click to view');
        overflowPill.innerHTML =
          '<span>+' + overflow.length + ' More' +
          (overflow.length === 1 ? ' Item' : ' Items') + ' Selected</span>' +
          '<span class="selectr-overflow-pill-caret" aria-hidden="true">▾</span>';
        overflowPill.addEventListener('click', function (e) {
          e.stopPropagation();
          self._toggleDrawer();
        });
        valueArea.appendChild(overflowPill);
        if (this.wrapper.classList.contains('drawer-open')) this._renderDrawer();
      } else {
        this._closeDrawer();
      }
    }
  };

  // style: 'pill' | 'plain' — comma is handled separately in _render
  SelectR.prototype._buildTag = function (item, style) {
    var self = this;
    var o = this.opts;
    style = style || o.displayStyle || 'pill';

    if (o.renderTag) {
      var tmp = document.createElement('div');
      tmp.innerHTML = o.renderTag(item);
      return tmp.firstChild;
    }

    var tag = document.createElement('span');
    tag.className = style === 'plain' ? 'selectr-tag selectr-tag-plain' : 'selectr-tag';

    var text = document.createElement('span');
    text.className = 'selectr-tag-text';
    text.title = item.label;
    text.textContent = item.label;
    tag.appendChild(text);

    var rm = document.createElement('button');
    rm.type = 'button';
    rm.className = 'selectr-tag-remove';
    rm.setAttribute('aria-label', 'Remove ' + item.label);
    rm.innerHTML = ICONS.close;
    rm.addEventListener('click', function (e) {
      e.stopPropagation();
      self._selectItem(item.value);
    });
    tag.appendChild(rm);

    return tag;
  };

  SelectR.prototype._findItem = function (value) {
    for (var i = 0; i < this._items.length; i++) {
      if (String(this._items[i].value) === String(value)) return this._items[i];
    }
    return null;
  };

  /* ─── All-selected check ──────────────────────────────────── */
  SelectR.prototype._isAllSelected = function () {
    var available = (this._filteredItems.length ? this._filteredItems : this._items)
      .filter(function (i) { return !i.disabled; });
    if (!available.length) return false;
    var self = this;
    return available.every(function (i) { return self._selected.indexOf(String(i.value)) !== -1; });
  };

  /* ─── Sync toggle-all button label in one place ───────────── */
  SelectR.prototype._syncToggleBtn = function (btn) {
    if (!btn) return;
    var allSel = this._isAllSelected();
    btn.textContent = allSel ? this.opts.clearAllLabel : this.opts.selectAllLabel;
  };

  /* ─── Toolbar update ──────────────────────────────────────── */
  SelectR.prototype._updateToolbar = function () {
    if (!this.toolbarCount) return;
    var total = this._filteredItems.length || this._items.length;
    var sel = this._selected.length;
    this.toolbarCount.textContent = sel + ' of ' + total + ' selected';
    this._syncToggleBtn(this.toggleAllBtn);
    this._syncToggleBtn(this.drawerToggleAllBtn);
  };

  /* ─── Drawer ──────────────────────────────────────────────── */
  SelectR.prototype._renderDrawer = function () {
    if (!this.drawer) return;
    var self = this;
    var total = this._selected.length;

    // Rebuild tag list inside drawer
    this.drawerTags.innerHTML = '';
    this._selected.forEach(function (val) {
      var item = self._findItem(val) || { value: val, label: val };
      self.drawerTags.appendChild(self._buildTag(item));
    });

    // Update footer count
    if (this.drawerCount) {
      this.drawerCount.textContent = total + ' item' + (total !== 1 ? 's' : '') + ' selected';
    }

    // Sync toggle button label
    this._syncToggleBtn(this.drawerToggleAllBtn);
  };

  SelectR.prototype._toggleDrawer = function () {
    if (this.wrapper.classList.contains('drawer-open')) {
      this._closeDrawer();
    } else {
      this._openDrawer();
    }
  };

  SelectR.prototype._openDrawer = function () {
    if (!this.drawer) return;
    this._renderDrawer();
    this.wrapper.classList.add('drawer-open');
  };

  SelectR.prototype._closeDrawer = function () {
    if (!this.drawer) return;
    this.wrapper.classList.remove('drawer-open');
  };

  /* ─── Public API ──────────────────────────────────────────── */

  /** Set value(s) programmatically */
  SelectR.prototype.setValue = function (val) {
    if (Array.isArray(val)) {
      this._selected = val.map(String);
    } else if (val == null || val === '') {
      this._selected = [];
    } else {
      this._selected = this.opts.mode === 'multiple' ? [String(val)] : [String(val)];
    }
    this._syncToOriginal();
    this._render();
    this._refreshOptionStates();
    return this;
  };

  /** Get current value(s) */
  SelectR.prototype.getValue = function () {
    if (this.opts.mode === 'single') return this._selected[0] || null;
    return this._selected.slice();
  };

  /** Get selected item objects */
  SelectR.prototype._getSelectedItems = function () {
    var self = this;
    return this._selected.map(function (v) { return self._findItem(v); }).filter(Boolean);
  };

  /** Select all visible options */
  SelectR.prototype.selectAll = function () {
    var items = this._filteredItems.length ? this._filteredItems : this._items;
    var self = this;
    items.forEach(function (item) {
      if (!item.disabled && self._selected.indexOf(String(item.value)) === -1) {
        self._selected.push(String(item.value));
      }
    });
    this._syncToOriginal();
    this._render();
    this._refreshOptionStates();
    if (this.opts.onChange) this.opts.onChange(this._selected.slice(), this._getSelectedItems());
    return this;
  };

  /** Clear all selections */
  SelectR.prototype.clearAll = function () {
    this._selected = [];
    if (this.searchInput) {
      this.searchInput.value = '';
      this._query = '';
      if (this._isOpen) {
        this._page = 1;
        if (this.opts.ajax) this._ajaxSearch('');
        else this._filterItems('');
      }
    }
    this._syncToOriginal();
    this._render();
    this._refreshOptionStates();
    if (this.opts.onChange) this.opts.onChange(this.opts.mode === 'single' ? null : [], []);
    return this;
  };

  /** Add an option dynamically */
  SelectR.prototype.addOption = function (item) {
    if (typeof item === 'string') item = { value: item, label: item };
    item.value = String(item.value);
    
    // Prevent duplicate options
    if (this._findItem(item.value)) return this;

    // also add to the <select>
    var opt = document.createElement('option');
    opt.value = item.value;
    opt.text = item.label;
    this.el.appendChild(opt);
    this._items.push(item);
    if (this._isOpen) this._filterItems(this._query);
    return this;
  };

  /** Remove an option by value */
  SelectR.prototype.removeOption = function (value) {
    value = String(value);
    this._items = this._items.filter(function (i) { return i.value !== value; });
    var opts = this.el.options;
    for (var j = opts.length - 1; j >= 0; j--) {
      if (opts[j].value === value) this.el.remove(j);
    }
    // Deselect if selected
    var idx = this._selected.indexOf(value);
    if (idx !== -1) { this._selected.splice(idx, 1); this._render(); }
    if (this._isOpen) this._filterItems(this._query);
    return this;
  };

  /** Disable the select */
  SelectR.prototype.disable = function () {
    this.opts.disabled = true;
    this.wrapper.classList.add('selectr-disabled');
    this.control.setAttribute('tabindex', '-1');
    return this;
  };

  /** Enable the select */
  SelectR.prototype.enable = function () {
    this.opts.disabled = false;
    this.wrapper.classList.remove('selectr-disabled');
    this.control.setAttribute('tabindex', '0');
    return this;
  };

  /** Set validation state */
  SelectR.prototype.setValidation = function (state) {
    this.wrapper.classList.remove('is-valid', 'is-invalid', 'selectr-valid', 'selectr-invalid');
    if (state === 'valid' || state === 'is-valid') {
      this.wrapper.classList.add('selectr-valid');
    } else if (state === 'invalid' || state === 'is-invalid') {
      this.wrapper.classList.add('selectr-invalid');
    }
    return this;
  };

  /** Open dropdown */
  SelectR.prototype.open = function () { this._openDropdown(); return this; };

  /** Close dropdown */
  SelectR.prototype.close = function () { this._close(); return this; };

  /** Set placeholder */
  SelectR.prototype.setPlaceholder = function (text) {
    this.opts.placeholder = text;
    this.placeholder.textContent = text;
    return this;
  };

  /** Set marker style dynamically */
  SelectR.prototype.setMarker = function (type) {
    this.opts.marker = type;
    if (this._isOpen) this._filterItems(this._query);
    return this;
  };

  /** Load items programmatically (replaces existing) */
  SelectR.prototype.load = function (items) {
    this._items = items.map(function (item) {
      if (typeof item === 'string') return { value: item, label: item };
      return merge({ value: '', label: '' }, item, { value: String(item.value != null ? item.value : item.id || ''), label: item.label || item.text || item.name || '' });
    });
    // Rebuild <select> options
    this.el.innerHTML = '';
    var self = this;
    this._items.forEach(function (item) {
      var opt = document.createElement('option');
      opt.value = item.value;
      opt.text = item.label;
      self.el.appendChild(opt);
    });
    if (this._isOpen) this._filterItems(this._query);
    return this;
  };

  /** Refresh — re-read from <select> element */
  SelectR.prototype.refresh = function () {
    this._items = parseSelectElement(this.el);
    this._selected = [];
    this._syncFromOriginal();
    this._render();
    if (this._isOpen) this._filterItems(this._query);
    return this;
  };

  /** Destroy and restore original <select> */
  SelectR.prototype.destroy = function () {
    if (this.wrapper && this.wrapper.parentNode) {
      this.wrapper.parentNode.removeChild(this.wrapper);
    }
    this.el.style.display = '';
    this.el.removeAttribute('aria-hidden');
    this.el.removeAttribute('tabindex');
    delete this.el._selectR;

    if (this._onDocumentClick) document.removeEventListener('click', this._onDocumentClick);
    if (this._onWindowResize) window.removeEventListener('resize', this._onWindowResize);
    if (this._onFormReset && this.el.form) this.el.form.removeEventListener('reset', this._onFormReset);
  };

  /* ─── Factory function ────────────────────────────────────── */
  function selectR(el, opts) {
    if (typeof el === 'string') {
      var els = Array.prototype.slice.call(document.querySelectorAll(el));
      if (els.length > 1) {
        var instances = [];
        els.forEach(function (e) { instances.push(new SelectR(e, opts)); });
        return instances;
      }
      el = els[0];
    }
    if (!el) return null;
    return new SelectR(el, opts);
  }

  selectR.version = '1.2.0';
  selectR.defaults = DEFAULTS;

  // ── Auto-init ──────────────────────────────────────────────────
  // Reads EITHER data-selectr='{ JSON }' OR individual data-sr-* attributes.
  // Individual attributes always win over JSON when both present.
  //
  // Boolean attrs:  presence of attr (no value) = true, "false" = false
  // Number attrs:   parsed as float
  // String attrs:   used as-is
  //
  // Supported data-sr-* attribute map:
  //   data-sr-mode            | data-sr-placeholder    | data-sr-disabled
  //   data-sr-readonly        | data-sr-size           | data-sr-marker
  //   data-sr-show-clear      | data-sr-max-height     | data-sr-dropdown-width
  //   data-sr-position        | data-sr-display-style  | data-sr-comma-separator
  //   data-sr-tag-limit       | data-sr-max-selected   | data-sr-close-on-select
  //   data-sr-summary-threshold | data-sr-summary-label
  //   data-sr-searchable      | data-sr-search-placeholder | data-sr-search-min-length
  //   data-sr-search-debounce | data-sr-highlight-match
  //   data-sr-infinite-scroll | data-sr-page-size
  //   data-sr-show-toolbar    | data-sr-select-all-label | data-sr-clear-all-label
  //   data-sr-show-drawer     | data-sr-drawer-title
  //   data-sr-ajax-url        | data-sr-ajax-method    | data-sr-ajax-delay
  //   data-sr-ajax-cache      | data-sr-validation

  function parseBool(v) {
    if (v === null || v === undefined) return undefined;
    if (v === '' || v === 'true') return true;
    if (v === 'false') return false;
    return undefined;
  }
  function parseNum(v) {
    if (v === null || v === undefined || v === '') return undefined;
    var n = parseFloat(v);
    return isNaN(n) ? undefined : n;
  }
  function attr(el, name) {
    return el.hasAttribute(name) ? el.getAttribute(name) : undefined;
  }
  function boolAttr(el, name) {
    if (!el.hasAttribute(name)) return undefined;
    return parseBool(el.getAttribute(name));
  }
  function numAttr(el, name) {
    return parseNum(attr(el, name));
  }
  function setIf(obj, key, val) {
    if (val !== undefined && val !== null) obj[key] = val;
  }

  function readDataAttrs(el) {
    var o = {};
    setIf(o, 'mode', attr(el, 'data-sr-mode'));
    setIf(o, 'placeholder', attr(el, 'data-sr-placeholder'));
    setIf(o, 'disabled', boolAttr(el, 'data-sr-disabled'));
    setIf(o, 'readonly', boolAttr(el, 'data-sr-readonly'));
    setIf(o, 'size', attr(el, 'data-sr-size'));
    setIf(o, 'marker', attr(el, 'data-sr-marker'));
    setIf(o, 'showClearButton', boolAttr(el, 'data-sr-show-clear'));
    setIf(o, 'maxHeight', numAttr(el, 'data-sr-max-height'));
    setIf(o, 'dropdownWidth', attr(el, 'data-sr-dropdown-width'));
    setIf(o, 'position', attr(el, 'data-sr-position'));
    setIf(o, 'displayStyle', attr(el, 'data-sr-display-style'));
    setIf(o, 'commaSeparator', attr(el, 'data-sr-comma-separator'));
    setIf(o, 'tagLimit', numAttr(el, 'data-sr-tag-limit'));
    setIf(o, 'maxSelected', numAttr(el, 'data-sr-max-selected'));
    setIf(o, 'closeOnSelect', boolAttr(el, 'data-sr-close-on-select'));
    setIf(o, 'creatable', boolAttr(el, 'data-sr-creatable'));
    setIf(o, 'createController', attr(el, 'data-sr-create-controller'));
    setIf(o, 'createAction', attr(el, 'data-sr-create-action'));
    setIf(o, 'createParam', attr(el, 'data-sr-create-param'));
    setIf(o, 'summaryThreshold', numAttr(el, 'data-sr-summary-threshold'));
    setIf(o, 'summaryLabel', attr(el, 'data-sr-summary-label'));
    setIf(o, 'searchable', boolAttr(el, 'data-sr-searchable'));
    setIf(o, 'searchPlaceholder', attr(el, 'data-sr-search-placeholder'));
    setIf(o, 'searchMinLength', numAttr(el, 'data-sr-search-min-length'));
    setIf(o, 'searchDebounce', numAttr(el, 'data-sr-search-debounce'));
    setIf(o, 'highlightMatch', boolAttr(el, 'data-sr-highlight-match'));
    setIf(o, 'infiniteScroll', boolAttr(el, 'data-sr-infinite-scroll'));
    setIf(o, 'pageSize', numAttr(el, 'data-sr-page-size'));
    setIf(o, 'showToolbar', boolAttr(el, 'data-sr-show-toolbar'));
    setIf(o, 'selectAllLabel', attr(el, 'data-sr-select-all-label'));
    setIf(o, 'clearAllLabel', attr(el, 'data-sr-clear-all-label'));
    setIf(o, 'showDrawer', boolAttr(el, 'data-sr-show-drawer'));
    setIf(o, 'drawerTitle', attr(el, 'data-sr-drawer-title'));
    setIf(o, 'validationClass', attr(el, 'data-sr-validation'));

    // AJAX via data attributes — builds the ajax config object
    var ajaxUrl = attr(el, 'data-sr-ajax-url');
    if (ajaxUrl) {
      o.ajax = {
        url: ajaxUrl,
        method: attr(el, 'data-sr-ajax-method') || 'GET',
        delay: parseNum(attr(el, 'data-sr-ajax-delay')) || 300,
        cache: boolAttr(el, 'data-sr-ajax-cache') !== false,
      };
    }

    return o;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var els = Array.prototype.slice.call(
      document.querySelectorAll('[data-selectr], [data-sr-mode], [data-sr-marker], [data-sr-display-style]')
    );
    els.forEach(function (el) {
      if (el._selectR) return;                      // already initialised
      if (el.hasAttribute('data-sr-defer')) return; // skip — caller will init manually after data loads
      var opts = {};
      var blob = el.getAttribute('data-selectr');
      if (blob) { try { opts = JSON.parse(blob); } catch (e) { } }
      opts = merge(opts, readDataAttrs(el));
      selectR(el, opts);
    });

    // Register jQuery plugin here too — covers the case where jQuery
    // loads AFTER selectR (common in Razor bundling order)
    if (typeof jQuery !== 'undefined' && !jQuery.fn.selectR) {
      jQuery.fn.selectR = function (options) {
        return this.each(function () { selectR(this, options); });
      };
    }
  });

  // ── selectR.init(el) ───────────────────────────────────────────
  // Manually initialise (or re-initialise) a deferred element.
  // Call this after you have finished populating the native <select>.
  //   selectR.init('#addYearSelect')   — first call: creates instance
  //   selectR.init('#addYearSelect')   — subsequent calls: calls .refresh() on the existing instance
  selectR.init = function (el) {
    var node = typeof el === 'string' ? document.querySelector(el) : el;
    if (!node) return null;
    if (node._selectR) {
      // Already exists — just re-read the native <select>
      node._selectR.refresh();
      return node._selectR;
    }
    // First time — read options from element attributes
    var opts = {};
    var blob = node.getAttribute('data-selectr');
    if (blob) { try { opts = JSON.parse(blob); } catch (e) { } }
    opts = merge(opts, readDataAttrs(node));
    return selectR(node, opts);
  };

  return selectR;
}));
