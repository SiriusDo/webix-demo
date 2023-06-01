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
