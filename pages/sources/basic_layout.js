const mainBody = {
  id: "parent_layout",
  rows: [
    // Button to switch between view
    {
      view: "button",
      value: "Switch Form",
      inputWidth: 150,
      align: "right",
      css: "webix_primary",
      click: switchForm,
    },
    // Form layout
    {
      view: "form",
      id: "my_form",
      elements: [
        { view: "text", placeholder: "First Name" },
        { view: "text", placeholder: "Last Name" },
        { view: "text", placeholder: "Age" },
        {
          cols: [
            {
              view: "button",
              value: "Submit",
              width: 100,
            },
            {
              view: "button",
              value: "Cancel",
              width: 100,
            },
          ],
        },
      ],
    },
    // Grid layout
    {
      id: "dynamic_layout",
      height: 500,
      type: "space",
      cols: [
        { template: "chart area", view: "template" },
        {
          gravity: 0.3,
          rows: [
            { view: "label", label: "Toggle" },
            {
              template: "layout navigation",
              view: "gridlayout",
              gridColumns: 2,
              gridRows: 1,
              cellHeight: 100,
              cells: [
                {
                  id: "a",
                  view: "button",
                  value: "Layout 01",
                  css: "webix_primary",
                  x: 0,
                  y: 0,
                  dx: 1,
                  dy: 1,
                },
                {
                  id: "b",
                  view: "button",
                  value: "Layout 02",
                  x: 1,
                  y: 0,
                  dx: 1,
                  dy: 1,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

const firstForm = {
  view: "form",
  id: "my_form",
  elements: [
    { view: "text", placeholder: "First Name" },
    { view: "text", placeholder: "Last Name" },
    { view: "text", placeholder: "Age" },
    {
      cols: [
        {
          view: "button",
          value: "Button A",
          width: 100,
        },
        {
          view: "button",
          value: "Button B",
          width: 100,
        },
      ],
    },
  ],
};

const secondForm = {
  view: "form",
  id: "my_new_form",
  elements: [
    { view: "text", placeholder: "Phone number" },
    {
      cols: [
        {
          view: "button",
          value: "Submit",
        },
      ],
    },
  ],
};

// Switch Layout function
function switchForm() {
  if ($$("my_form")) {
    // webix.message("first form action");
    webix.ui(secondForm, $$("parent_layout"), $$("my_form"));
  } else if (webix.$$("my_new_form")) {
    // webix.message("sencond form action");
    webix.ui(firstForm, $$("parent_layout"), $$("my_new_form"));
  }
}

webix.ui({
  id: "basic_layout",
  // Parent layout: Button, Form, ...
  rows: [
    {
      view: "scrollview",
      body: mainBody,
    },
  ],
});
