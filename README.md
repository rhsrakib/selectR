# selectR

A lightweight, framework-agnostic JavaScript select enhancement library for modern web applications.

`selectR` enhances the native HTML `<select>` element with single and multiple selection, client-side search, server-side AJAX search, infinite scrolling, rich option rendering, selection summaries, drawers, validation states, programmatic APIs, Bootstrap-friendly styling, jQuery support, and automatic initialization through `data-selectr`.

## Features

- Single-select and multiple-select modes
- Searchable dropdowns
- Server-side/AJAX searching
- Infinite-scroll pagination
- Configurable page size
- Select All / Clear All toolbar
- Maximum selection limit
- Selected-item tag limits
- `+N More Items Selected` overflow display
- Summary mode such as `3 Items Selected`
- Drawer for viewing and managing selected items
- Multiple selected-item display styles:
  - `pill`
  - `plain`
  - `comma`
- Checkbox, tick, circle, or no selection markers
- Option groups using native `<optgroup>`
- Rich options with badges and descriptions
- Small, default, and large sizes
- Validation states
- Disabled and readonly states
- Custom option, tag, loading, and empty-state rendering
- Change/open/close/search/scroll callbacks
- Programmatic API
- Vanilla JavaScript API
- jQuery plugin API
- `data-selectr` auto-initialization
- Native `<select>` synchronization
- Framework-agnostic floating-label support
- Bootstrap 5 compatibility
- Destroy and reinitialize support
- Cache support for AJAX requests

## Demo

The project includes a comprehensive demo page covering the available selectR features and API.

The demo includes:

1. Single select
2. Floating labels
3. Multiple select with overflow and drawer
4. Selected-item display styles
5. Grouped options
6. Rich options with badges/descriptions
7. Different sizes
8. Validation states
9. Marker styles
10. Server-side AJAX search
11. Infinite scrolling
12. Programmatic API
13. `data-selectr` auto-init
14. jQuery integration
15. Full configuration reference
16. Destroy/reinitialize examples
17. Value retrieval and programmatic value setting
18. Bootstrap and framework-agnostic layouts

## Installation

`selectR` is designed to work directly with standard HTML.

Include the library stylesheet and JavaScript:

```html
<link rel="stylesheet" href="selectR.css">

<script src="selectR.js"></script>
```

If you use Bootstrap 5, include Bootstrap before `selectR`:

```html
<link rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">

<link rel="stylesheet" href="selectR.css">

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="selectR.js"></script>
```

## Basic Usage

### Vanilla JavaScript

```html
<select id="mySelect">
    <option value="">Select an option</option>
    <option value="1">Option One</option>
    <option value="2">Option Two</option>
    <option value="3">Option Three</option>
</select>
```

```javascript
const element = document.getElementById('mySelect');

const mySelect = new SelectR(element, {
    marker: 'tick',
    showClearButton: true
});
```

### jQuery

If jQuery is available, selectR exposes a jQuery plugin:

```javascript
$('#mySelect').selectR({
    marker: 'circle',
    showClearButton: true
});
```

For multiple elements:

```javascript
$('.my-selects').selectR({
    mode: 'multiple'
});
```

## Single Select

```javascript
selectR('#country', {
    mode: 'single',
    marker: 'checkbox',
    showClearButton: true,
    onChange: (value) => {
        console.log(value);
    }
});
```

## Multiple Select

```html
<select id="languages" multiple>
    <option value="js">JavaScript</option>
    <option value="ts">TypeScript</option>
    <option value="py">Python</option>
    <option value="cs">C#</option>
</select>
```

```javascript
selectR('#languages', {
    mode: 'multiple',
    marker: 'checkbox',
    showToolbar: true
});
```

## Multiple Selection with Tag Limit

Display only a limited number of selected tags and collapse the remaining selections into an overflow indicator:

```javascript
selectR('#languages', {
    mode: 'multiple',
    tagLimit: 2,
    showDrawer: true,
    showToolbar: true
});
```

When more than two items are selected, the component displays an overflow summary such as:

```text
JavaScript  TypeScript  +3 More Items Selected
```

## Summary Mode

Collapse the selected values into a summary after a specified threshold:

```javascript
selectR('#days', {
    mode: 'multiple',
    summaryThreshold: 3,
    summaryLabel: 'Items Selected',
    showDrawer: true
});
```

## Selected Item Display Styles

### Pill

```javascript
selectR('#select', {
    mode: 'multiple',
    displayStyle: 'pill',
    tagLimit: 2
});
```

### Plain

```javascript
selectR('#select', {
    mode: 'multiple',
    displayStyle: 'plain',
    tagLimit: 2
});
```

### Comma

```javascript
selectR('#select', {
    mode: 'multiple',
    displayStyle: 'comma',
    commaSeparator: ' · ',
    tagLimit: 3
});
```

## Marker Styles

Available markers:

```text
checkbox
tick
circle
none
```

Example:

```javascript
selectR('#mySelect', {
    mode: 'multiple',
    marker: 'tick'
});
```

You can also change the marker dynamically:

```javascript
const instance = document.getElementById('mySelect')._selectR;

instance.setMarker('circle');
```

## Grouped Options

Native `<optgroup>` elements are supported:

```html
<select id="cities">
    <option value="">Select a city</option>

    <optgroup label="United States">
        <option value="nyc">New York</option>
        <option value="la">Los Angeles</option>
        <option value="chi">Chicago</option>
    </optgroup>

    <optgroup label="United Kingdom">
        <option value="lon">London</option>
        <option value="man">Manchester</option>
    </optgroup>
</select>
```

```javascript
selectR('#cities', {
    marker: 'tick'
});
```

## Rich Options

Options can contain additional metadata such as badges and descriptions.

### Badge

```html
<option
    value="pro"
    data-badge="PRO"
    data-badge-class="bg-primary">
    Pro
</option>
```

### Description

```html
<option
    value="md"
    data-description="2 vCPU · 4 GB RAM">
    MD Medium
</option>
```

Initialize normally:

```javascript
selectR('#plans', {
    marker: 'tick'
});
```

## Sizes

Supported sizes:

```text
sm
default
lg
```

Examples:

```javascript
selectR('#small', {
    size: 'sm'
});

selectR('#normal', {
    size: ''
});

selectR('#large', {
    size: 'lg'
});
```

## Validation

Validation can be controlled through `validationClass`:

```javascript
selectR('#validSelect', {
    validationClass: 'is-valid'
});

selectR('#invalidSelect', {
    validationClass: 'is-invalid'
});
```

The API also supports:

```javascript
instance.setValidation('valid');
instance.setValidation('invalid');
```

or Bootstrap-style classes:

```javascript
instance.setValidation('is-valid');
instance.setValidation('is-invalid');
```

## Server-Side Search and Infinite Scroll

One of the main features of selectR is server-side search with pagination.

Example:

```javascript
const element = document.getElementById('ajaxSingle');

const instance = new SelectR(element, {
    infiniteScroll: true,
    pageSize: 20,

    ajax: {
        url: '/api/options',
        method: 'GET',

        data: function (params) {
            return {
                q: params.query,
                page: params.page,
                pageSize: 20
            };
        },

        processResults: function (response) {
            return {
                results: response.data,
                hasMore: response.hasMore
            };
        }
    }
});
```

The server endpoint should return data in a structure equivalent to:

```json
{
    "data": [
        {
            "value": "1",
            "label": "Option One"
        },
        {
            "value": "2",
            "label": "Option Two"
        }
    ],
    "hasMore": true
}
```

The request can contain:

```text
q
page
pageSize
```

For example:

```text
GET /api/options?q=tax&page=2&pageSize=20
```

This allows the backend to return only the required page rather than loading the complete dataset into the browser.

## jQuery AJAX Example

```javascript
$('#ajaxSingle').selectR({
    infiniteScroll: true,
    pageSize: 20,

    ajax: {
        url: '/api/options',
        method: 'GET',

        data: function (params) {
            return {
                q: params.query,
                page: params.page,
                pageSize: 20
            };
        },

        processResults: function (response) {
            return {
                results: response.data,
                hasMore: response.hasMore
            };
        }
    }
});
```

## Search Configuration

Search-related options include:

```javascript
selectR('#mySelect', {
    searchable: true,
    searchPlaceholder: 'Search',
    searchMinLength: 0,
    searchDebounce: 300,
    highlightMatch: true
});
```

### Options

| Option | Type | Default | Description |
|---|---|---:|---|
| `searchable` | boolean | `true` | Enable search |
| `searchPlaceholder` | string | `Search` | Search input placeholder |
| `searchMinLength` | number | `0` | Minimum characters required |
| `searchDebounce` | number | `300` | Search debounce in milliseconds |
| `highlightMatch` | boolean | `true` | Highlight matched text |

## Toolbar

For multiple selections:

```javascript
selectR('#mySelect', {
    mode: 'multiple',
    showToolbar: true,
    selectAllLabel: 'Select all',
    clearAllLabel: 'Clear all'
});
```

## Maximum Selections

```javascript
selectR('#mySelect', {
    mode: 'multiple',
    maxSelected: 6
});
```

## Programmatic API

After initialization, the instance exposes the following public methods.

| Method | Description |
|---|---|
| `.setValue(val)` | Set value(s) programmatically |
| `.getValue()` | Get current value(s) |
| `.selectAll()` | Select all visible options |
| `.clearAll()` | Clear all selections |
| `.addOption(item)` | Add an option dynamically |
| `.removeOption(val)` | Remove an option |
| `.load(items)` | Replace all options |
| `.refresh()` | Re-read options from the native `<select>` |
| `.enable()` | Enable the select |
| `.disable()` | Disable the select |
| `.open()` | Open the dropdown |
| `.close()` | Close the dropdown |
| `.setPlaceholder(text)` | Update placeholder |
| `.setMarker(type)` | Change marker style |
| `.setValidation(state)` | Set validation state |
| `.destroy()` | Destroy selectR and restore the native `<select>` |

## Getting the Instance

Vanilla JavaScript:

```javascript
const instance = document.getElementById('mySelect')._selectR;
```

jQuery:

```javascript
const instance = $('#mySelect')[0]._selectR;
```

## Reading Values

Because selectR synchronizes with the native `<select>`, values can be read normally:

```javascript
const value = document.getElementById('mySelect').value;
```

With jQuery:

```javascript
const value = $('#mySelect').val();
```

Or through the selectR API:

```javascript
const value = document.getElementById('mySelect')
    ._selectR
    .getValue();
```

For multiple select, the value is an array.

## Setting Values

Single:

```javascript
instance.setValue('apple');
```

Multiple:

```javascript
instance.setValue(['apple', 'banana']);
```

## Callbacks

### onChange

```javascript
selectR('#mySelect', {
    onChange: function (value, selectedItems) {
        console.log('Value:', value);
        console.log('Items:', selectedItems);
    }
});
```

### onOpen

```javascript
selectR('#mySelect', {
    onOpen: function () {
        console.log('Dropdown opened');
    }
});
```

### onClose

```javascript
selectR('#mySelect', {
    onClose: function () {
        console.log('Dropdown closed');
    }
});
```

### onSearch

```javascript
selectR('#mySelect', {
    onSearch: function (query) {
        console.log('Searching:', query);
    }
});
```

### onScrollEnd

```javascript
selectR('#mySelect', {
    infiniteScroll: true,

    onScrollEnd: function (page) {
        console.log('Loading page:', page);
    }
});
```

## Custom Rendering

The component supports custom rendering callbacks:

```javascript
selectR('#mySelect', {
    renderOption: function (item) {
        return '<strong>' + item.label + '</strong>';
    },

    renderTag: function (item) {
        return '<span>' + item.label + '</span>';
    },

    renderEmpty: function (query) {
        return '<div>No results for "' + query + '"</div>';
    },

    renderLoading: function () {
        return '<div>Loading...</div>';
    }
});
```

> If HTML rendering is enabled, only use trusted data.

## Data Attribute Auto-Initialization

You can initialize selectR without JavaScript initialization code:

```html
<select
    id="mySelect"
    data-selectr='{"marker":"tick"}'>

    <option value="1">Option One</option>
    <option value="2">Option Two</option>
</select>
```

Multiple selection:

```html
<select
    data-selectr='{"mode":"multiple","marker":"tick","placeholder":"Select items"}'
    multiple>

    <option value="1">Option One</option>
    <option value="2">Option Two</option>
    <option value="3">Option Three</option>
</select>
```

## ASP.NET Core / Razor

selectR can be used with ASP.NET Core MVC/Razor views.

```html
<select asp-for="CategoryId"
        asp-items="Model.Categories"
        data-selectr='{"marker":"tick"}'>
    <option value="">Select category</option>
</select>
```

For a multiple selection:

```html
<select asp-for="CategoryIds"
        asp-items="Model.Categories"
        multiple
        data-selectr='{"mode":"multiple","marker":"checkbox"}'>
</select>
```

Because selectR keeps the native `<select>` synchronized, normal HTML form submission continues to work.

## Floating Labels

selectR provides a framework-agnostic floating-label class:

```html
<div class="selectr-floating mb-3">
    <select id="taxZone" data-selectr='{"marker":"none"}'>
        <option value="">Select Tax Zone</option>
        <option value="1">Zone 1</option>
        <option value="2">Zone 2</option>
    </select>

    <label for="taxZone">Choose Tax Zone</label>
</div>
```

The `<label>` should come immediately after the `<select>`.

Bootstrap's `.form-floating` layout is also supported.

## Configuration Reference

| Option | Type | Default | Description |
|---|---|---|---|
| `mode` | string | `single` | `single` or `multiple` |
| `placeholder` | string | `Select` | Placeholder text |
| `disabled` | boolean | `false` | Disable component |
| `readonly` | boolean | `false` | Prevent changes |
| `size` | string | `''` | `sm`, `''`, or `lg` |
| `marker` | string | `checkbox` | `checkbox`, `tick`, `circle`, `none` |
| `showClearButton` | boolean | `true` | Show clear button |
| `maxHeight` | number | `240` | Dropdown max height in pixels |
| `dropdownWidth` | string/null | `null` | Override dropdown width |
| `position` | string | `auto` | `auto`, `up`, or `down` |
| `maxSelected` | number/null | `null` | Maximum selections |
| `tagLimit` | number/null | `null` | Maximum visible tags |
| `closeOnSelect` | boolean | `false` | Close after selection |
| `searchable` | boolean | `true` | Enable search |
| `searchPlaceholder` | string | `Search` | Search placeholder |
| `searchMinLength` | number | `0` | Minimum search characters |
| `searchDebounce` | number | `300` | Search debounce |
| `highlightMatch` | boolean | `true` | Highlight matches |
| `ajax` | object/null | `null` | AJAX configuration |
| `infiniteScroll` | boolean | `false` | Enable infinite scrolling |
| `pageSize` | number | `20` | Server-side page size |
| `showToolbar` | boolean | `true` | Show toolbar |
| `selectAllLabel` | string | `Select all` | Select-all label |
| `clearAllLabel` | string | `Clear all` | Clear-all label |
| `renderOption` | function/null | `null` | Custom option rendering |
| `renderTag` | function/null | `null` | Custom tag rendering |
| `renderEmpty` | function/null | `null` | Custom empty state |
| `renderLoading` | function/null | `null` | Custom loading state |
| `onChange` | function/null | `null` | Selection callback |
| `onOpen` | function/null | `null` | Open callback |
| `onClose` | function/null | `null` | Close callback |
| `onSearch` | function/null | `null` | Search callback |
| `onScrollEnd` | function/null | `null` | Infinite-scroll callback |
| `validationClass` | string | `''` | Validation CSS class |
| `ariaLabel` | string/null | `null` | Custom ARIA label |
| `allowHtml` | boolean | `false` | Allow HTML in labels |

## Example Configuration

```javascript
selectR('#users', {
    mode: 'multiple',
    marker: 'checkbox',

    placeholder: 'Select users',
    searchable: true,
    searchPlaceholder: 'Search users...',
    searchDebounce: 300,

    tagLimit: 2,
    showDrawer: true,
    showToolbar: true,

    maxSelected: 10,

    infiniteScroll: true,
    pageSize: 20,

    ajax: {
        url: '/api/users',
        method: 'GET',

        data: function (params) {
            return {
                q: params.query,
                page: params.page,
                pageSize: 20
            };
        },

        processResults: function (response) {
            return {
                results: response.data,
                hasMore: response.hasMore
            };
        }
    },

    onChange: function (value, items) {
        console.log(value, items);
    }
});
```

## Destroy and Reinitialize

Destroy an instance:

```javascript
document
    .getElementById('mySelect')
    ._selectR
    .destroy();
```

The original native `<select>` is restored.

Reinitialize:

```javascript
const mySelect = new SelectR(
    document.getElementById('mySelect'),
    {
        mode: 'multiple'
    }
);
```

Or with jQuery:

```javascript
$('#mySelect').selectR({
    mode: 'multiple'
});
```

## Reusable Initialization

A reusable initialization function can be used for dynamically injected content:

```javascript
function initMySelects(selector) {
    $(selector).selectR({
        mode: 'multiple',
        marker: 'checkbox'
    });
}

initMySelects('.my-custom-selects');

// Later, after dynamically adding HTML:
initMySelects('#my-newly-added-select');
```

## Accessibility

selectR provides an `ariaLabel` configuration option:

```javascript
selectR('#mySelect', {
    ariaLabel: 'Choose tax zone'
});
```

The original native `<select>` remains part of the component's value synchronization model.

## Security

If using custom HTML rendering or `allowHtml`, make sure the supplied data is trusted.

Do not inject untrusted user-controlled HTML into:

```javascript
renderOption
renderTag
renderEmpty
renderLoading
```

Keep:

```javascript
allowHtml: false
```

unless HTML rendering is intentionally required.

## Browser / Dependency Model

selectR is designed as a framework-agnostic JavaScript component.

It supports:

- Native JavaScript
- jQuery
- Bootstrap 5 styling/integration
- ASP.NET Core/Razor usage
- Native HTML `<select>` elements

jQuery is optional for the core API.

## Suggested Project Structure

A simple repository structure can be:

```text
selectR/
├── selectR.js
├── selectR.css
├── index.html
├── README.md
└── LICENSE
```

If the project grows, a more structured layout can be used:

```text
selectR/
├── src/
│   ├── selectR.js
│   └── selectR.css
├── demo/
│   └── index.html
├── dist/
│   ├── selectR.js
│   └── selectR.css
├── README.md
└── LICENSE
```

## Version

Current demo version:

```text
v1.0.0
```

## Contributing

Contributions are welcome.

When submitting changes:

1. Keep the native `<select>` behavior synchronized.
2. Preserve single and multiple selection behavior.
3. Test keyboard and mouse interactions.
4. Test AJAX search and pagination.
5. Test infinite-scroll behavior.
6. Test Bootstrap and framework-agnostic layouts.
7. Test the jQuery integration when applicable.
8. Update the demo when adding a public feature.
9. Update the configuration/API documentation when changing the public API.

## License

Add the project's license information here.

If this project is intended to be open source, choose an appropriate license such as MIT and add the corresponding `LICENSE` file to the repository.
