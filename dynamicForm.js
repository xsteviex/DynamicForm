var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/// <reference path="interfaces.ts" />
var DynamicForm;
(function (DynamicForm) {
    "use strict";
    var Event = (function () {
        function Event() {
            this.subscribers = new Array();
        }
        Event.prototype.subscribe = function (subscriber) {
            this.subscribers.push(subscriber);
        };
        Event.prototype.unSubscribe = function (subscriber) {
            this.subscribers.splice(this.subscribers.indexOf(subscriber), 1);
        };
        Event.prototype.notifySubscribers = function (eventData) {
            for (var i = 0; i < this.subscribers.length; i++) {
                this.subscribers[i].Notify(eventData);
            }
        };
        return Event;
    })();
    DynamicForm.Event = Event;
    var AbstractMethodException = (function () {
        function AbstractMethodException(params) {
            var type = "";
            if (params.NameSpace) {
                this.name = params.NameSpace + ".";
            }
            if (params.Class) {
                this.name += params.Class + ".";
                type = "Class";
            }
            if (params.Method) {
                this.name += params.Method;
                type = "Method";
            }
            this.message = "Cannot call Abstract " + type + ": " + name + ". Please create an implementation" + ((type === "Class") ? " that extends this class" : " in the calling class") + ".";
        }
        return AbstractMethodException;
    })();
    DynamicForm.AbstractMethodException = AbstractMethodException;
    // abstract Class
    var FormField = (function () {
        function FormField() {
            this._onValidate = new Event();
        }
        Object.defineProperty(FormField.prototype, "onValidate", {
            get: function () {
                return this._onValidate;
            },
            enumerable: true,
            configurable: true
        });
        FormField.prototype.setOnValidate = function (value) {
            this._onValidate = value;
        };
        FormField.prototype.validated = function (obj) {
            this._onValidate.notifySubscribers(obj);
        };
        FormField.prototype.isValid = function () {
            throw new AbstractMethodException({ NameSpace: "Dynamic_Form", Class: "FormField", Method: "isValid" });
        };
        FormField.prototype.display = function (callback) {
            throw new AbstractMethodException({ NameSpace: "Dynamic_Form", Class: "FormField", Method: "Display" });
        };
        return FormField;
    })();
    DynamicForm.FormField = FormField;
    // base Classes
    var OptionGroup = (function (_super) {
        __extends(OptionGroup, _super);
        function OptionGroup(params) {
            _super.call(this);
            this.items = [];
            this.required = params.Required;
            this.name = params.Name;
            this.displayName = params.DisplayName;
        }
        OptionGroup.prototype.isValid = function () {
            var group = document.getElementsByName(this.name);
            if (this.required) {
                for (var i = 0; i < group.length; i++) {
                    if (group[i].checked) {
                        this.validated({ Element: group, Data: true });
                        return true;
                    }
                }
                this.validated({ Element: group, Data: false });
                return false;
            }
            this.validated({ Element: group, Data: true });
            return true;
        };
        OptionGroup.prototype.display = function (callback) {
            var div = document.createElement("div");
            div.id = this.name + "div";
            this.items.forEach(function (val) {
                div.appendChild(val);
            });
            callback(div);
        };
        OptionGroup.prototype.createItems = function (val, index, params, type) {
            var item = document.createElement("input");
            item.type = type;
            item.name = params.Name;
            item.id = params.Name + "_" + index;
            item.className = "" + ((params.Classes) ? params.Classes : "");
            item.value = val.Value;
            item.checked = val.Selected;
            if (params.DOMEvents) {
                params.DOMEvents.forEach(function (event) {
                    if (window.attachEvent) {
                        item.attachEvent("on" + event.DOMEvent, function () { event.Action(this); });
                    }
                    else {
                        item.addEventListener(event.DOMEvent, function () { event.Action(this); });
                    }
                });
            }
            var label = document.createElement("label");
            label.className = "control-label";
            label.appendChild(item);
            label.appendChild(document.createTextNode(val.DisplayName));
            this.items.push(label);
        };
        return OptionGroup;
    })(FormField);
    DynamicForm.OptionGroup = OptionGroup;
    var Input = (function (_super) {
        __extends(Input, _super);
        /*Constructor*/
        function Input(params) {
            _super.call(this);
            // todo: Create onValidation Event
            if (this.element === undefined) {
                this.element = document.createElement("input");
                this.element.type = "text";
            }
            this.element.id = params.Name;
            this.element.name = params.Name;
            this.element.value = params.Value;
            this.element.readOnly = params.ReadOnly;
            this.element.className = "form-control " + ((params.Classes) ? params.Classes : "");
            this.element.required = params.Required;
            this.name = params.Name;
            this.displayName = params.DisplayName;
            this.registerDomEvents(params.DomEvents);
        }
        /*Methods*/
        Input.prototype.registerDomEvents = function (events) {
            var _this = this;
            if (events !== undefined && events != null) {
                for (var i = 0; i < events.length; i++) {
                    var a = events[i].Action;
                    if (window.attachEvent) {
                        this.element.attachEvent("on" + events[i].DomEvent, function () { a(_this); });
                    }
                    else {
                        this.element.addEventListener(events[i].DomEvent, function () { a(_this); });
                    }
                }
            }
        };
        Input.prototype.create = function () {
            // create div
            var div = document.createElement("div");
            div.className = "form-group";
            // create label
            var label = document.createElement("label");
            var req = "";
            if (this.element.required) {
                req = "*";
            }
            label.innerHTML = this.displayName + req;
            // add label to div
            div.appendChild(label);
            // return div;
            return div;
        };
        Input.prototype.display = function (callback) {
            var div = this.create();
            div.appendChild(this.element);
            callback(div);
        };
        Input.prototype.isValid = function () {
            // get a fresh copy of this object
            var element = document.getElementById(this.name);
            if (element.hasAttribute("required") || element.required) {
                if (element.value.trim() !== "") {
                    this.validated({ Element: element, Data: true });
                    return true;
                }
                this.validated({ Element: element, Data: false });
                return false;
            }
            this.validated({ Element: element, Data: true });
            return true;
        };
        Input.Create = function (element) {
            switch (typeof (element)) {
                case "HTMLInputElement":
                    return new Input({
                        DisplayName: element.id,
                        Classes: element.classList.toString(),
                        Name: element.id,
                        Required: element.hasAttribute("required"),
                        ReadOnly: element.hasAttribute("disabled"),
                        Value: element.value
                    });
                case "HTMLSelectElement":
                    return new Input({
                        DisplayName: element.id,
                        Classes: element.classList.toString(),
                        Name: element.id,
                        Required: element.hasAttribute("required"),
                        ReadOnly: element.hasAttribute("disabled"),
                        Value: element.value
                    });
                case "HTMLTextAreaElement":
                    return new Input({
                        DisplayName: element.id,
                        Classes: element.classList.toString(),
                        Name: element.id,
                        Required: element.hasAttribute("required"),
                        ReadOnly: element.hasAttribute("disabled"),
                        Value: element.value
                    });
                default:
                    throw new Error("The Element wasn't compatible with the FormField");
            }
        };
        return Input;
    })(FormField);
    DynamicForm.Input = Input;
    var InputGroup = (function (_super) {
        __extends(InputGroup, _super);
        /*Events*/
        function InputGroup(displayName, inputs) {
            _super.call(this);
            this.inputs = inputs;
            this.displayName = displayName;
        }
        InputGroup.prototype.create = function () {
            // create div
            var div = document.createElement("div");
            div.className = "form-group";
            // create label
            var label = document.createElement("label");
            label.innerHTML = this.displayName;
            // add label to div
            div.appendChild(label);
            // return div;
            return div;
        };
        InputGroup.prototype.display = function (callback) {
            var div = this.create();
            var innerdiv = document.createElement("div");
            innerdiv.className = "input-group";
            var req = "";
            for (var i = 0; i < this.inputs.length; i++) {
                var element;
                this.inputs[i].display(function (obj) {
                    element = obj.getElementsByTagName("input").item(0) ||
                        obj.getElementsByTagName("select").item(0) ||
                        obj.getElementsByTagName("textarea").item(0);
                });
                if (element.hasAttribute("required") || element.Required) {
                    req = "*";
                }
                innerdiv.appendChild(element);
                if (i !== this.inputs.length - 1) {
                    var span = document.createElement("span");
                    span.className = "input-group-addon";
                    span.textContent = "||";
                    innerdiv.appendChild(span);
                }
            }
            div.appendChild(innerdiv);
            div.children[0].textContent += req;
            callback(div);
        };
        InputGroup.prototype.isValid = function () {
            var elements = new Array();
            var isValid = true;
            for (var i = 0; i < this.inputs.length; i++) {
                this.inputs[i].onValidate.subscribe({ Notify: function (d) { elements.push(d); } });
                if (!this.inputs[i].isValid()) {
                    isValid = false;
                }
            }
            this.validated({ Element: elements, Data: isValid });
            return isValid;
        };
        return InputGroup;
    })(FormField);
    DynamicForm.InputGroup = InputGroup;
    // form
    var Form = (function () {
        function Form(params) {
            this.element = document.createElement("form");
            this.element.action = params.Action;
            this.element.method = (params.Method) ? params.Method : "post";
            this.element.id = (params.Id) ? params.Id : "DynamicForm";
            this.items = params.Items;
            this.deletable = (params.Deletable || false);
            this.onCancel = params.OnCancel;
            this.onDelete = params.OnDelete;
            this.onSubmit = params.OnSubmit;
            this.registerDomEvents(params.DomEvents);
        }
        Form.prototype.registerDomEvents = function (events) {
            if (events !== undefined) {
                for (var i = 0; i < events.length; i++) {
                    var action = events[i].Action;
                    if (window.attachEvent) {
                        this.element.attachEvent("on" + events[i].DomEvent, function () { action(this); });
                    }
                    else {
                        this.element.addEventListener(events[i].DomEvent, function () { action(this); });
                    }
                }
            }
        };
        Form.prototype.createButton = function (buttonText, fn, classes) {
            var button = document.createElement("button");
            button.className = "btn " + classes;
            button.textContent = buttonText;
            if (window.attachEvent) {
                // for Internet Explorer
                button.attachEvent("onclick", function () {
                    event.cancelBubble = true;
                    event.returnValue = false;
                    fn();
                });
            }
            else {
                button.addEventListener("click", function () {
                    event.preventDefault();
                    fn();
                }, true);
            }
            return button;
        };
        Form.prototype.create = function () {
            for (var i = 0; i < this.items.length; i++) {
                var item;
                this.items[i].display(function (obj) { item = obj; });
                this.element.appendChild(item);
            }
            var div = document.createElement("div");
            div.className = "form-group btn-group";
            var submit = this.createButton("submit", this.onSubmit, "btn-primary submit");
            div.appendChild(submit);
            if (this.deletable) {
                var delbtn = this.createButton("delete", this.onDelete, "btn-danger delete");
                div.appendChild(delbtn);
            }
            var cancel = this.createButton("cancel", this.onCancel, "btn-default cancel");
            div.appendChild(cancel);
            this.element.appendChild(div);
            return this.element;
        };
        Form.prototype.display = function (callback) {
            callback(this.create());
        };
        Form.prototype.validate = function () {
            var isValid = true;
            for (var i = 0; i < this.items.length; i++) {
                if (!this.items[i].isValid()) {
                    isValid = false;
                }
            }
            return isValid;
        };
        Form.prototype.submit = function () {
            this.onSubmit();
        };
        return Form;
    })();
    DynamicForm.Form = Form;
    // input
    var DropDown = (function (_super) {
        __extends(DropDown, _super);
        function DropDown(params, options) {
            this.element = document.createElement("select");
            this.options = options;
            this.defaultVal = params.Value;
            _super.call(this, params);
        }
        DropDown.prototype.display = function (callback) {
            var div = this.create();
            for (var i = 0; i < this.options.length; i++) {
                var option = document.createElement("option");
                option.value = this.options[i].Value;
                option.textContent = this.options[i].DisplayName;
                if (this.defaultVal === this.options[i].Value) {
                    option.selected = true;
                }
                this.element.appendChild(option);
            }
            div.appendChild(this.element);
            callback(div);
        };
        return DropDown;
    })(Input);
    DynamicForm.DropDown = DropDown;
    var Hidden = (function (_super) {
        __extends(Hidden, _super);
        function Hidden(name, value) {
            _super.call(this, { DisplayName: null, Name: name, Value: value, ReadOnly: true });
            this.element.type = "hidden";
        }
        Hidden.prototype.display = function (callback) {
            callback(this.element);
        };
        return Hidden;
    })(Input);
    DynamicForm.Hidden = Hidden;
    var TextBox = (function (_super) {
        __extends(TextBox, _super);
        function TextBox(params) {
            this.element = document.createElement("textarea");
            _super.call(this, params);
        }
        return TextBox;
    })(Input);
    DynamicForm.TextBox = TextBox;
    var Numeric = (function (_super) {
        __extends(Numeric, _super);
        function Numeric(params, max, min) {
            _super.call(this, params);
            try {
                this.element.type = "number";
            }
            catch (e) {
                this.element.type = "text";
            }
            if (max !== undefined) {
                this.element.setAttribute("max", max);
            }
            if (min !== undefined) {
                this.element.setAttribute("min", min);
            }
        }
        Numeric.prototype.isValid = function () {
            var element = document.getElementById(this.name);
            if (_super.prototype.isValid.call(this)) {
                //Either required and has something in it || not required may have something in it
                if (isNaN(parseFloat(element.value)) && (element.hasAttribute("required") || element.required)) {
                    //If required...and not a number
                    this.validated({ Element: element, Data: false, CalledByNumeric: true });
                    return false;
                }
                else if (!isNaN(parseFloat(element.value)) &&
                    ((element.hasAttribute("max") && parseFloat(element.getAttribute("max")) < parseFloat(element.value)) ||
                        (element.hasAttribute("min") && parseFloat(element.getAttribute("min")) > parseFloat(element.value)))) {
                    //If it is a number and it is outside of the range
                    this.validated({ Element: element, Data: false, CalledByNumeric: true });
                    return false;
                }
                this.validated({ Element: element, Data: true, CalledByNumeric: true });
                return true;
            }
            this.validated({ Element: element, Data: false, CalledByNumeric: true });
            return false;
        };
        Numeric.prototype.validated = function (obj) {
            if (obj.CalledByNumeric) {
                this.onValidate.notifySubscribers(obj);
            }
        };
        return Numeric;
    })(Input);
    DynamicForm.Numeric = Numeric;
    var Password = (function (_super) {
        __extends(Password, _super);
        function Password(params) {
            _super.call(this, params);
            this.element.type = "password";
        }
        return Password;
    })(Input);
    DynamicForm.Password = Password;
    // optionGroup
    var CheckBoxGroup = (function (_super) {
        __extends(CheckBoxGroup, _super);
        function CheckBoxGroup(params, options) {
            var _this = this;
            _super.call(this, params);
            options.forEach(function (val, index) {
                _this.createItems(val, index, params, "checkbox");
            });
        }
        return CheckBoxGroup;
    })(OptionGroup);
    DynamicForm.CheckBoxGroup = CheckBoxGroup;
    var RadioBtnGroup = (function (_super) {
        __extends(RadioBtnGroup, _super);
        function RadioBtnGroup(params, options) {
            var _this = this;
            _super.call(this, params);
            options.forEach(function (val, index) {
                _this.createItems(val, index, params, "radio");
            });
        }
        return RadioBtnGroup;
    })(OptionGroup);
    DynamicForm.RadioBtnGroup = RadioBtnGroup;
})(DynamicForm || (DynamicForm = {}));
//# sourceMappingURL=dynamicForm.js.map