/// <reference path="interfaces.ts" />
module DynamicForm {
    "use strict";

    export class Event implements Interfaces.ISubscribable {
        private subscribers:Array<Interfaces.ISubscriber>;
        constructor() {
            this.subscribers = new Array();
        }

        subscribe(subscriber: Interfaces.ISubscriber) {
            this.subscribers.push(subscriber);
        }

        unSubscribe(subscriber: Interfaces.ISubscriber) {
            this.subscribers.splice(this.subscribers.indexOf(subscriber), 1);
        }

        notifySubscribers(eventData: any) {
            for (var i = 0; i < this.subscribers.length; i++) {
                this.subscribers[i].Notify(eventData);
            }
        }
    }

    export class AbstractMethodException implements Error {
        name: string;
        message: string;
        constructor(params:any) {
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
            this.message = `Cannot call Abstract ${type}: ${name}. Please create an implementation${(type === "Class") ? " that extends this class" : " in the calling class"}.`;
       }
    }

    // abstract Class
    export class FormField implements Interfaces.IFormField {
        // ReSharper disable once InconsistentNaming
        private _onValidate: Event;
        constructor() {
            this._onValidate = new Event();
        }

        get onValidate() {
            return this._onValidate;
        }

        private setOnValidate(value) {
            this._onValidate = value;
        }

        protected validated(obj: any) {
            this._onValidate.notifySubscribers(obj);
        }

        isValid() {
            throw new AbstractMethodException({ NameSpace: "Dynamic_Form", Class: "FormField", Method: "isValid" });
        }

        display(callback: (obj: HTMLDivElement) => void) {
            throw new AbstractMethodException({ NameSpace: "Dynamic_Form", Class: "FormField", Method: "Display" });
        }
    }
    // base Classes
    export class OptionGroup extends FormField {
        protected required: boolean;
        protected name: string;
        protected displayName: string;
        protected items = [];
        constructor(params: Interfaces.IFormFieldArgs) {
            super();
            this.required = params.Required;
            this.name = params.Name;
            this.displayName = params.DisplayName;
        }

        isValid() {
            var group = document.getElementsByName(this.name);
            if (this.required) {
                for (var i = 0; i < group.length; i++) {
                    if ((<HTMLInputElement>group[i]).checked) {
                        this.validated({Element: group, Data: true });
                        return true;
                    }
                }
                this.validated({ Element: group, Data: false });
                return false;
            }
            this.validated({ Element: group, Data: true });
            return true;
        }

        display(callback: (obj: HTMLDivElement) => void) {
            var div = document.createElement("div");
            div.id = this.name + "div";
            this.items.forEach((val) => {
                div.appendChild((<HTMLInputElement>val));
            });
            callback(div);
        }
        protected createItems(val, index, params, type) {
            var item = document.createElement("input");
            item.type = type;
            item.name = params.Name;
            item.id = params.Name + "_" + index;
            item.className = "" + ((params.Classes) ? params.Classes : "");
            item.value = val.Value;
            item.checked = val.Selected;
            if (params.DOMEvents) {
                params.DOMEvents.forEach((event) => {
                    if (window.attachEvent) {
                        item.attachEvent(`on${event.DOMEvent}`, function () { event.Action(this); });
                    } else {
                        item.addEventListener(event.DOMEvent, function () { event.Action(this); });
                    }
                });
            }
            var label = document.createElement("label");
            label.className = "control-label";
            label.appendChild(item);
            label.appendChild(document.createTextNode(val.DisplayName));
            this.items.push(label);
        }
    }
    export class Input extends FormField {
        /*Members*/
        protected element;
        protected name;
        protected displayName: string;

        /*Constructor*/
        constructor(params: Interfaces.IFormFieldArgs) {
            super();
            // todo: Create onValidation Event
            if (this.element === undefined) {
                this.element = document.createElement("input");
                this.element.type = "text";
            }
            this.element.id = params.Name;
            this.element.name = params.Name;
            this.element.value = params.Value;
            this.element.readOnly = params.ReadOnly;            
            this.element.className = `form-control ${(params.Classes) ? params.Classes : ""}`;
            this.element.required = params.Required;
            this.name = params.Name;
            this.displayName = params.DisplayName;
            this.registerDomEvents(params.DomEvents);
        }

        /*Methods*/
        private registerDomEvents(events: Array<Interfaces.IDomEvent>) {
            if (events !== undefined && events != null) {
                for (var i = 0; i < events.length; i++) {
                    var a = events[i].Action;
                    if (window.attachEvent) {
                        this.element.attachEvent(`on${events[i].DomEvent}`, () => {a(this); });
                    } else {
                        this.element.addEventListener(events[i].DomEvent, () => { a(this); });
                    }
                }
            }
        }

        protected create() {
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
        }

        display(callback: (obj: HTMLDivElement) => void) {
            var div = this.create();
            div.appendChild(this.element);
            callback(div);
        }

        isValid() {
            // get a fresh copy of this object
            var element = <HTMLInputElement>document.getElementById(this.name);
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
        }
        static Create(element: HTMLElement) {
            switch (typeof (element)) {
                case "HTMLInputElement":
                    return new Input({
                        DisplayName: element.id,
                        Classes: element.classList.toString(),
                        Name: element.id,
                        Required: element.hasAttribute("required"),
                        ReadOnly: element.hasAttribute("disabled"),
                        Value: (<HTMLInputElement>element).value
                    });
                case "HTMLSelectElement":
                    return new Input({
                        DisplayName: element.id,
                        Classes: element.classList.toString(),
                        Name: element.id,
                        Required: element.hasAttribute("required"),
                        ReadOnly: element.hasAttribute("disabled"),
                        Value: (<HTMLSelectElement>element).value
                    });
                case "HTMLTextAreaElement":
                    return new Input({
                        DisplayName: element.id,
                        Classes: element.classList.toString(),
                        Name: element.id,
                        Required: element.hasAttribute("required"),
                        ReadOnly: element.hasAttribute("disabled"),
                        Value: (<HTMLTextAreaElement>element).value
                    });
                default:
                    throw new Error("The Element wasn't compatible with the FormField");
            }

        }
    }
    export class InputGroup extends FormField {
        /*Members*/
        protected inputs: Array<FormField>;
        private displayName: string;

        /*Events*/
        constructor(displayName: string, inputs: Array<FormField>) {
            super();
            this.inputs = inputs;
            this.displayName = displayName;
        }
        protected create() {
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
        }

        display(callback: (obj: HTMLDivElement) => void) {
            var div = this.create();
            var innerdiv = document.createElement("div");
            innerdiv.className = "input-group";
            var req = "";
            for (var i = 0; i < this.inputs.length; i++) {
                var element: any;
                this.inputs[i].display(
                    (obj: HTMLDivElement) => {
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
        }

        isValid() {
            var elements = new Array();
            var isValid = true;
            for (var i = 0; i < this.inputs.length; i++) {
                this.inputs[i].onValidate.subscribe({ Notify(d) { elements.push(d); } });
                if (!this.inputs[i].isValid()) {
                    isValid = false;
                }
            }
            this.validated({ Element: elements, Data: isValid });
            return isValid;
        }
    }
    // form
    export class Form implements Interfaces.IDisplayable {
        private element = document.createElement("form");
        private items: Array<Interfaces.IFormField>;
        private deletable: boolean;
        private onSubmit: Function;
        private onDelete: Function;
        private onCancel: Function;
        private registerDomEvents(events: Array<Interfaces.IDomEvent>) {
            if (events !== undefined) {
                for (var i = 0; i < events.length; i++) {
                    var action = events[i].Action;
                    if (window.attachEvent) {
                        this.element.attachEvent(`on${events[i].DomEvent}`, function () { action(this); });
                    } else {
                        this.element.addEventListener(events[i].DomEvent, function () { action(this); });
                    }
                }
            }
        }
        constructor(params: Interfaces.IFormArgs) {
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

        private createButton(buttonText: string, fn: Function, classes?: string) {
            var button = document.createElement("button");
            button.className = `btn ${classes}`;
            button.textContent = buttonText;
            if (window.attachEvent) {
                // for Internet Explorer
                button.attachEvent("onclick", () => {
                    event.cancelBubble = true;
                    event.returnValue = false;
                    fn();
                });
            } else {
                button.addEventListener("click", () => {
                    event.preventDefault();
                    fn();
                }, true);
            }
            return button;
        }

        protected create() {
            for (var i = 0; i < this.items.length; i++) {
                var item;
                this.items[i].display((obj: HTMLDivElement) => { item = obj; });
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
        }

        display(callback: (obj: HTMLFormElement) => void) {
            callback(this.create());
        }

        validate() {
            var isValid = true;
            for (var i = 0; i < this.items.length; i++) {
                if (!this.items[i].isValid()) {
                    isValid = false;
                }
            }
            return isValid;
        }

        submit() {
            this.onSubmit();
        }
    }
    // input
    export class DropDown extends Input {
        private defaultVal: any;
        private options: Array<Interfaces.IOption>;
        constructor(params: Interfaces.IFormFieldArgs, options: Array<Interfaces.IOption>) {
            this.element = document.createElement("select");
            this.options = options;
            this.defaultVal = params.Value;
            super(params);
        }

        display(callback: (obj: HTMLDivElement) => void) {
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
        }
    }
    export class Hidden extends Input {
        constructor(name: string, value: any) {
            super({ DisplayName: null, Name: name, Value: value, ReadOnly: true });
            this.element.type = "hidden";
        }

        display(callback: (obj: HTMLDivElement) => void) {
            callback(this.element);
        }
    }
    export class TextBox extends Input {
        constructor(params: Interfaces.IFormFieldArgs) {
            this.element = document.createElement("textarea");
            super(params);
        }
    }
    export class Numeric extends Input {
        constructor(params: Interfaces.IFormFieldArgs, max?: number, min?: number) {
            super(params);
            try {
                this.element.type = "number";
            } catch (e) {
                this.element.type = "text";
            }
            if (max !== undefined) {
                this.element.setAttribute("max", max);
            }
            if (min !== undefined) {
                this.element.setAttribute("min", min);
            }
        }

       isValid() {
            var element = <HTMLInputElement>document.getElementById(this.name);
            if (super.isValid()) {
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
        }

        protected validated(obj: any) {
            if (obj.CalledByNumeric) {
                this.onValidate.notifySubscribers(obj);
            }
        }
    }
    export class Password extends Input {
        constructor(params: Interfaces.IFormFieldArgs) {
            super(params);
            this.element.type = "password";
        }
    }
    // optionGroup
    export class CheckBoxGroup extends OptionGroup {
        constructor(params: Interfaces.IFormFieldArgs, options: Array<Interfaces.IOption>) {
            super(params);
            options.forEach((val, index) => {
                this.createItems(val, index, params, "checkbox");
            });
        }
    }
    export class RadioBtnGroup extends OptionGroup {
        constructor(params: Interfaces.IFormFieldArgs, options: Array<Interfaces.IOption>) {
            super(params);
            options.forEach((val, index) => {
                this.createItems(val, index, params, "radio");
            });
        }
    }
}